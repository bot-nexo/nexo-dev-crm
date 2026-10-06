import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Rocket,
  RefreshCw,
} from 'lucide-react';
import { Pago, PagoEstado, Cliente, Proyecto } from '../../types/database';
import { NotificationService } from '../../services/notificationService';
import { formatCOP, formatDateCO, formatPeriodCO } from '../../lib/formatters';

interface PaymentListProps {
  pagos: Pago[];
  clientes: Cliente[];
  proyectos: Proyecto[];
  onOpenCreate: () => void;
  onOpenEdit: (pago: Pago) => void;
  onOpenReceipt: (pago: Pago) => void;
  onDeletePago: (id: string) => Promise<void>;
  onUpdatePagoStatus: (pago: Pago, newEstado: PagoEstado) => Promise<void>;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  pagos,
  clientes,
  proyectos,
  onOpenCreate,
  onOpenEdit,
  onOpenReceipt,
  onDeletePago,
  onUpdatePagoStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | PagoEstado>('todos');
  const [filterPeriodo, setFilterPeriodo] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'cuota_mensual' | 'implementacion' | 'venta_directa_hito'>('todos');
  const [sortField, setSortField] = useState<'fecha_pago' | 'monto' | 'estado'>('fecha_pago');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Available unique periods
  const periods = useMemo(() => {
    const set = new Set(pagos.map((p) => p.periodo_mes));
    return Array.from(set).sort().reverse();
  }, [pagos]);

  // Totals for top cards
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalCobradoMes = pagos
    .filter((p) => p.periodo_mes === currentMonth && p.estado === 'pagado')
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const totalImplementacion = pagos
    .filter((p) => p.tipo_pago === 'implementacion' && p.estado === 'pagado')
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const totalVencido = pagos
    .filter((p) => p.estado === 'vencido')
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  // Filtering & Sorting
  const filteredPagos = useMemo(() => {
    return pagos
      .filter((p) => {
        const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
        const matchesPeriodo = filterPeriodo === 'todos' || p.periodo_mes === filterPeriodo;
        const matchesTipo = filterTipo === 'todos' || (p.tipo_pago || 'cuota_mensual') === filterTipo;
        const q = searchTerm.toLowerCase();
        const clientName = p.cliente?.nombre?.toLowerCase() || '';
        const clientCompany = p.cliente?.empresa?.toLowerCase() || '';
        const projName = p.proyecto?.nombre_proyecto?.toLowerCase() || '';
        const matchesSearch =
          clientName.includes(q) ||
          clientCompany.includes(q) ||
          projName.includes(q) ||
          p.periodo_mes.includes(q) ||
          (p.notas || '').toLowerCase().includes(q);
        return matchesEstado && matchesPeriodo && matchesTipo && matchesSearch;
      })
      .sort((a, b) => {
        if (sortField === 'monto') {
          return sortOrder === 'asc' ? a.monto - b.monto : b.monto - a.monto;
        }
        if (sortField === 'fecha_pago') {
          return sortOrder === 'asc'
            ? a.fecha_pago.localeCompare(b.fecha_pago)
            : b.fecha_pago.localeCompare(a.fecha_pago);
        }
        return sortOrder === 'asc'
          ? a.estado.localeCompare(b.estado)
          : b.estado.localeCompare(a.estado);
      });
  }, [pagos, searchTerm, filterEstado, filterPeriodo, filterTipo, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredPagos.length / pageSize) || 1;
  const paginatedPagos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPagos.slice(start, start + pageSize);
  }, [filteredPagos, currentPage, pageSize]);

  const handleSortToggle = (field: 'fecha_pago' | 'monto' | 'estado') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleNotifyWhatsApp = (pago: Pago) => {
    if (!pago.cliente) return;
    let text = '';
    if (pago.estado === 'pagado') {
      text = NotificationService.getPaymentConfirmationWhatsApp({
        cliente: pago.cliente,
        proyecto: pago.proyecto,
        pago,
      });
    } else if (pago.estado === 'vencido') {
      text = NotificationService.getOverdueWhatsApp({
        cliente: pago.cliente,
        proyecto: pago.proyecto,
        pago,
      });
    } else {
      text = NotificationService.getReminderWhatsApp({
        cliente: pago.cliente,
        proyecto: pago.proyecto,
        pago,
      });
    }
    NotificationService.openWhatsAppChat(pago.cliente.telefono, text);
  };

  return (
    <div className="space-y-4">
      {/* Financial metrics header cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Cobrado Este Mes ({formatPeriodCO(currentMonth)})</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            {formatCOP(totalCobradoMes)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block">Recaudación mensual</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Implementación (Total)</span>
            <Rocket className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
            {formatCOP(totalImplementacion)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-1 block">Puesta en marcha</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Saldo Vencido (Mora)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-rose-400 font-mono">
            {formatCOP(totalVencido)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-rose-300 mt-1 block">Cobro urgente</span>
        </div>
      </div>

      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>Gestión de Cobranza & Transacciones</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {filteredPagos.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Registro de abonos en Pesos Colombianos, comprobantes en PDF/PNG y mensajes de confirmación
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Pago</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar cliente, proyecto..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div>
          <select
            value={filterTipo}
            onChange={(e) => {
              setFilterTipo(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="cuota_mensual">🔄 Cuota Mensual MRR</option>
            <option value="implementacion">🚀 Implementación (Setup)</option>
            <option value="venta_directa_hito">💻 Venta Directa / Hito</option>
          </select>
        </div>

        <div>
          <select
            value={filterPeriodo}
            onChange={(e) => {
              setFilterPeriodo(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="todos">Todos los Períodos</option>
            {periods.map((per) => (
              <option key={per} value={per}>
                Período {formatPeriodCO(per)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="todos">Todos los Estados</option>
            <option value="pagado">🟢 Solo Pagados</option>
            <option value="pendiente">🟡 Solo Pendientes</option>
            <option value="vencido">🔴 Solo Vencidos (Mora)</option>
          </select>
        </div>
      </div>

      {/* MOBILE CARDS VIEW (visible on small screens < md) */}
      <div className="block md:hidden space-y-3">
        {paginatedPagos.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl">
            No se encontraron pagos con los filtros seleccionados.
          </div>
        ) : (
          paginatedPagos.map((pago) => (
            <div
              key={pago.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-white">
                    {pago.cliente?.nombre || 'Cliente General'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {pago.cliente?.empresa} • {pago.proyecto?.nombre_proyecto || 'Servicio'}
                  </div>
                </div>

                <select
                  value={pago.estado}
                  onChange={(e) => onUpdatePagoStatus(pago, e.target.value as PagoEstado)}
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full cursor-pointer border transition ${
                    pago.estado === 'pagado'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                      : pago.estado === 'vencido'
                      ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                      : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                  }`}
                >
                  <option value="pagado">PAGADO</option>
                  <option value="pendiente">PENDIENTE</option>
                  <option value="vencido">VENCIDO</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Fecha: {formatDateCO(pago.fecha_pago)}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Período: {formatPeriodCO(pago.periodo_mes)}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Monto a Cobrar:</span>
                  <span className="font-mono font-black text-sm text-cyan-400">
                    {formatCOP(pago.monto)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                <button
                  onClick={() => onOpenReceipt(pago)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ver Recibo</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleNotifyWhatsApp(pago)}
                    className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                    title="Aviso WhatsApp"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenEdit(pago)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Deseas eliminar este registro de pago?')) {
                        onDeletePago(pago.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW (visible on medium screens >= md) */}
      <div className="hidden md:block bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th
                  onClick={() => handleSortToggle('fecha_pago')}
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Fecha / Período</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4">Cliente & Empresa</th>
                <th className="py-3 px-4">Proyecto & Tipo</th>
                <th
                  onClick={() => handleSortToggle('monto')}
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Monto (COP)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('estado')}
                  className="py-3 px-4 text-center cursor-pointer hover:text-cyan-400 transition"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Estado</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Comprobante & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {paginatedPagos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron pagos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedPagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">{formatDateCO(pago.fecha_pago)}</div>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        Período: {formatPeriodCO(pago.periodo_mes)}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">
                        {pago.cliente?.nombre || 'Cliente General'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {pago.cliente?.empresa || 'Empresa'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-white font-medium flex items-center gap-2">
                        <span>{pago.proyecto?.nombre_proyecto || 'Servicio General'}</span>
                        {pago.tipo_pago === 'implementacion' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Rocket className="w-3 h-3" />
                            <span>Implementación</span>
                          </span>
                        ) : pago.tipo_pago === 'venta_directa_hito' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            <DollarSign className="w-3 h-3" />
                            <span>Venta Directa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            <RefreshCw className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Cuota Mensual</span>
                          </span>
                        )}
                      </div>
                      {pago.notas && (
                        <div className="text-[10px] text-slate-500 italic truncate max-w-[200px] mt-0.5">
                          {pago.notas}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-xs text-cyan-400">
                      {formatCOP(pago.monto)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <select
                          value={pago.estado}
                          onChange={(e) => onUpdatePagoStatus(pago, e.target.value as PagoEstado)}
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full cursor-pointer border transition ${
                            pago.estado === 'pagado'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                              : pago.estado === 'vencido'
                              ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                              : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          <option value="pagado">PAGADO</option>
                          <option value="pendiente">PENDIENTE</option>
                          <option value="vencido">VENCIDO</option>
                        </select>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenReceipt(pago)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700 transition cursor-pointer"
                          title="Ver o imprimir comprobante oficial"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Recibo</span>
                        </button>

                        <button
                          onClick={() => handleNotifyWhatsApp(pago)}
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition"
                          title="Enviar aviso/confirmación por WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenEdit(pago)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Editar pago"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('¿Deseas eliminar este registro de pago?')) {
                              onDeletePago(pago.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title="Eliminar pago"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Página <span className="font-semibold text-white">{currentPage}</span> de{' '}
            <span className="font-semibold text-white">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
