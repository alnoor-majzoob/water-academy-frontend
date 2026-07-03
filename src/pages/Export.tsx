import { useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Download, FileSpreadsheet, Check, Clock, FileDown } from 'lucide-react';
import { api } from '../lib/api';

const reports = [
  { id: 'full', ar: 'المصنف الكامل', en: 'Full Workbook', icon: '📊', size: 'dynamic', desc: { ar: 'جميع الأوراق والبيانات', en: 'All sheets and data' } },
  { id: 'schedule', ar: 'الجدول فقط', en: 'Schedule Only', icon: '📅', size: 'dynamic', desc: { ar: 'مدخلات الجدول المعتمدة', en: 'Confirmed schedule entries' } },
  { id: 'conflicts', ar: 'تقرير التعارضات', en: 'Conflict Report', icon: '⚠️', size: 'dynamic', desc: { ar: 'التعارضات المسجلة في الجدول', en: 'Recorded conflicts from schedule entries' } },
  { id: 'unscheduled', ar: 'الدورات غير المجدولة', en: 'Unscheduled Courses', icon: '📋', size: 'dynamic', desc: { ar: 'يتطلب دعماً من محرك الجدولة', en: 'Requires scheduler engine support' } },
];

const sheets = [
  { key: 'courses', ar: 'الدورات', en: 'Courses' },
  { key: 'trainers', ar: 'المدربون', en: 'Trainers' },
  { key: 'venues', ar: 'القاعات', en: 'Venues' },
  { key: 'schedule', ar: 'الجدول', en: 'Schedule' },
  { key: 'assignments', ar: 'التعيينات', en: 'Assignments' },
  { key: 'calendar', ar: 'التقويم', en: 'Calendar' },
];

export function Export() {
  const { lang, theme, addToast, activeWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [selectedSheets, setSelectedSheets] = useState<string[]>(['courses', 'trainers', 'venues', 'schedule']);
  const [exporting, setExporting] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<{ name: string; date: string; size: string; status: string }[]>([]);

  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;

  const toggleSheet = (key: string) => {
    setSelectedSheets((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (id: string, name: string) => {
    if (!activeWorkspace) {
      addToast('error', t('اختر مساحة عمل أولاً', 'Select a workspace first', lang));
      return;
    }
    setExporting(id);
    try {
      let blob: Blob;
      let filename: string;

      if (id === 'custom') {
        const mappedSheets = selectedSheets.map((s) => s === 'schedule' ? 'schedule-entries' : s);
        blob = await api.exportExcel(activeWorkspace, { sheets: mappedSheets });
        filename = 'water-academy-custom-export.xlsx';
      } else if (id === 'full') {
        blob = await api.exportExcel(activeWorkspace);
        filename = 'water-academy-export.xlsx';
      } else {
        blob = await api.exportExcel(activeWorkspace, { type: id });
        filename = `water-academy-export-${id}.xlsx`;
      }

      triggerDownload(blob, filename);
      setRecentExports((prev) => [{ name: filename, date: new Date().toLocaleString(), size: `${Math.max(1, Math.round(blob.size / 1024))} KB`, status: 'ready' }, ...prev].slice(0, 5));
      addToast('success', t(`تم تصدير "${name}" بنجاح`, `Exported "${name}" successfully`, lang));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('التصدير والتقارير', 'Export / Reports', lang)}</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('تصدير البيانات إلى Excel من الخادم', 'Export workbook from the backend', lang)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className={`${card} p-5`}>
            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('تقارير جاهزة', 'Ready Reports', lang)}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <div key={report.id} className={`rounded-xl border p-4 flex items-start gap-3 ${isDark ? 'border-slate-700 bg-slate-700/30' : 'border-slate-200 bg-slate-50'}`}>
                  <span className="text-3xl">{report.icon}</span>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{t(report.ar, report.en, lang)}</p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(report.desc.ar, report.desc.en, lang)}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{report.size}</span>
                      <button onClick={() => void handleExport(report.id, t(report.ar, report.en, lang))} disabled={exporting === report.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-60 transition-colors">
                        {exporting === report.id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={12} />}
                        {t('تحميل', 'Download', lang)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('تصدير مخصص', 'Custom Export', lang)}</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('اختر الأوراق التي تريد تصديرها', 'Select the sheets you want to export', lang)}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
              {sheets.map((sheet) => (
                <label key={sheet.key} className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border transition-all ${selectedSheets.includes(sheet.key) ? 'border-blue-500 bg-blue-50 text-blue-700' : (isDark ? 'border-slate-700 hover:border-slate-600 text-slate-300' : 'border-slate-200 hover:border-slate-300 text-slate-600')}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedSheets.includes(sheet.key) ? 'bg-blue-600 border-blue-600' : (isDark ? 'border-slate-600' : 'border-slate-300')}`}>{selectedSheets.includes(sheet.key) && <Check size={12} className="text-white" />}</div>
                  <input type="checkbox" className="hidden" checked={selectedSheets.includes(sheet.key)} onChange={() => toggleSheet(sheet.key)} />
                  <div><FileSpreadsheet size={12} className="inline me-1 text-green-500" /><span className="text-sm">{t(sheet.ar, sheet.en, lang)}</span></div>
                </label>
              ))}
            </div>
            <div className={`flex items-center justify-between p-4 rounded-xl mb-4 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedSheets.length} {t('ورقة مختارة', 'sheets selected', lang)}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('سيتم تنزيل المصنف بالأوراق المحددة فقط', 'Only selected sheets will be included', lang)}</p>
              </div>
              <button onClick={() => void handleExport('custom', t('تصدير مخصص', 'Custom Export', lang))} disabled={selectedSheets.length === 0 || !!exporting} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                {exporting === 'custom' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FileDown size={16} />}
                {t('تصدير', 'Export', lang)}
              </button>
            </div>
          </div>
        </div>

        <div className={`${card} p-5 h-fit`}>
          <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('آخر التصديرات', 'Recent Exports', lang)}</h3>
          <div className="space-y-3">
            {recentExports.length === 0 && <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t('لم يتم تنفيذ أي تصدير بعد', 'No exports yet', lang)}</div>}
            {recentExports.map((exp, i) => (
              <div key={i} className={`p-3 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-700/30' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-2"><FileSpreadsheet size={14} className="text-green-500 flex-shrink-0" /><p className={`text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{exp.name}</p></div>
                <div className="flex items-center justify-between"><div><div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}><Clock size={10} /> {exp.date}</div><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{exp.size}</p></div><button className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Download size={12} /></button></div>
              </div>
            ))}
          </div>
          <div className={`mt-4 p-3 rounded-xl text-center border-2 border-dashed ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}><p className="text-xs">{t('سيتم حفظ قائمة آخر التنزيلات خلال هذه الجلسة', 'Recent downloads are kept during this session', lang)}</p></div>
        </div>
      </div>
    </div>
  );
}
