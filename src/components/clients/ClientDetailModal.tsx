import React from 'react';
import {
  X,
  Building,
  Mail,
  Phone,
  Calendar,
  Send,
  ExternalLink,
  PlusCircle,
  CreditCard,
  FolderKanban,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Cliente, Proyecto, Pago } from '../../types/database';
import { NotificationService } from '../../services/notificationService';

interface ClientDetailModalProps {
  cliente: Cliente;
  proyectos: Proyecto[];
  pagos: Pago[];
  onClose: () => void;
  onEditClient: (cliente: Cliente) => void;
  onNewPaymentForClient: (cliente: Cliente) => void;
  onNewProjectForClient: (cliente: Cliente) => void;
  onOpenReceipt: (pago: Pago) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  cliente,
  proyectos,
  pagos,
  onClose,
  onEditClient,
  onNewPaymentForClient,
  onNewProjectForClient,
  onOpenReceipt,
}) => {
  const clientProjects = proyectos.filter((p) => p.cliente_id === cliente.id);
  const clientPayments = pagos.filter((p) => p.cliente_id === cliente.id);

  const totalAbonado = clientPayments
    .filter((p) => p.estado === 'pagado')
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const totalPendiente = clientPayments
    .filter((p) => p.estado !== 'pagado')
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const mrrActual = clientProjects
    .filter((p) => p.estado === 'activo')
    .reduce((sum, p) => sum + (Number(p.valor_mensual) || 0), 0);

  const handleOpenDirectWhatsApp = () => {
    const text = `¡Hola ${cliente.nombre.split(' ')[0]}! Te saludamos desde Nexo Dev Studio. ¿Cómo estás?`;
    NotificationService.openWhatsAppChat(cliente.telefono, text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header with client summary */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-lg">
              {cliente.nombre.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{cliente.nombre}</h2>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    cliente.estado === 'activo'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {cliente.estado}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-cyan-400 mt-0.5">
                <Building className="w-3.5 h-3.5" />
                <span>{cliente.empresa}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDirectWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Chatear por WhatsApp</span>
            </button>
            <button
              onClick={() => onEditClient(cliente)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Editar
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contact details & Metrics bar */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Correo Electrónico</span>
            <span className="font-mono text-slate-200 truncate block">{cliente.email}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">WhatsApp</span>
            <span className="font-mono text-cyan-400 block">{cliente.telefono}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">MRR Activo</span>
            <span className="font-mono font-bold text-emerald-400 block">
              ${mrrActual.toLocaleString()} USD/mes
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Histórico Pagado</span>
            <span className="font-mono font-bold text-cyan-400 block">
              ${totalAbonado.toLocaleString()} USD
            </span>
          </div>
        </div>

        {/* Tab content: Projects & Payments */}
        <div className="p-6 space-y-6">
          {/* Section: Active Projects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Proyectos Asignados ({clientProjects.length})
                </h4>
              </div>
              <button
                onClick={() => onNewProjectForClient(cliente)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Agregar Proyecto</span>
              </button>
            </div>

            {clientProjects.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400">
                Este cliente aún no tiene proyectos vinculados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clientProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-white">{p.nombre_proyecto}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                          p.estado === 'activo'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {p.estado}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Día de cobro: <strong className="text-slate-200">Día {p.dia_cobro}</strong>
                      </span>
                      <span className="font-mono font-bold text-cyan-400">
                        ${Number(p.valor_mensual).toLocaleString()} USD/m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Payments History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Historial de Pagos & Cobranza ({clientPayments.length})
                </h4>
              </div>
              <button
                onClick={() => onNewPaymentForClient(cliente)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar Pago</span>
              </button>
            </div>

            {clientPayments.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-xs text-slate-400">
                No hay registros de pagos para este cliente todavía.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Período</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Monto</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Comprobante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {clientPayments.map((pago) => (
                      <tr key={pago.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-mono font-semibold text-white">
                          {pago.periodo_mes}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{pago.fecha_pago}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                          ${Number(pago.monto).toLocaleString()} USD
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pago.estado === 'pagado'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : pago.estado === 'vencido'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {pago.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onOpenReceipt(pago)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700 transition cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-cyan-400" />
                            <span>Ver Recibo</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
