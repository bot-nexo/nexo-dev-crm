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
  Calendar,
  Zap,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
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

  // Estados del Scheduler / Cron Diario
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronDryRun, setCronDryRun] = useState(true);
  const [cronForceDay, setCronForceDay] = useState<number>(new Date().getDate());
  const [cronResult, setCronResult] = useState<any | null>(null);
  const [showWebhookDetails, setShowWebhookDetails] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);


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

  // Handler para la ejecución del Cron Programado (Test o Producción)
  const handleExecuteCron = async () => {
    setIsCronRunning(true);
    setStatusFeedback(null);
    try {
      const result = await NotificationService.triggerCronBilling({
        dryRun: cronDryRun,
        forceDay: cronForceDay,
        clientes,
        proyectos,
        pagos,
      });
      setCronResult(result.summary);
      setStatusFeedback(result.message);
      await onRefreshData();
    } catch (e: any) {
      setStatusFeedback(`Error al ejecutar el cron: ${e.message}`);
    } finally {
      setIsCronRunning(false);
    }
  };

  const handleCopyWebhook = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nexo-dev-crm.netlify.app';
    const url = `${origin}/.netlify/functions/cron-billing`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
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
            disabled={isProcessing || isCronRunning}
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

      {/* SCHEDULER & CRON DIARIO DE COBRANZAS (P0 FEATURE) */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white">
                    Scheduler & Cron Diario de Cobranzas
                  </h3>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>09:00 AM UTC-5 Activo</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evalúa automáticamente proyectos con corte hoy, avisos preventivos a 3 días y cobros en mora para despachar recordatorios por Evolution API y Resend.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowWebhookDetails(!showWebhookDetails)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Ver Webhook Serverless</span>
              {showWebhookDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleExecuteCron}
              disabled={isCronRunning}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition shadow-lg cursor-pointer disabled:opacity-50 ${
                cronDryRun
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isCronRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Procesando Cron...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{cronDryRun ? 'Simular Cron Ahora (Dry Run)' : 'Ejecutar Cron Real'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cron Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">Modo de Ejecución:</div>
              <div className="text-[11px] text-slate-400">
                {cronDryRun ? 'Seguro: Sin envíos reales' : 'Activo: Envía WhatsApp/Email'}
              </div>
            </div>
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setCronDryRun(true)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  cronDryRun ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Simulación
              </button>
              <button
                type="button"
                onClick={() => setCronDryRun(false)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                  !cronDryRun ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Envíos Reales
              </button>
            </div>
          </div>

          {/* Test Day Selector */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">Día del Mes a Evaluar:</div>
              <div className="text-[11px] text-slate-400">Hoy es día {new Date().getDate()}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="31"
                value={cronForceDay}
                onChange={(e) => setCronForceDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                className="w-16 px-2.5 py-1 text-xs font-mono font-bold text-center text-cyan-300 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setCronForceDay(new Date().getDate())}
                className="text-[10px] text-slate-400 hover:text-cyan-400 underline cursor-pointer"
              >
                Hoy
              </button>
            </div>
          </div>

          {/* Schedule Engine Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">Disparador de Fondo:</div>
              <div className="text-[11px] text-slate-400">Netlify Scheduled Function</div>
            </div>
            <div className="font-mono text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              0 14 * * * (UTC)
            </div>
          </div>
        </div>

        {/* Webhook Endpoint Panel (Expandable) */}
        {showWebhookDetails && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-cyan-400">URL del Endpoint Serverless para Triggers Externos:</span>
              <button
                onClick={handleCopyWebhook}
                className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 cursor-pointer font-mono"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebhook ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/.netlify/functions/cron-billing` : '/.netlify/functions/cron-billing'}
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>Integración con cron-job.org o VPS:</strong> Puedes configurar una llamada HTTP POST diaria a esta URL. Si defines la variable de entorno <code className="text-cyan-400 font-mono">CRON_SECRET</code>, envía el header <code className="text-cyan-400 font-mono">x-cron-secret: tu_token</code> para protegerlo contra ejecuciones no autorizadas.
            </div>
          </div>
        )}

        {/* Cron Execution Results Card */}
        {cronResult && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Resultado de la Última Ejecución del Cron:</span>
                <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                  cronResult.dryRun ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {cronResult.dryRun ? 'Simulación (Dry Run)' : 'Ejecución Real'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {cronResult.timestamp?.replace('T', ' ').slice(0, 19)} (Día Evaluado: {cronResult.evaluatedDay})
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Proyectos Evaluados</div>
                <div className="text-base font-bold text-white font-mono">{cronResult.totalProyectosEvaluados}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Clientes a Notificar</div>
                <div className="text-base font-bold text-cyan-400 font-mono">{cronResult.totalClientesNotificados}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Corte Hoy</div>
                <div className="text-base font-bold text-amber-400 font-mono">{cronResult.recordatoriosHoy}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Preventivo (3 días)</div>
                <div className="text-base font-bold text-blue-400 font-mono">{cronResult.recordatoriosPreventivos}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Alertas Mora</div>
                <div className="text-base font-bold text-rose-400 font-mono">{cronResult.alertasMora}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">Envíos WhatsApp</div>
                <div className="text-base font-bold text-emerald-400 font-mono">{cronResult.mensajesWhatsApp}</div>
              </div>
            </div>

            {/* Details Table */}
            {cronResult.detalles && cronResult.detalles.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-2.5">Cliente</th>
                      <th className="py-1.5 px-2.5">Tipo de Notificación</th>
                      <th className="py-1.5 px-2.5">Canal</th>
                      <th className="py-1.5 px-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {cronResult.detalles.map((d: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="py-1.5 px-2.5 font-semibold text-white">{d.cliente}</td>
                        <td className="py-1.5 px-2.5 font-mono">
                          {d.tipo === 'corte_hoy' && <span className="text-amber-400">📅 Corte Hoy</span>}
                          {d.tipo === 'preventivo_3_dias' && <span className="text-blue-400">🔔 Preventivo (3 días)</span>}
                          {d.tipo === 'mora_vencida' && <span className="text-rose-400">⚠️ Saldo Vencido</span>}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-400">{d.canal}</td>
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            d.estado === 'enviado'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : d.estado === 'simulado'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {d.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
