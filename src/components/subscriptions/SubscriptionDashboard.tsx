import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Mail,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  Send,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import {
  SuscripcionStartup,
  SuscripcionCategoria,
  SuscripcionEstado,
  SuscripcionesSummary,
} from '../../types/database';
import { SubscriptionCard } from './SubscriptionCard';
import { SubscriptionFormModal } from './SubscriptionFormModal';
import { SubscriptionAlertModal } from './SubscriptionAlertModal';
import { DataService } from '../../services/dataService';
import {
  SubscriptionAlertService,
  calculateSubscriptionDueInfo,
  formatSubscriptionCost,
} from '../../services/subscriptionAlertService';
import { formatCOP } from '../../lib/formatters';
import { getStoredConfig } from '../../lib/supabase';

interface SubscriptionDashboardProps {
  suscripciones: SuscripcionStartup[];
  onRefreshData: () => Promise<void>;
}

export const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({
  suscripciones,
  onRefreshData,
}) => {
  const config = getStoredConfig();
  const exchangeRate = config.usdCopExchangeRate || 4200;

  // View state: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState<string>('all');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SuscripcionStartup | null>(null);
  const [alertModalSub, setAlertModalSub] = useState<SuscripcionStartup | null>(null);

  // Bulk alert sending state
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ success: boolean; message: string } | null>(null);

  // Financial summary computation
  const summary: SuscripcionesSummary = useMemo(() => {
    return DataService.calculateSuscripcionesSummary(suscripciones, exchangeRate);
  }, [suscripciones, exchangeRate]);

  // Extract unique emails for account filter
  const uniqueEmails = useMemo(() => {
    const set = new Set<string>();
    suscripciones.forEach((s) => {
      if (s.email_cuenta) set.add(s.email_cuenta.trim().toLowerCase());
    });
    return Array.from(set).sort();
  }, [suscripciones]);

  // Breakdown by email account
  const emailSpendBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalUSD: number; services: string[] }>();
    suscripciones.forEach((sub) => {
      const email = (sub.email_cuenta || 'Sin correo').toLowerCase();
      if (!map.has(email)) {
        map.set(email, { count: 0, totalUSD: 0, services: [] });
      }
      const item = map.get(email)!;
      item.count++;
      item.services.push(sub.nombre_servicio);
      
      let costInUSD = Number(sub.costo) || 0;
      if (sub.moneda === 'COP') costInUSD = costInUSD / exchangeRate;
      if (sub.moneda === 'EUR') costInUSD = costInUSD * 1.08;
      
      if (sub.ciclo_cobro === 'anual') costInUSD = costInUSD / 12;
      else if (sub.ciclo_cobro === 'trimestral') costInUSD = costInUSD / 3;

      if (sub.estado === 'activa' || sub.estado === 'por_renovar') {
        item.totalUSD += costInUSD;
      }
    });
    return Array.from(map.entries()).map(([email, data]) => ({
      email,
      ...data,
      totalUSD: Math.round(data.totalUSD * 100) / 100,
    }));
  }, [suscripciones, exchangeRate]);

  // Imminent bills in the next 3 days
  const imminentSubscriptions = useMemo(() => {
    return suscripciones.filter((s) => {
      if (s.estado !== 'activa' && s.estado !== 'en_prueba' && s.estado !== 'por_renovar') return false;
      const dueInfo = calculateSubscriptionDueInfo(s);
      return dueInfo.isToday || (dueInfo.daysRemaining >= 0 && dueInfo.daysRemaining <= 3);
    });
  }, [suscripciones]);

  // Filtered list
  const filteredSubscriptions = useMemo(() => {
    return suscripciones.filter((sub) => {
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = sub.nombre_servicio.toLowerCase().includes(query);
        const matchesProvider = sub.proveedor?.toLowerCase().includes(query);
        const matchesEmail = sub.email_cuenta.toLowerCase().includes(query);
        const matchesNotes = sub.notas?.toLowerCase().includes(query);
        if (!matchesName && !matchesProvider && !matchesEmail && !matchesNotes) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && sub.categoria !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && sub.estado !== selectedStatus) {
        return false;
      }

      // Email account filter
      if (selectedEmail !== 'all' && sub.email_cuenta.toLowerCase() !== selectedEmail) {
        return false;
      }

      return true;
    });
  }, [suscripciones, searchTerm, selectedCategory, selectedStatus, selectedEmail]);

  // CRUD Handlers
  const handleSaveSub = async (data: any) => {
    const saved = await DataService.saveSuscripcion(data);
    await onRefreshData();
    return saved;
  };

  const handleDeleteSub = async (id: string) => {
    await DataService.deleteSuscripcion(id);
    await onRefreshData();
  };

  // Bulk dispatch of alerts for upcoming bills
  const handleSendBulkAlerts = async () => {
    if (imminentSubscriptions.length === 0) return;
    setIsBulkSending(true);
    setBulkResult(null);

    let sentCount = 0;
    for (const sub of imminentSubscriptions) {
      await SubscriptionAlertService.dispatchSubscriptionAlertEmail(sub);
      sentCount++;
    }

    setIsBulkSending(false);
    setBulkResult({
      success: true,
      message: `¡Se despacharon con éxito ${sentCount} alertas de cobro inminente a tu correo!`,
    });
    await onRefreshData();
    setTimeout(() => setBulkResult(null), 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Main Banner & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Panel de Suscripciones & Herramientas SaaS
              </h1>
              <p className="text-xs text-slate-300">
                Control de costos tecnológicos, cuentas asociadas, fechas de cobro y alertas a tu correo
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setEditingSub(null);
              setFormModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Suscripción</span>
          </button>
        </div>
      </div>

      {/* Imminent Billing Alert Banner */}
      {imminentSubscriptions.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-rose-950/50 to-amber-950/70 border border-amber-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200">
                ¡Atención! {imminentSubscriptions.length} suscripción{imminentSubscriptions.length > 1 ? 'es tienen' : ' tiene'} cobro en las próximas 72 horas
              </h4>
              <p className="text-xs text-amber-300/80">
                {imminentSubscriptions.map((s) => s.nombre_servicio).join(', ')}. Verifica tus fondos o cancela si no la necesitas.
              </p>
            </div>
          </div>

          <button
            onClick={handleSendBulkAlerts}
            disabled={isBulkSending}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {isBulkSending ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Enviar Alertas a mi Correo</span>
          </button>
        </div>
      )}

      {bulkResult && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{bulkResult.message}</span>
        </div>
      )}

      {/* Financial KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gasto Mensual */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gasto Mensual Estimado
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            ${summary.totalGastoMensualUSD} <span className="text-xs font-normal text-slate-400">USD/mes</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            ≈ {formatCOP(summary.totalGastoMensualCOP)} COP
          </div>
        </div>

        {/* KPI 2: Gasto Anualizado */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gasto Anual Proyectado
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-300 font-mono">
            ${summary.totalGastoAnualUSD} <span className="text-xs font-normal text-slate-400">USD/año</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            ≈ {formatCOP(summary.totalGastoAnualCOP)} COP
          </div>
        </div>

        {/* KPI 3: Suscripciones Activas & Trials */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Herramientas Activas
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {summary.suscripcionesActivasCount} <span className="text-xs font-normal text-slate-400">activas</span>
          </div>
          <div className="text-xs text-amber-400 mt-1 flex items-center gap-1 font-medium">
            <span>🎁 {summary.suscripcionesTrialCount} en período de prueba (Trial)</span>
          </div>
        </div>

        {/* KPI 4: Próximos Pagos en 7 días */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cobros en Próximos 7 Días
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {summary.suscripcionesPorPagarProximasCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            En {summary.cuentasEmailsUnicasCount} cuentas de correo registradas
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por servicio (ej. OpenAI, GitHub, AWS, Google)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              <option value="ia_apis">🤖 IA & APIs</option>
              <option value="infraestructura_cloud">☁️ Cloud & Hosting</option>
              <option value="herramientas_dev">🛠️ Dev Tools</option>
              <option value="productividad_email">📬 Email & Suite</option>
              <option value="diseno_frontend">🎨 Diseño & UI</option>
              <option value="marketing_dominios">🌐 Dominios & Mkt</option>
              <option value="seguridad_vpn">🛡️ Seguridad & VPN</option>
              <option value="otros">📦 Otros</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Todos los Estados</option>
              <option value="activa">🟢 Activas</option>
              <option value="en_prueba">🎁 En Prueba (Trial)</option>
              <option value="por_renovar">🟡 Por Renovar</option>
              <option value="pausada">⏸️ Pausadas</option>
              <option value="cancelada">🔴 Canceladas</option>
            </select>
          </div>

          {/* Email Account Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">Todas las Cuentas / Emails</option>
              {uniqueEmails.map((email) => (
                <option key={email} value={email}>
                  📧 {email}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Tabla Detallada"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions Content: Grid or Table */}
      {filteredSubscriptions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <CreditCard className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No se encontraron suscripciones</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedEmail !== 'all'
              ? 'Prueba ajustando los filtros de búsqueda o categoría.'
              : 'Empieza registrando las herramientas de tu startup para no olvidar ninguna fecha de cobro.'}
          </p>
          <button
            onClick={() => {
              setEditingSub(null);
              setFormModalOpen(true);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
          >
            Registrar Primera Suscripción
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={(s) => {
                setEditingSub(s);
                setFormModalOpen(true);
              }}
              onDelete={handleDeleteSub}
              onOpenAlert={(s) => setAlertModalSub(s)}
            />
          ))}
        </div>
      ) : (
        /* Detailed Financial Table View */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Servicio / Herramienta</th>
                  <th className="p-4">Cuenta (Email)</th>
                  <th className="p-4">Costo</th>
                  <th className="p-4">Ciclo</th>
                  <th className="p-4">Próximo Cobro</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubscriptions.map((sub) => {
                  const dueInfo = calculateSubscriptionDueInfo(sub);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="font-bold text-white">{sub.nombre_servicio}</div>
                        <div className="text-[11px] text-slate-400">{sub.proveedor}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                          {sub.email_cuenta}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-cyan-300 font-mono">
                        {formatSubscriptionCost(sub.costo, sub.moneda)}
                      </td>
                      <td className="p-4 capitalize text-slate-400">{sub.ciclo_cobro}</td>
                      <td className="p-4">
                        <div className="font-mono text-slate-200">{sub.proxima_fecha_pago}</div>
                        <div className={`text-[10px] font-semibold ${dueInfo.isToday ? 'text-rose-400' : 'text-amber-400'}`}>
                          {dueInfo.statusLabel}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            sub.estado === 'activa'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                              : sub.estado === 'en_prueba'
                              ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {sub.estado}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setAlertModalSub(sub)}
                            title="Enviar alerta al correo"
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          {sub.url_panel_gestion && (
                            <a
                              href={sub.url_panel_gestion}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                              title="Panel proveedor"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setEditingSub(sub);
                              setFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                            title="Editar"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Account / Email Audit Breakdown Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              Auditoría de Suscripciones por Cuenta de Correo
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {emailSpendBreakdown.length} cuentas corporativas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emailSpendBreakdown.map((item) => (
            <div
              key={item.email}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 hover:border-purple-500/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-300 truncate">
                  {item.email}
                </span>
                <span className="text-xs font-bold text-cyan-300 font-mono">
                  ${item.totalUSD} USD/mes
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {item.count} herramienta{item.count > 1 ? 's' : ''}: {item.services.slice(0, 3).join(', ')}
                {item.services.length > 3 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Subscription Modal */}
      {formModalOpen && (
        <SubscriptionFormModal
          initialSub={editingSub}
          onClose={() => {
            setFormModalOpen(false);
            setEditingSub(null);
          }}
          onSave={handleSaveSub}
        />
      )}

      {/* Alert Preview & Sending Modal */}
      {alertModalSub && (
        <SubscriptionAlertModal
          subscription={alertModalSub}
          onClose={() => setAlertModalSub(null)}
          onAlertSent={onRefreshData}
        />
      )}
    </div>
  );
};
