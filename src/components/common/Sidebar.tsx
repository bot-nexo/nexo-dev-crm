import React from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CreditCard,
  Send,
  BarChart3,
  FileCode2,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'clientes'
  | 'proyectos'
  | 'pagos'
  | 'automatizaciones'
  | 'reportes'
  | 'sql'
  | 'config';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingAlertsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Panel Principal',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'clientes' as NavTab,
      label: 'Clientes',
      icon: Users,
      badge: null,
    },
    {
      id: 'proyectos' as NavTab,
      label: 'Proyectos & MRR',
      icon: FolderKanban,
      badge: null,
    },
    {
      id: 'pagos' as NavTab,
      label: 'Pagos & Cobranza',
      icon: CreditCard,
      badge: pendingAlertsCount > 0 ? `${pendingAlertsCount}` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'automatizaciones' as NavTab,
      label: 'Automatizaciones',
      icon: Send,
      badge: 'WhatsApp/Mail',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'reportes' as NavTab,
      label: 'Informes & Métricas',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'sql' as NavTab,
      label: 'Esquema SQL Supabase',
      icon: FileCode2,
      badge: 'v1.0',
      badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'config' as NavTab,
      label: 'Configuración & Netlify',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#090d16] border-r border-slate-800/80 p-4 shrink-0">
        <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase px-3 mb-2 font-mono">
          Navegación
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Agency Footer Card */}
        <div className="mt-auto pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200">Supabase + Netlify</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Arquitectura lista para producción y PWA offline con sincronización.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Horizontal Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto no-scrollbar gap-1.5 px-4 py-2 bg-slate-950 border-b border-slate-800 shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
