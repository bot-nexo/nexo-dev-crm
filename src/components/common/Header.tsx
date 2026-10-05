import React from 'react';
import { Database, PlusCircle, Bell, RefreshCw, Layers } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getSupabaseClient } from '../../lib/supabase';

interface HeaderProps {
  onOpenNewPayment: () => void;
  onOpenNewClient: () => void;
  onOpenSettings: () => void;
  onSync: () => void;
  isSyncing: boolean;
  pendingAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewPayment,
  onOpenNewClient,
  onOpenSettings,
  onSync,
  isSyncing,
  pendingAlertsCount,
}) => {
  const isOnline = useOnlineStatus();
  const supabaseClient = getSupabaseClient();
  const isSupabaseConfigured = Boolean(supabaseClient);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-slate-900 to-indigo-950 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white font-mono">
              NEXO<span className="text-cyan-400">DEV</span>STUDIO
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              CRM PRO
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Control de Clientes, Proyectos & Pagos Recurrentes
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Supabase Status / Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
            isSupabaseConfigured
              ? 'bg-slate-900 border-emerald-500/40 text-emerald-400 hover:bg-slate-800'
              : 'bg-slate-900 border-cyan-500/30 text-cyan-400 hover:bg-slate-800'
          }`}
          title={isSupabaseConfigured ? 'Supabase Conectado (Clic para sincronizar)' : 'Almacenamiento Local (Clic para probar Supabase)'}
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {isSupabaseConfigured ? 'Supabase Live' : 'Local Synced'}
          </span>
          <RefreshCw className={`w-3 h-3 ml-0.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
        </button>

        {/* Connectivity status */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
            isOnline
              ? 'bg-slate-900/60 border-slate-800 text-slate-400'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
          <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
        </div>

        {/* Notifications / Alerts icon */}
        <button
          onClick={onOpenSettings}
          className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition cursor-pointer"
          title="Configuración e Integraciones"
        >
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-bold text-black bg-cyan-400 rounded-full">
              {pendingAlertsCount}
            </span>
          )}
        </button>

        {/* Quick Add Client Button */}
        <button
          onClick={onOpenNewClient}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500/40 transition cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nuevo Cliente</span>
        </button>

        {/* Quick Register Payment Button */}
        <button
          onClick={onOpenNewPayment}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium shadow-md shadow-cyan-500/20 transition cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Registrar Pago</span>
        </button>
      </div>
    </header>
  );
};
