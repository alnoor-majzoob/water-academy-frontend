import { useEffect, useMemo, useState } from 'react';
import { useApp, t } from '../context/AppContext';
import { Play, ChevronDown, ChevronUp, RefreshCw, Plus, CalendarRange, Clock, Loader, CheckCircle, XCircle } from 'lucide-react';
import { StatusChip } from '../components/ui/StatusChip';
import { Modal } from '../components/ui/Modal';
import { api, taskStatusLabel, type TaskDto } from '../lib/api';

type UiTask = {
  id: number;
  workspace: number;
  type: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  startedAt: string;
  completedAt?: string;
  log: string[];
  progress: number;
};

export function Tasks() {
  const { lang, theme, addToast, activeWorkspace, currentWorkspace } = useApp();
  const isDark = theme === 'dark';

  const formatDt = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  const mapTask = (task: TaskDto): UiTask => ({
    id: task.id,
    workspace: task.workspaceId,
    type: task.type === 'NEW_SCHEDULE'
      ? t('جدولة جديدة', 'New Schedule', lang)
      : task.type === 'UPDATE_SCHEDULE'
        ? t('تحديث جدولة', 'Schedule Update', lang)
        : t('مهمة جدولة', 'Scheduling Task', lang),
    status: taskStatusLabel(task.status),
    startedAt: task.startedAt || '',
    completedAt: task.completedAt || undefined,
    log: task.log ? task.log.split('\n').filter(Boolean) : [],
    progress: task.status === 'COMPLETED' ? 100 : task.status === 'RUNNING' ? 50 : 0,
  });
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [creatingMode, setCreatingMode] = useState<'new' | 'update' | null>(null);

  const card = `rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`;

  const loadTasks = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const data = await api.tasks.list(activeWorkspace);
      setTasks(data.map(mapTask));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [activeWorkspace]);

  const startTask = async (id: number) => {
    if (!activeWorkspace) return;
    try {
      await api.tasks.start(activeWorkspace, id);
      addToast('info', t('تم بدء المهمة', 'Task started', lang));
      await loadTasks();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Task start failed');
    }
  };

  const openScheduleDialog = () => setShowScheduleDialog(true);

  const runScheduler = async (mode: 'new' | 'update') => {
    if (!activeWorkspace) return;
    setCreatingMode(mode);
    try {
      const taskDto = await api.schedule.run(activeWorkspace, mode);
      setTasks(prev => [mapTask(taskDto), ...prev]);
      setShowScheduleDialog(false);
      addToast('success', t('تم بدء الجدولة', 'Scheduling started', lang));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to start scheduler');
    } finally {
      setCreatingMode(null);
    }
  };

  const handleSchedule = (mode: 'new' | 'update') => () => void runScheduler(mode);

  const statusIcon = useMemo(() => ({
    Pending: Clock,
    Running: Loader,
    Completed: CheckCircle,
    Failed: XCircle,
  }), []);

  const statusColors = {
    Pending:   { border: 'border-t-yellow-400', bg: 'bg-yellow-100/50 dark:bg-yellow-900/20', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40', iconColor: 'text-yellow-600 dark:text-yellow-400' },
    Running:   { border: 'border-t-blue-400',   bg: 'bg-blue-100/50 dark:bg-blue-900/20',   iconBg: 'bg-blue-100 dark:bg-blue-900/40',   iconColor: 'text-blue-600 dark:text-blue-400' },
    Completed: { border: 'border-t-green-400',  bg: 'bg-green-100/50 dark:bg-green-900/20', iconBg: 'bg-green-100 dark:bg-green-900/40', iconColor: 'text-green-600 dark:text-green-400' },
    Failed:    { border: 'border-t-red-400',    bg: 'bg-red-100/50 dark:bg-red-900/20',     iconBg: 'bg-red-100 dark:bg-red-900/40',     iconColor: 'text-red-600 dark:text-red-400' },
  };

  const counts = useMemo(() => ({
    Pending: tasks.filter((t) => t.status === 'Pending').length,
    Running: tasks.filter((t) => t.status === 'Running').length,
    Completed: tasks.filter((t) => t.status === 'Completed').length,
    Failed: tasks.filter((t) => t.status === 'Failed').length,
  }), [tasks]);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('المهام', 'Tasks', lang)}</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('مهام الجدولة ومعالجة البيانات', 'Scheduling & processing tasks', lang)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openScheduleDialog} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"><Plus size={14} /> {t('مهمة جديدة', 'New Task', lang)}</button>
          <button onClick={() => void loadTasks()} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><RefreshCw size={14} /> {t('تحديث', 'Refresh', lang)}</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {(['Pending', 'Running', 'Completed', 'Failed'] as UiTask['status'][]).map((status) => {
          const Icon = statusIcon[status];
          const c = statusColors[status];
          const total = counts.Pending + counts.Running + counts.Completed + counts.Failed;
          const pct = total > 0 ? Math.round((counts[status] / total) * 100) : 0;
          return (
            <div key={status}
              className={`${card} p-4 border-t-4 ${c.border} ${c.bg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg} ${c.iconColor}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{counts[status]}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusChip status={status} size="sm" />
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{pct}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${card} p-5 animate-pulse`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 w-32 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <div className={`h-3 w-48 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
              </div>
            </div>
          ))
        ) : tasks.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {t('لا توجد مهام', 'No tasks yet', lang)}
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`${card} overflow-hidden`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>{(() => { const Icon = statusIcon[task.status]; return <Icon size={20} />; })()}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1"><h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{task.type}</h3><span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>#{String(task.id).slice(0, 8)}</span></div>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentWorkspace?.name || task.workspace}</p>
                      {(task.startedAt || task.completedAt) && <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{task.startedAt && `${t('بدء:', 'Started:', lang)} ${formatDt(task.startedAt)}`} {task.completedAt && `· ${t('انتهاء:', 'Completed:', lang)} ${formatDt(task.completedAt)}`}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusChip status={task.status} size="sm" />
                    {task.status === 'Pending' && <button onClick={() => void startTask(task.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium"><Play size={12} /> {t('تشغيل', 'Run', lang)}</button>}
                    <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)} className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}>{expandedTask === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                  </div>
                </div>
                {task.status === 'Running' && <div className="mt-4"><div className="flex justify-between mb-1"><span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('التقدم', 'Progress', lang)}</span><span className="text-xs font-semibold text-blue-600">{task.progress}%</span></div><div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}><div className="h-2 rounded-full bg-blue-500 transition-all duration-500 animate-pulse" style={{ width: `${task.progress}%` }} /></div></div>}
                {task.status === 'Completed' && <div className="mt-4"><div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}><div className="h-2 rounded-full bg-green-500" style={{ width: '100%' }} /></div></div>}
              </div>
              {expandedTask === task.id && task.log.length > 0 && <div className={`border-t p-4 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}><p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('سجل التنفيذ', 'Execution Log', lang)}</p><div className="space-y-1 font-mono text-xs">{task.log.map((line, i) => <div key={i} className={`flex items-start gap-2 ${isDark ? 'text-green-400' : 'text-green-700'}`}><span className={isDark ? 'text-slate-600' : 'text-slate-400'}>[{String(i + 1).padStart(2, '0')}]</span><span>{line}</span></div>)}</div></div>}
            </div>
          ))
        )}
      </div>

      <Modal open={showScheduleDialog} onClose={() => setShowScheduleDialog(false)} maxWidth="max-w-sm">
        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
          <CalendarRange size={24} className="text-teal-600" />
        </div>
        <h2 className={`text-center font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {t('بدء الجدولة الذكية', 'Start Smart Scheduling', lang)}
        </h2>
        <p className={`text-center text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {t('اختر وضع الجدولة:', 'Choose scheduling mode:', lang)}
        </p>
        <div className="flex gap-3">
          <button onClick={handleSchedule('new')} disabled={creatingMode !== null}
            className={`flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors ${creatingMode === 'new' ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} text-white`}>
            {creatingMode === 'new' && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {t('جديد (مسح الكل)', 'New (Replace All)', lang)}
          </button>
          <button onClick={handleSchedule('update')} disabled={creatingMode !== null}
            className={`flex-1 py-3 rounded-xl font-medium text-sm border flex items-center justify-center gap-2 transition-colors ${creatingMode === 'update' ? (isDark ? 'bg-slate-600 border-slate-500' : 'bg-slate-200 border-slate-300') : (isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}`}>
            {creatingMode === 'update' && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {t('تحديث (إضافة)', 'Update (Append)', lang)}
          </button>
        </div>
        <button onClick={() => setShowScheduleDialog(false)} disabled={creatingMode !== null}
          className={`w-full mt-3 py-2 text-xs disabled:opacity-40 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {t('إلغاء', 'Cancel', lang)}
        </button>
      </Modal>
    </div>
  );
}
