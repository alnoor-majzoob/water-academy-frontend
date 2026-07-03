import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Plus, Search, Edit2, Trash2, X, MapPin } from 'lucide-react';
import { api, type TrainerDto } from '../lib/api';

type UiTrainer = {
  id: string;
  externalId: string;
  name: string;
  nameEn: string;
  specialties: string[];
  city: string;
  trainerType: 'Internal' | 'External' | 'Freelance';
  unavailableDates: string[];
  maxDaysPerMonth: number;
  maxConsecutiveDays: number;
  costPerDay: number;
  notes: string;
};

const mapTrainer = (trainer: TrainerDto): UiTrainer => ({
  id: trainer.id,
  externalId: trainer.externalId || '',
  name: trainer.name,
  nameEn: trainer.name,
  specialties: trainer.specialties ? trainer.specialties.split(',').map((item) => item.trim()).filter(Boolean) : [],
  city: trainer.city || '',
  trainerType: (trainer.trainerType as UiTrainer['trainerType']) || 'Internal',
  unavailableDates: trainer.unavailableDates ? trainer.unavailableDates.split(';').map((item) => item.trim()).filter(Boolean) : [],
  maxDaysPerMonth: trainer.maxDaysPerMonth || 0,
  maxConsecutiveDays: trainer.maxConsecutiveDays || 0,
  costPerDay: trainer.costPerDay || 0,
  notes: trainer.notes || '',
});

export function Trainers() {
  const { lang, theme, addToast, activeWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [trainers, setTrainers] = useState<UiTrainer[]>([]);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selected, setSelected] = useState<UiTrainer | null>(null);
  const [form, setForm] = useState<UiTrainer | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDarkCard = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;
  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-800'}`;
  const errorCls = inputCls.replace('border-slate-200', 'border-red-500').replace('border-slate-600', 'border-red-500');

  const typeColors: Record<string, string> = {
    Internal: 'bg-blue-100 text-blue-700',
    External: 'bg-purple-100 text-purple-700',
    Freelance: 'bg-amber-100 text-amber-700',
  };

  const loadTrainers = async () => {
    if (!activeWorkspace) return;
    try {
      const data = await api.trainers.list(activeWorkspace);
      setTrainers(data.map(mapTrainer));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load trainers');
    }
  };

  useEffect(() => {
    void loadTrainers();
  }, [activeWorkspace]);

  const filtered = useMemo(() => trainers.filter((tr) =>
    (tr.name.toLowerCase().includes(search.toLowerCase()) || tr.nameEn.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCity || tr.city === filterCity) &&
    (!filterType || tr.trainerType === filterType)
  ), [filterCity, filterType, search, trainers]);

  const cities = [...new Set(trainers.map((item) => item.city).filter(Boolean))];

  const openCreate = () => {
    setSelected(null);
    setErrors({});
    setForm({ id: '', externalId: '', name: '', nameEn: '', specialties: [], city: '', trainerType: 'Internal', unavailableDates: [], maxDaysPerMonth: 20, maxConsecutiveDays: 5, costPerDay: 1500, notes: '' });
    setShowDrawer(true);
  };

  const openEdit = (trainer: UiTrainer) => { setSelected(trainer); setForm(trainer); setErrors({}); setShowDrawer(true); };

  const handleSave = async () => {
    if (!activeWorkspace || !form) return;
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('اسم المدرب مطلوب', 'Trainer name is required', lang);
    if (form.maxDaysPerMonth < 1) errs.maxDaysPerMonth = t('الحد الأدنى 1', 'Minimum is 1', lang);
    if (form.maxConsecutiveDays < 1) errs.maxConsecutiveDays = t('الحد الأدنى 1', 'Minimum is 1', lang);
    if (form.costPerDay < 1) errs.costPerDay = t('التكلفة يجب أن تكون 1 على الأقل', 'Cost must be at least 1', lang);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const payload = {
      name: form.name,
      city: form.city || null,
      specialties: form.specialties.join(', '),
      trainerType: form.trainerType,
      unavailableDates: form.unavailableDates.join('; '),
      maxDaysPerMonth: form.maxDaysPerMonth,
      maxConsecutiveDays: form.maxConsecutiveDays,
      costPerDay: form.costPerDay,
      notes: form.notes || null,
    };
    try {
      if (selected) {
        await api.trainers.update(activeWorkspace, selected.id, payload);
        addToast('success', t('تم تحديث المدرب', 'Trainer updated', lang));
      } else {
        await api.trainers.create(activeWorkspace, payload);
        addToast('success', t('تمت إضافة المدرب', 'Trainer added', lang));
      }
      setShowDrawer(false);
      await loadTrainers();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Trainer save failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeWorkspace) return;
    try {
      await api.trainers.delete(activeWorkspace, id);
      addToast('success', t('تم الحذف', 'Deleted', lang));
      await loadTrainers();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Delete failed');
    }
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('المدربون', 'Trainers', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(`${trainers.length} مدرب`, `${trainers.length} trainers`, lang)}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> {t('مدرب جديد', 'New Trainer', lang)}
        </button>
      </div>

      <div className={`${isDarkCard} p-4 flex flex-wrap gap-3`}>
        <div className={`flex items-center gap-2 flex-1 min-w-[200px] rounded-xl border px-3 py-2 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <Search size={14} className="text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('بحث...', 'Search...', lang)} className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل المدن', 'All Cities', lang)}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`rounded-xl border px-3 py-2 text-sm outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}>
          <option value="">{t('كل الأنواع', 'All Types', lang)}</option>
          <option value="Internal">{t('داخلي', 'Internal', lang)}</option>
          <option value="External">{t('خارجي', 'External', lang)}</option>
          <option value="Freelance">{t('مستقل', 'Freelance', lang)}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((trainer) => {
          return (
            <div key={trainer.id} className={`${isDarkCard} p-5 hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow">
                    {trainer.name.charAt(0) || 'T'}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{lang === 'ar' ? trainer.name : trainer.nameEn}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{trainer.city}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[trainer.trainerType]}`}>
                  {t({ Internal: 'داخلي', External: 'خارجي', Freelance: 'مستقل' }[trainer.trainerType], trainer.trainerType, lang)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {trainer.specialties.map((sp, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{sp}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { ar: 'الحد الشهري', en: 'Max/Month', val: trainer.maxDaysPerMonth },
                  { ar: 'المتتالي', en: 'Consecutive', val: trainer.maxConsecutiveDays },
                  { ar: 'التكلفة/يوم', en: 'Cost/Day', val: `${trainer.costPerDay.toLocaleString()}` },
                ].map((stat, i) => (
                  <div key={i} className={`text-center p-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                    <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stat.val}</div>
                    <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(stat.ar, stat.en, lang)}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(trainer)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <Edit2 size={12} className="inline me-1" />{t('تعديل', 'Edit', lang)}
                </button>
                <button onClick={() => void handleDelete(trainer.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-500 hover:bg-red-50 border border-red-200">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showDrawer && form && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => { setShowDrawer(false); setErrors({}); }} />
          <div className={`w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{selected ? t('تعديل المدرب', 'Edit Trainer', lang) : t('إضافة مدرب', 'Add Trainer', lang)}</h2>
              <button onClick={() => setShowDrawer(false)} className={isDark ? 'text-slate-400' : 'text-slate-500'}><X size={20} /></button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الاسم', 'Name', lang)} *</label>
                <input value={form.name} onChange={(e) => setForm((p) => p ? ({ ...p, name: e.target.value, nameEn: e.target.value }) : p)} className={`${errors.name ? errorCls : inputCls}`} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('المدينة', 'City', lang)}</label>
                <input value={form.city} onChange={(e) => setForm((p) => p ? ({ ...p, city: e.target.value }) : p)} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('التخصصات', 'Specialties', lang)}</label>
                <input value={form.specialties.join(', ')} onChange={(e) => setForm((p) => p ? ({ ...p, specialties: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }) : p)} className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('نوع المدرب', 'Trainer Type', lang)}</label>
                <select value={form.trainerType} onChange={(e) => setForm((p) => p ? ({ ...p, trainerType: e.target.value as UiTrainer['trainerType'] }) : p)} className={inputCls}>
                  <option value="Internal">{t('داخلي', 'Internal', lang)}</option>
                  <option value="External">{t('خارجي', 'External', lang)}</option>
                  <option value="Freelance">{t('مستقل', 'Freelance', lang)}</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('أيام عدم التوفر', 'Unavailable Dates', lang)}</label>
                <input value={form.unavailableDates.join('; ')} onChange={(e) => setForm((p) => p ? ({ ...p, unavailableDates: e.target.value.split(';').map((item) => item.trim()).filter(Boolean) }) : p)} className={inputCls} placeholder="2026-02-15; 2026-02-16" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('أيام/شهر', 'Days/Month', lang)} *</label>
                  <input type="number" value={form.maxDaysPerMonth} onChange={(e) => setForm((p) => p ? ({ ...p, maxDaysPerMonth: +e.target.value }) : p)} className={`${errors.maxDaysPerMonth ? errorCls : inputCls}`} />
                  {errors.maxDaysPerMonth && <p className="text-xs text-red-500 mt-1">{errors.maxDaysPerMonth}</p>}
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('متتالي', 'Consecutive', lang)} *</label>
                  <input type="number" value={form.maxConsecutiveDays} onChange={(e) => setForm((p) => p ? ({ ...p, maxConsecutiveDays: +e.target.value }) : p)} className={`${errors.maxConsecutiveDays ? errorCls : inputCls}`} />
                  {errors.maxConsecutiveDays && <p className="text-xs text-red-500 mt-1">{errors.maxConsecutiveDays}</p>}
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('تكلفة/يوم', 'Cost/Day', lang)} *</label>
                  <input type="number" value={form.costPerDay} onChange={(e) => setForm((p) => p ? ({ ...p, costPerDay: +e.target.value }) : p)} className={`${errors.costPerDay ? errorCls : inputCls}`} />
                  {errors.costPerDay && <p className="text-xs text-red-500 mt-1">{errors.costPerDay}</p>}
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('ملاحظات', 'Notes', lang)}</label>
                <textarea value={form.notes || ''} onChange={(e) => setForm((p) => p ? ({ ...p, notes: e.target.value }) : p)} rows={3} className={inputCls + ' resize-none'} />
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <button onClick={() => void handleSave()} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm">{t('حفظ', 'Save', lang)}</button>
              <button onClick={() => setShowDrawer(false)} className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t('إلغاء', 'Cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
