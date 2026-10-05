import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Send,
  Building,
  Mail,
  Phone,
  Trash2,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { Cliente, ClienteEstado } from '../../types/database';
import { NotificationService } from '../../services/notificationService';

interface ClientListProps {
  clientes: Cliente[];
  onOpenCreate: () => void;
  onOpenEdit: (cliente: Cliente) => void;
  onOpenDetail: (cliente: Cliente) => void;
  onDeleteClient: (id: string) => Promise<void>;
}

export const ClientList: React.FC<ClientListProps> = ({
  clientes,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onDeleteClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | ClienteEstado>('todos');
  const [sortField, setSortField] = useState<'nombre' | 'empresa' | 'fecha_registro'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filter & Sort
  const filteredClientes = useMemo(() => {
    return clientes
      .filter((c) => {
        const matchesEstado = filterEstado === 'todos' || c.estado === filterEstado;
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          c.nombre.toLowerCase().includes(q) ||
          c.empresa.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.telefono.includes(q);
        return matchesEstado && matchesSearch;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (sortOrder === 'asc') {
          return valA.localeCompare(valB);
        }
        return valB.localeCompare(valA);
      });
  }, [clientes, searchTerm, filterEstado, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredClientes.length / pageSize) || 1;
  const paginatedClientes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClientes.slice(start, start + pageSize);
  }, [filteredClientes, currentPage, pageSize]);

  const handleSortToggle = (field: 'nombre' | 'empresa' | 'fecha_registro') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleWhatsAppClick = (cliente: Cliente, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `¡Hola ${cliente.nombre.split(' ')[0]}! Te saludamos desde Nexo Dev Studio. ¿Cómo estás?`;
    NotificationService.openWhatsAppChat(cliente.telefono, text);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Directorio de Clientes</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {filteredClientes.length} {filteredClientes.length === 1 ? 'cliente' : 'clientes'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión de cuentas, contacto rápido por WhatsApp y balance individual
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, empresa, email o teléfono..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
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
            <option value="activo">Solo Activos</option>
            <option value="inactivo">Solo Inactivos</option>
          </select>
        </div>

        {/* Page size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 shrink-0">Mostrar:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full px-2 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value={10}>10 items</option>
            <option value={25}>25 items</option>
            <option value={50}>50 items</option>
          </select>
        </div>
      </div>

      {/* Interactive Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th
                  onClick={() => handleSortToggle('nombre')}
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Cliente / Contacto</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('empresa')}
                  className="py-3 px-4 cursor-pointer hover:text-cyan-400 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Empresa</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4">Canal Directo WhatsApp</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {paginatedClientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No se encontraron clientes que coincidan con los criterios.
                  </td>
                </tr>
              ) : (
                paginatedClientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    onClick={() => onOpenDetail(cliente)}
                    className="hover:bg-slate-800/50 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                          {cliente.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{cliente.nombre}</div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Reg: {cliente.fecha_registro?.slice(0, 10) || '2026'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                        <Building className="w-3.5 h-3.5 text-cyan-400/70" />
                        <span>{cliente.empresa}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => handleWhatsAppClick(cliente, e)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono transition"
                        title="Abrir chat en WhatsApp"
                      >
                        <Send className="w-3 h-3 text-emerald-400" />
                        <span>{cliente.telefono}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 truncate max-w-[180px]">
                      {cliente.email}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          cliente.estado === 'activo'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {cliente.estado}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenDetail(cliente)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition"
                          title="Ver detalle del cliente"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenEdit(cliente)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Editar cliente"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Seguro que deseas eliminar a ${cliente.nombre}? Se eliminarán también sus proyectos y pagos.`)) {
                              onDeleteClient(cliente.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                          title="Eliminar cliente"
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
