import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Plus, X, AlertCircle } from 'lucide-react';
import { api, type AssignmentDto, type CourseDto, type TrainerDto } from '../lib/api';

type UiAssignment = {
  id: string;
  courseId: string;
  courseName: string;
  courseNameEn: string;
  trainerId: string;
  trainerName: string;
  trainerNameEn: string;
  assignedDate: string;
  specialty: string;
};

export function Assignments() {
  const { lang, theme, addToast, activeWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [assignments, setAssignments] = useState<UiAssignment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ courseId: '', trainerId: '', specialty: '' });
  const [view, setView] = useState<'table' | 'matrix'>('table');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [trainers, setTrainers] = useState<TrainerDto[]>([]);

  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;
  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  const buildAssignments = (rawAssignments: AssignmentDto[], rawCourses: CourseDto[], rawTrainers: TrainerDto[]) => rawAssignments.map((item) => {
    const course = rawCourses.find((entry) => entry.id === item.courseId);
    const trainer = rawTrainers.find((entry) => entry.id === item.trainerId);
    return {
      id: item.id,
      courseId: item.courseId,
      courseName: course?.name || item.courseId,
      courseNameEn: course?.name || item.courseId,
      trainerId: item.trainerId,
      trainerName: trainer?.name || item.trainerId,
      trainerNameEn: trainer?.name || item.trainerId,
      assignedDate: item.createdAt.slice(0, 10),
      specialty: trainer?.specialties?.split(',')[0]?.trim() || '',
    };
  });

  const loadData = async () => {
    if (!activeWorkspace) return;
    try {
      const [assignmentRows, courseRows, trainerRows] = await Promise.all([
        api.assignments.list(activeWorkspace),
        api.courses.list(activeWorkspace),
        api.trainers.list(activeWorkspace),
      ]);
      setCourses(courseRows);
      setTrainers(trainerRows);
      setAssignments(buildAssignments(assignmentRows, courseRows, trainerRows));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load assignments');
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeWorkspace]);

  const filtered = useMemo(() => assignments.filter((a) =>
    (!filterCourse || a.courseId === filterCourse) &&
    (!filterTrainer || a.trainerId === filterTrainer)
  ), [assignments, filterCourse, filterTrainer]);

  const handleSave = async () => {
    if (!activeWorkspace) return;
    if (saving) return;
    const duplicate = assignments.some((a) => a.courseId === form.courseId && a.trainerId === form.trainerId);
    if (duplicate) {
      addToast('error', t('هذا التعيين موجود مسبقاً!', 'This assignment already exists!', lang));
      return;
    }
    setSaving(true);
    try {
      await api.assignments.create(activeWorkspace, { courseId: form.courseId, trainerId: form.trainerId });
      setShowModal(false);
      setForm({ courseId: '', trainerId: '', specialty: '' });
      addToast('success', t('تم إضافة التعيين', 'Assignment added', lang));
      await loadData();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Assignment save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeWorkspace) return;
    try {
      await api.assignments.delete(activeWorkspace, id);
      addToast('success', t('تم حذف التعيين', 'Assignment deleted', lang));
      await loadData();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const matrixCourses = courses.slice(0, 10);
  const matrixTrainers = trainers;
  const isAssigned = (courseId: string, trainerId: string) => assignments.some((a) => a.courseId === courseId && a.trainerId === trainerId);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('تعيين المدربين', 'Trainer Assignments', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(`${assignments.length} تعيين`, `${assignments.length} assignments`, lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex rounded-xl border p-1 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            {(['table', 'matrix'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view === v ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>{v === 'table' ? t('جدول', 'Table', lang) : t('مصفوفة', 'Matrix', lang)}</button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"><Plus size={16} /> {t('تعيين جديد', 'New Assignment', lang)}</button>
        </div>
      </div>

      <div className={`${card} p-4 flex flex-wrap gap-3`}>
        <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل الدورات', 'All Courses', lang)}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterTrainer} onChange={(e) => setFilterTrainer(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل المدربين', 'All Trainers', lang)}</option>
          {trainers.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
        </select>
      </div>

      {view === 'table' && (
        <div className={`${card} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                {[t('الدورة','Course',lang), t('المدرب','Trainer',lang), t('التخصص','Specialty',lang), t('تاريخ التعيين','Assigned Date',lang), t('إجراءات','Actions',lang)].map((h,i) => <th key={i} className={`text-start px-4 py-3 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((asgn) => (
                <tr key={asgn.id} className={`border-b table-row-hover ${isDark ? 'border-slate-700/50' : 'border-slate-50'}`}>
                  <td className="px-4 py-3"><p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{lang === 'ar' ? asgn.courseName : asgn.courseNameEn}</p></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{asgn.trainerName.charAt(0)}</div><span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{lang === 'ar' ? asgn.trainerName : asgn.trainerNameEn}</span></div></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{asgn.specialty}</span></td>
                  <td className={`px-4 py-3 text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{asgn.assignedDate}</td>
                  <td className="px-4 py-3"><button onClick={() => void handleDelete(asgn.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><X size={13} /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('لا توجد تعيينات', 'No assignments', lang)}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {view === 'matrix' && (
        <div className={`${card} p-5 overflow-x-auto`}>
          <h3 className={`font-semibold mb-4 text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('مصفوفة الدورات والمدربين', 'Courses × Trainers Matrix', lang)}</h3>
          <table className="w-full">
            <thead>
              <tr>
                <th className={`text-start px-3 py-2 text-xs font-semibold min-w-[200px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('الدورة', 'Course', lang)}</th>
                {matrixTrainers.map((tr) => (
                  <th key={tr.id} className={`px-3 py-2 text-xs font-semibold text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">{tr.name.charAt(0)}</div>
                    <div className="text-center text-[10px] leading-tight">{tr.name.split(' ')[0]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixCourses.map((course) => (
                <tr key={course.id} className={`border-b ${isDark ? 'border-slate-700/50' : 'border-slate-50'}`}>
                  <td className="px-3 py-3"><span className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{course.name}</span></td>
                  {matrixTrainers.map((trainer) => {
                    const assigned = isAssigned(course.id, trainer.id);
                    return (
                      <td key={trainer.id} className="px-3 py-3 text-center">
                        <button
                          onClick={() => {
                            if (assigned) {
                              const existing = assignments.find((a) => a.courseId === course.id && a.trainerId === trainer.id);
                              if (existing) void handleDelete(existing.id);
                            } else {
                              setForm({ courseId: course.id, trainerId: trainer.id, specialty: trainer.specialties?.split(',')[0]?.trim() || '' });
                              void api.assignments.create(activeWorkspace, { courseId: course.id, trainerId: trainer.id }).then(() => loadData()).catch((error: unknown) => addToast('error', error instanceof Error ? error.message : 'Assignment failed'));
                            }
                          }}
                          className={`w-8 h-8 rounded-lg border-2 mx-auto flex items-center justify-center transition-all ${assigned ? 'bg-green-500 border-green-500 text-white hover:bg-red-500 hover:border-red-500' : (isDark ? 'border-slate-600 hover:border-green-500 text-slate-500' : 'border-slate-200 hover:border-green-500 text-slate-300')}`}
                        >
                          {assigned ? '✓' : '+'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('إضافة تعيين', 'Add Assignment', lang)}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الدورة', 'Course', lang)}</label>
                <select value={form.courseId} onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))} className={inputCls}>
                  <option value="">{t('اختر الدورة', 'Select Course', lang)}</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('المدرب', 'Trainer', lang)}</label>
                <select value={form.trainerId} onChange={(e) => setForm((p) => ({ ...p, trainerId: e.target.value }))} className={inputCls}>
                  <option value="">{t('اختر المدرب', 'Select Trainer', lang)}</option>
                  {trainers.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('التخصص', 'Specialty', lang)}</label>
                <input value={form.specialty} onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))} className={inputCls} placeholder={t('أدخل التخصص', 'Enter specialty', lang)} />
              </div>
              {assignments.some((a) => a.courseId === form.courseId && a.trainerId === form.trainerId) && (
                <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                  <AlertCircle size={14} />
                  <span className="text-xs">{t('هذا التعيين موجود مسبقاً', 'This assignment already exists', lang)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => void handleSave()} disabled={saving} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>{saving ? t('جاري الحفظ...', 'Saving...', lang) : t('حفظ', 'Save', lang)}</button>
              <button onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t('إلغاء', 'Cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
