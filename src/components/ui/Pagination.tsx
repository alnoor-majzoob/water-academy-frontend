import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t, type Lang } from '../../context/AppContext';

interface PaginationProps {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  lang: Lang;
  isDark: boolean;
  loading?: boolean;
}

export function Pagination({ page, size, totalElements, totalPages, onPageChange, onSizeChange, lang, isDark, loading }: PaginationProps) {
  const current = page + 1;
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    const start = Math.max(1, Math.min(current - 2, Math.max(totalPages - 4, 1)));
    return start + i;
  }).filter((item) => item <= totalPages);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
      <span className="text-xs">{t(`الإجمالي: ${totalElements}`, `Total: ${totalElements}`, lang)}</span>
      <div className="flex items-center gap-2">
        <select
          value={size}
          disabled={loading}
          onChange={(event) => onSizeChange(Number(event.target.value))}
          className={`rounded-lg border px-2 py-1 text-xs ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}
        >
          {[10, 20, 50, 100].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <button disabled={loading || page === 0} onClick={() => onPageChange(page - 1)} className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
          <ChevronLeft size={14} />
        </button>
        {pages.map((item) => (
          <button key={item} disabled={loading} onClick={() => onPageChange(item - 1)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${current === item ? 'bg-blue-600 text-white' : isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
            {item}
          </button>
        ))}
        <button disabled={loading || page >= totalPages - 1} onClick={() => onPageChange(page + 1)} className={`w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-40 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
