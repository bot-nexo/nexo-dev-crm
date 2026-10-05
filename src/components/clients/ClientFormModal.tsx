import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, User, Building, Mail, Phone, Shield } from 'lucide-react';
import { Cliente, ClienteEstado } from '../../types/database';

interface ClientFormModalProps {
  initialClient?: Cliente | null;
  onClose: () => void;
  onSave: (cliente: Partial<Cliente> & { nombre: string; email: string }) => Promise<Cliente>;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  initialClient,
  onClose,
  onSave,
}) => {
  const [nombre, setNombre] = useState(initialClient?.nombre || '');
  const [empresa, setEmpresa] = useState(initialClient?.empresa || '');
  const [email, setEmail] = useState(initialClient?.email || '');
  const [telefono, setTelefono] = useState(initialClient?.telefono || '+549');
  const [estado, setEstado] = useState<ClienteEstado>(initialClient?.estado || 'activo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombre.trim()) {
      setErrorMsg('El nombre del cliente es obligatorio.');
      return;
    }
    if (!empresa.trim()) {
      setErrorMsg('La empresa o razón social es obligatoria.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Ingresa un correo electrónico válido.');
      return;
    }
    if (!telefono.trim() || telefono.length < 8) {
      setErrorMsg('Ingresa un teléfono válido para WhatsApp con código de país (ej: +5491123456789).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialClient?.id,
        nombre: nombre.trim(),
        empresa: empresa.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        estado,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar el cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {initialClient ? 'Editar Cliente' : 'Nuevo Cliente'}
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
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nombre y Apellido *</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Marcos Valenzuela"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Empresa o Marca *</span>
            </label>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Ej: Apex Global Corp"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>Correo Electrónico (Para facturas y avisos) *</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Teléfono WhatsApp (Con prefijo internacional) *</span>
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+5491123456789"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Utilizado para el envío directo de recordatorios de cobro y comprobantes por WhatsApp.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Estado del Cliente *</span>
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as ClienteEstado)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="activo">🟢 Activo (Proyectos y Cobros regulares)</option>
              <option value="inactivo">⚪ Inactivo (Sin proyectos activos)</option>
            </select>
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
              <span>{isSubmitting ? 'Guardando...' : initialClient ? 'Actualizar Cliente' : 'Crear Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
