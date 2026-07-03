import { useApp } from '../../context/AppContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: { icon: CheckCircle, classes: 'bg-green-600' },
  error:   { icon: XCircle,     classes: 'bg-red-600' },
  warning: { icon: AlertTriangle, classes: 'bg-amber-500' },
  info:    { icon: Info,        classes: 'bg-blue-600' },
};

export function ToastContainer() {
  const { toasts, removeToast, lang } = useApp();
  return (
    <div className={`fixed bottom-5 z-[100] flex flex-col gap-2 ${lang === 'ar' ? 'left-5' : 'right-5'}`}>
      {toasts.map(toast => {
        const cfg = icons[toast.type];
        const Icon = cfg.icon;
        return (
          <div key={toast.id} className="toast-enter flex items-center gap-3 min-w-[280px] max-w-sm bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.classes}`}>
              <Icon size={14} />
            </div>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
