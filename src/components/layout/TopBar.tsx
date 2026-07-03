import { useState } from 'react';
import { useApp, t } from '../../context/AppContext';
import { Sun, Moon, ChevronDown, Globe } from 'lucide-react';
import type { NavItem } from './Sidebar';
import { workspaceStatusLabel } from '../../lib/api';

const breadcrumbMap: Record<NavItem, { ar: string; en: string }> = {
  dashboard:   { ar: 'لوحة التحكم',       en: 'Dashboard' },
  workspaces:  { ar: 'مساحات العمل',       en: 'Workspaces' },
  import:      { ar: 'استيراد البيانات',   en: 'Import Data' },
  courses:     { ar: 'الدورات',            en: 'Courses' },
  trainers:    { ar: 'المدربون',           en: 'Trainers' },
  venues:      { ar: 'القاعات',            en: 'Venues' },
  calendar:    { ar: 'التقويم',            en: 'Calendar' },
  assignments: { ar: 'تعيين المدربين',     en: 'Trainer Assignments' },
  schedule:    { ar: 'الجدول',             en: 'Schedule' },
  conflicts:   { ar: 'التعارضات',          en: 'Conflicts' },
  unscheduled: { ar: 'غير المجدولة',       en: 'Unscheduled' },
  tasks:       { ar: 'المهام',             en: 'Tasks' },
  export:      { ar: 'التصدير والتقارير',  en: 'Export / Reports' },
  settings:    { ar: 'الإعدادات',          en: 'Settings' },
};

interface TopBarProps {
  activePage: NavItem;
}

export function TopBar({ activePage }: TopBarProps) {
  const {
    lang,
    setLang,
    theme,
    setTheme,
    activeWorkspace,
    setActiveWorkspace,
    currentWorkspace,
    workspaces,
    loadingWorkspaces,
    addToast,
  } = useApp();
  const isDark = theme === 'dark';
  const [showWS, setShowWS] = useState(false);

  const base = `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer
    ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`;

  return (
    <header className={`h-14 flex items-center gap-3 px-4 border-b flex-shrink-0
      ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center gap-2 flex-1">
        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {t('أكاديمية المياه', 'Water Academy', lang)}
        </span>
        <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>/</span>
        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {t(breadcrumbMap[activePage].ar, breadcrumbMap[activePage].en, lang)}
        </span>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowWS(!showWS)}
          className={`${base} border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentWorkspace?.color || '#3B82F6' }} />
          <span className="hidden sm:inline">
            {loadingWorkspaces
              ? t('جاري التحميل...', 'Loading...', lang)
              : currentWorkspace?.name || t('بدون مساحة عمل', 'No Workspace', lang)}
          </span>
          <ChevronDown size={14} />
        </button>
        {showWS && (
          <div className={`absolute top-10 z-50 rounded-xl shadow-xl border min-w-[240px]
            ${lang === 'ar' ? 'right-0' : 'left-0'}
            ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            {workspaces.length === 0 ? (
              <div className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('لا توجد مساحات عمل', 'No workspaces found', lang)}
              </div>
            ) : (
              workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws.id);
                    setShowWS(false);
                    addToast('info', t(`تم التبديل إلى ${ws.name}`, `Switched to ${ws.name}`, lang));
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm
                    ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}
                    ${ws.id === activeWorkspace ? (isDark ? 'bg-slate-700' : 'bg-blue-50 text-blue-700') : ''}`}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ws.color || '#3B82F6' }} />
                  <div className="flex-1 text-start">
                    <div className="font-medium">{ws.name}</div>
                    <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {ws.year} · {workspaceStatusLabel(ws.status)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => { setLang(lang === 'ar' ? 'en' : 'ar'); addToast('success', lang === 'ar' ? 'Language changed to English' : 'تم التغيير للعربية'); }}
        className={`${base} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
        title="Toggle Language"
      >
        <Globe size={14} />
        <span className="text-xs font-bold">{lang === 'ar' ? 'EN' : 'ع'}</span>
      </button>

      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className={`p-2 rounded-xl transition-colors
          ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  );
}
