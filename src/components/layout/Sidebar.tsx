import { useApp, t } from '../../context/AppContext';
import {
  LayoutDashboard, Briefcase, Upload, BookOpen, Users, MapPin,
  CalendarDays, Link2, CalendarRange, AlertTriangle, ListX,
  CheckSquare, FileDown, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';

export type NavItem =
  | 'dashboard' | 'workspaces' | 'import' | 'courses' | 'trainers'
  | 'venues' | 'calendar' | 'assignments' | 'schedule' | 'conflicts'
  | 'unscheduled' | 'tasks' | 'export' | 'settings';

const navItems: { id: NavItem; arLabel: string; enLabel: string; icon: React.ElementType }[] = [
  { id: 'dashboard',    arLabel: 'لوحة التحكم',       enLabel: 'Dashboard',         icon: LayoutDashboard },
  { id: 'workspaces',   arLabel: 'مساحات العمل',       enLabel: 'Workspaces',        icon: Briefcase },
  { id: 'import',       arLabel: 'استيراد البيانات',   enLabel: 'Import Data',       icon: Upload },
  { id: 'courses',      arLabel: 'الدورات',            enLabel: 'Courses',           icon: BookOpen },
  { id: 'trainers',     arLabel: 'المدربون',           enLabel: 'Trainers',          icon: Users },
  { id: 'venues',       arLabel: 'القاعات',            enLabel: 'Venues',            icon: MapPin },
  { id: 'calendar',     arLabel: 'التقويم',            enLabel: 'Calendar',          icon: CalendarDays },
  { id: 'assignments',  arLabel: 'تعيين المدربين',     enLabel: 'Trainer Assignments', icon: Link2 },
  { id: 'schedule',     arLabel: 'الجدول',             enLabel: 'Schedule',          icon: CalendarRange },
  { id: 'conflicts',    arLabel: 'التعارضات',          enLabel: 'Conflicts',         icon: AlertTriangle },
  { id: 'unscheduled',  arLabel: 'غير المجدولة',       enLabel: 'Unscheduled',       icon: ListX },
  { id: 'tasks',        arLabel: 'المهام',             enLabel: 'Tasks',             icon: CheckSquare },
  { id: 'export',       arLabel: 'التصدير والتقارير',  enLabel: 'Export / Reports',  icon: FileDown },
  { id: 'settings',     arLabel: 'الإعدادات',          enLabel: 'Settings',          icon: Settings },
];

interface SidebarProps {
  activePage: NavItem;
  setActivePage: (p: NavItem) => void;
}

export function Sidebar({ activePage, setActivePage }: SidebarProps) {
  const { lang, theme, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  return (
    <aside className={`
      flex flex-col h-full
      ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
      border-e transition-all duration-300
      ${sidebarCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden">
          <img src="/logo.jpg" alt="Water Academy" className="w-full h-full object-cover" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <div className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {t('أكاديمية المياه', 'Water Academy', lang)}
            </div>
            <div className="text-xs text-blue-500 font-medium">
              {t('مخطط التدريب', 'Training Scheduler', lang)}
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium
                transition-all duration-150 group relative
                ${isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }
              `}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} size={18} />
              {!sidebarCollapsed && (
                <span className="flex-1 text-start truncate text-sm">{t(item.arLabel, item.enLabel, lang)}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className={`px-2 py-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`w-full flex items-center justify-center p-2 rounded-xl transition-colors
            ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          {sidebarCollapsed
            ? (isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />)
            : (isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />)
          }
        </button>
      </div>
    </aside>
  );
}
