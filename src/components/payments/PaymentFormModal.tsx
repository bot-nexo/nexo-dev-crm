import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, DollarSign, Calendar, Layers, User, Send } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Pago, Cliente, Proyecto, PagoEstado } from '../../types/database';
import { NotificationService } from '../../services/notificationService';

interface PaymentFormModalProps {
  initialPayment?: Pago | null;
  clientes: Cliente[];
  proyectos: Proyecto[];
  onClose: () => void;
  onSave: (pago: Partial<Pago> & { proyecto_id: string; cliente_id: string; monto: number }) => Promise<Pago>;
  onOpenReceipt?: (pago: Pago) => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  initialPayment,
  clientes,
  proyectos,
  onClose,
  onSave,
  onOpenReceipt,
}) => {
  const [proyectoId, setProyectoId] = useState(initialPayment?.proyecto_id || '');
  const [clienteId, setClienteId] = useState(initialPayment?.cliente_id || '');
  const [monto, setMonto] = useState(initialPayment ? String(initialPayment.monto) : '');
  const [fechaPago, setFechaPago] = useState(
    initialPayment?.fecha_pago || new Date().toISOString().split('T')[0]
  );
  const [periodoMes, setPeriodoMes] = useState(
    initialPayment?.periodo_mes || new Date().toISOString().slice(0, 7)
  );
  const [estado, setEstado] = useState<PagoEstado>(initialPayment?.estado || 'pendiente');
  const [comprobanteUrl, setComprobanteUrl] = useState(initialPayment?.comprobante_url || '');
  const [notas, setNotas] = useState(initialPayment?.notas || '');
  const [sendConfirmation, setSendConfirmation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-populate client and monthly fee when project changes
  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProjId = e.target.value;
    setProyectoId(selectedProjId);
    const proj = proyectos.find((p) => p.id === selectedProjId);
    if (proj) {
      setClienteId(proj.cliente_id);
      if (!monto || monto === '0') {
        setMonto(String(proj.valor_mensual));
      }
    }
  };

  useEffect(() => {
    if (!initialPayment && proyectos.length > 0 && !proyectoId) {
      const firstProj = proyectos[0];
      setProyectoId(firstProj.id);
      setClienteId(firstProj.cliente_id);
      setMonto(String(firstProj.valor_mensual));
    }
  }, [proyectos, initialPayment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!proyectoId) {
      setErrorMsg('Por favor selecciona un proyecto.');
      return;
    }
    if (!clienteId) {
      setErrorMsg('Por favor selecciona el cliente.');
      return;
    }
    const numMonto = parseFloat(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      setErrorMsg('Ingresa un monto válido mayor a 0.');
      return;
    }
    if (!periodoMes) {
      setErrorMsg('Ingresa el período mensual (ej: 2026-10).');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await onSave({
        id: initialPayment?.id,
        proyecto_id: proyectoId,
        cliente_id: clienteId,
        monto: numMonto,
        fecha_pago: fechaPago,
        periodo_mes: periodoMes,
        estado,
        comprobante_url: comprobanteUrl.trim() || null,
        notas: notas.trim() || null,
      });

      // If registered as 'pagado' launch pleasant confetti celebration!
      if (estado === 'pagado') {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#00f2fe', '#38bdf8', '#818cf8', '#34d399'],
          });
        } catch {}

        // If user left send confirmation checked, prompt WhatsApp or Email
        if (sendConfirmation) {
          const cli = clientes.find((c) => c.id === clienteId);
          const proj = proyectos.find((p) => p.id === proyectoId);
          if (cli) {
            const waText = NotificationService.getPaymentConfirmationWhatsApp({
              cliente: cli,
              proyecto: proj,
              pago: saved,
            });
            NotificationService.openWhatsAppChat(cli.telefono, waText);
          }
        }
      }

      if (onOpenReceipt && estado === 'pagado') {
        onOpenReceipt(saved);
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {initialPayment ? 'Editar Pago Registrado' : 'Registrar Nuevo Pago'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Proyecto Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Proyecto Asignado *</span>
            </label>
            <select
              value={proyectoId}
              onChange={handleProjectChange}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              required
            >
              <option value="">-- Selecciona el Proyecto --</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_proyecto} (${Number(p.valor_mensual).toLocaleString()} USD/mes)
                </option>
              ))}
            </select>
          </div>

          {/* Cliente Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cliente Facturado *</span>
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              required
            >
              <option value="">-- Selecciona el Cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.empresa})
                </option>
              ))}
            </select>
          </div>

          {/* Monto & Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monto (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="2500.00"
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado del Pago *
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as PagoEstado)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="pagado">🟢 Pagado / Acreditado</option>
                <option value="pendiente">🟡 Pendiente de Pago</option>
                <option value="vencido">🔴 Vencido / En Mora</option>
              </select>
            </div>
          </div>

          {/* Fecha Pago & Periodo Mes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fecha de Pago *</span>
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Período Mes (YYYY-MM) *
              </label>
              <input
                type="text"
                value={periodoMes}
                onChange={(e) => setPeriodoMes(e.target.value)}
                placeholder="2026-10"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                required
              />
            </div>
          </div>

          {/* URL Comprobante (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              URL Comprobante o Recibo Digital (Opcional)
            </label>
            <input
              type="url"
              value={comprobanteUrl}
              onChange={(e) => setComprobanteUrl(e.target.value)}
              placeholder="https://drive.google.com/... o enlace de transferencia"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notas y Método de Pago (Opcional)
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Transferencia Wise #10294, Stripe, Cripto o Banco Internacional..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition resize-none"
            />
          </div>

          {/* WhatsApp confirmation prompt checkbox */}
          {estado === 'pagado' && (
            <div className="flex items-center gap-2 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl">
              <input
                type="checkbox"
                id="sendConfirmCheck"
                checked={sendConfirmation}
                onChange={(e) => setSendConfirmation(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="sendConfirmCheck" className="text-xs text-cyan-200 cursor-pointer">
                Enviar mensaje automático de confirmación al cliente por WhatsApp al guardar
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : initialPayment ? 'Actualizar Pago' : 'Confirmar & Guardar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
