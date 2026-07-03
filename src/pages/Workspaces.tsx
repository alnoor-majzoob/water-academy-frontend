import { useEffect, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Plus, Edit2, Trash2, LayoutGrid, List, Calendar } from 'lucide-react';
import { StatusChip } from '../components/ui/StatusChip';
import { api, uiToWorkspaceStatus, workspaceStatusLabel, type WorkspaceDto } from '../lib/api';

type UiWorkspaceStatus = 'Draft' | 'Imported' | 'Optimized' | 'Disabled';

export function Workspaces() {
  const { lang, theme, addToast, workspaces, reloadWorkspaces } = useApp();
  const isDark = theme === 'dark';
  const [view, setView] = useState<'card' | 'table'>('card');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<WorkspaceDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', year: 2026, color: '#3B82F6', status: 'Draft' as UiWorkspaceStatus, description: '' });

  const card = `rounded-2xl p-5 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;
  const inputCls = `w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500
    ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-800'}`;

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name,
        year: editItem.year,
        color: editItem.color || '#3B82F6',
        status: workspaceStatusLabel(editItem.status),
        description: editItem.description || '',
      });
      setShowCreate(true);
    }
  }, [editItem]);

  const resetForm = () => {
    setForm({ name: '', year: 2026, color: '#3B82F6', status: 'Draft', description: '' });
    setEditItem(null);
    setShowCreate(false);
  };

  const handleCreateOrUpdate = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await api.workspaces.update(editItem.id, {
          name: form.name || 'Training Plan',
          description: form.description || null,
          year: form.year,
          color: form.color,
        });
        if (workspaceStatusLabel(editItem.status) !== form.status) {
          await api.workspaces.updateStatus(editItem.id, uiToWorkspaceStatus(form.status));
        }
        addToast('success', t('تم تحديث مساحة العمل بنجاح', 'Workspace updated successfully', lang));
      } else {
        const created = await api.workspaces.create({
          name: form.name || 'Training Plan',
          description: form.description || null,
          year: form.year,
          color: form.color,
        });
        if (form.status !== 'Draft') {
          await api.workspaces.updateStatus(created.id, uiToWorkspaceStatus(form.status));
        }
        addToast('success', t('تم إنشاء مساحة العمل بنجاح', 'Workspace created successfully', lang));
      }
      await reloadWorkspaces();
      resetForm();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Workspace request failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.workspaces.delete(id);
      setDeleteId(null);
      await reloadWorkspaces();
      addToast('success', t('تم الحذف بنجاح', 'Deleted successfully', lang));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleStatusChange = async (workspace: WorkspaceDto, status: UiWorkspaceStatus) => {
    try {
      await api.workspaces.updateStatus(workspace.id, uiToWorkspaceStatus(status));
      await reloadWorkspaces();
      addToast('info', t('تم تحديث الحالة', 'Status updated', lang));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Status update failed');
    }
  };

  const statusOptions: UiWorkspaceStatus[] = ['Draft', 'Imported', 'Optimized', 'Disabled'];

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('مساحات العمل', 'Workspaces', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('إدارة خطط التدريب السنوية', 'Manage annual training plans', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex rounded-xl border p-1 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            {(['card', 'table'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`p-1.5 rounded-lg transition-colors ${view === v ? 'bg-blue-600 text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                {v === 'card' ? <LayoutGrid size={16} /> : <List size={16} />}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus size={16} />{t('مساحة عمل جديدة', 'New Workspace', lang)}
          </button>
        </div>
      </div>

      {view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div key={ws.id} className={`${card} hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ backgroundColor: ws.color || '#3B82F6' }}>
                    {ws.year.toString().slice(2)}
                  </div>
                  <div>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{ws.name}</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ws.year}</p>
                  </div>
                </div>
                <StatusChip status={workspaceStatusLabel(ws.status)} size="sm" />
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                <Calendar size={12} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('تحديث:', 'Updated:', lang)} {ws.updatedAt.slice(0, 10)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={workspaceStatusLabel(ws.status)}
                  onChange={(e) => void handleStatusChange(ws, e.target.value as UiWorkspaceStatus)}
                  className={`flex-1 text-xs rounded-lg border px-2 py-1.5 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => setEditItem(ws)} className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setDeleteId(ws.id)} className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => setShowCreate(true)} className={`rounded-2xl p-5 border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-[180px] transition-colors
            ${isDark ? 'border-slate-700 text-slate-500 hover:border-blue-500 hover:text-blue-400' : 'border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'}`}>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Plus size={20} className="text-blue-500" />
            </div>
            <span className="text-sm font-medium">{t('إنشاء مساحة عمل جديدة', 'Create New Workspace', lang)}</span>
          </button>
        </div>
      ) : (
        <div className={`${card} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                {[t('الاسم', 'Name', lang), t('السنة', 'Year', lang), t('الحالة', 'Status', lang), t('تاريخ الإنشاء', 'Created', lang), t('تاريخ التحديث', 'Updated', lang), t('الإجراءات', 'Actions', lang)].map((h, i) => (
                  <th key={i} className={`text-start px-4 py-3 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workspaces.map((ws) => (
                <tr key={ws.id} className={`border-b table-row-hover ${isDark ? 'border-slate-700/50' : 'border-slate-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ws.color || '#3B82F6' }} />
                      <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{ws.name}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{ws.year}</td>
                  <td className="px-4 py-3"><StatusChip status={workspaceStatusLabel(ws.status)} size="sm" /></td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ws.createdAt.slice(0, 10)}</td>
                  <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{ws.updatedAt.slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditItem(ws)} className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}><Edit2 size={13} /></button>
                      <button onClick={() => setDeleteId(ws.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-5 ${isDark ? 'text-white' : 'text-slate-800'}`}>{editItem ? t('تعديل مساحة العمل', 'Edit Workspace', lang) : t('إنشاء مساحة عمل جديدة', 'Create New Workspace', lang)}</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الاسم', 'Name', lang)}</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Training Plan 2026" className={inputCls} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الوصف', 'Description', lang)}</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className={inputCls + ' resize-none'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('السنة', 'Year', lang)}</label>
                  <input type="number" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('اللون', 'Color', lang)}</label>
                  <input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} className="w-full h-10 rounded-xl border cursor-pointer" />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('الحالة', 'Status', lang)}</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as UiWorkspaceStatus }))} className={inputCls}>
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => void handleCreateOrUpdate()} disabled={saving} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-60">{saving ? t('جاري الحفظ...', 'Saving...', lang) : t(editItem ? 'حفظ التغييرات' : 'إنشاء', editItem ? 'Save Changes' : 'Create', lang)}</button>
              <button onClick={resetForm} className={`flex-1 py-2.5 rounded-xl font-medium text-sm border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t('إلغاء', 'Cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h2 className={`text-center font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('تأكيد الحذف', 'Confirm Delete', lang)}</h2>
            <p className={`text-center text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('هل أنت متأكد؟ لا يمكن التراجع.', 'Are you sure? This cannot be undone.', lang)}</p>
            <div className="flex gap-3">
              <button onClick={() => void handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm">{t('حذف', 'Delete', lang)}</button>
              <button onClick={() => setDeleteId(null)} className={`flex-1 py-2.5 rounded-xl font-medium text-sm border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{t('إلغاء', 'Cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
