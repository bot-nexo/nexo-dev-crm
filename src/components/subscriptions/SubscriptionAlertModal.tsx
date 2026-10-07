import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { SuscripcionStartup } from '../../types/database';
import {
  SubscriptionAlertService,
  calculateSubscriptionDueInfo,
  formatSubscriptionCost,
} from '../../services/subscriptionAlertService';
import { getStoredConfig } from '../../lib/supabase';

interface SubscriptionAlertModalProps {
  subscription: SuscripcionStartup;
  onClose: () => void;
  onAlertSent?: () => Promise<void>;
}

export const SubscriptionAlertModal: React.FC<SubscriptionAlertModalProps> = ({
  subscription,
  onClose,
  onAlertSent,
}) => {
  const config = getStoredConfig();
  const dueInfo = calculateSubscriptionDueInfo(subscription);
  const emailData = SubscriptionAlertService.generateAlertEmailHTML(subscription, dueInfo);

  const [targetEmail, setTargetEmail] = useState(
    subscription.email_notificacion_alerta || config.founderEmailAlerts || subscription.email_cuenta
  );
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);

  const handleSendEmail = async () => {
    setIsSending(true);
    setDispatchResult(null);

    const result = await SubscriptionAlertService.dispatchSubscriptionAlertEmail(
      subscription,
      targetEmail.trim()
    );

    setIsSending(false);
    setDispatchResult(result);

    if (onAlertSent) {
      await onAlertSent();
    }
  };

  const handleOpenWhatsApp = () => {
    const text = SubscriptionAlertService.generateWhatsAppAlert(subscription, dueInfo);
    const cleanPhone = (config as any).founderPhone || '';
    const encoded = encodeURIComponent(text);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Alerta de Cobro: {subscription.nombre_servicio}
              </h2>
              <p className="text-xs text-slate-400">
                Notificación inmediata a tu correo electrónico de fundador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {dispatchResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                dispatchResult.success
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              }`}
            >
              {dispatchResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{dispatchResult.message}</span>
            </div>
          )}

          {/* Quick Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Servicio & Tarifa:</span>
              <span className="text-sm font-bold text-cyan-300">
                {formatSubscriptionCost(subscription.costo, subscription.moneda)} / {subscription.ciclo_cobro}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Próxima Fecha de Cobro:</span>
              <span className="text-xs font-semibold text-amber-300 font-mono">
                {subscription.proxima_fecha_pago} ({dueInfo.statusLabel})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Cuenta / Email Registrado:</span>
              <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                {subscription.email_cuenta}
              </span>
            </div>

            {subscription.metodo_pago && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Método de Pago:</span>
                <span className="text-xs font-semibold text-slate-300">{subscription.metodo_pago}</span>
              </div>
            )}
          </div>

          {/* Email Recipient Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enviar Alerta de Correo a:
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="founder@startup.com"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Recibirás un correo formateado en HTML con el costo, la fecha y el acceso directo al proveedor.
            </p>
          </div>

          {/* Subject Preview */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-mono">
              Asunto del Correo:
            </span>
            <span className="text-xs font-medium text-slate-200">{emailData.subject}</span>
          </div>

          {/* Toggle HTML Preview */}
          <div>
            <button
              type="button"
              onClick={() => setShowHtmlPreview(!showHtmlPreview)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showHtmlPreview ? 'Ocultar Vista Previa HTML' : 'Ver Vista Previa del Correo HTML'}</span>
            </button>

            {showHtmlPreview && (
              <div className="mt-3 border border-slate-800 rounded-xl overflow-hidden bg-[#090d16] max-h-60 overflow-y-auto">
                <div
                  className="p-4 text-xs"
                  dangerouslySetInnerHTML={{ __html: emailData.html }}
                />
              </div>
            )}
          </div>

          {/* Last alert info */}
          {subscription.ultima_alerta_enviada && (
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Última alerta enviada: {new Date(subscription.ultima_alerta_enviada).toLocaleString('es-CO')}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending || !targetEmail}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Enviar Alerta a mi Correo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
