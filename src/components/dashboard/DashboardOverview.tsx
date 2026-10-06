import React from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  FolderKanban,
  Send,
  Mail,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Layers,
  Database,
  RefreshCw,
  Gift,
  Rocket,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Cliente, Proyecto, Pago, FinancialSummary } from '../../types/database';
import { NotificationService } from '../../services/notificationService';
import { formatCOP, formatDateCO, formatPeriodCO, getTrialInfo } from '../../lib/formatters';

interface DashboardOverviewProps {
  summary: FinancialSummary;
  clientes: Cliente[];
  proyectos: Proyecto[];
  pagos: Pago[];
  onOpenNewPayment: () => void;
  onOpenNewClient: () => void;
  onOpenReceipt: (pago: Pago) => void;
  onRefreshData?: () => Promise<void>;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  summary,
  clientes,
  proyectos,
  pagos,
  onOpenNewPayment,
  onOpenNewClient,
  onOpenReceipt,
  onRefreshData,
}) => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentDay = new Date().getDate();

  // 1. Detect OVERDUE payments (Urgent Mora)
  const overduePayments = pagos.filter((p) => p.estado === 'vencido');

  // 2. Detect UPCOMING billings in next 3 days
  const upcomingBillingProjects = proyectos.filter((p) => {
    if (p.estado !== 'activo') return false;
    const diff = p.dia_cobro - currentDay;
    return diff >= 0 && diff <= 3;
  });

  // Chart data: Monthly comparison (Last 5 periods)
  const chartMonthlyData = React.useMemo(() => {
    const periodMap = new Map<string, { period: string; periodLabel: string; cobrado: number; pendiente: number }>();
    pagos.forEach((p) => {
      const per = p.periodo_mes || currentPeriod;
      if (!periodMap.has(per)) {
        periodMap.set(per, {
          period: per,
          periodLabel: formatPeriodCO(per),
          cobrado: 0,
          pendiente: 0,
        });
      }
      const item = periodMap.get(per)!;
      if (p.estado === 'pagado') {
        item.cobrado += Number(p.monto) || 0;
      } else {
        item.pendiente += Number(p.monto) || 0;
      }
    });

    const list = Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));
    return list.slice(-5);
  }, [pagos, currentPeriod]);

  // Chart data: Status distribution
  const statusPieData = [
    { name: 'Pagado', value: summary.pagosCobradosCount, color: '#10b981' },
    { name: 'Pendiente', value: summary.pagosPendientesCount, color: '#f59e0b' },
    { name: 'Vencido', value: summary.pagosVencidosCount, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  const handleSendOverdueWhatsApp = (pago: Pago) => {
    if (!pago.cliente) return;
    const text = NotificationService.getOverdueWhatsApp({
      cliente: pago.cliente,
      proyecto: pago.proyecto,
      pago,
    });
    NotificationService.openWhatsAppChat(pago.cliente.telefono, text);
  };

  const handleSendReminderWhatsApp = (proj: Proyecto) => {
    if (!proj.cliente) return;
    const text = NotificationService.getReminderWhatsApp({
      cliente: proj.cliente,
      proyecto: proj,
    });
    NotificationService.openWhatsAppChat(proj.cliente.telefono, text);
  };

  const handleManualRefresh = async () => {
    if (onRefreshData) {
      setIsRefreshing(true);
      await onRefreshData();
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Database connection banner & refresh control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Database className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Dashboard Financiero (BD SQL Nexo CRM)
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                BD Conectada
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pesos Colombianos (COP) • {clientes.length} clientes • {proyectos.length} proyectos ({summary.proyectosEnPruebaCount} en prueba) • {pagos.length} facturas
            </p>
          </div>
        </div>

        {onRefreshData && (
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refrescar BD</span>
          </button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Ingresos del Mes */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Ingresos del Mes</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg lg:text-xl font-black text-white font-mono tracking-tight">
            {formatCOP(summary.totalIngresosMes)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Período {formatPeriodCO(currentPeriod)}</span>
          </div>
        </div>

        {/* Proyección del Mes (MRR) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">MRR Recurrente</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg lg:text-xl font-black text-cyan-400 font-mono tracking-tight">
            {formatCOP(summary.proyeccionMensualMRR)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {summary.proyectosActivosCount} proyectos activos
          </div>
        </div>

        {/* Pruebas Gratis */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Proyectos en Prueba</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg lg:text-xl font-black text-purple-300 font-mono tracking-tight flex items-center gap-2">
            <span>{summary.proyectosEnPruebaCount}</span>
            {summary.pruebasVencidasCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {summary.pruebasVencidasCount} vencidos
              </span>
            )}
          </div>
          <div className="text-[10px] text-purple-400/80 mt-1">
            Pruebas gratis 7/14 días
          </div>
        </div>

        {/* Implementación Recaudada */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Implementación Única</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Rocket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg lg:text-xl font-black text-amber-300 font-mono tracking-tight">
            {formatCOP(summary.totalIngresosImplementacion)}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">
            Ingreso de setup a producción
          </div>
        </div>

        {/* Pagos Vencidos (Mora) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Mora / Vencidos</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg lg:text-xl font-black text-rose-400 font-mono tracking-tight">
            {formatCOP(summary.totalVencido)}
          </div>
          <div className="text-[10px] text-rose-300 mt-1 font-semibold">
            {summary.pagosVencidosCount} facturas en mora
          </div>
        </div>
      </div>

      {/* PRIORITY ALERTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerta 1: Pruebas Vencidas (Conversión Urgente) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/40 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Pruebas Gratis ({summary.proyectosEnPruebaCount})</h3>
            </div>
            {summary.pruebasVencidasCount > 0 ? (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                {summary.pruebasVencidasCount} Vencidos
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                Al Día
              </span>
            )}
          </div>

          {summary.proyectosEnPruebaCount === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400">
              No hay proyectos en período de prueba actualmente.
            </div>
          ) : (
            <div className="space-y-2.5">
              {proyectos
                .filter((p) => p.estado === 'en_prueba')
                .map((p) => {
                  const info = getTrialInfo(p);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border transition ${
                        info.isExpired
                          ? 'border-rose-500/40 bg-rose-950/20'
                          : 'border-purple-500/30'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-white">
                          {p.nombre_proyecto}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.cliente?.nombre} ({p.cliente?.empresa})
                        </div>
                        <div
                          className={`text-xs font-semibold mt-0.5 ${
                            info.isExpired ? 'text-rose-400' : 'text-purple-300'
                          }`}
                        >
                          {info.formattedStatus}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-cyan-400 block mb-1">
                          {formatCOP(p.valor_mensual)}/mes
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Cobro Setup: {formatCOP(p.valor_implementacion || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Alerta 2: Clientes en Mora */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-rose-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Pagos en Mora ({overduePayments.length})</h3>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
              Urgente
            </span>
          </div>

          {overduePayments.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400">
              🎉 ¡Excelente! No hay clientes con pagos vencidos en este momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {overduePayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-rose-950 hover:border-rose-500/40 transition"
                >
                  <div>
                    <div className="font-bold text-xs text-white">
                      {p.cliente?.nombre || 'Cliente'} • {p.cliente?.empresa}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {p.proyecto?.nombre_proyecto} • Período {formatPeriodCO(p.periodo_mes)}
                    </div>
                    <div className="text-xs font-mono font-bold text-rose-400 mt-0.5">
                      {formatCOP(p.monto)} adeudados
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendOverdueWhatsApp(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
                    title="Enviar reclamo amigable por WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Aviso WA</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerta 3: Próximos a Vencer (&lt; 3 días) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Próximos Cobros (&lt; 3 días) ({upcomingBillingProjects.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
              Preventivo
            </span>
          </div>

          {upcomingBillingProjects.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400">
              No hay vencimientos programados en los próximos 3 días.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingBillingProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition"
                >
                  <div>
                    <div className="font-bold text-xs text-white">
                      {proj.cliente?.nombre || 'Cliente'} • {proj.cliente?.empresa}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {proj.nombre_proyecto} • Cobro día {proj.dia_cobro}
                    </div>
                    <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
                      {formatCOP(proj.valor_mensual)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendReminderWhatsApp(proj)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recordar</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart: Recurrent revenue evolution */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Evolución de Cobros por Período</h3>
              <p className="text-xs text-slate-400">Comparativa de ingresos cobrados vs pendientes en Pesos Colombianos</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Pesos Colombianos (COP)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="periodLabel" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#090d16',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [formatCOP(value), '']}
                />
                <Bar dataKey="cobrado" name="Cobrado (COP)" fill="#00f2fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendiente" name="Pendiente (COP)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart: Status distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Distribución de Facturas</h3>
            <p className="text-xs text-slate-400">Estado general de pagos registrados en BD</p>
          </div>

          <div className="h-48 w-full my-auto flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">Sin datos registrados en BD</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-[11px]">
            <div>
              <span className="text-emerald-400 font-bold block">{summary.pagosCobradosCount}</span>
              <span className="text-slate-400">Pagados</span>
            </div>
            <div>
              <span className="text-amber-400 font-bold block">{summary.pagosPendientesCount}</span>
              <span className="text-slate-400">Pendientes</span>
            </div>
            <div>
              <span className="text-rose-400 font-bold block">{summary.pagosVencidosCount}</span>
              <span className="text-slate-400">Vencidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT MOVEMENTS TABLE */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Últimos Movimientos de Facturación (BD)</h3>
          </div>
          <button
            onClick={onOpenNewPayment}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
          >
            + Registrar Pago
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-mono">
              <tr>
                <th className="py-2.5 px-3">Cliente / Empresa</th>
                <th className="py-2.5 px-3">Proyecto</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Monto (COP)</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No hay movimientos registrados en la base de datos.
                  </td>
                </tr>
              ) : (
                pagos.slice(0, 5).map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {pago.cliente?.nombre || 'Cliente'}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {pago.cliente?.empresa}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span>{pago.proyecto?.nombre_proyecto || 'General'}</span>
                      {pago.tipo_pago === 'implementacion' && (
                        <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Setup
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{formatDateCO(pago.fecha_pago)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                      {formatCOP(pago.monto)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          pago.estado === 'pagado'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : pago.estado === 'vencido'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {pago.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onOpenReceipt(pago)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                      >
                        Ver
                      </button>
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
