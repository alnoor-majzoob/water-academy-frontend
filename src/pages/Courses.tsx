import { useEffect, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { PriorityBadge } from '../components/ui/StatusChip';
import { api, courseTypeLabel, formatDate, uiToCourseType, type CourseDto } from '../lib/api';
import { Pagination } from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';

type UiCourse = {
  id: number;
  externalId: string;
  name: string;
  nameEn: string;
  specialization: string;
  durationDays: number;
  hoursPerDay: number;
  expectedTrainees: number;
  city: string;
  beneficiary: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'In-person' | 'Online' | 'External';
  earliestStart: string;
  latestEnd: string;
  notes: string;
  color: string;
};

const mapCourse = (course: CourseDto): UiCourse => ({
  id: course.id,
  externalId: course.externalId || '',
  name: course.name,
  nameEn: course.name,
  specialization: course.specialization || '',
  durationDays: course.durationDays || 1,
  hoursPerDay: course.hoursPerDay || 0,
  expectedTrainees: course.expectedTrainees || 0,
  city: course.city || '',
  beneficiary: course.beneficiary || '',
  priority: (course.priority as UiCourse['priority']) || 'Medium',
  type: courseTypeLabel(course.type),
  earliestStart: formatDate(course.earliestStart),
  latestEnd: formatDate(course.latestEnd),
  notes: course.notes || '',
  color: course.color || '#3B82F6',
});

export function Courses() {
  const { lang, theme, addToast, activeWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [courses, setCourses] = useState<UiCourse[]>([]);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<UiCourse | null>(null);
  const [sortField, setSortField] = useState<keyof UiCourse>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { page, size, setPage, setSize, resetPage } = usePagination(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [cities, setCities] = useState<string[]>([]);

  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500
    ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-800'}`;
  const errorCls = inputCls.replace('border-slate-200', 'border-red-500').replace('border-slate-600', 'border-red-500');
  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;

  const emptyForm: UiCourse = {
    id: 0, externalId: '', name: '', nameEn: '', specialization: '', durationDays: 3, hoursPerDay: 8,
    expectedTrainees: 20, city: '', beneficiary: '', priority: 'Medium', type: 'In-person', earliestStart: '', latestEnd: '', notes: '', color: '#3B82F6',
  };
  const [form, setForm] = useState<UiCourse>(emptyForm);

  const loadCourses = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await api.courses.list(activeWorkspace, {
        page,
        size,
        sort: `${sortField},${sortDir}`,
        search,
        priority: filterPriority,
        type: filterType ? uiToCourseType(filterType) : undefined,
        city: filterCity,
      });
      setCourses(data.content.map(mapCourse));
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, [activeWorkspace, page, size, sortField, sortDir, search, filterPriority, filterType, filterCity]);

  useEffect(() => {
    if (!activeWorkspace) return;
    api.courses.filterOptions(activeWorkspace)
      .then((options) => setCities(options.cities))
      .catch(() => setCities([]));
  }, [activeWorkspace]);

  const paginated = courses;

  const handleSort = (field: keyof UiCourse) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    resetPage();
  };

  const SortIcon = ({ field }: { field: keyof UiCourse }) => (
    sortField === field ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronUp size={12} className="opacity-30" />
  );

  const openCreate = () => { setForm(emptyForm); setSelectedCourse(null); setErrors({}); setShowDrawer(true); };
  const openEdit = (course: UiCourse) => { setForm(course); setSelectedCourse(course); setErrors({}); setShowDrawer(true); };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('اسم الدورة مطلوب', 'Course name is required', lang);
    if (!form.durationDays || form.durationDays < 1) errs.durationDays = t('عدد الأيام يجب أن يكون 1 على الأقل', 'Duration must be at least 1 day', lang);
    if (form.hoursPerDay < 1) errs.hoursPerDay = t('ساعات اليوم يجب أن تكون 1 على الأقل', 'Hours must be at least 1', lang);
    if (form.expectedTrainees < 1) errs.expectedTrainees = t('عدد المتدربين يجب أن يكون 1 على الأقل', 'Trainees must be at least 1', lang);
    if (form.earliestStart && form.latestEnd && form.earliestStart > form.latestEnd) {
      errs.earliestStart = t('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'Start date must be before end date', lang);
      errs.latestEnd = ' ';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!activeWorkspace) return;
    if (!validateForm()) return;
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        specialization: form.specialization || null,
        durationDays: form.durationDays,
        hoursPerDay: form.hoursPerDay,
        expectedTrainees: form.expectedTrainees,
        city: form.city || null,
        beneficiary: form.beneficiary || null,
        priority: form.priority,
        type: uiToCourseType(form.type),
        earliestStart: form.earliestStart || null,
        latestEnd: form.latestEnd || null,
        fixedDate: null,
        notes: form.notes || null,
        color: form.color || null,
      };
      if (selectedCourse) {
        await api.courses.update(activeWorkspace, selectedCourse.id, payload);
        addToast('success', t('تم تحديث الدورة', 'Course updated', lang));
      } else {
        await api.courses.create(activeWorkspace, payload);
        addToast('success', t('تمت إضافة الدورة', 'Course added', lang));
      }
      setShowDrawer(false);
      await loadCourses();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Course save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!activeWorkspace) return;
    try {
      await api.courses.delete(activeWorkspace, id);
      addToast('success', t('تم حذف الدورة', 'Course deleted', lang));
      await loadCourses();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const toggleSelect = (id: number) => setSelected((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الدورات', 'Courses', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{loading ? t('جاري التحميل...', 'Loading...', lang) : t(`${totalElements} دورة مسجلة`, `${totalElements} courses`, lang)}</p>
        </div>
        <button onClick={openCreate} disabled={!activeWorkspace} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          <Plus size={16} /> {t('دورة جديدة', 'New Course', lang)}
        </button>
      </div>

      <div className={`${card} p-4`}>
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 flex-1 min-w-[200px] rounded-xl border px-3 py-2
            ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <Search size={14} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
            <input value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} placeholder={t('بحث...', 'Search...', lang)} className="bg-transparent outline-none text-sm flex-1 placeholder:text-slate-400" />
          </div>
          <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); resetPage(); }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
            <option value="">{t('كل الأولويات', 'All Priorities', lang)}</option>
            <option value="High">{t('عالية', 'High', lang)}</option>
            <option value="Medium">{t('متوسطة', 'Medium', lang)}</option>
            <option value="Low">{t('منخفضة', 'Low', lang)}</option>
          </select>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); resetPage(); }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
            <option value="">{t('كل الأنواع', 'All Types', lang)}</option>
            <option value="In-person">{t('حضوري', 'In-person', lang)}</option>
            <option value="Online">{t('أونلاين', 'Online', lang)}</option>
            <option value="External">{t('خارجي', 'External', lang)}</option>
          </select>
          <select value={filterCity} onChange={(e) => { setFilterCity(e.target.value); resetPage(); }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
            <option value="">{t('كل المدن', 'All Cities', lang)}</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(search || filterPriority || filterType || filterCity) && (
            <button onClick={() => { setSearch(''); setFilterPriority(''); setFilterType(''); setFilterCity(''); resetPage(); }} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
              <X size={14} /> {t('مسح', 'Clear', lang)}
            </button>
          )}
        </div>
        {selected.length > 0 && (
          <div className={`mt-3 flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <span className="text-sm text-blue-700 font-medium">{selected.length} {t('مختار', 'selected', lang)}</span>
            <button onClick={() => void Promise.all(selected.map((id) => api.courses.delete(activeWorkspace, id))).then(loadCourses).then(() => { setSelected([]); addToast('success', t('تم الحذف', 'Deleted', lang)); }).catch((error: unknown) => addToast('error', error instanceof Error ? error.message : 'Bulk delete failed'))} className="text-xs text-red-600 hover:text-red-800 font-medium">{t('حذف المختار', 'Delete Selected', lang)}</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                <th className="w-10 px-4 py-3"><input type="checkbox" onChange={(e) => setSelected(e.target.checked ? paginated.map((c) => c.id) : [])} className="rounded" /></th>
                {([
                  ['externalId', 'ID'],
                  ['name', t('الاسم', 'Name', lang)],
                  ['specialization', t('التخصص', 'Specialization', lang)],
                  ['durationDays', t('الأيام', 'Days', lang)],
                  ['city', t('المدينة', 'City', lang)],
                  ['priority', t('الأولوية', 'Priority', lang)],
                  ['type', t('النوع', 'Type', lang)],
                  ['expectedTrainees', t('المتدربون', 'Trainees', lang)],
                ] as [keyof UiCourse, string][]).map(([field, label]) => (
                  <th key={field} onClick={() => handleSort(field)} className={`text-start px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-1">{label} <SortIcon field={field} /></div>
                  </th>
                ))}
                <th className={`text-start px-4 py-3 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('إجراءات', 'Actions', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={10} className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('لا توجد دورات', 'No courses found', lang)}</td></tr>
              ) : paginated.map((course) => (
                <tr key={course.id} className={`border-b table-row-hover ${isDark ? 'border-slate-700/50' : 'border-slate-50'} ${selected.includes(course.id) ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(course.id)} onChange={() => toggleSelect(course.id)} className="rounded" /></td>
                  <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{course.externalId}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                      <div>
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{lang === 'ar' ? course.name : course.nameEn}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{course.beneficiary}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{course.specialization}</td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{course.durationDays} {t('أيام', 'd', lang)}</td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{course.city}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={course.priority} /></td>
                  <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t(course.type === 'In-person' ? 'حضوري' : course.type === 'Online' ? 'أونلاين' : 'خارجي', course.type, lang)}</td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{course.expectedTrainees}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(course)} className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}><Edit2 size={13} /></button>
                      <button onClick={() => void handleDelete(course.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
          <Pagination page={page} size={size} totalElements={totalElements} totalPages={totalPages} onPageChange={setPage} onSizeChange={setSize} lang={lang} isDark={isDark} loading={loading} />
        </div>
      </div>
      )}

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => { setShowDrawer(false); setErrors({}); }} />
          <div className={`w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedCourse ? t('تعديل الدورة', 'Edit Course', lang) : t('إضافة دورة', 'Add Course', lang)}</h2>
              <button onClick={() => setShowDrawer(false)} className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}><X size={20} /></button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('اسم الدورة', 'Course Name', lang)} *</label><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, nameEn: e.target.value }))} className={`${errors.name ? errorCls : inputCls}`} />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}</div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('التخصص', 'Specialization', lang)}</label><input value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} className={inputCls} /></div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('المدينة', 'City', lang)}</label><input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className={inputCls} /></div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('عدد الأيام', 'Duration Days', lang)} *</label><input type="number" value={form.durationDays} onChange={(e) => setForm((p) => ({ ...p, durationDays: +e.target.value }))} className={`${errors.durationDays ? errorCls : inputCls}`} />{errors.durationDays && <p className="text-xs text-red-500 mt-1">{errors.durationDays}</p>}</div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('ساعات اليوم', 'Hours/Day', lang)} *</label><input type="number" value={form.hoursPerDay} onChange={(e) => setForm((p) => ({ ...p, hoursPerDay: +e.target.value }))} className={`${errors.hoursPerDay ? errorCls : inputCls}`} />{errors.hoursPerDay && <p className="text-xs text-red-500 mt-1">{errors.hoursPerDay}</p>}</div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('عدد المتدربين', 'Expected Trainees', lang)} *</label><input type="number" value={form.expectedTrainees} onChange={(e) => setForm((p) => ({ ...p, expectedTrainees: +e.target.value }))} className={`${errors.expectedTrainees ? errorCls : inputCls}`} />{errors.expectedTrainees && <p className="text-xs text-red-500 mt-1">{errors.expectedTrainees}</p>}</div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الأولوية', 'Priority', lang)}</label><select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as UiCourse['priority'] }))} className={inputCls}><option value="High">{t('عالية', 'High', lang)}</option><option value="Medium">{t('متوسطة', 'Medium', lang)}</option><option value="Low">{t('منخفضة', 'Low', lang)}</option></select></div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('النوع', 'Type', lang)}</label><select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as UiCourse['type'] }))} className={inputCls}><option value="In-person">{t('حضوري', 'In-person', lang)}</option><option value="Online">{t('أونلاين', 'Online', lang)}</option><option value="External">{t('خارجي', 'External', lang)}</option></select></div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('أقرب بداية', 'Earliest Start', lang)}</label><input type="date" value={form.earliestStart} onChange={(e) => setForm((p) => ({ ...p, earliestStart: e.target.value }))} className={`${errors.earliestStart ? errorCls : inputCls}`} />{errors.earliestStart && <p className="text-xs text-red-500 mt-1">{errors.earliestStart}</p>}</div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('أبعد نهاية', 'Latest End', lang)}</label><input type="date" value={form.latestEnd} onChange={(e) => setForm((p) => ({ ...p, latestEnd: e.target.value }))} className={`${errors.latestEnd ? errorCls : inputCls}`} />{errors.latestEnd && <p className="text-xs text-red-500 mt-1">{errors.latestEnd}</p>}</div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الجهة المستفيدة', 'Beneficiary', lang)}</label><input value={form.beneficiary} onChange={(e) => setForm((p) => ({ ...p, beneficiary: e.target.value }))} className={inputCls} /></div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('اللون', 'Color', lang)}</label><input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} className="w-full h-10 rounded-xl border cursor-pointer" /></div>
                <div className="col-span-2"><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('ملاحظات', 'Notes', lang)}</label><textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} /></div>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <button onClick={() => void handleSave()} disabled={saving} className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>{saving ? t('جاري الحفظ...', 'Saving...', lang) : t('حفظ', 'Save', lang)}</button>
              <button onClick={() => setShowDrawer(false)} className={`flex-1 py-2.5 rounded-xl font-medium text-sm border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t('إلغاء', 'Cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
