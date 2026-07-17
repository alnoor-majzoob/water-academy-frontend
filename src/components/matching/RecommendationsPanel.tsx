import { useState } from 'react';
import { useApp, type Lang } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { TrainerScoreCard } from './TrainerScoreCard';
import { api, type MatchingRecommendationResult, type MatchingRecommendedTrainer, type CourseDto } from '../../lib/api';
import { Sparkles, Loader2 } from 'lucide-react';

interface RecommendationsPanelProps {
  open: boolean;
  onClose: () => void;
  workspaceId: number;
  courses: CourseDto[];
  onAssigned: () => void;
}

const units = (lang: Lang) => ({
  ms: lang === 'ar' ? 'مللي ثانية' : 'ms',
  s:  lang === 'ar' ? 'ثانية' : 's',
  m:  lang === 'ar' ? 'دقيقة' : 'min',
  h:  lang === 'ar' ? 'ساعة' : 'h',
});

const formatDuration = (ms: number, locale: string, lang: Lang) => {
  const nf = (opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(locale, opts);
  const u = units(lang);

  if (ms >= 3600000) return `${nf({ maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(ms / 3600000)} ${u.h}`;
  if (ms >= 60000)   return `${nf({ maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(ms / 60000)} ${u.m}`;
  if (ms >= 1000)    return `${nf({ maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(ms / 1000)} ${u.s}`;
  return `${nf().format(Math.round(ms))} ${u.ms}`;
};

export function RecommendationsPanel({ open, onClose, workspaceId, courses, onAssigned }: RecommendationsPanelProps) {
  const { lang, theme, addToast } = useApp();
  const isDark = theme === 'dark';
  const [courseId, setCourseId] = useState(0);
  const [result, setResult] = useState<MatchingRecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [topK, setTopK] = useState(5);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const handleRecommend = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.matching.recommend(workspaceId, {
        courseName: selectedCourse.name,
        courseDesc: selectedCourse.specialization || selectedCourse.name,
        attendees: selectedCourse.expectedTrainees || 15,
        topK,
        lang,
      });
      setResult(data);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Recommendation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (trainer: MatchingRecommendedTrainer) => {
    if (!result || !selectedCourse) return;
    setAssigningId(trainer.trainerId);
    try {
      await api.assignments.create(workspaceId, { trainerId: Number(trainer.trainerNumber), courseId: selectedCourse.id });
      await api.matching.assignTrainer(workspaceId, result.planId, {
        trainerId: trainer.trainerId,
        score: trainer.score,
        reasons: trainer.reasons,
      });
      addToast('success', lang === 'ar' ? 'تم تعيين المدرب' : 'Trainer assigned');
      onAssigned();
      onClose();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Assignment failed');
    } finally {
      setAssigningId(null);
    }
  };

  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <Modal open={open} onClose={() => { setCourseId(0); setTopK(5); setResult(null); setLoading(false); setAssigningId(null); onClose(); }} maxWidth="max-w-lg" title={lang === 'ar' ? 'مطابقة AI' : 'AI Match'}>
      <div className="space-y-4">
        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {lang === 'ar' ? 'اختر الدورة' : 'Select Course'}
          </label>
          <select value={courseId || ''} onChange={(e) => setCourseId(Number(e.target.value))} disabled={!!result || loading} className={inputCls}>
            <option value="">{lang === 'ar' ? '-- اختر --' : '-- Select --'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {lang === 'ar' ? 'عدد التوصيات' : 'Recommendations count'}
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Math.min(20, Math.max(1, Number(e.target.value))))}
            disabled={!!result || loading}
            className={inputCls}
          />
        </div>

        <button
          onClick={handleRecommend}
          disabled={!courseId || loading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            !courseId || loading
              ? 'bg-blue-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading
            ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...')
            : (lang === 'ar' ? 'توصيات AI' : 'Get AI Recommendations')}
        </button>

        {result && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {result.matching.durationMs != null && (
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang === 'ar' ? 'زمن الاستجابة' : 'Response time'}: {formatDuration(result.matching.durationMs, lang === 'ar' ? 'ar-SA' : 'en-US', lang)}
              </p>
            )}
            {result.recommendedTrainers.length === 0 ? (
              <p className={`text-sm text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang === 'ar' ? 'لم يتم العثور على مدربين' : 'No trainers found'}
              </p>
            ) : (
              result.recommendedTrainers.map((t) => (
                <TrainerScoreCard
                  key={t.trainerId}
                  trainer={t}
                  onAssign={() => handleAssign(t)}
                  assigning={assigningId === t.trainerId}
                />
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
