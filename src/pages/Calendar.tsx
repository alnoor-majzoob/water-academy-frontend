import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, type CalendarDayDto } from '../lib/api';

type DayType = 'working' | 'holiday' | 'weekend';

const toDayType = (day?: CalendarDayDto): DayType => {
  if (!day) return 'weekend';
  if (day.isHoliday) return 'holiday';
  if (!day.isWorkDay) return 'weekend';
  return 'working';
};

const toRequest = (type: DayType) => ({
  isWorkDay: type === 'working',
  isHoliday: type === 'holiday',
});

export function CalendarPage() {
  const { lang, theme, addToast, activeWorkspace, currentWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [currentMonth, setCurrentMonth] = useState(0);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [calendarDays, setCalendarDays] = useState<CalendarDayDto[]>([]);
  const [loading, setLoading] = useState(false);

  const year = currentWorkspace?.year || new Date().getFullYear();
  const months = lang === 'ar' ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = lang === 'ar' ? ['أح','إث','ثل','أر','خم','جم','سب'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const loadCalendar = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await api.calendarDays.list(activeWorkspace);
      setCalendarDays(data);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalendar();
  }, [activeWorkspace]);

  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
  const firstDayOffset = new Date(year, currentMonth, 1).getDay();

  const monthRows = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = `${year}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const saved = calendarDays.find((item) => item.date === date);
      const type = toDayType(saved);
      return { day, date, saved, type };
    });
  }, [calendarDays, currentMonth, daysInMonth, year]);

  const toggleDay = async (date: string, current: DayType, existing?: CalendarDayDto) => {
    if (!activeWorkspace) return;
    const next: DayType = current === 'working' ? 'holiday' : current === 'holiday' ? 'weekend' : 'working';
    const body = { date, ...toRequest(next) };
    try {
      if (existing) {
        await api.calendarDays.update(activeWorkspace, existing.id, body);
      } else {
        await api.calendarDays.create(activeWorkspace, body);
      }
      addToast('info', t(`تم تغيير اليوم إلى ${next === 'working' ? 'عمل' : next === 'holiday' ? 'إجازة' : 'عطلة'}`, `Day changed to ${next}`, lang));
      await loadCalendar();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Calendar update failed');
    }
  };

  const dayColors: Record<DayType, string> = {
    working: isDark ? 'bg-slate-700/50 border-slate-600 hover:border-blue-500 text-slate-200' : 'bg-white border-slate-200 hover:border-blue-400 text-slate-700',
    holiday: isDark ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-300 text-red-700',
    weekend: isDark ? 'bg-slate-800/50 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400',
  };

  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;
  const stats = monthRows.reduce((acc, row) => { acc[row.type]++; return acc; }, { working: 0, holiday: 0, weekend: 0 });

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('التقويم', 'Calendar', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(`إدارة أيام العمل والإجازات ${year}`, `Manage working days & holidays ${year}`, lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex rounded-xl border p-1 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            {(['calendar', 'table'] as const).map((v) => <button key={v} onClick={() => setViewMode(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === v ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>{v === 'calendar' ? t('تقويم', 'Calendar', lang) : t('جدول', 'Table', lang)}</button>)}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (<>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('أيام عمل', 'Working Days', lang), count: stats.working, dot: 'bg-green-500' },
          { label: t('إجازات', 'Holidays', lang), count: stats.holiday, dot: 'bg-red-500' },
          { label: t('عطل/غير عمل', 'Non-working', lang), count: stats.weekend, dot: 'bg-slate-400' },
        ].map((s, i) => <div key={i} className={`${card} p-4 flex items-center gap-3`}><span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} /><div><div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{s.count}</div><div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</div></div></div>)}
      </div>

      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setCurrentMonth((m) => Math.max(0, m - 1))} className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}><ChevronLeft size={18} /></button>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{months[currentMonth]} {year}</h3>
          <button onClick={() => setCurrentMonth((m) => Math.min(11, m + 1))} className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}><ChevronRight size={18} /></button>
        </div>

        {viewMode === 'calendar' ? (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((d) => <div key={d} className={`text-center text-xs font-semibold py-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }, (_, i) => <div key={`e${i}`} />)}
              {monthRows.map(({ day, date, type, saved }) => (
                <button key={day} onClick={() => void toggleDay(date, type, saved)} className={`aspect-square rounded-xl border text-sm font-medium calendar-day flex flex-col items-center justify-center gap-0.5 ${dayColors[type]}`}>
                  <span>{day}</span>
                  {type === 'holiday' && <span className="text-[8px] leading-tight">🏖️</span>}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                  {[t('اليوم','Day',lang), t('التاريخ','Date',lang), t('النوع','Type',lang), t('تغيير','Toggle',lang)].map((h,i) => <th key={i} className={`text-start px-4 py-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {monthRows.map(({ day, date, type, saved }) => (
                  <tr key={day} className={`border-b ${isDark ? 'border-slate-700/50' : 'border-slate-50'} ${type === 'holiday' ? (isDark ? 'bg-red-900/10' : 'bg-red-50/50') : type === 'weekend' ? (isDark ? 'bg-slate-800/50' : 'bg-slate-50/50') : ''}`}>
                    <td className={`px-4 py-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{new Date(year, currentMonth, day).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en', { weekday: 'short' })}</td>
                    <td className={`px-4 py-2 text-sm font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{date}</td>
                    <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type === 'working' ? 'bg-green-100 text-green-700' : type === 'holiday' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{t({ working: 'عمل', holiday: 'إجازة', weekend: 'عطلة' }[type], type, lang)}</span></td>
                    <td className="px-4 py-2"><button onClick={() => void toggleDay(date, type, saved)} className="text-xs text-blue-600 hover:text-blue-800">{t('تبديل', 'Toggle', lang)}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center gap-5 mt-4 pt-4 border-t flex-wrap">
          {[
            { label: t('يوم عمل', 'Working Day', lang), dot: 'bg-green-500' },
            { label: t('إجازة', 'Holiday', lang), dot: 'bg-red-500' },
            { label: t('عطلة/غير عمل', 'Non-working', lang), dot: 'bg-slate-300' },
          ].map((l, i) => <div key={i} className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${l.dot}`} /><span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{l.label}</span></div>)}
          <span className={`text-xs ms-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('اضغط على اليوم لتغيير نوعه', 'Click a day to change its type', lang)}</span>
        </div>
      </div>
      </>)}
    </div>
  );
}
