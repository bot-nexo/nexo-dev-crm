import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  DollarSign,
  Calendar,
  Building,
  Edit2,
  Trash2,
  CreditCard,
  Send,
  Clock,
  Gift,
  Rocket,
  Zap,
  AlertTriangle,
  CheckCircle,
  Globe,
  Wrench,
  Code,
  Tag,
} from 'lucide-react';
import { Proyecto, Cliente, ProyectoEstado } from '../../types/database';
import { NotificationService } from '../../services/notificationService';
import { formatCOP, formatDateCO, getTrialInfo } from '../../lib/formatters';
import { ProjectResourcesModal } from './ProjectResourcesModal';

interface ProjectListProps {
  proyectos: Proyecto[];
  clientes: Cliente[];
  onOpenCreate: () => void;
  onOpenEdit: (proyecto: Proyecto) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onNewPaymentForProject: (proyecto: Proyecto) => void;
  onSaveProjectResources?: (proyectoUpdated: Proyecto) => Promise<void>;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  proyectos,
  clientes,
  onOpenCreate,
  onOpenEdit,
  onDeleteProject,
  onNewPaymentForProject,
  onSaveProjectResources,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | ProyectoEstado>('todos');
  const [selectedResourcesProject, setSelectedResourcesProject] = useState<Proyecto | null>(null);

  // Compute metrics
  const activeProjects = proyectos.filter((p) => p.estado === 'activo');
  const devProjects = proyectos.filter((p) => p.estado === 'en_desarrollo');
  const trialProjects = proyectos.filter((p) => p.estado === 'en_prueba');
  
  const expiredTrialsCount = trialProjects.filter((p) => {
    const info = getTrialInfo(p);
    return info.isExpired;
  }).length;

  const totalMRR = activeProjects
    .filter((p) => (p.modelo_cobro || 'mensual_alquiler') === 'mensual_alquiler')
    .reduce((sum, p) => sum + (Number(p.valor_mensual) || 0), 0);

  // Filter & Search
  const filteredProyectos = useMemo(() => {
    return proyectos.filter((p) => {
      const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
      const q = searchTerm.toLowerCase();
      const clientName = p.cliente?.nombre?.toLowerCase() || '';
      const clientCompany = p.cliente?.empresa?.toLowerCase() || '';
      const matchesSearch =
        p.nombre_proyecto.toLowerCase().includes(q) ||
        clientName.includes(q) ||
        clientCompany.includes(q);
      return matchesEstado && matchesSearch;
    });
  }, [proyectos, searchTerm, filterEstado]);

  const handleSendReminder = (proyecto: Proyecto) => {
    if (!proyecto.cliente) return;
    const text = NotificationService.getReminderWhatsApp({
      cliente: proyecto.cliente,
      proyecto,
    });
    NotificationService.openWhatsAppChat(proyecto.cliente.telefono, text);
  };

  return (
    <div className="space-y-4">
      {/* Metric summary top cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1">
            <span>MRR Recurrente</span>
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          </div>
          <div className="text-base sm:text-xl font-black text-white font-mono">
            {formatCOP(totalMRR)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-cyan-400 mt-1 block truncate">
            {activeProjects.length} activos
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1">
            <span>En Desarrollo</span>
            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          </div>
          <div className="text-base sm:text-xl font-black text-indigo-300 font-mono">
            {devProjects.length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-indigo-400/80 mt-1 block truncate">
            En construcción
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1">
            <span>Pruebas Gratis</span>
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
          </div>
          <div className="text-base sm:text-xl font-black text-purple-300 font-mono flex items-center gap-1.5">
            <span>{trialProjects.length}</span>
            {expiredTrialsCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {expiredTrialsCount} vencidas
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] text-purple-400/80 mt-1 block truncate">
            7/14 días
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 mb-1">
            <span>Proyectos</span>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <div className="text-base sm:text-xl font-black text-white font-mono">
            {proyectos.length}
          </div>
          <span className="text-[10px] sm:text-[11px] text-emerald-400/80 mt-1 block truncate">
            {activeProjects.length} activos
          </span>
        </div>
      </div>

      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>Gestión de Proyectos & Recursos</span>
          </h2>
          <p className="text-xs text-slate-400">
            Alquileres mensuales, Venta directa, Pruebas gratis y Credenciales (GitHub, Dominio, Mapbox)
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre de proyecto o empresa cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as any)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="todos">Todos los Estados</option>
            <option value="activo">🟢 Solo Activos</option>
            <option value="en_desarrollo">🛠️ Solo En Desarrollo</option>
            <option value="en_prueba">🟣 Solo En Prueba (Trial)</option>
            <option value="pausado">🟡 Solo Pausados</option>
            <option value="finalizado">⚪ Solo Finalizados</option>
          </select>
        </div>
      </div>

      {/* MOBILE CARDS VIEW (visible on small screens < md) */}
      <div className="block md:hidden space-y-3">
        {filteredProyectos.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-2xl">
            No se encontraron proyectos según el criterio especificado.
          </div>
        ) : (
          filteredProyectos.map((proyecto) => {
            const trialInfo = getTrialInfo(proyecto);
            const recursosCount = proyecto.recursos_tecnicos?.length || 0;

            return (
              <div
                key={proyecto.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-white">{proyecto.nombre_proyecto}</h3>
                    <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1 mt-0.5">
                      <Building className="w-3 h-3" />
                      <span>{proyecto.cliente?.empresa || 'Empresa'} ({proyecto.cliente?.nombre})</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {proyecto.estado === 'en_prueba' ? (
                      trialInfo.isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Prueba Vencida</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          <Gift className="w-3 h-3 text-purple-400" />
                          <span>Prueba ({trialInfo.daysRemaining}d)</span>
                        </span>
                      )
                    ) : (
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          proyecto.estado === 'activo'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : proyecto.estado === 'en_desarrollo'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : proyecto.estado === 'pausado'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {proyecto.estado === 'en_desarrollo' ? '🛠️ En Desarrollo' : proyecto.estado}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Modelo de Cobro:</span>
                    {proyecto.modelo_cobro === 'venta_directa' ? (
                      <div className="font-mono font-bold text-indigo-300 text-xs mt-0.5">
                        {formatCOP(proyecto.valor_total_venta || 0)} Total
                      </div>
                    ) : (
                      <div className="font-mono font-bold text-cyan-400 text-xs mt-0.5">
                        {formatCOP(proyecto.valor_mensual)}/mes
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Recursos Técnicos:</span>
                    <button
                      onClick={() => setSelectedResourcesProject(proyecto)}
                      className="mt-0.5 inline-flex items-center gap-1 text-cyan-400 hover:underline font-semibold"
                    >
                      <Globe className="w-3 h-3" />
                      <span>{recursosCount} Enlaces / Cred.</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    {proyecto.estado === 'en_prueba' && (
                      <button
                        onClick={() => onOpenEdit({ ...proyecto, estado: 'activo' })}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Pasar a Activo</span>
                      </button>
                    )}
                    <button
                      onClick={() => onNewPaymentForProject(proyecto)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Cobrar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSendReminder(proyecto)}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                      title="WhatsApp"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenEdit(proyecto)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar proyecto "${proyecto.nombre_proyecto}"?`)) {
                          onDeleteProject(proyecto.id);
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
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (visible on medium screens >= md) */}
      <div className="hidden md:block bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Proyecto</th>
                <th className="py-3 px-4">Cliente Responsable</th>
                <th className="py-3 px-4">Modelo de Cobro</th>
                <th className="py-3 px-4">Recursos & Enlaces</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredProyectos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron proyectos según el criterio especificado.
                  </td>
                </tr>
              ) : (
                filteredProyectos.map((proyecto) => {
                  const trialInfo = getTrialInfo(proyecto);
                  const recursosCount = proyecto.recursos_tecnicos?.length || 0;

                  return (
                    <tr key={proyecto.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{proyecto.nombre_proyecto}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Inicio: {formatDateCO(proyecto.fecha_inicio)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">
                          {proyecto.cliente?.nombre || 'Cliente no asignado'}
                        </div>
                        <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span>{proyecto.cliente?.empresa || 'Empresa'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {proyecto.modelo_cobro === 'venta_directa' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              <Code className="w-3 h-3" />
                              <span>Venta Directa</span>
                            </span>
                            <div className="font-mono text-xs font-bold text-white mt-1">
                              {formatCOP(proyecto.valor_total_venta || 0)} Total
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              <Clock className="w-2.5 h-2.5 text-cyan-400" />
                              <span>Alquiler Mensual</span>
                            </span>
                            <div className="font-mono font-bold text-xs text-cyan-400 mt-1">
                              {formatCOP(proyecto.valor_mensual)}/mes
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedResourcesProject(proyecto)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 border border-slate-700 transition cursor-pointer text-xs"
                          title="Ver y administrar enlaces de GitHub, Dominio, Hosting, Mapbox..."
                        >
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Recursos ({recursosCount})</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {proyecto.estado === 'en_prueba' ? (
                            trialInfo.isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span>PRUEBA VENCIDA ({Math.abs(trialInfo.daysRemaining)} días)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                <Gift className="w-3 h-3 text-purple-400" />
                                <span>Prueba Activa ({trialInfo.daysRemaining} días rest.)</span>
                              </span>
                            )
                          ) : (
                            <span
                              className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                proyecto.estado === 'activo'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : proyecto.estado === 'en_desarrollo'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : proyecto.estado === 'pausado'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {proyecto.estado === 'en_desarrollo' ? '🛠️ En Desarrollo' : proyecto.estado}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {proyecto.estado === 'en_prueba' && (
                            <button
                              onClick={() => onOpenEdit({ ...proyecto, estado: 'activo' })}
                              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition cursor-pointer flex items-center gap-1"
                              title="Pasar proyecto a producción/activo"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Pasar a Activo</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleSendReminder(proyecto)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition"
                            title="Enviar Recordatorio por WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => onNewPaymentForProject(proyecto)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition cursor-pointer"
                            title="Registrar cobro para este proyecto"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cobrar</span>
                          </button>
                          <button
                            onClick={() => onOpenEdit(proyecto)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                            title="Editar proyecto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Eliminar proyecto "${proyecto.nombre_proyecto}"?`)) {
                                onDeleteProject(proyecto.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Recursos Técnicos */}
      {selectedResourcesProject && (
        <ProjectResourcesModal
          proyecto={selectedResourcesProject}
          onClose={() => setSelectedResourcesProject(null)}
          onSave={async (updated) => {
            if (onSaveProjectResources) {
              await onSaveProjectResources(updated);
            }
          }}
        />
      )}
    </div>
  );
};
