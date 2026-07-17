import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { api, type MatchingProfileResult } from '../../lib/api';
import { Upload, Loader2 } from 'lucide-react';

interface CvUploadModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: number;
  defaultTrainerId: string;
  trainerName: string;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.map(v => formatValue(v)).join(', ');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join('; ');
  }
  return '—';
}

export function CvUploadModal({ open, onClose, workspaceId, defaultTrainerId, trainerName }: CvUploadModalProps) {
  const { lang, theme, addToast } = useApp();
  const isDark = theme === 'dark';
  const [provider, setProvider] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MatchingProfileResult | null>(null);

  const handleAnalyze = async () => {
    if (!file) {
      addToast('error', lang === 'ar' ? 'يرجى اختيار ملف' : 'Select a file');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('cv', file);
      fd.append('trainer_id', defaultTrainerId);
      fd.append('provider', provider);
      const data = await api.matching.analyzeCv(workspaceId, fd);
      setResult(data);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await api.matching.saveTrainer(workspaceId, {
        trainerId: defaultTrainerId,
        profile: { ...result.profile, full_name: trainerName },
        cvText: result.cvText,
        cvFilename: result.cvFilename,
      });
      addToast('success', lang === 'ar' ? 'تم حفظ المدرب' : 'Trainer saved');
      setResult(null);
      setFile(null);
      onClose();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!analyzing && !saving) {
          setProvider('');
          setFile(null);
          setAnalyzing(false);
          setSaving(false);
          setResult(null);
          onClose();
        }
      }}
      maxWidth="max-w-lg"
      scrollable={!!result}
      title={lang === 'ar' ? 'رفع السيرة الذاتية' : 'Upload CV'}
    >
      <div className="space-y-4">
        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {lang === 'ar' ? 'ملف السيرة الذاتية (PDF, DOCX, TXT)' : 'CV File (PDF, DOCX, TXT)'}
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className={inputCls}
            disabled={analyzing || !!result}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!file || analyzing || !!result}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            !file || analyzing || !!result
              ? 'bg-blue-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {analyzing
            ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...')
            : (lang === 'ar' ? 'تحليل السيرة الذاتية' : 'Analyze CV')}
        </button>

        {result && result.profile && Object.keys(result.profile).length > 0 && (
          <div className={`rounded-xl border p-3 space-y-2.5 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>
              {lang === 'ar' ? 'الملف المستخرج' : 'Extracted Profile'}
            </p>
            {Object.entries(result.profile)
              .filter(([key]) => !/^name$/i.test(key))
              .map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className={`text-xs font-medium min-w-[100px] capitalize ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ')}
                  </span>
                  <span className={`text-xs flex-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {formatValue(value)}
                  </span>
                </div>
              ))}
          </div>
        )}

        {result && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              saving
                ? 'bg-green-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving
              ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
              : (lang === 'ar' ? 'حفظ تحليل السيرة الذاتية' : 'Save Trainer CV Analysis')}
          </button>
        )}
      </div>
    </Modal>
  );
}
