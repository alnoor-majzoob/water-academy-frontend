import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Plus, CalendarRange, List, LayoutGrid, Filter, AlertTriangle, X, Check, Lock, Trash2, type LucideIcon } from 'lucide-react';
import { StatusChip } from '../components/ui/StatusChip';
import { Modal } from '../components/ui/Modal';
import { api, scheduleStatusLabel, uiToScheduleStatus, type CourseDto, type ScheduleEntryDto, type TrainerDto, type VenueDto } from '../lib/api';
import { Pagination } from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';

type ViewType = 'gantt' | 'table' | 'kanban';
type UiStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Conflict';

export function Schedule() {
  const { lang, theme, addToast, activeWorkspace, currentWorkspace } = useApp();
  const isDark = theme === 'dark';

  const months = useMemo(() =>
    lang === 'ar'
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  [lang]);
  const [view, setView] = useState<ViewType>('table');
  const [entries, setEntries] = useState<UiScheduleEntry[]>([]);
  const [tableEntries, setTableEntries] = useState<UiScheduleEntry[]>([]);
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
  const [loadingTable, setLoadingTable] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({ courseId: '', trainerId: '', venueId: '', startDate: '', endDate: '', notes: '' });
  const [pendingPayload, setPendingPayload] = useState<typeof form | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const { page, size, setPage, setSize, resetPage } = usePagination(20);
  const [tableTotalElements, setTableTotalElements] = useState(0);
  const [tableTotalPages, setTableTotalPages] = useState(1);

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
        api.scheduleEntries.listAll(activeWorkspace),
        api.courses.listAll(activeWorkspace),
        api.trainers.listAll(activeWorkspace),
        api.venues.listAll(activeWorkspace),
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

  const loadTableEntries = async () => {
    if (!activeWorkspace) return;
    setLoadingTable(true);
    try {
      const month = filterMonth !== ''
        ? `${currentWorkspace?.year || new Date().getFullYear()}-${String(Number(filterMonth) + 1).padStart(2, '0')}`
        : undefined;
      const data = await api.scheduleEntries.list(activeWorkspace, {
        page,
        size,
        sort: 'startDate,asc',
        status: filterStatus && filterStatus !== 'Conflict' ? uiToScheduleStatus(filterStatus as 'Scheduled' | 'Confirmed' | 'Completed') : undefined,
        hasConflict: filterStatus === 'Conflict' ? true : undefined,
        city: filterCity,
        month,
      });
      setTableEntries(data.content.map((entry) => mapEntry(entry, venues)));
      setTableTotalElements(data.totalElements);
      setTableTotalPages(data.totalPages || 1);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load schedule table');
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeWorkspace]);

  useEffect(() => {
    if (view !== 'table') return;
    void loadTableEntries();
  }, [activeWorkspace, view, page, size, filterStatus, filterCity, filterMonth, venues]);

  const filtered = useMemo(() => entries.filter((e) =>
    (!filterStatus || e.status === filterStatus) &&
    (!filterCity || e.city === filterCity) &&
    (filterMonth === '' || new Date(e.startDate).getMonth() === Number(filterMonth))
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
      if (view === 'table') await loadTableEntries();
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
    if (!activeWorkspace || statusUpdating.has(id)) return;
    setStatusUpdating(prev => new Set(prev).add(id));

    const prevStatus = entries.find(e => e.id === id)?.status as UiStatus | undefined;
    if (!prevStatus) { setStatusUpdating(prev => { const n = new Set(prev); n.delete(id); return n; }); return; }

    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: status as UiStatus } : e));

    try {
      await api.scheduleEntries.updateStatus(activeWorkspace, id, uiToScheduleStatus(status));
      addToast('success', t('تم تحديث الحالة', 'Status updated', lang));
      if (view === 'table') await loadTableEntries();
    } catch (error) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: prevStatus } : e));
      addToast('error', error instanceof Error ? error.message : 'Status update failed');
    } finally {
      setStatusUpdating(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!activeWorkspace || pendingDeleteId === null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);

    const deletedEntry = entries.find(e => e.id === id);
    setEntries(prev => prev.filter(e => e.id !== id));

    try {
      await api.scheduleEntries.delete(activeWorkspace, id);
      addToast('success', t('تم حذف المدخل', 'Entry deleted', lang));
      if (view === 'table') await loadTableEntries();
    } catch (error) {
      if (deletedEntry) setEntries(prev => [...prev, deletedEntry]);
      addToast('error', error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const kanbanStatuses: UiStatus[] = ['Scheduled', 'Confirmed', 'Completed', 'Conflict'];

  const ganttMonthIndex = filterMonth !== '' ? Number(filterMonth) : new Date().getMonth();
  const ganttYear = currentWorkspace?.year || new Date().getFullYear();
  const ganttDaysInMonth = new Date(ganttYear, ganttMonthIndex + 1, 0).getDate();
  const ganttDays = Array.from({ length: ganttDaysInMonth }, (_, i) => i + 1);
  const ganttGridColumns = `repeat(${ganttDaysInMonth}, minmax(44px, 1fr))`;
  const ganttMinWidth = `${ganttDaysInMonth * 44}px`;
  const ganttChartMinWidth = `${280 + (ganttDaysInMonth * 44)}px`;
  const ganttLayoutColumns = `280px ${ganttMinWidth}`;
  const ganttMonthStart = new Date(ganttYear, ganttMonthIndex, 1);
  const ganttMonthEnd = new Date(ganttYear, ganttMonthIndex, ganttDaysInMonth);

  const getGanttBar = (entry: UiScheduleEntry) => {
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    const visibleStart = start < ganttMonthStart ? ganttMonthStart : start;
    const visibleEnd = end > ganttMonthEnd ? ganttMonthEnd : end;
    const startDay = visibleStart.getDate();
    const duration = Math.max(1, visibleEnd.getDate() - startDay + 1);
    return { startDay, duration };
  };

  const ganttBarClass = (entry: UiScheduleEntry) => {
    if (entry.hasConflict || entry.status === 'Conflict') return 'bg-red-500 text-white shadow-red-500/20';
    if (entry.status === 'Confirmed') return 'bg-emerald-500 text-white shadow-emerald-500/20';
    if (entry.status === 'Completed') return isDark ? 'bg-slate-600 text-slate-100 shadow-slate-900/30' : 'bg-slate-500 text-white shadow-slate-500/20';
    return 'bg-blue-600 text-white shadow-blue-500/20';
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الجدول', 'Schedule', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(`${entries.length} مدخل`, `${entries.length} entries`, lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex rounded-xl border p-1 gap-0.5 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            {([['gantt', CalendarRange], ['table', List], ['kanban', LayoutGrid]] as [ViewType, LucideIcon][]).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} className={`p-2 rounded-lg transition-colors ${view === v ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}><Icon size={16} /></button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"><Plus size={16} /> {t('مدخل جديد', 'New Entry', lang)}</button>
        </div>
      </div>

      <div className={`${card} p-4 flex flex-wrap gap-3`}>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل الحالات', 'All Statuses', lang)}</option>
          {['Scheduled','Confirmed','Completed','Conflict'].map((s) => (
            <option key={s} value={s}>{t({ Scheduled: 'مجدول', Confirmed: 'مؤكد', Completed: 'منتهي', Conflict: 'تعارض' }[s], s, lang)}</option>
          ))}
        </select>
        <select value={filterCity} onChange={(e) => { setFilterCity(e.target.value); resetPage(); }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل المدن', 'All Cities', lang)}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); resetPage(); }} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل الأشهر', 'All Months', lang)}</option>
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <div className={`flex items-center gap-1.5 ms-auto text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Filter size={14} />{view === 'table' ? tableTotalElements : filtered.length} {t('نتيجة', 'results', lang)}</div>
      </div>

      {loading || (view === 'table' && loadingTable) ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <>
      {view === 'gantt' && (
        <div className={`${card} overflow-hidden`}>
          <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('مخطط جانت', 'Gantt Chart', lang)}</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{months[ganttMonthIndex]} {ganttYear}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {[
                ['bg-blue-600', t('مجدول', 'Scheduled', lang)],
                ['bg-emerald-500', t('مؤكد', 'Confirmed', lang)],
                ['bg-slate-500', t('منتهي', 'Completed', lang)],
                ['bg-red-500', t('تعارض', 'Conflict', lang)],
              ].map(([color, label]) => <span key={label} className={`flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}</span>)}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className={`p-12 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('لا توجد مدخلات تطابق الفلتر', 'No entries match the current filters', lang)}</div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: ganttChartMinWidth }}>
                <div className={`grid border-b ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`} style={{ gridTemplateColumns: ganttLayoutColumns }}>
                  <div className={`px-4 py-3 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('الدورة', 'Course', lang)}</div>
                  <div>
                    <div className="grid" style={{ gridTemplateColumns: ganttGridColumns, minWidth: ganttMinWidth }}>
                      {ganttDays.map((day) => <div key={day} className={`py-3 text-center text-[11px] font-semibold border-s ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-500'}`}>{day}</div>)}
                    </div>
                  </div>
                </div>
                <div className={isDark ? 'divide-y divide-slate-700/70' : 'divide-y divide-slate-100'}>
                  {filtered.map((entry) => {
                    const bar = getGanttBar(entry);
                    return (
                      <div key={entry.id} className="grid min-h-[72px]" style={{ gridTemplateColumns: ganttLayoutColumns }}>
                        <div className={`px-4 py-3 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                          <div className="flex items-start gap-2">
                            {entry.hasConflict && <AlertTriangle size={14} className="mt-0.5 text-red-500 flex-shrink-0" />}
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{lang === 'ar' ? entry.courseName : entry.courseNameEn}</p>
                              <p className={`truncate text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entry.trainerName} · {entry.venueName || '-'}</p>
                              <p className={`text-[11px] mt-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{entry.startDate} → {entry.endDate}</p>
                            </div>
                          </div>
                        </div>
                        <div className="py-4 pe-4">
                          <div className="grid relative h-10" style={{ gridTemplateColumns: ganttGridColumns, minWidth: ganttMinWidth }}>
                            {ganttDays.map((day) => <div key={day} className={`border-s ${isDark ? 'border-slate-800' : 'border-slate-100'}`} />)}
                            <div
                              className={`row-start-1 h-9 rounded-xl px-3 flex items-center gap-2 text-xs font-semibold shadow-lg ${ganttBarClass(entry)}`}
                              style={{ gridColumn: `${bar.startDay} / span ${bar.duration}` }}
                              title={`${entry.courseName}: ${entry.startDate} - ${entry.endDate}`}
                            >
                              {entry.hasConflict && <AlertTriangle size={12} className="flex-shrink-0" />}
                              <span className="truncate">{entry.courseName}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
                {tableEntries.map((entry) => (
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
                        {entry.status === 'Scheduled' && <button onClick={() => void changeStatus(entry.id, 'Confirmed')} disabled={statusUpdating.has(entry.id)} title={t('تأكيد', 'Confirm', lang)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed">{statusUpdating.has(entry.id) ? <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : <Check size={13} />}</button>}
                        {entry.status === 'Confirmed' && <button onClick={() => void changeStatus(entry.id, 'Completed')} disabled={statusUpdating.has(entry.id)} title={t('إتمام', 'Complete', lang)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed">{statusUpdating.has(entry.id) ? <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" /> : <Check size={13} />}</button>}
                        <button onClick={() => void changeStatus(entry.id, 'Confirmed')} disabled={statusUpdating.has(entry.id)} title={t('قفل', 'Lock', lang)} className={`p-1.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}><Lock size={13} /></button>
                        <button onClick={() => setPendingDeleteId(entry.id)} title={t('حذف', 'Delete', lang)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tableEntries.length === 0 && (
                  <tr>
                    <td colSpan={8} className={`text-center py-12 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {tableTotalElements === 0
                        ? t('لا توجد مدخلات جدول بعد. اضف مدخلا جديدا', 'No schedule entries yet. Add a new entry.', lang)
                        : t('لا توجد مدخلات تطابق الفلتر', 'No entries match the current filters', lang)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!loadingTable && tableEntries.length > 0 && (
            <Pagination page={page} size={size} totalElements={tableTotalElements} totalPages={tableTotalPages} onPageChange={setPage} onSizeChange={setSize} lang={lang} isDark={isDark} loading={loadingTable} />
          )}
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
                      <button onClick={() => setPendingDeleteId(entry.id)} className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-600"><Trash2 size={11} /> {t('حذف', 'Delete', lang)}</button>
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

      <Modal open={pendingDeleteId !== null} onClose={() => setPendingDeleteId(null)} maxWidth="max-w-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} className="text-red-600" /></div>
        <h3 className={`text-center font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('حذف المدخل', 'Delete Entry', lang)}</h3>
        <p className={`text-center text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('هل أنت متأكد من حذف هذا المدخل؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to delete this entry? This action cannot be undone.', lang)}</p>
        <div className="flex gap-3"><button onClick={() => void handleDelete()} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white">{t('حذف', 'Delete', lang)}</button><button onClick={() => setPendingDeleteId(null)} className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t('إلغاء', 'Cancel', lang)}</button></div>
      </Modal>
    </div>
  );
}
