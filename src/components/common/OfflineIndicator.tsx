import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-950/90 border border-amber-500/50 px-3.5 py-2 text-xs font-medium text-amber-200 shadow-2xl backdrop-blur-md animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <div className="flex items-center gap-1.5">
        <span className="font-semibold">Modo Offline Activo:</span>
        <span className="text-amber-300">Tus cambios se guardan localmente y sincronizan al reconectar.</span>
      </div>
      <Database className="w-3.5 h-3.5 text-amber-400 ml-1" />
    </div>
  );
};
