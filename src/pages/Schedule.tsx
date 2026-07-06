import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Plus, Calendar, List, LayoutGrid, Filter, AlertTriangle, X, Check, Lock } from 'lucide-react';
import { StatusChip } from '../components/ui/StatusChip';
import { Modal } from '../components/ui/Modal';
import { api, scheduleStatusLabel, uiToScheduleStatus, type CourseDto, type ScheduleEntryDto, type TrainerDto, type VenueDto } from '../lib/api';

type ViewType = 'calendar' | 'table' | 'kanban';
type UiStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Conflict';

interface UiScheduleEntry {
  id: number;
  courseId: number;
  courseName: string;
  courseNameEn: string;
  trainerId: number;
  trainerName: string;
  venueId: number;
  venueName: string;
  city: string;
  startDate: string;
  endDate: string;
  status: UiStatus;
  hasConflict: boolean;
  notes: string;
}

const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export function Schedule() {
  const { lang, theme, addToast, activeWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [view, setView] = useState<ViewType>('table');
  const [entries, setEntries] = useState<UiScheduleEntry[]>([]);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [trainers, setTrainers] = useState<TrainerDto[]>([]);
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ courseId: '', trainerId: '', venueId: '', startDate: '', endDate: '', notes: '' });
  const [pendingPayload, setPendingPayload] = useState<typeof form | null>(null);

  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;
  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  const mapEntry = (entry: ScheduleEntryDto, venueRows: VenueDto[]): UiScheduleEntry => ({
    id: entry.id,
    courseId: entry.courseId,
    courseName: entry.courseName,
    courseNameEn: entry.courseName,
    trainerId: entry.trainerId,
    trainerName: entry.trainerName,
    venueId: entry.venueId ?? 0,
    venueName: entry.venueName || '',
    city: venueRows.find((venue) => venue.id === entry.venueId)?.city || '',
    startDate: entry.startDate,
    endDate: entry.endDate,
    status: scheduleStatusLabel(entry.status, entry.conflictNotes),
    hasConflict: Boolean(entry.conflictNotes),
    notes: entry.conflictNotes || '',
  });

  const loadData = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const [entryRows, courseRows, trainerRows, venueRows] = await Promise.all([
        api.scheduleEntries.list(activeWorkspace),
        api.courses.list(activeWorkspace),
        api.trainers.list(activeWorkspace),
        api.venues.list(activeWorkspace),
      ]);
      setCourses(courseRows);
      setTrainers(trainerRows);
      setVenues(venueRows);
      setEntries(entryRows.map((entry) => mapEntry(entry, venueRows)));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeWorkspace]);

  const filtered = useMemo(() => entries.filter((e) =>
    (!filterStatus || e.status === filterStatus) &&
    (!filterCity || e.city === filterCity) &&
    (!filterMonth || new Date(e.startDate).getMonth() === +filterMonth)
  ), [entries, filterCity, filterMonth, filterStatus]);

  const cities = [...new Set(entries.map((e) => e.city).filter(Boolean))];

  const persistEntry = async (payload: typeof form) => {
    if (!activeWorkspace) return;
    if (saving) return;
    setSaving(true);
    try {
      const created = await api.scheduleEntries.create(activeWorkspace, {
        courseId: Number(payload.courseId),
        trainerId: Number(payload.trainerId),
        venueId: payload.venueId ? Number(payload.venueId) : null,
        startDate: payload.startDate,
        endDate: payload.endDate,
        conflictNotes: payload.notes || null,
      });
      setShowModal(false);
      setShowConflictWarning(false);
      setPendingPayload(null);
      setForm({ courseId: '', trainerId: '', venueId: '', startDate: '', endDate: '', notes: '' });
      addToast(created.conflictNotes ? 'warning' : 'success', t(created.conflictNotes ? 'تم الحفظ مع تعارض!' : 'تم إنشاء مدخل الجدول', created.conflictNotes ? 'Saved with conflict!' : 'Schedule entry created', lang));
      await loadData();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Schedule save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!activeWorkspace || !form.courseId || !form.trainerId || !form.startDate || !form.endDate) {
      addToast('error', t('يرجى إكمال الحقول المطلوبة', 'Please complete the required fields', lang));
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const [trainerConflicts, venueConflicts] = await Promise.all([
        api.scheduleEntries.trainerConflicts(activeWorkspace, Number(form.trainerId), form.startDate, form.endDate),
        form.venueId ? api.scheduleEntries.venueConflicts(activeWorkspace, Number(form.venueId), form.startDate, form.endDate) : Promise.resolve([]),
      ]);
      const actualTrainerConflicts = trainerConflicts.filter((item) => item.id !== Number(form.courseId));
      const actualVenueConflicts = venueConflicts.filter((item) => item.id !== Number(form.courseId));
      if (actualTrainerConflicts.length || actualVenueConflicts.length) {
        setPendingPayload(form);
        setShowConflictWarning(true);
        return;
      }
      await persistEntry(form);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Conflict check failed');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: number, status: 'Scheduled' | 'Confirmed' | 'Completed') => {
    if (!activeWorkspace) return;
    try {
      await api.scheduleEntries.updateStatus(activeWorkspace, id, uiToScheduleStatus(status));
      addToast('success', t('تم تحديث الحالة', 'Status updated', lang));
      await loadData();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Status update failed');
    }
  };

  const kanbanStatuses: UiStatus[] = ['Scheduled', 'Confirmed', 'Completed', 'Conflict'];

  const currentMonthIndex = filterMonth ? Number(filterMonth) : new Date().getMonth();
  const daysInMonth = 31;
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const entry = entries.find((e) => new Date(e.startDate).getDate() === day && new Date(e.startDate).getMonth() === currentMonthIndex);
    return { day, entry };
  });

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الجدول', 'Schedule', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(`${entries.length} مدخل`, `${entries.length} entries`, lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex rounded-xl border p-1 gap-0.5 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            {([['calendar', Calendar], ['table', List], ['kanban', LayoutGrid]] as [ViewType, typeof Calendar][]).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} className={`p-2 rounded-lg transition-colors ${view === v ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}><Icon size={16} /></button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"><Plus size={16} /> {t('مدخل جديد', 'New Entry', lang)}</button>
        </div>
      </div>

      <div className={`${card} p-4 flex flex-wrap gap-3`}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل الحالات', 'All Statuses', lang)}</option>
          {['Scheduled','Confirmed','Completed','Conflict'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل المدن', 'All Cities', lang)}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل الأشهر', 'All Months', lang)}</option>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <div className={`flex items-center gap-1.5 ms-auto text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Filter size={14} />{filtered.length} {t('نتيجة', 'results', lang)}</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <>
      {view === 'calendar' && (
        <div className={`${card} p-5`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{months[currentMonthIndex]}</h3>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {(lang === 'ar' ? ['أح','إث','ثل','أر','خم','جم','سب'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map((d) => <div key={d} className={`text-center text-xs font-semibold py-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map(({ day, entry }) => (
              <div key={day} className={`min-h-[80px] rounded-xl p-2 border calendar-day cursor-pointer ${entry ? (isDark ? 'border-blue-500/50 bg-blue-900/20' : 'border-blue-200 bg-blue-50') : (isDark ? 'border-slate-700 bg-slate-800/50 hover:border-slate-600' : 'border-slate-100 bg-white hover:border-slate-200')}`}>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{day}</span>
                {entry && <div className={`mt-1 text-xs p-1 rounded-lg font-medium leading-tight ${entry.status === 'Conflict' ? 'bg-red-100 text-red-700' : entry.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{lang === 'ar' ? entry.courseName.slice(0, 12) : entry.courseNameEn.slice(0, 12)}...</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'table' && (
        <div className={`${card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                  {[t('الدورة','Course',lang), t('المدرب','Trainer',lang), t('القاعة','Venue',lang), t('المدينة','City',lang), t('البداية','Start',lang), t('النهاية','End',lang), t('الحالة','Status',lang), t('إجراءات','Actions',lang)].map((h,i) => <th key={i} className={`text-start px-4 py-3 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className={`border-b table-row-hover ${isDark ? 'border-slate-700/50' : 'border-slate-50'} ${entry.hasConflict ? (isDark ? 'bg-red-900/10' : 'bg-red-50/50') : ''}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{entry.hasConflict && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}<span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{lang === 'ar' ? entry.courseName : entry.courseNameEn}</span></div></td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{entry.trainerName}</td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{entry.venueName}</td>
                    <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{entry.city}</td>
                    <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entry.startDate}</td>
                    <td className={`px-4 py-3 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entry.endDate}</td>
                    <td className="px-4 py-3"><StatusChip status={entry.status} size="sm" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {entry.status === 'Scheduled' && <button onClick={() => void changeStatus(entry.id, 'Confirmed')} title={t('تأكيد', 'Confirm', lang)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100"><Check size={13} /></button>}
                        {entry.status === 'Confirmed' && <button onClick={() => void changeStatus(entry.id, 'Completed')} title={t('إتمام', 'Complete', lang)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"><Check size={13} /></button>}
                        <button onClick={() => void changeStatus(entry.id, 'Confirmed')} title={t('قفل', 'Lock', lang)} className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}><Lock size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'kanban' && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kanbanStatuses.map((status) => {
            const col = filtered.filter((e) => e.status === status);
            return (
              <div key={status} className={`${card} p-4`}>
                <div className="flex items-center justify-between mb-4"><StatusChip status={status} size="sm" /><span className={`text-xs font-bold px-2 py-1 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{col.length}</span></div>
                <div className="space-y-3">
                  {col.map((entry) => (
                    <div key={entry.id} className={`p-3 rounded-xl border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`text-sm font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{lang === 'ar' ? entry.courseName : entry.courseNameEn}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entry.trainerName}</p>
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{entry.startDate}</p>
                      {entry.hasConflict && <div className="mt-2 flex items-center gap-1 text-xs text-red-500"><AlertTriangle size={11} /> {t('تعارض', 'Conflict', lang)}</div>}
                    </div>
                  ))}
                  {col.length === 0 && <div className={`text-center py-6 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('لا مدخلات', 'No entries', lang)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>)}

      <Modal open={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-lg" title={t('إنشاء مدخل جدول', 'Create Schedule Entry', lang)}>
        <div className="space-y-4">
          <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الدورة', 'Course', lang)}</label><select value={form.courseId} onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))} className={inputCls}><option value="">{t('اختر الدورة', 'Select Course', lang)}</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('المدرب', 'Trainer', lang)}</label><select value={form.trainerId} onChange={(e) => setForm((p) => ({ ...p, trainerId: e.target.value }))} className={inputCls}><option value="">{t('اختر المدرب', 'Select Trainer', lang)}</option>{trainers.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}</select></div>
          <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('القاعة', 'Venue', lang)}</label><select value={form.venueId} onChange={(e) => setForm((p) => ({ ...p, venueId: e.target.value }))} className={inputCls}><option value="">{t('اختر القاعة', 'Select Venue', lang)}</option>{venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3"><div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('تاريخ البداية', 'Start Date', lang)}</label><input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className={inputCls} /></div><div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('تاريخ النهاية', 'End Date', lang)}</label><input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className={inputCls} /></div></div>
          <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('ملاحظات', 'Notes', lang)}</label><textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className={inputCls + ' resize-none'} /></div>
        </div>
        <div className="flex gap-3 mt-6"><button onClick={() => void handleSaveEntry()} disabled={saving} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>{saving ? t('جاري الحفظ...', 'Saving...', lang) : t('حفظ', 'Save', lang)}</button><button onClick={() => setShowModal(false)} className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t('إلغاء', 'Cancel', lang)}</button></div>
      </Modal>

      <Modal open={showConflictWarning} onClose={() => setShowConflictWarning(false)} maxWidth="max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-red-600" /></div>
        <h3 className={`text-center font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('تحذير: تعارض!', 'Warning: Conflict!', lang)}</h3>
        <p className={`text-center text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('هناك تعارض مع مدرب أو قاعة في نفس الفترة. هل تريد الحفظ مع التعارض؟', 'There is a trainer or venue conflict in the same period. Save with conflict anyway?', lang)}</p>
        <div className="flex gap-3"><button onClick={() => pendingPayload && void persistEntry(pendingPayload)} disabled={saving} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${saving ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}>{saving ? t('جاري الحفظ...', 'Saving...', lang) : t('حفظ مع التعارض', 'Save with Conflict', lang)}</button><button onClick={() => setShowConflictWarning(false)} className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t('مراجعة', 'Review', lang)}</button></div>
      </Modal>
    </div>
  );
}
