import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Plus, Search, Edit2, Trash2, X, MapPin, Users } from 'lucide-react';
import { api, courseTypeLabel, uiToCourseType, type VenueDto } from '../lib/api';

type UiVenue = {
  id: string;
  externalId: string;
  name: string;
  nameEn: string;
  city: string;
  type: 'In-person' | 'Online' | 'External';
  capacity: number;
  availableFrom: string;
  availableTo: string;
  unavailableDates: string[];
  equipmentNotes: string;
};

const mapVenue = (venue: VenueDto): UiVenue => ({
  id: venue.id,
  externalId: venue.externalId || '',
  name: venue.name,
  nameEn: venue.name,
  city: venue.city || '',
  type: courseTypeLabel(venue.type),
  capacity: venue.capacity || 0,
  availableFrom: venue.availableFrom ? venue.availableFrom.slice(0, 10) : '',
  availableTo: venue.availableTo ? venue.availableTo.slice(0, 10) : '',
  unavailableDates: venue.unavailableDates ? venue.unavailableDates.split(';').map((item) => item.trim()).filter(Boolean) : [],
  equipmentNotes: venue.equipmentNotes || '',
});

export function Venues() {
  const { lang, theme, addToast, activeWorkspace } = useApp();
  const isDark = theme === 'dark';
  const [venues, setVenues] = useState<UiVenue[]>([]);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selected, setSelected] = useState<UiVenue | null>(null);
  const [form, setForm] = useState<UiVenue | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;
  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`;
  const errorCls = inputCls.replace('border-slate-200', 'border-red-500').replace('border-slate-600', 'border-red-500');

  const typeColors: Record<string, string> = {
    'In-person': 'bg-blue-100 text-blue-700',
    Online: 'bg-teal-100 text-teal-700',
    External: 'bg-purple-100 text-purple-700',
  };

  const typeIcons: Record<string, string> = { 'In-person': '🏫', Online: '💻', External: '🏛️' };

  const loadVenues = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await api.venues.list(activeWorkspace);
      setVenues(data.map(mapVenue));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVenues();
  }, [activeWorkspace]);

  const filtered = useMemo(() => venues.filter((v) =>
    (v.name.toLowerCase().includes(search.toLowerCase()) || v.nameEn.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCity || v.city === filterCity) &&
    (!filterType || v.type === filterType)
  ), [filterCity, filterType, search, venues]);

  const cities = [...new Set(venues.map((v) => v.city).filter(Boolean))];

  const openCreate = () => {
    setSelected(null);
    setErrors({});
    setForm({ id: '', externalId: '', name: '', nameEn: '', city: '', type: 'In-person', capacity: 20, availableFrom: '', availableTo: '', unavailableDates: [], equipmentNotes: '' });
    setShowDrawer(true);
  };

  const openEdit = (venue: UiVenue) => { setSelected(venue); setForm(venue); setErrors({}); setShowDrawer(true); };

  const handleSave = async () => {
    if (!activeWorkspace || !form) return;
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('اسم القاعة مطلوب', 'Venue name is required', lang);
    if (form.capacity < 1) errs.capacity = t('السعة يجب أن تكون 1 على الأقل', 'Capacity must be at least 1', lang);
    if (form.availableFrom && form.availableTo && form.availableFrom > form.availableTo) {
      errs.availableFrom = t('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'Start date must be before end date', lang);
      errs.availableTo = ' ';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (saving) return;
    setSaving(true);
    const payload = {
      name: form.name,
      city: form.city || null,
      capacity: form.capacity,
      type: uiToCourseType(form.type),
      availableFrom: form.availableFrom || null,
      availableTo: form.availableTo || null,
      unavailableDates: form.unavailableDates.join('; '),
      equipmentNotes: form.equipmentNotes || null,
    };
    try {
      if (selected) {
        await api.venues.update(activeWorkspace, selected.id, payload);
        addToast('success', t('تم تحديث القاعة', 'Venue updated', lang));
      } else {
        await api.venues.create(activeWorkspace, payload);
        addToast('success', t('تمت إضافة القاعة', 'Venue added', lang));
      }
      setShowDrawer(false);
      await loadVenues();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Venue save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeWorkspace) return;
    try {
      await api.venues.delete(activeWorkspace, id);
      addToast('success', t('تم الحذف', 'Deleted', lang));
      await loadVenues();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const getCapacityColor = (cap: number) => cap >= 50 ? 'bg-green-100 text-green-700' : cap >= 25 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('القاعات', 'Venues', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t(`${venues.length} قاعة`, `${venues.length} venues`, lang)}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
          <Plus size={16} /> {t('قاعة جديدة', 'New Venue', lang)}
        </button>
      </div>

      <div className={`${card} p-4 flex flex-wrap gap-3`}>
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
          {['In-person', 'Online', 'External'].map((tp) => <option key={tp} value={tp}>{tp === 'In-person' ? t('حضوري', 'In-person', lang) : tp === 'Online' ? t('أونلاين', 'Online', lang) : t('خارجي', 'External', lang)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((venue) => (
          <div key={venue.id} className={`${card} p-5 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>{typeIcons[venue.type]}</div>
                <div>
                  <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{lang === 'ar' ? venue.name : venue.nameEn}</h3>
                  <div className="flex items-center gap-1 mt-0.5"><MapPin size={11} className="text-slate-400" /><span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{venue.city}</span></div>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[venue.type]}`}>{venue.type}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${getCapacityColor(venue.capacity)}`}><Users size={11} /> {venue.capacity}</span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{venue.availableFrom || '—'} - {venue.availableTo || '—'}</span>
            </div>
            {venue.equipmentNotes && <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{venue.equipmentNotes}</p>}
            <div className="flex gap-2">
              <button onClick={() => openEdit(venue)} className={`flex-1 py-1.5 text-xs font-medium rounded-lg border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Edit2 size={12} className="inline me-1" />{t('تعديل', 'Edit', lang)}</button>
              <button onClick={() => void handleDelete(venue.id)} className="px-3 py-1.5 text-xs rounded-lg text-red-500 hover:bg-red-50 border border-red-200"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
      )}

      {showDrawer && form && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => { setShowDrawer(false); setErrors({}); }} />
          <div className={`w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{selected ? t('تعديل القاعة', 'Edit Venue', lang) : t('إضافة قاعة', 'Add Venue', lang)}</h2>
              <button onClick={() => setShowDrawer(false)}><X size={20} className={isDark ? 'text-slate-400' : 'text-slate-500'} /></button>
            </div>
            <div className="flex-1 p-6 space-y-4">
              <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الاسم', 'Name', lang)} *</label><input value={form.name || ''} onChange={(e) => setForm((p) => p ? ({ ...p, name: e.target.value, nameEn: e.target.value }) : p)} className={`${errors.name ? errorCls : inputCls}`} />{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('المدينة', 'City', lang)}</label><input value={form.city || ''} onChange={(e) => setForm((p) => p ? ({ ...p, city: e.target.value }) : p)} className={inputCls} /></div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('النوع', 'Type', lang)}</label><select value={form.type} onChange={(e) => setForm((p) => p ? ({ ...p, type: e.target.value as UiVenue['type'] }) : p)} className={inputCls}><option value="In-person">{t('حضوري', 'In-person', lang)}</option><option value="Online">{t('أونلاين', 'Online', lang)}</option><option value="External">{t('خارجي', 'External', lang)}</option></select></div>
              </div>
              <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('السعة', 'Capacity', lang)} *</label><input type="number" value={form.capacity || 20} onChange={(e) => setForm((p) => p ? ({ ...p, capacity: +e.target.value }) : p)} className={`${errors.capacity ? errorCls : inputCls}`} />{errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('متاح من', 'Available From', lang)}</label><input type="date" value={form.availableFrom || ''} onChange={(e) => setForm((p) => p ? ({ ...p, availableFrom: e.target.value }) : p)} className={`${errors.availableFrom ? errorCls : inputCls}`} />{errors.availableFrom && <p className="text-xs text-red-500 mt-1">{errors.availableFrom}</p>}</div>
                <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('متاح إلى', 'Available To', lang)}</label><input type="date" value={form.availableTo || ''} onChange={(e) => setForm((p) => p ? ({ ...p, availableTo: e.target.value }) : p)} className={`${errors.availableTo ? errorCls : inputCls}`} />{errors.availableTo && <p className="text-xs text-red-500 mt-1">{errors.availableTo}</p>}</div>
              </div>
              <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('أيام عدم التوفر', 'Unavailable Dates', lang)}</label><input value={form.unavailableDates.join('; ')} onChange={(e) => setForm((p) => p ? ({ ...p, unavailableDates: e.target.value.split(';').map((item) => item.trim()).filter(Boolean) }) : p)} className={inputCls} placeholder="2026-03-10; 2026-03-11" /></div>
              <div><label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('ملاحظات التجهيز', 'Equipment Notes', lang)}</label><textarea value={form.equipmentNotes || ''} onChange={(e) => setForm((p) => p ? ({ ...p, equipmentNotes: e.target.value }) : p)} rows={3} className={inputCls + ' resize-none'} /></div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-3 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
              <button onClick={() => void handleSave()} disabled={saving} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>{saving ? t('جاري الحفظ...', 'Saving...', lang) : t('حفظ', 'Save', lang)}</button>
              <button onClick={() => setShowDrawer(false)} className={`flex-1 py-2.5 rounded-xl text-sm border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-200 text-slate-600'}`}>{t('إلغاء', 'Cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
