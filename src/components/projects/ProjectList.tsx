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
  ArrowUpDown,
} from 'lucide-react';
import { Proyecto, Cliente, ProyectoEstado } from '../../types/database';
import { NotificationService } from '../../services/notificationService';

interface ProjectListProps {
  proyectos: Proyecto[];
  clientes: Cliente[];
  onOpenCreate: () => void;
  onOpenEdit: (proyecto: Proyecto) => void;
  onDeleteProject: (id: string) => Promise<void>;
  onNewPaymentForProject: (proyecto: Proyecto) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  proyectos,
  clientes,
  onOpenCreate,
  onOpenEdit,
  onDeleteProject,
  onNewPaymentForProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | ProyectoEstado>('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Compute metrics
  const activeProjects = proyectos.filter((p) => p.estado === 'activo');
  const totalMRR = activeProjects.reduce((sum, p) => sum + (Number(p.valor_mensual) || 0), 0);
  const avgTicket = activeProjects.length > 0 ? totalMRR / activeProjects.length : 0;

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>MRR Recurrente Activo</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${totalMRR.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-cyan-400 mt-1 block">
            {activeProjects.length} proyectos con facturación recurrente
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ticket Promedio Mensual</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${avgTicket.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Por cliente activo mensual</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Proyectos Registrados</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {proyectos.length}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            {activeProjects.length} activos • {proyectos.length - activeProjects.length} pausados / cerrados
          </span>
        </div>
      </div>

      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            <span>Gestión de Proyectos & Retainers</span>
          </h2>
          <p className="text-xs text-slate-400">
            Control de cuotas mensuales, días de cobro y recordatorios preventivos
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
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
            <option value="activo">Solo Activos</option>
            <option value="pausado">Solo Pausados</option>
            <option value="finalizado">Solo Finalizados</option>
          </select>
        </div>
      </div>

      {/* Interactive Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Proyecto</th>
                <th className="py-3 px-4">Cliente Responsable</th>
                <th className="py-3 px-4">Valor Mensual (MRR)</th>
                <th className="py-3 px-4">Día de Cobro</th>
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
                filteredProyectos.map((proyecto) => (
                  <tr key={proyecto.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{proyecto.nombre_proyecto}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Inicio: {proyecto.fecha_inicio}
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

                    <td className="py-3 px-4 font-mono font-bold text-sm text-cyan-400">
                      ${Number(proyecto.valor_mensual).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>Día {proyecto.dia_cobro} de c/mes</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          proyecto.estado === 'activo'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : proyecto.estado === 'pausado'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {proyecto.estado}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
