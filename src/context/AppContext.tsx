import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type WorkspaceDto } from '../lib/api';

export type Lang = 'ar' | 'en';
export type Theme = 'light' | 'dark';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  activeWorkspace: string;
  setActiveWorkspace: (id: string) => void;
  workspaces: WorkspaceDto[];
  currentWorkspace: WorkspaceDto | null;
  loadingWorkspaces: boolean;
  reloadWorkspaces: () => Promise<void>;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [theme, setThemeState] = useState<Theme>('light');
  const [activeWorkspace, setActiveWorkspace] = useState('');
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const setLang = (l: Lang) => {
    setLangState(l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
    document.title = l === 'ar'
      ? 'مخطط التدريب | أكاديمية المياه'
      : 'Training Scheduler | Water Academy';
    document.body.className = l === 'en' ? 'lang-en' : '';
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const addToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const reloadWorkspaces = async () => {
    setLoadingWorkspaces(true);
    try {
      const data = await api.workspaces.list();
      setWorkspaces(data);
      setActiveWorkspace((prev) => {
        if (prev && data.some((item) => item.id === prev)) return prev;
        return data[0]?.id || '';
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load workspaces';
      addToast('error', message);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    void reloadWorkspaces();
    setLang('ar');
    setTheme('light');
  }, []);

  const currentWorkspace = useMemo(
    () => workspaces.find((item) => item.id === activeWorkspace) || null,
    [activeWorkspace, workspaces],
  );

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        theme,
        setTheme,
        activeWorkspace,
        setActiveWorkspace,
        workspaces,
        currentWorkspace,
        loadingWorkspaces,
        reloadWorkspaces,
        toasts,
        addToast,
        removeToast,
        sidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export const t = (ar: string, en: string, lang: Lang) => (lang === 'ar' ? ar : en);
