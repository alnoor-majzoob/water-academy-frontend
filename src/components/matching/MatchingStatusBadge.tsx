import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Wifi, WifiOff } from 'lucide-react';

export function MatchingStatusBadge({ workspaceId }: { workspaceId: number }) {
  const { lang, theme } = useApp();
  const isDark = theme === 'dark';
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.matching.health(workspaceId)
      .then(() => { if (!cancelled) setOnline(true); })
      .catch(() => { if (!cancelled) setOnline(false); });
    return () => { cancelled = true; };
  }, [workspaceId]);

  if (online === null) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
      online
        ? isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-700'
        : isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-700'
    }`}>
      {online ? <Wifi size={12} /> : <WifiOff size={12} />}
      {online
        ? (lang === 'ar' ? 'متصل' : 'Online')
        : (lang === 'ar' ? 'غير متصل' : 'Offline')}
    </span>
  );
}
