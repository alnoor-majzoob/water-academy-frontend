import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { ListX, Clock, Users, MapPin, AlertTriangle } from 'lucide-react';
import { PriorityBadge } from '../components/ui/StatusChip';
import { api, formatDate, type CourseDto, type ScheduleEntryDto } from '../lib/api';

const reasonConfig: Record<string, { ar: string; en: string; color: string; icon: string }> = {
  not_scheduled: { ar: 'غير موجودة في الجدول', en: 'Not in schedule', color: 'bg-orange-100 text-orange-700', icon: '📋' },
  narrow_window: { ar: 'نافذة التواريخ ضيقة', en: 'Date window too narrow', color: 'bg-blue-100 text-blue-700', icon: '⏰' },
  no_city: { ar: 'لا توجد مدينة محددة', en: 'No preferred city', color: 'bg-purple-100 text-purple-700', icon: '📍' },
};

const inferReason = (course: CourseDto) => {
  if (course.earliestStart && course.latestEnd) {
    const start = new Date(course.earliestStart).getTime();
    const end = new Date(course.latestEnd).getTime();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (course.durationDays && days < course.durationDays) return 'narrow_window';
  }
  if (!course.city) return 'no_city';
  return 'not_scheduled';
};

export function Unscheduled() {
  const { lang, theme, activeWorkspace, addToast } = useApp();
  const isDark = theme === 'dark';
  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntryDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    Promise.all([api.courses.list(activeWorkspace), api.scheduleEntries.list(activeWorkspace)])
      .then(([courseRows, entryRows]) => { setCourses(courseRows); setScheduleEntries(entryRows); })
      .catch((error: unknown) => addToast('error', error instanceof Error ? error.message : 'Failed to load unscheduled courses'))
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const unscheduledCourses = useMemo(() => {
    const scheduledIds = new Set(scheduleEntries.map((entry) => entry.courseId));
    return courses.filter((course) => !scheduledIds.has(course.id)).map((course) => {
      const reasonKey = inferReason(course);
      return {
        id: course.id,
        name: course.name,
        nameEn: course.name,
        specialization: course.specialization || '',
        duration: course.durationDays || 0,
        trainees: course.expectedTrainees || 0,
        city: course.city || t('غير محدد', 'Unspecified', lang),
        priority: (course.priority as 'High' | 'Medium' | 'Low') || 'Medium',
        reason: reasonKey,
        reasonEn: reasonConfig[reasonKey].en,
        earliestStart: formatDate(course.earliestStart),
        latestEnd: formatDate(course.latestEnd),
      };
    });
  }, [courses, lang, scheduleEntries]);

  const summaryKeys = Object.keys(reasonConfig);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الدورات غير المجدولة', 'Unscheduled Courses', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(`${unscheduledCourses.length} دورة تحتاج إلى جدولة`, `${unscheduledCourses.length} courses need scheduling`, lang)}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-50 text-orange-700'}`}><AlertTriangle size={16} /><span className="text-sm font-medium">{t('يتطلب مراجعة', 'Needs Review', lang)}</span></div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (<>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryKeys.map((key) => {
          const cfg = reasonConfig[key];
          const count = unscheduledCourses.filter((course) => course.reason === key).length;
          return <div key={key} className={`${card} p-3 text-center`}><div className="text-2xl mb-1">{cfg.icon}</div><div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{count}</div><div className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(cfg.ar, cfg.en, lang)}</div></div>;
        })}
      </div>

      <div className="space-y-4">
        {unscheduledCourses.map((course) => {
          const reason = reasonConfig[course.reason];
          return (
            <div key={course.id} className={`${card} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>{reason.icon}</div>
                  <div>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{lang === 'ar' ? course.name : course.nameEn}</h3>
                    <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{course.specialization}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Clock size={11} /> {course.duration} {t('أيام', 'days', lang)}</div>
                      <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><Users size={11} /> {course.trainees}</div>
                      <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><MapPin size={11} /> {course.city}</div>
                      <PriorityBadge priority={course.priority} />
                    </div>
                    {(course.earliestStart || course.latestEnd) && <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{course.earliestStart} {course.latestEnd ? `→ ${course.latestEnd}` : ''}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3"><span className={`text-xs font-medium px-3 py-1.5 rounded-full ${reason.color}`}>{t(reason.ar, reason.en, lang)}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {unscheduledCourses.length === 0 && !loading && (
        <div className={`${card} p-16 flex flex-col items-center gap-4 text-center`}>
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center"><ListX size={28} className="text-green-500" /></div>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('رائع! لا توجد دورات غير مجدولة', 'Great! No unscheduled courses', lang)}</p>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('جميع الدورات الموجودة تم جدولتها أو لا توجد بيانات بعد', 'All available courses are scheduled or no data has been imported yet', lang)}</p>
        </div>
      )}
      </>)}
    </div>
  );
}
