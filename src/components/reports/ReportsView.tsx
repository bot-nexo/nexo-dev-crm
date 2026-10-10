import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Layers,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Building,
  FileSpreadsheet,
  HardDrive,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Cliente, Proyecto, Pago, Notificacion } from '../../types/database';
import { ExportService } from '../../services/exportService';

interface ReportsViewProps {
  clientes: Cliente[];
  proyectos: Proyecto[];
  pagos: Pago[];
  notificaciones?: Notificacion[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  clientes,
  proyectos,
  pagos,
  notificaciones = [],
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('todos');
  const [selectedPeriodRange, setSelectedPeriodRange] = useState<'all' | '2026' | 'q3' | 'q4'>('all');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setExportFeedback(msg);
    setTimeout(() => setExportFeedback(null), 4000);
  };

  // Export handlers
  const handleExportPagos = () => {
    ExportService.exportPagosToCSV(
      filteredPagos,
      selectedProjectId !== 'todos' ? 'filtrado' : 'completo'
    );
    showFeedback('¡Archivo CSV de Pagos y Cobranzas generado con codificación Excel UTF-8!');
  };

  const handleExportClientes = () => {
    ExportService.exportClientesToCSV(clientes, proyectos, pagos);
    showFeedback('¡Archivo CSV de Cartera de Clientes & MRR generado exitosamente!');
  };

  const handleExportConciliacion = () => {
    ExportService.exportConciliacionToCSV(pagos, proyectos);
    showFeedback('¡Informe de Conciliación Mensual exportado a CSV exitosamente!');
  };

  const handleExportBackup = () => {
    ExportService.exportBackupJSON(clientes, proyectos, pagos, notificaciones);
    showFeedback('¡Copia de seguridad completa del CRM en formato JSON generada con éxito!');
  };

  const handlePrintPDF = () => {
    window.print();
  };


  // Filtered payments based on project & date range
  const filteredPagos = useMemo(() => {
    return pagos.filter((p) => {
      const matchProj = selectedProjectId === 'todos' || p.proyecto_id === selectedProjectId;
      let matchRange = true;
      if (selectedPeriodRange === '2026') {
        matchRange = p.periodo_mes.startsWith('2026');
      } else if (selectedPeriodRange === 'q3') {
        matchRange = ['2026-07', '2026-08', '2026-09'].includes(p.periodo_mes);
      } else if (selectedPeriodRange === 'q4') {
        matchRange = ['2026-10', '2026-11', '2026-12'].includes(p.periodo_mes);
      }
      return matchProj && matchRange;
    });
  }, [pagos, selectedProjectId, selectedPeriodRange]);

  // Key metrics
  const totalFacturado = filteredPagos
    .filter((p) => p.estado === 'pagado')
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const totalPendiente = filteredPagos
    .filter((p) => p.estado === 'pendiente')
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const totalVencido = filteredPagos
    .filter((p) => p.estado === 'vencido')
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const complianceRate = filteredPagos.length > 0
    ? Math.round(
        (filteredPagos.filter((p) => p.estado === 'pagado').length / filteredPagos.length) * 100
      )
    : 100;

  // Monthly Revenue Data for Chart
  const revenueByPeriod = useMemo(() => {
    const map = new Map<string, { period: string; monto: number; pagos: number }>();
    filteredPagos
      .filter((p) => p.estado === 'pagado')
      .forEach((p) => {
        const per = p.periodo_mes;
        if (!map.has(per)) {
          map.set(per, { period: per, monto: 0, pagos: 0 });
        }
        const item = map.get(per)!;
        item.monto += Number(p.monto) || 0;
        item.pagos += 1;
      });
    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredPagos]);

  // Client billing leaderboard
  const topClients = useMemo(() => {
    const map = new Map<string, { cliente: Cliente; total: number; count: number }>();
    filteredPagos
      .filter((p) => p.estado === 'pagado' && p.cliente)
      .forEach((p) => {
        const cid = p.cliente_id;
        if (!map.has(cid)) {
          map.set(cid, { cliente: p.cliente!, total: 0, count: 0 });
        }
        const item = map.get(cid)!;
        item.total += Number(p.monto) || 0;
        item.count += 1;
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredPagos]);

  return (
    <div className="space-y-6">
      {/* Header and Export Hub */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Informes Financieros, Exportación & Auditoría</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Descarga reportes contables compatibles con Excel en formato CSV y respaldos completos del CRM.
            </p>
          </div>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Imprimir Vista</span>
          </button>
        </div>

        {/* Export Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          <button
            onClick={handleExportPagos}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer group text-left"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Cobranzas & Pagos
              </div>
              <div className="text-[10px] text-slate-400">CSV con importes y fechas</div>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
          </button>

          <button
            onClick={handleExportClientes}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 transition cursor-pointer group text-left"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-blue-300">
                Cartera & MRR
              </div>
              <div className="text-[10px] text-slate-400">CSV de clientes y contratos</div>
            </div>
            <Building className="w-4 h-4 text-blue-400 shrink-0" />
          </button>

          <button
            onClick={handleExportConciliacion}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer group text-left"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                Conciliación Mensual
              </div>
              <div className="text-[10px] text-slate-400">CSV de tasas de cobranza</div>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          </button>

          <button
            onClick={handleExportBackup}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer group text-left"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300">
                Respaldo Completo
              </div>
              <div className="text-[10px] text-slate-400">JSON con base de datos total</div>
            </div>
            <HardDrive className="w-4 h-4 text-purple-400 shrink-0" />
          </button>
        </div>

        {exportFeedback && (
          <div className="p-3 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-xs text-cyan-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
        )}
      </div>

      {/* Filter Bar (hidden on print) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 print:hidden">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filtrar por Proyecto:</span>
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="todos">Todos los Proyectos ({proyectos.length})</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre_proyecto}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rango de Períodos:</span>
          </label>
          <select
            value={selectedPeriodRange}
            onChange={(e) => setSelectedPeriodRange(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="all">Histórico Completo</option>
            <option value="2026">Año 2026</option>
            <option value="q4">Trimestre Actual (Q4 2026)</option>
            <option value="q3">Trimestre Anterior (Q3 2026)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Cobrado</span>
          <div className="text-xl font-bold font-mono text-emerald-400">
            ${totalFacturado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Liquidado con éxito</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Saldo Pendiente</span>
          <div className="text-xl font-bold font-mono text-amber-400">
            ${totalPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Dentro de fecha límite</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Monto en Mora</span>
          <div className="text-xl font-bold font-mono text-rose-400">
            ${totalVencido.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500">Atrasado de cobro</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Tasa de Cumplimiento</span>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {complianceRate}%
          </div>
          <span className="text-[10px] text-slate-500">Pagos al día vs mora</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly bar */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">Histórico de Ingresos Realizados</h3>
          <p className="text-xs text-slate-400 mb-4">Monto total liquidado mes a mes</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByPeriod} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="monto" name="Total Cobrado ($)" fill="#00f2fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clients by Revenue Leaderboard */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1">Top Clientes por Aportación</h3>
          <p className="text-xs text-slate-400 mb-4">Total histórico facturado por cliente</p>

          <div className="space-y-3">
            {topClients.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8">
                No hay datos en el rango seleccionado.
              </div>
            ) : (
              topClients.map((item, idx) => (
                <div
                  key={item.cliente.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-xs text-white">{item.cliente.nombre}</div>
                      <div className="text-[11px] text-slate-400">{item.cliente.empresa}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-cyan-400">
                      ${item.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD
                    </div>
                    <span className="text-[10px] text-slate-500">{item.count} pagos registrados</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
