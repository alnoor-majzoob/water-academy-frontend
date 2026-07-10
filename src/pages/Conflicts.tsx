import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { SeverityBadge } from '../components/ui/StatusChip';
import { api, type ScheduleEntryDto } from '../lib/api';

type Conflict = {
  id: number;
  type: 'Trainer' | 'Venue' | 'DateOverlap' | 'Capacity' | 'Holiday' | 'Mismatch';
  severity: 'Critical' | 'Warning' | 'Info';
  description: string;
  descriptionEn: string;
  affectedEntries: number[];
  resolved: boolean;
};

function inferType(notes: string): Conflict['type'] {
  const text = notes.toLowerCase();
  if (text.includes('trainer')) return 'Trainer';
  if (text.includes('venue')) return 'Venue';
  if (text.includes('holiday')) return 'Holiday';
  if (text.includes('capacity')) return 'Capacity';
  if (text.includes('mismatch')) return 'Mismatch';
  return 'DateOverlap';
}

export function Conflicts() {
  const { lang, theme, addToast, activeWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [resolvedIds, setResolvedIds] = useState<number[]>([]);
  const [entries, setEntries] = useState<ScheduleEntryDto[]>([]);
  const [loading, setLoading] = useState(false);

  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;

  useEffect(() => {
    if (!activeWorkspace) return;
    setLoading(true);
    api.scheduleEntries.listAll(activeWorkspace)
      .then(setEntries)
      .catch((error: unknown) => addToast('error', error instanceof Error ? error.message : 'Failed to load conflicts'))
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const conflicts = useMemo<Conflict[]>(() => entries.filter((entry) => entry.conflictNotes).map((entry) => ({
    id: entry.id,
    type: inferType(entry.conflictNotes || ''),
    severity: entry.conflictNotes?.toLowerCase().includes('trainer') || entry.conflictNotes?.toLowerCase().includes('venue') ? 'Critical' : 'Warning',
    description: entry.conflictNotes || '',
    descriptionEn: entry.conflictNotes || '',
    affectedEntries: [entry.id],
    resolved: resolvedIds.includes(entry.id),
  })), [entries, resolvedIds]);

  const typeLabels: Record<string, { ar: string; en: string; icon: string }> = {
    Trainer:     { ar: 'تعارض مدرب', en: 'Trainer Conflict', icon: '👤' },
    Venue:       { ar: 'تعارض قاعة', en: 'Venue Conflict', icon: '🏛️' },
    DateOverlap: { ar: 'تداخل تواريخ', en: 'Date Overlap', icon: '📅' },
    Capacity:    { ar: 'مشكلة سعة', en: 'Capacity Issue', icon: '⚠️' },
    Holiday:     { ar: 'يوم إجازة', en: 'Holiday', icon: '🏖️' },
    Mismatch:    { ar: 'عدم تطابق', en: 'Mismatch', icon: '❌' },
  };

  const active = conflicts.filter((c) => !c.resolved);
  const resolved = conflicts.filter((c) => c.resolved);

  const handleResolve = (id: number) => {
    setResolvedIds((prev) => [...prev, id]);
    setSelectedConflict(null);
    addToast('success', t('تم تعليم التعارض كمحلول في الواجهة', 'Conflict marked as resolved in the UI', lang));
  };

  const ConflictCard = ({ conflict }: { conflict: Conflict }) => {
    const type = typeLabels[conflict.type];
    return (
      <div onClick={() => setSelectedConflict(conflict)} className={`${card} p-5 cursor-pointer hover:shadow-md transition-all ${conflict.severity === 'Critical' ? (isDark ? 'border-red-800' : 'border-red-200') : ''} ${selectedConflict?.id === conflict.id ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2"><span className="text-2xl">{type.icon}</span><div><p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{t(type.ar, type.en, lang)}</p><p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{conflict.affectedEntries.length} {t('مدخلات متأثرة', 'affected entries', lang)}</p></div></div>
          <SeverityBadge severity={conflict.severity} />
        </div>
        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t(conflict.description, conflict.descriptionEn, lang)}</p>
        <div className="flex items-center justify-between mt-4"><span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>#{String(conflict.id).slice(0, 8)}</span><button onClick={(e) => { e.stopPropagation(); handleResolve(conflict.id); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">{t('حل التعارض', 'Resolve', lang)}</button></div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('التعارضات', 'Conflicts', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{active.length} {t('تعارض نشط', 'active conflicts', lang)} · {resolved.length} {t('محلول', 'resolved', lang)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('حرج', 'Critical', lang), count: conflicts.filter((c) => c.severity === 'Critical' && !c.resolved).length },
          { label: t('تحذيرات', 'Warnings', lang), count: conflicts.filter((c) => c.severity === 'Warning' && !c.resolved).length },
          { label: t('معلومات', 'Info', lang), count: conflicts.filter((c) => c.severity === 'Info' && !c.resolved).length },
          { label: t('محلولة', 'Resolved', lang), count: resolved.length },
        ].map((s, i) => <div key={i} className={`${card} p-4 flex items-center gap-3`}><div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{s.count}</div><div className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{s.label}</div></div>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {active.length > 0 && <><h3 className={`font-semibold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><AlertTriangle size={16} className="text-red-500" />{t('التعارضات النشطة', 'Active Conflicts', lang)}</h3>{active.map((c) => <ConflictCard key={c.id} conflict={c} />)}</>}
          {resolved.length > 0 && <><h3 className={`font-semibold text-sm flex items-center gap-2 mt-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><CheckCircle size={16} className="text-green-500" />{t('التعارضات المحلولة', 'Resolved Conflicts', lang)}</h3>{resolved.map((c) => <div key={c.id} className={`${card} p-4 opacity-60`}><div className="flex items-center gap-3"><CheckCircle size={16} className="text-green-500 flex-shrink-0" /><p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t(c.description, c.descriptionEn, lang)}</p><span className="ms-auto text-xs text-green-600 font-medium">{t('محلول', 'Resolved', lang)}</span></div></div>)}</>}
          {conflicts.length === 0 && <div className={`${card} p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('لا توجد تعارضات مسجلة في الجدول الحالي', 'No conflicts recorded in the current schedule', lang)}</div>}
        </div>

        <div>
          {selectedConflict ? (
            <div className={`${card} p-5 sticky top-0`}>
              <div className="flex items-center justify-between mb-4"><h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('حل التعارض', 'Resolve Conflict', lang)}</h3><button onClick={() => setSelectedConflict(null)}><X size={16} className={isDark ? 'text-slate-400' : 'text-slate-500'} /></button></div>
              <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}><p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{t(selectedConflict.description, selectedConflict.descriptionEn, lang)}</p><div className="mt-2 flex items-center gap-2"><SeverityBadge severity={selectedConflict.severity} /><span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{selectedConflict.type}</span></div></div>
              <h4 className={`text-xs font-semibold mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('ملاحظة', 'Note', lang)}</h4>
              <p className={`text-sm mb-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('الخادم الحالي يسجل ملاحظات التعارض داخل مدخل الجدول، ولا يقدم بعد مسار حل تلقائي. يمكنك استخدام هذه الشاشة للمراجعة اليدوية فقط.', 'The current backend stores conflict notes on schedule entries and does not yet expose an automatic resolution workflow. Use this screen for manual review.', lang)}</p>
              <button onClick={() => handleResolve(selectedConflict.id)} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm"><CheckCircle size={14} className="inline me-2" />{t('تعليم كمحلول', 'Mark Resolved', lang)}</button>
            </div>
          ) : (
            <div className={`${card} p-8 flex flex-col items-center gap-3 text-center`}><div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center"><AlertTriangle size={24} className="text-slate-400" /></div><p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('اختر تعارضاً للمراجعة', 'Select a conflict to review', lang)}</p></div>
          )}
        </div>
      </div>
      </>)}
    </div>
  );
}
