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
  Mail,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Download,
} from 'lucide-react';
import { Pago, PagoEstado, Cliente, Proyecto } from '../../types/database';
import { NotificationService } from '../../services/notificationService';
import { PdfService } from '../../services/pdfService';
import { ExportService } from '../../services/exportService';

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

  const totalPendienteMes = pagos
    .filter((p) => p.periodo_mes === currentMonth && p.estado === 'pendiente')
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
        return matchesEstado && matchesPeriodo && matchesSearch;
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
  }, [pagos, searchTerm, filterEstado, filterPeriodo, sortField, sortOrder]);

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Cobrado Este Mes ({currentMonth})</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${totalCobradoMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ingresos ya ingresados</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pendiente Por Cobrar</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ${totalPendienteMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Abonos activos en plazo</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Saldo Vencido (Mora)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            ${totalVencido.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-rose-300 mt-1 block">Requiere aviso de cobro urgente</span>
        </div>
      </div>

      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <span>Gestión de Cobranza & Facturas</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {filteredPagos.length} transacciones
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Registro de abonos, comprobantes oficiales y disparadores automáticos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => ExportService.exportPagosToCSV(filteredPagos, 'listado')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Exportar pagos visibles a CSV para Excel"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nuevo Pago</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por cliente, proyecto o notas..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Period Filter */}
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
                Período {per}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter */}
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

        {/* Page size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0">Items:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full px-2 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value={10}>10 por pág.</option>
            <option value={25}>25 por pág.</option>
            <option value={50}>50 por pág.</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
                <th className="py-3 px-4">Proyecto</th>
                <th
                  onClick={() => handleSortToggle('monto')}
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Monto (USD)</span>
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
                      <div className="font-mono font-bold text-white">{pago.fecha_pago}</div>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        Período: {pago.periodo_mes}
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
                      <div className="text-white font-medium">
                        {pago.proyecto?.nombre_proyecto || 'Servicio General'}
                      </div>
                      {pago.notas && (
                        <div className="text-[10px] text-slate-500 italic truncate max-w-[200px]">
                          {pago.notas}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-sm text-cyan-400">
                      ${Number(pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
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
                          onClick={() => PdfService.downloadReceiptPdf({ pago, cliente: pago.cliente, proyecto: pago.proyecto })}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                          title="Descargar comprobante en PDF oficial"
                        >
                          <Download className="w-3.5 h-3.5 text-cyan-400" />
                          <span>PDF</span>
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
