import { useEffect, type ReactNode } from 'react';
import { useApp } from '../../context/AppContext';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-sm' }: ModalProps) {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h2>
            <button onClick={onClose} className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
