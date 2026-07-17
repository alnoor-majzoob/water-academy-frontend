import { useApp } from '../../context/AppContext';
import type { MatchingRecommendedTrainer } from '../../lib/api';
import { User, Check } from 'lucide-react';

interface TrainerScoreCardProps {
  trainer: MatchingRecommendedTrainer;
  onAssign: () => void;
  assigning: boolean;
}

export function TrainerScoreCard({ trainer, onAssign, assigning }: TrainerScoreCardProps) {
  const { lang, theme } = useApp();
  const isDark = theme === 'dark';

  const fitColor = trainer.fitLevel === 'high' ? 'bg-green-500'
    : trainer.fitLevel === 'medium' ? 'bg-amber-500'
    : 'bg-slate-500';

  return (
    <div className={`rounded-xl border p-4 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-white border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
            {trainer.trainerName?.charAt(0) || <User size={16} />}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {trainer.trainerName || `#${trainer.trainerId}`}
            </p>
            {trainer.jobTitle && (
              <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{trainer.jobTitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {trainer.fitLevel && (
            <span className={`${fitColor} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full`}>
              {lang === 'ar'
                ? { high: 'عالي', medium: 'متوسط', low: 'منخفض' }[trainer.fitLevel] || trainer.fitLevel
                : trainer.fitLevel}
            </span>
          )}
          <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {trainer.score}
          </span>
        </div>
      </div>

      {trainer.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {trainer.topics.slice(0, 4).map((topic, i) => (
            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{topic}</span>
          ))}
        </div>
      )}

      {trainer.reasons.length > 0 && (
        <div className="mt-2">
          <p className={`text-[10px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-0.5`}>
            {lang === 'ar' ? 'الأسباب' : 'Reasons'}
          </p>
          <ul className="text-xs space-y-0.5">
            {trainer.reasons.slice(0, 3).map((r, i) => (
              <li key={i} className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {trainer.risks.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] font-semibold uppercase text-red-500 mb-0.5">
            {lang === 'ar' ? 'المخاطر' : 'Risks'}
          </p>
          <ul className="text-xs space-y-0.5">
            {trainer.risks.slice(0, 2).map((r, i) => (
              <li key={i} className="text-red-400">• {r}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onAssign}
        disabled={assigning}
        className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${
          assigning
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <Check size={15} />
        {assigning
          ? (lang === 'ar' ? 'جاري...' : 'Assigning...')
          : (lang === 'ar' ? 'تعيين' : 'Assign')}
      </button>
    </div>
  );
}
