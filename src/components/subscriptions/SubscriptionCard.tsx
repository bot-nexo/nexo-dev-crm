import React, { useState } from 'react';
import {
  CreditCard,
  Mail,
  Calendar,
  ExternalLink,
  Bell,
  Clock,
  Edit2,
  Trash2,
  Copy,
  Check,
  Shield,
  Zap,
  Globe,
  Sparkles,
} from 'lucide-react';
import { SuscripcionStartup } from '../../types/database';
import {
  calculateSubscriptionDueInfo,
  formatSubscriptionCost,
} from '../../services/subscriptionAlertService';

interface SubscriptionCardProps {
  subscription: SuscripcionStartup;
  onEdit: (sub: SuscripcionStartup) => void;
  onDelete: (id: string) => void;
  onOpenAlert: (sub: SuscripcionStartup) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  ia_apis: { label: 'IA & APIs', color: 'text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-500/30', icon: '🤖' },
  infraestructura_cloud: { label: 'Cloud & Hosting', color: 'text-sky-400 bg-sky-950/40 border-sky-500/30', icon: '☁️' },
  herramientas_dev: { label: 'Dev Tools', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30', icon: '🛠️' },
  productividad_email: { label: 'Email & Suite', color: 'text-violet-400 bg-violet-950/40 border-violet-500/30', icon: '📬' },
  diseno_frontend: { label: 'Diseño & UI', color: 'text-pink-400 bg-pink-950/40 border-pink-500/30', icon: '🎨' },
  marketing_dominios: { label: 'Dominios & Mkt', color: 'text-amber-400 bg-amber-950/40 border-amber-500/30', icon: '🌐' },
  seguridad_vpn: { label: 'Seguridad', color: 'text-teal-400 bg-teal-950/40 border-teal-500/30', icon: '🛡️' },
  otros: { label: 'General', color: 'text-slate-400 bg-slate-900 border-slate-700', icon: '📦' },
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
  onOpenAlert,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const dueInfo = calculateSubscriptionDueInfo(subscription);
  const categoryInfo = CATEGORY_CONFIG[subscription.categoria] || CATEGORY_CONFIG.otros;

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(subscription.email_cuenta);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="relative group flex flex-col justify-between p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-lg hover:shadow-cyan-500/5 overflow-hidden">
      
      {/* Top Banner & Category */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-lg shrink-0 shadow-inner">
            {categoryInfo.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition">
              {subscription.nombre_servicio}
            </h3>
            <span className="text-[11px] text-slate-400 truncate block">
              {subscription.proveedor || subscription.nombre_servicio}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
            subscription.estado === 'activa'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              : subscription.estado === 'en_prueba'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
              : subscription.estado === 'por_renovar'
              ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
              : subscription.estado === 'pausada'
              ? 'bg-slate-800 text-slate-400 border-slate-700'
              : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
          }`}
        >
          {subscription.estado === 'activa' && '🟢 Activa'}
          {subscription.estado === 'en_prueba' && '🎁 Prueba (Trial)'}
          {subscription.estado === 'por_renovar' && '🟡 Por Renovar'}
          {subscription.estado === 'pausada' && '⏸️ Pausada'}
          {subscription.estado === 'cancelada' && '🔴 Cancelada'}
        </span>
      </div>

      {/* Pricing and Due Date Highlight */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4 space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-medium text-slate-400">Tarifa / Costo:</span>
          <div className="text-right">
            <span className="text-base font-extrabold text-cyan-300 font-mono tracking-tight">
              {formatSubscriptionCost(subscription.costo, subscription.moneda)}
            </span>
            <span className="text-[11px] text-slate-400 font-normal"> / {subscription.ciclo_cobro}</span>
          </div>
        </div>

        {/* Due Date & Urgency Indicator */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Próximo Cobro:</span>
          </div>
          <span
            className={`font-semibold font-mono text-[11px] px-2 py-0.5 rounded ${
              dueInfo.isToday
                ? 'bg-rose-500 text-white font-bold animate-bounce'
                : dueInfo.isOverdue
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                : dueInfo.isSoon
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                : 'text-slate-300'
            }`}
          >
            {subscription.proxima_fecha_pago} ({dueInfo.statusLabel})
          </span>
        </div>
      </div>

      {/* Account Email Information (Crucial Feature Requested) */}
      <div className="space-y-2 mb-4 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] text-slate-400">Cuenta:</span>
            <span className="font-mono text-purple-300 font-semibold truncate text-[11px]">
              {subscription.email_cuenta}
            </span>
          </div>
          <button
            onClick={handleCopyEmail}
            title="Copiar email de la cuenta"
            className="p-1 rounded text-purple-400 hover:text-purple-200 hover:bg-purple-900/40 transition cursor-pointer shrink-0"
          >
            {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {subscription.metodo_pago && (
          <div className="flex items-center gap-1.5 px-2 text-[11px] text-slate-400">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{subscription.metodo_pago}</span>
          </div>
        )}

        {subscription.notas && (
          <p className="px-2 text-[11px] text-slate-400 line-clamp-1 italic">
            "{subscription.notas}"
          </p>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80 mt-auto">
        {/* Send Email Alert Button */}
        <button
          onClick={() => onOpenAlert(subscription)}
          title="Enviar aviso a mi correo"
          className="flex-1 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-cyan-400" />
          <span>Avisar al Correo</span>
        </button>

        {/* Direct Link to Provider Billing */}
        {subscription.url_panel_gestion && (
          <a
            href={subscription.url_panel_gestion}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir panel de facturación del proveedor"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Edit Button */}
        <button
          onClick={() => onEdit(subscription)}
          title="Editar suscripción"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button */}
        <button
          onClick={() => {
            if (confirm(`¿Estás seguro de eliminar la suscripción "${subscription.nombre_servicio}"?`)) {
              onDelete(subscription.id);
            }
          }}
          title="Eliminar suscripción"
          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
