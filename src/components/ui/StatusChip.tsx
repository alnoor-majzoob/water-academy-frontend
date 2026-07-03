import { useApp, t } from '../../context/AppContext';

type Status = 'Scheduled' | 'Confirmed' | 'Completed' | 'Conflict' | 'Unscheduled' | 'Draft' | 'Imported' | 'Optimized' | 'Disabled' | 'Pending' | 'Running' | 'Failed';

const statusConfig: Record<Status, { ar: string; en: string; classes: string }> = {
  Scheduled:   { ar: 'مجدول',     en: 'Scheduled',   classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  Confirmed:   { ar: 'مؤكد',      en: 'Confirmed',   classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  Completed:   { ar: 'منتهي',     en: 'Completed',   classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  Conflict:    { ar: 'تعارض',     en: 'Conflict',    classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 chip-glow-conflict' },
  Unscheduled: { ar: 'غير مجدول', en: 'Unscheduled', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  Draft:       { ar: 'مسودة',     en: 'Draft',       classes: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  Imported:    { ar: 'مستورد',    en: 'Imported',    classes: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  Optimized:   { ar: 'محسّن',     en: 'Optimized',   classes: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  Disabled:    { ar: 'معطّل',     en: 'Disabled',    classes: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500' },
  Pending:     { ar: 'في الانتظار', en: 'Pending',   classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  Running:     { ar: 'جارٍ',      en: 'Running',     classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  Failed:      { ar: 'فشل',       en: 'Failed',      classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, size = 'md' }: Props) {
  const { lang } = useApp();
  const cfg = statusConfig[status] || statusConfig.Draft;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${cfg.classes}`}>
      {t(cfg.ar, cfg.en, lang)}
    </span>
  );
}

type Priority = 'High' | 'Medium' | 'Low';
const priorityConfig: Record<Priority, { ar: string; en: string; classes: string; dot: string }> = {
  High:   { ar: 'عالية',   en: 'High',   classes: 'bg-red-50 text-red-700 border border-red-200',    dot: 'bg-red-500' },
  Medium: { ar: 'متوسطة',  en: 'Medium', classes: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  Low:    { ar: 'منخفضة',  en: 'Low',    classes: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { lang } = useApp();
  const cfg = priorityConfig[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(cfg.ar, cfg.en, lang)}
    </span>
  );
}

type Severity = 'Critical' | 'Warning' | 'Info';
const severityConfig: Record<Severity, { classes: string; icon: string }> = {
  Critical: { classes: 'bg-red-100 text-red-700', icon: '🔴' },
  Warning:  { classes: 'bg-amber-100 text-amber-700', icon: '🟡' },
  Info:     { classes: 'bg-blue-100 text-blue-700', icon: '🔵' },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = severityConfig[severity];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${cfg.classes}`}>
      {cfg.icon} {severity}
    </span>
  );
}
