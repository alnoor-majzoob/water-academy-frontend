import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BookOpen, Users, MapPin, AlertTriangle, CalendarCheck, Clock, TrendingUp, Plus, Upload, FileDown, CalendarRange } from 'lucide-react';
import { api, scheduleStatusLabel, type DashboardDto } from '../lib/api';
import type { NavItem } from '../components/layout/Sidebar';

interface Props { setActivePage: (p: NavItem) => void; }
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function Dashboard({ setActivePage }: Props) {
  const { lang, theme, addToast, activeWorkspace, currentWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [dashboard, setDashboard] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(false);

  const card = `rounded-2xl p-5 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;

  useEffect(() => {
    if (!activeWorkspace) {
      setDashboard(null);
      return;
    }
    setLoading(true);
    api.dashboard.get(activeWorkspace)
      .then(setDashboard)
      .catch((error: unknown) => addToast('error', error instanceof Error ? error.message : 'Dashboard load failed'))
    .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const totalCourses = dashboard?.totalCourses ?? 0;
  const scheduledCount = dashboard?.scheduledCourses ?? 0;

  const kpis = [
    { ar: 'إجمالي الدورات', en: 'Total Courses', value: totalCourses, icon: BookOpen, color: 'blue' },
    { ar: 'الدورات المجدولة', en: 'Scheduled', value: scheduledCount, icon: CalendarCheck, color: 'green' },
    { ar: 'غير المجدولة', en: 'Unscheduled', value: dashboard?.unscheduledCourses ?? 0, icon: Clock, color: 'orange' },
    { ar: 'المدربون', en: 'Trainers', value: dashboard?.totalTrainers ?? 0, icon: Users, color: 'purple' },
    { ar: 'القاعات', en: 'Venues', value: dashboard?.totalVenues ?? 0, icon: MapPin, color: 'teal' },
    { ar: 'التعارضات', en: 'Conflicts', value: dashboard?.conflicts ?? 0, icon: AlertTriangle, color: 'red' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
    teal: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  };

  const quickActions = [
    { ar: 'إنشاء مساحة عمل', en: 'New Workspace', icon: Plus, page: 'workspaces' as NavItem, color: 'bg-blue-600 hover:bg-blue-700' },
    { ar: 'استيراد Excel', en: 'Import Excel', icon: Upload, page: 'import' as NavItem, color: 'bg-purple-600 hover:bg-purple-700' },
    { ar: 'إضافة دورة', en: 'Add Course', icon: BookOpen, page: 'courses' as NavItem, color: 'bg-green-600 hover:bg-green-700' },
    { ar: 'إنشاء جدول', en: 'Create Schedule', icon: CalendarRange, page: 'schedule' as NavItem, color: 'bg-teal-600 hover:bg-teal-700' },
    { ar: 'تصدير Excel', en: 'Export Excel', icon: FileDown, page: 'export' as NavItem, color: 'bg-slate-600 hover:bg-slate-700' },
  ];

  const chartData = useMemo(() => {
    const monthNames = lang === 'ar' ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return monthNames.map((name, index) => ({ name, courses: dashboard?.coursesByMonth[index] ?? 0 }));
  }, [dashboard?.coursesByMonth, lang]);

  const typeData = useMemo(() => {
    return [
      { type: lang === 'ar' ? 'حضوري' : 'In-person', value: dashboard?.coursesByType.inPerson ?? 0 },
      { type: lang === 'ar' ? 'أونلاين' : 'Online', value: dashboard?.coursesByType.online ?? 0 },
      { type: lang === 'ar' ? 'خارجي' : 'External', value: dashboard?.coursesByType.external ?? 0 },
    ];
  }, [dashboard?.coursesByType, lang]);

  const trainerUtilization = dashboard?.trainerUtilization ?? [];
  const upcoming = dashboard?.upcomingSessions ?? [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('لوحة التحكم', 'Dashboard', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentWorkspace ? `${currentWorkspace.name} — ${currentWorkspace.year}` : t('اختر مساحة عمل', 'Select a workspace', lang)}</p>
        </div>
        <div className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-700'}`}><TrendingUp size={14} />{totalCourses ? `${Math.round((scheduledCount / Math.max(totalCourses, 1)) * 100)}% ${t('مكتمل', 'Complete', lang)}` : t('لا توجد بيانات', 'No data', lang)}</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return <div key={i} className={`${card} flex flex-col gap-3`}><div className="flex items-start justify-between"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[kpi.color]}`}><Icon size={18} /></div></div><div><div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{kpi.value}</div><div className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(kpi.ar, kpi.en, lang)}</div></div></div>;
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} lg:col-span-2`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الدورات حسب الشهر', 'Courses by Month', lang)}</h3>
          <ResponsiveContainer width="100%" height={200}><BarChart data={chartData} barSize={28}><CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#f1f5f9'} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} /><YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} /><Tooltip formatter={(value) => [value ?? 0, t('الدورات', 'Courses', lang)]} contentStyle={{ background: isDark ? '#1e293b' : '#fff', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: isDark ? '#f1f5f9' : '#1e293b' }} /><Bar dataKey="courses" fill="#3B82F6" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <div className={`${card}`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('نوع التدريب', 'Delivery Type', lang)}</h3>
          <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="type">{typeData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: isDark ? '#1e293b' : '#fff', borderRadius: 8, fontSize: 12 }} /><Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ fontSize: 11 }}>{val}</span>} /></PieChart></ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${card} lg:col-span-2`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('استخدام المدربين', 'Trainer Utilization', lang)}</h3>
          <div className="space-y-3">{trainerUtilization.map((tr, i) => { const max = tr.maxDaysPerMonth || Math.max(tr.scheduledDays, 1); const pct = max > 0 ? Math.round((tr.scheduledDays / max) * 100) : 0; return <div key={i}><div className="flex items-center justify-between mb-1"><span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{tr.trainerName}</span><span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tr.scheduledDays}/{max} {t('يوم', 'days', lang)}</span></div><div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}><div className={`h-2 rounded-full transition-all duration-1000 ${pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div></div>; })}</div>
        </div>
        <div className={`${card}`}>
          <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الجلسات القادمة', 'Upcoming Sessions', lang)}</h3>
          <div className="space-y-2">{upcoming.map((entry, i) => { const uiStatus = scheduleStatusLabel(entry.status, entry.hasConflict ? 'Conflict' : null); return <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}><div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white font-bold text-xs ${uiStatus === 'Conflict' ? 'bg-red-500' : uiStatus === 'Confirmed' ? 'bg-green-500' : 'bg-blue-500'}`}><span>{new Date(entry.startDate).getDate()}</span><span className="text-[9px]">{new Date(entry.startDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en', { month: 'short' })}</span></div><div className="flex-1 min-w-0"><p className={`text-sm font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{entry.courseName}</p><p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entry.trainerName}</p></div><span className={`text-xs px-2 py-1 rounded-full font-medium ${uiStatus === 'Confirmed' ? 'bg-green-100 text-green-700' : uiStatus === 'Conflict' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{uiStatus === 'Conflict' ? t('تعارض', 'Conflict', lang) : uiStatus === 'Confirmed' ? t('مؤكد', 'Confirmed', lang) : t('مجدول', 'Scheduled', lang)}</span></div>; })}</div>
        </div>
      </div>

      <div className={`${card}`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الإجراءات السريعة', 'Quick Actions', lang)}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">{quickActions.map((action, i) => { const Icon = action.icon; return <button key={i} onClick={() => { setActivePage(action.page); addToast('info', t(`فتح ${action.ar}`, `Opening ${action.en}`, lang)); }} className={`flex flex-col items-center gap-2 p-3 rounded-xl text-white text-xs font-medium transition-all hover:scale-105 ${action.color}`}><Icon size={18} />{t(action.ar, action.en, lang)}</button>; })}</div>
      </div>
    </div>
  );
}
