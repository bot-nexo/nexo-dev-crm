import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, FolderKanban, DollarSign, Calendar, Clock, User } from 'lucide-react';
import { Proyecto, Cliente, ProyectoEstado } from '../../types/database';

interface ProjectFormModalProps {
  initialProject?: Proyecto | null;
  clientes: Cliente[];
  defaultClientId?: string;
  onClose: () => void;
  onSave: (proyecto: Partial<Proyecto> & { nombre_proyecto: string; cliente_id: string }) => Promise<Proyecto>;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  initialProject,
  clientes,
  defaultClientId,
  onClose,
  onSave,
}) => {
  const [nombreProyecto, setNombreProyecto] = useState(initialProject?.nombre_proyecto || '');
  const [clienteId, setClienteId] = useState(
    initialProject?.cliente_id || defaultClientId || (clientes[0]?.id ?? '')
  );
  const [valorMensual, setValorMensual] = useState(
    initialProject ? String(initialProject.valor_mensual) : ''
  );
  const [diaCobro, setDiaCobro] = useState<number>(initialProject?.dia_cobro || 5);
  const [estado, setEstado] = useState<ProyectoEstado>(initialProject?.estado || 'activo');
  const [fechaInicio, setFechaInicio] = useState(
    initialProject?.fecha_inicio || new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombreProyecto.trim()) {
      setErrorMsg('El nombre del proyecto es obligatorio.');
      return;
    }
    if (!clienteId) {
      setErrorMsg('Debes seleccionar el cliente responsable.');
      return;
    }
    const numMonto = parseFloat(valorMensual);
    if (isNaN(numMonto) || numMonto < 0) {
      setErrorMsg('Ingresa un valor mensual válido (MRR).');
      return;
    }
    if (diaCobro < 1 || diaCobro > 31) {
      setErrorMsg('El día de cobro debe estar entre 1 y 31.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialProject?.id,
        cliente_id: clienteId,
        nombre_proyecto: nombreProyecto.trim(),
        valor_mensual: numMonto,
        dia_cobro: diaCobro,
        estado,
        fecha_inicio: fechaInicio,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar el proyecto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {initialProject ? 'Editar Proyecto' : 'Nuevo Proyecto & Retainer'}
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nombre del Proyecto *</span>
            </label>
            <input
              type="text"
              value={nombreProyecto}
              onChange={(e) => setNombreProyecto(e.target.value)}
              placeholder="Ej: Desarrollo Backend Microservicios & PWA"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cliente Vinculado *</span>
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              required
            >
              <option value="">-- Selecciona un Cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.empresa})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                <span>Valor Mensual / MRR *</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorMensual}
                  onChange={(e) => setValorMensual(e.target.value)}
                  placeholder="2000.00"
                  className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Día de Cobro Mensual *</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaCobro}
                onChange={(e) => setDiaCobro(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Dispara recordatorio 3 días antes del día {diaCobro}.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado del Proyecto *
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as ProyectoEstado)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="activo">🟢 Activo (Facturación en curso)</option>
                <option value="pausado">🟡 Pausado (En espera)</option>
                <option value="finalizado">⚪ Finalizado / Cerrado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fecha de Inicio *</span>
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : initialProject ? 'Actualizar Proyecto' : 'Crear Proyecto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
