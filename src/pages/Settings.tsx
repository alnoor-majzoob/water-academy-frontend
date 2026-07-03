import { useApp, t } from '../context/AppContext';
import { Globe, Moon, Sun, Palette } from 'lucide-react';

export function Settings() {
  const { lang, setLang, theme, setTheme, addToast } = useApp();
  const isDark = theme === 'dark';
  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${value ? 'bg-blue-600' : (isDark ? 'bg-slate-600' : 'bg-slate-200')}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'end-0.5' : 'start-0.5'}`} />
    </button>
  );

  const sections = [
    {
      icon: Globe, ar: 'اللغة والمنطقة', en: 'Language & Region',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('اللغة', 'Language', lang)}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('اختر لغة الواجهة', 'Choose interface language', lang)}</p>
            </div>
            <div className={`flex rounded-xl border p-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              {(['ar', 'en'] as const).map(l => (
                <button key={l} onClick={() => { setLang(l); addToast('success', l === 'ar' ? 'تم التغيير للعربية' : 'Language changed to English'); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${lang === l ? 'bg-blue-600 text-white' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                  {l === 'ar' ? 'العربية' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Palette, ar: 'المظهر', en: 'Appearance',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-500" />}
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الوضع الداكن', 'Dark Mode', lang)}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('تغيير مظهر الواجهة', 'Change interface appearance', lang)}</p>
              </div>
            </div>
            <Toggle value={isDark} onChange={() => { setTheme(isDark ? 'light' : 'dark'); addToast('info', t('تم تغيير المظهر', 'Theme changed', lang)); }} />
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('الإعدادات', 'Settings', lang)}</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('تخصيص تفضيلات النظام', 'Customize system preferences', lang)}</p>
      </div>

      <div className="space-y-4">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <div key={i} className={`${card} p-5`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                  <Icon size={18} className="text-blue-600" />
                </div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t(section.ar, section.en, lang)}</h3>
              </div>
              {section.content}
            </div>
          );
        })}
      </div>

    </div>
  );
}
