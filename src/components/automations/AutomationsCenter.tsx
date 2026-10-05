import React, { useState } from 'react';
import {
  Send,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Play,
  Settings,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Cliente, Proyecto, Pago, Notificacion } from '../../types/database';
import { NotificationService } from '../../services/notificationService';
import { getStoredConfig } from '../../lib/supabase';

interface AutomationsCenterProps {
  clientes: Cliente[];
  proyectos: Proyecto[];
  pagos: Pago[];
  notificaciones: Notificacion[];
  onRefreshData: () => Promise<void>;
  onOpenReceipt: (pago: Pago) => void;
}

export const AutomationsCenter: React.FC<AutomationsCenterProps> = ({
  clientes,
  proyectos,
  pagos,
  notificaciones,
  onRefreshData,
  onOpenReceipt,
}) => {
  const config = getStoredConfig();
  const [selectedClientId, setSelectedClientId] = useState<string>(clientes[0]?.id || '');
  const [automationType, setAutomationType] = useState<'confirmation' | 'reminder' | 'overdue'>('confirmation');
  const [channel, setChannel] = useState<'both' | 'whatsapp' | 'email'>('both');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const selectedClient = clientes.find((c) => c.id === selectedClientId) || clientes[0];
  const clientProjects = proyectos.filter((p) => p.cliente_id === selectedClient?.id);
  const clientPayments = pagos.filter((p) => p.cliente_id === selectedClient?.id);
  const latestProject = clientProjects[0];
  const latestPayment = clientPayments[0];

  // Dynamic preview text
  const previewData = {
    cliente: selectedClient,
    proyecto: latestProject,
    pago: latestPayment,
  };

  const whatsAppPreview = React.useMemo(() => {
    if (!selectedClient) return '';
    if (automationType === 'confirmation') {
      return NotificationService.getPaymentConfirmationWhatsApp(previewData);
    }
    if (automationType === 'reminder') {
      return NotificationService.getReminderWhatsApp(previewData);
    }
    return NotificationService.getOverdueWhatsApp(previewData);
  }, [selectedClient, latestProject, latestPayment, automationType]);

  const emailPreview = React.useMemo(() => {
    if (!selectedClient) return { subject: '', html: '' };
    if (automationType === 'confirmation') {
      return NotificationService.getPaymentConfirmationEmailHTML(previewData);
    }
    if (automationType === 'reminder') {
      return NotificationService.getReminderEmailHTML(previewData);
    }
    return NotificationService.getOverdueEmailHTML(previewData);
  }, [selectedClient, latestProject, latestPayment, automationType]);

  // Execute manual dispatch test
  const handleExecuteAutomation = async () => {
    if (!selectedClient) return;
    setIsProcessing(true);
    setStatusFeedback(null);

    const results: string[] = [];

    try {
      if (channel === 'both' || channel === 'whatsapp') {
        const waResult = await NotificationService.dispatchWhatsApp(
          selectedClient,
          whatsAppPreview,
          latestPayment?.id
        );
        results.push(waResult.message);
      }

      if (channel === 'both' || channel === 'email') {
        const mailResult = await NotificationService.dispatchEmail(
          selectedClient,
          emailPreview.subject,
          emailPreview.html,
          latestPayment?.id
        );
        results.push(mailResult.message);
      }

      setStatusFeedback(results.join(' | '));
      await onRefreshData();
    } catch (e: any) {
      setStatusFeedback(`Error al procesar: ${e.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusFeedback(null), 6000);
    }
  };

  // Batch trigger overdue reminders
  const handleTriggerAllOverdue = async () => {
    const overduePagos = pagos.filter((p) => p.estado === 'vencido');
    if (overduePagos.length === 0) {
      alert('No existen pagos en mora en este momento.');
      return;
    }

    if (
      !window.confirm(
        `¿Deseas enviar avisos de mora para ${overduePagos.length} cliente(s) con saldo vencido?`
      )
    ) {
      return;
    }

    setIsProcessing(true);
    let count = 0;
    for (const p of overduePagos) {
      if (p.cliente) {
        const waText = NotificationService.getOverdueWhatsApp({
          cliente: p.cliente,
          proyecto: p.proyecto,
          pago: p,
        });
        await NotificationService.dispatchWhatsApp(p.cliente, waText, p.id);
        const { subject, html } = NotificationService.getOverdueEmailHTML({
          cliente: p.cliente,
          proyecto: p.proyecto,
          pago: p,
        });
        await NotificationService.dispatchEmail(p.cliente, subject, html, p.id);
        count++;
      }
    }
    await onRefreshData();
    setIsProcessing(false);
    setStatusFeedback(`Se despacharon avisos de mora a ${count} cliente(s).`);
    setTimeout(() => setStatusFeedback(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">
                Centro de Automatizaciones (WhatsApp + Resend Email)
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Disparadores manuales y automatizados para confirmación de pagos con comprobante oficial,
              recordatorios preventivos de cobro (3 días antes del vencimiento) y reclamos formales de saldo en mora.
            </p>
          </div>

          <button
            onClick={handleTriggerAllOverdue}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Disparar Alertas de Mora Masivas</span>
          </button>
        </div>

        {statusFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-xs text-cyan-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
        )}
      </div>

      {/* Main Interactive Dispatcher & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls & Configuration */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              <span>Simulador & Disparador Manual</span>
            </h3>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-mono">
              Live Test
            </span>
          </div>

          {/* Client Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              1. Seleccionar Cliente Destinatario:
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.empresa}) - Tel: {c.telefono}
                </option>
              ))}
            </select>
          </div>

          {/* Automation Template Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2. Plantilla de Notificación:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAutomationType('confirmation')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                  automationType === 'confirmation'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirmación</span>
                </div>
                <div className="text-[10px] text-slate-500">Recibo de pago exitoso</div>
              </button>

              <button
                type="button"
                onClick={() => setAutomationType('reminder')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                  automationType === 'reminder'
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Aviso Cobro</span>
                </div>
                <div className="text-[10px] text-slate-500">3 días antes del venc.</div>
              </button>

              <button
                type="button"
                onClick={() => setAutomationType('overdue')}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                  automationType === 'overdue'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Aviso de Mora</span>
                </div>
                <div className="text-[10px] text-slate-500">Pago vencido urgente</div>
              </button>
            </div>
          </div>

          {/* Delivery Channel */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              3. Canal de Envío:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('both')}
                className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  channel === 'both'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Ambos (WhatsApp + Email)
              </button>
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Solo WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  channel === 'email'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Solo Email (Resend)
              </button>
            </div>
          </div>

          {/* Execute Button */}
          <div className="pt-2">
            <button
              onClick={handleExecuteAutomation}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {isProcessing ? 'Enviando notificación...' : 'Disparar Notificación Ahora'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Message Preview Box */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Vista Previa del Mensaje (WhatsApp)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">wa.me/{selectedClient?.telefono}</span>
            </div>

            {/* WhatsApp Phone Mockup Bubble */}
            <div className="p-4 rounded-xl bg-[#0b141a] border border-[#202c33] text-xs text-slate-200 font-sans whitespace-pre-line leading-relaxed shadow-inner">
              {whatsAppPreview}
            </div>

            {/* Email subject preview */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">
                Asunto del Correo Resend:
              </div>
              <div className="text-slate-200 font-medium">{emailPreview.subject}</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Para: {selectedClient?.email}</span>
            <span className="text-cyan-400 font-mono">Motor: Netlify Functions</span>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS LOG HISTORY TABLE */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Historial de Notificaciones y Envíos ({notificaciones.length})
            </h3>
          </div>
          <button
            onClick={() => onRefreshData()}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Actualizar</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Fecha & Hora</th>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Contenido / Asunto</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {notificaciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No se han registrado notificaciones todavía.
                  </td>
                </tr>
              ) : (
                notificaciones.map((notif) => (
                  <tr key={notif.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {notif.fecha_envio?.replace('T', ' ').slice(0, 16)}
                    </td>

                    <td className="py-2.5 px-3">
                      {notif.tipo === 'whatsapp' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                          <Send className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-cyan-400 font-mono text-[11px]">
                          <Mail className="w-3 h-3" />
                          <span>Resend Email</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-white">
                      {notif.cliente?.nombre || 'Cliente'}
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-md">
                      {notif.mensaje}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {notif.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
