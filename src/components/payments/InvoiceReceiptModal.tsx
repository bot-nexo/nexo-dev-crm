import React, { useState } from 'react';
import { X, Printer, Send, Mail, CheckCircle2, Copy, Check, FileText, Download } from 'lucide-react';
import { Pago, Cliente, Proyecto } from '../../types/database';
import { NotificationService } from '../../services/notificationService';
import { PdfService } from '../../services/pdfService';
import { getStoredConfig } from '../../lib/supabase';

interface InvoiceReceiptModalProps {
  pago: Pago;
  cliente?: Cliente;
  proyecto?: Proyecto;
  onClose: () => void;
  onNotifySent?: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  pago,
  cliente,
  proyecto,
  onClose,
  onNotifySent,
}) => {
  const config = getStoredConfig();
  const [copied, setCopied] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const receiptNumber = `NX-${pago.periodo_mes?.replace('-', '') || '202610'}-${pago.id.slice(0, 4).toUpperCase()}`;

  const handleDownloadPdf = () => {
    try {
      PdfService.downloadReceiptPdf({ pago, cliente, proyecto });
      setActionMessage('¡Comprobante PDF oficial generado y descargado exitosamente!');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Error al generar el PDF: ${err.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const textToCopy = `Comprobante Nexo Dev Studio #${receiptNumber} - Cliente: ${cliente?.nombre || 'Cliente'} - Monto: $${Number(pago.monto).toLocaleString()} USD`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleSendWhatsApp = () => {
    if (!cliente) return;
    const text = NotificationService.getPaymentConfirmationWhatsApp({
      cliente,
      proyecto,
      pago,
    });
    NotificationService.openWhatsAppChat(cliente.telefono, text);
    setActionMessage('WhatsApp abierto para envío.');
    if (onNotifySent) onNotifySent();
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleSendEmail = async () => {
    if (!cliente) return;
    setIsSendingMail(true);
    const { subject, html } = NotificationService.getPaymentConfirmationEmailHTML({
      cliente,
      proyecto,
      pago,
    });

    const result = await NotificationService.dispatchEmail(cliente, subject, html, pago.id);
    setIsSendingMail(false);
    setActionMessage(result.message);
    if (onNotifySent) onNotifySent();
    setTimeout(() => setActionMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Action Bar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-white font-mono">
              Comprobante Oficial #{receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition cursor-pointer"
              title="Descargar comprobante oficial en archivo PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Imprimir vía navegador"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="bg-cyan-950/80 border-b border-cyan-500/40 px-6 py-2.5 text-xs text-cyan-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Printable Voucher Paper */}
        <div className="p-8 space-y-6 text-slate-200 bg-[#090d16]" id="printable-receipt">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black tracking-tight text-white font-mono">
                  NEXO<span className="text-cyan-400">DEV</span>STUDIO
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {pago.estado.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Soluciones de Software, Cloud & Aplicaciones Web Pro
              </p>
              <p className="text-xs text-slate-500 font-mono mt-1">
                billing@nexodevstudio.com • www.nexodevstudio.com
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs font-mono text-slate-400">Recibo de Cobranza</div>
              <div className="text-sm font-bold font-mono text-cyan-400">#{receiptNumber}</div>
              <div className="text-xs text-slate-400 mt-1">
                Fecha Emisión: <strong className="text-slate-200">{pago.fecha_pago}</strong>
              </div>
              <div className="text-xs text-slate-400">
                Período Facturado: <strong className="text-slate-200">{pago.periodo_mes}</strong>
              </div>
            </div>
          </div>

          {/* Client & Project Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Facturado a:
              </span>
              <div className="text-sm font-bold text-white mt-1">
                {cliente?.nombre || 'Cliente General'}
              </div>
              <div className="text-xs text-cyan-400">{cliente?.empresa || 'Empresa'}</div>
              <div className="text-xs text-slate-400 mt-0.5">{cliente?.email}</div>
              <div className="text-xs text-slate-400 font-mono">{cliente?.telefono}</div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Detalle del Proyecto:
              </span>
              <div className="text-sm font-bold text-white mt-1">
                {proyecto?.nombre_proyecto || 'Desarrollo de Software'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Día de abono mensual: <strong className="text-slate-200">Día {proyecto?.dia_cobro || 1}</strong>
              </div>
              <div className="text-xs text-slate-400">
                Estado del Proyecto:{' '}
                <span className="capitalize text-emerald-400">{proyecto?.estado || 'activo'}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono">
                <tr>
                  <th className="py-2.5 px-4">Descripción del Servicio</th>
                  <th className="py-2.5 px-4 text-center">Período</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">
                      Desarrollo, Mantenimiento & Infraestructura Cloud
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {proyecto?.nombre_proyecto || 'Suscripción de Desarrollo'} - Cuota mensual acordada
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{pago.periodo_mes}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                    ${Number(pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-cyan-500/30">
            <div>
              <span className="text-xs text-slate-400">Notas de la transacción:</span>
              <p className="text-xs text-slate-300 mt-0.5 italic">
                {pago.notas || 'Pago registrado mediante transferencia digital bancaria.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">TOTAL ABONADO</span>
              <span className="text-2xl font-black text-cyan-400 font-mono">
                ${Number(pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>

          {/* Footer certification */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
            <div>
              ID de Referencia: {pago.id}
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Transacción verificada por Nexo Dev Studio</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer (hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Resumen'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={handleSendEmail}
              disabled={isSendingMail}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isSendingMail ? 'Enviando...' : 'Enviar por Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
