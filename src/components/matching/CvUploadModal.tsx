import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { api, type MatchingProfileResult } from '../../lib/api';
import { Upload, Loader2 } from 'lucide-react';

interface CvUploadModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: number;
}

export function CvUploadModal({ open, onClose, workspaceId }: CvUploadModalProps) {
  const { lang, theme, addToast } = useApp();
  const isDark = theme === 'dark';
  const [trainerId, setTrainerId] = useState('');
  const [provider, setProvider] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MatchingProfileResult | null>(null);

  const handleAnalyze = async () => {
    if (!file || !trainerId.trim()) {
      addToast('error', lang === 'ar' ? 'يرجى إدخال معرف المدرب واختيار ملف' : 'Enter trainer ID and select a file');
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('cv', file);
      fd.append('trainer_id', trainerId.trim());
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
        trainer_id: trainerId.trim(),
        profile: result.profile,
        cv_text: result.cvText,
        cv_filename: result.cvFilename,
      });
      addToast('success', lang === 'ar' ? 'تم حفظ المدرب' : 'Trainer saved');
      setResult(null);
      setFile(null);
      setTrainerId('');
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
      onClose={() => { if (!analyzing && !saving) onClose(); }}
      maxWidth="max-w-lg"
      title={lang === 'ar' ? 'رفع السيرة الذاتية' : 'Upload CV'}
    >
      <div className="space-y-4">
        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {lang === 'ar' ? 'معرف المدرب' : 'Trainer ID'}
          </label>
          <input
            value={trainerId}
            onChange={(e) => setTrainerId(e.target.value)}
            className={inputCls}
            placeholder={lang === 'ar' ? 'أدخل معرف المدرب' : 'Enter trainer ID'}
            disabled={analyzing}
          />
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {lang === 'ar' ? 'ملف السيرة الذاتية (PDF, DOCX, TXT)' : 'CV File (PDF, DOCX, TXT)'}
          </label>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className={inputCls}
            disabled={analyzing}
          />
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            AI Provider {lang === 'ar' ? '(اختياري)' : '(optional)'}
          </label>
          <input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className={inputCls}
            placeholder="groq / ollama / local"
            disabled={analyzing}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!file || !trainerId.trim() || analyzing}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            !file || !trainerId.trim() || analyzing
              ? 'bg-blue-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {analyzing
            ? (lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...')
            : (lang === 'ar' ? 'تحليل السيرة الذاتية' : 'Analyze CV')}
        </button>

        {result && (
          <div className={`rounded-xl border p-3 space-y-2 ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>
              {lang === 'ar' ? 'الملف المستخرج' : 'Extracted Profile'}
            </p>
            <pre className={`text-[11px] overflow-x-auto max-h-60 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {JSON.stringify(result.profile, null, 1)}
            </pre>
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
              : (lang === 'ar' ? 'حفظ المدرب' : 'Save Trainer')}
          </button>
        )}
      </div>
    </Modal>
  );
}
