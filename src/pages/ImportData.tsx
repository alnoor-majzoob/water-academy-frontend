import { useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Upload, CheckCircle, AlertTriangle, XCircle, ChevronRight, FileSpreadsheet, Eye } from 'lucide-react';
import { api, type ImportResultDto } from '../lib/api';

type Step = 1 | 2 | 3 | 4 | 5;

export function ImportData() {
  const { lang, theme, addToast, activeWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [step, setStep] = useState<Step>(1);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResultDto | null>(null);

  const card = `rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;

  const steps = [
    { n: 1, ar: 'رفع الملف', en: 'Upload File' },
    { n: 2, ar: 'فحص الأوراق', en: 'Validate Sheets' },
    { n: 3, ar: 'معاينة البيانات', en: 'Preview Data' },
    { n: 4, ar: 'الأخطاء والتحذيرات', en: 'Errors & Warnings' },
    { n: 5, ar: 'ملخص الاستيراد', en: 'Import Summary' },
  ];

  const previewRows = [
    { labelAr: 'الدورات', labelEn: 'Courses', value: result?.coursesParsed || 0 },
    { labelAr: 'المدربون', labelEn: 'Trainers', value: result?.trainersParsed || 0 },
    { labelAr: 'القاعات', labelEn: 'Venues', value: result?.venuesParsed || 0 },
    { labelAr: 'أيام التقويم', labelEn: 'Calendar Days', value: result?.calendarDaysParsed || 0 },
    { labelAr: 'التعيينات', labelEn: 'Assignments', value: result?.assignmentsParsed || 0 },
  ];

  const warnings = useMemo(() => {
    if (!result) return [];
    const items: { issue: string; severity: 'warning' | 'error' }[] = [];
    if (result.error) items.push({ issue: result.error, severity: 'error' });
    if (result.coursesParsed !== result.coursesInserted) items.push({ issue: 'Courses parsed count differs from inserted count', severity: 'warning' });
    if (result.trainersParsed !== result.trainersInserted) items.push({ issue: 'Trainers parsed count differs from inserted count', severity: 'warning' });
    if (result.venuesParsed !== result.venuesInserted) items.push({ issue: 'Venues parsed count differs from inserted count', severity: 'warning' });
    if (result.assignmentsParsed !== result.assignmentsInserted) items.push({ issue: 'Assignments parsed count differs from inserted count', severity: 'warning' });
    return items;
  }, [result]);

  const handleFileDrop = (selectedFile?: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setStep(2);
    addToast('success', t('تم اختيار الملف بنجاح', 'File selected successfully', lang));
  };

  const advance = async () => {
    if (step < 4) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep((step + 1) as Step);
      }, 400);
      return;
    }
    if (step === 4) {
      if (!activeWorkspace || !file) {
        addToast('error', t('اختر مساحة عمل وملفاً أولاً', 'Select a workspace and file first', lang));
        return;
      }
      setLoading(true);
      try {
        const importResult = await api.importExcel(activeWorkspace, file);
        setResult(importResult);
        setStep(5);
        addToast(importResult.error ? 'warning' : 'success', importResult.error || t('تم الاستيراد بنجاح', 'Import completed successfully', lang));
      } catch (error) {
        addToast('error', error instanceof Error ? error.message : 'Import failed');
      } finally {
        setLoading(false);
      }
      return;
    }
    setStep(1);
    setFileName(null);
    setFile(null);
    setResult(null);
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('استيراد البيانات', 'Import Data', lang)}</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('استيراد البيانات من ملف Excel إلى مساحة العمل الحالية', 'Import Excel data into the current workspace', lang)}</p>
      </div>

      <div className={`${card}`}>
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-blue-600 text-white ring-4 ring-blue-100' : (isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400')}`}>
                  {step > s.n ? <CheckCircle size={16} /> : s.n}
                </div>
                <span className={`text-xs font-medium text-center ${step === s.n ? 'text-blue-600' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>{t(s.ar, s.en, lang)}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${step > s.n ? 'bg-green-500' : (isDark ? 'bg-slate-700' : 'bg-slate-200')}`} />}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileDrop(e.dataTransfer.files[0]); }} className={`rounded-2xl border-2 border-dashed p-16 flex flex-col items-center gap-4 transition-all ${dragging ? 'border-blue-500 bg-blue-50' : (isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50')}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dragging ? 'bg-blue-100' : (isDark ? 'bg-slate-700' : 'bg-white')} shadow-lg`}><Upload size={28} className={dragging ? 'text-blue-600' : 'text-blue-500'} /></div>
          <div className="text-center">
            <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-700'}`}>{t('اسحب وأفلت ملف Excel', 'Drag & Drop Excel File', lang)}</p>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('أو اضغط لاختيار الملف', 'or click to browse', lang)}</p>
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('يدعم: .xlsx, .xls', 'Supports: .xlsx, .xls', lang)}</p>
          </div>
          <label className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium cursor-pointer transition-colors">
            {t('اختر الملف', 'Browse File', lang)}
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileDrop(e.target.files?.[0])} />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className={`${card}`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><FileSpreadsheet size={16} className="text-blue-500" />{t('التحقق من الأوراق', 'Sheet Validation', lang)}</h3>
          <div className="space-y-3">
            {['Courses', 'Trainers', 'Venues', 'Calendar', 'assigned course'].map((sheet) => (
              <div key={sheet} className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100"><CheckCircle size={16} className="text-green-600" /></div>
                <div className="flex-1"><p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{sheet}</p><p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('ورقة مطلوبة أو مدعومة', 'Required or supported sheet', lang)}</p></div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">{t('مقبول', 'Accepted', lang)}</span>
              </div>
            ))}
          </div>
          <div className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}><CheckCircle size={14} />{t('الملف: ', 'File: ', lang)}{fileName}</div>
        </div>
      )}

      {step === 3 && (
        <div className={`${card}`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><Eye size={16} className="text-blue-500" />{t('معاينة عملية الاستيراد', 'Import Preview', lang)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {previewRows.map((row, index) => (
              <div key={index} className={`rounded-xl p-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{t(row.labelAr, row.labelEn, lang)}</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('سيتم قراءتها عند التنفيذ', 'Will be parsed during execution', lang)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className={`${card}`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><AlertTriangle size={16} className="text-amber-500" />{t('الأخطاء والتحذيرات المتوقعة', 'Expected Errors & Warnings', lang)}</h3>
          <div className="space-y-3">
            {[
              t('تأكد من وجود أوراق: Courses, Trainers, Venues, Calendar, assigned course', 'Make sure the workbook contains the required sheet names', lang),
              t('تأكد من تطابق معرفات الدورات والمدربين في ورقة assigned course', 'Ensure course and trainer IDs match the assigned course sheet', lang),
              t('تجنب تكرار أيام التقويم داخل نفس مساحة العمل', 'Avoid duplicate calendar days inside the same workspace', lang),
            ].map((issue, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'}`}><AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" /><div className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{issue}</div></div>
            ))}
          </div>
        </div>
      )}

      {step === 5 && result && (
        <div className="space-y-4">
          <div className={`${card} flex flex-col items-center gap-3 py-8`}>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle size={32} className="text-green-600" /></div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{result.error ? t('اكتمل مع ملاحظات', 'Completed with notes', lang) : t('اكتمل الاستيراد!', 'Import Completed!', lang)}</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{result.error || t('تم استيراد جميع البيانات بنجاح', 'All data imported successfully', lang)}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { ar: 'الدورات', en: 'Courses', count: result.coursesInserted, color: 'blue' },
              { ar: 'المدربون', en: 'Trainers', count: result.trainersInserted, color: 'green' },
              { ar: 'القاعات', en: 'Venues', count: result.venuesInserted, color: 'purple' },
              { ar: 'أيام التقويم', en: 'Calendar Days', count: result.calendarDaysInserted, color: 'teal' },
              { ar: 'التعيينات', en: 'Assignments', count: result.assignmentsInserted, color: 'orange' },
            ].map((s, i) => <div key={i} className={`${card} text-center`}><div className={`text-3xl font-bold text-${s.color}-600`}>{s.count}</div><div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(s.ar, s.en, lang)}</div></div>)}
          </div>
          {warnings.length > 0 && (
            <div className={`${card}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}><XCircle size={16} className="text-amber-500" />{t('تنبيهات', 'Warnings', lang)}</h3>
              <div className="space-y-2">
                {warnings.map((warning, index) => <div key={index} className={`p-3 rounded-xl ${warning.severity === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{warning.issue}</div>)}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={() => step > 1 && setStep((step - 1) as Step)} disabled={step === 1 || loading} className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors disabled:opacity-40 ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t('السابق', 'Back', lang)}</button>
        <button onClick={() => void advance()} disabled={loading || (step === 1 && !fileName)} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {step === 5 ? t('إنهاء', 'Finish', lang) : step === 4 ? t('ابدأ الاستيراد', 'Run Import', lang) : step === 1 ? t('المتابعة', 'Continue', lang) : t('التالي', 'Next', lang)}
          {step < 5 && !loading && <ChevronRight size={16} />}
        </button>
      </div>
    </div>
  );
}
