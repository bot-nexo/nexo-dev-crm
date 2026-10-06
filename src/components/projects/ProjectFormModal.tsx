import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  FolderKanban,
  DollarSign,
  Calendar,
  Clock,
  User,
  Gift,
  Rocket,
  Code,
  Link,
  Mail,
  Plus,
  Trash2,
  Key,
  Shield,
  Layers,
  Wrench,
  Globe,
  Database,
  Tag,
} from 'lucide-react';
import {
  Proyecto,
  Cliente,
  ProyectoEstado,
  ImplementacionEstado,
  ModeloCobro,
  RecursoTecnico,
  EtapaPago,
} from '../../types/database';
import { generateUUID } from '../../services/dataService';

interface ProjectFormModalProps {
  initialProject?: Proyecto | null;
  clientes: Cliente[];
  defaultClientId?: string;
  onClose: () => void;
  onSave: (
    proyecto: Partial<Proyecto> & {
      nombre_proyecto: string;
      cliente_id: string;
      dias_prueba?: number;
    }
  ) => Promise<Proyecto>;
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
  const [estado, setEstado] = useState<ProyectoEstado>(initialProject?.estado || 'activo');
  const [fechaInicio, setFechaInicio] = useState(
    initialProject?.fecha_inicio || new Date().toISOString().split('T')[0]
  );

  // Modelo de Cobro
  const [modeloCobro, setModeloCobro] = useState<ModeloCobro>(
    initialProject?.modelo_cobro || 'mensual_alquiler'
  );
  
  // Alquiler Mensual
  const [valorMensual, setValorMensual] = useState(
    initialProject ? String(initialProject.valor_mensual || 0) : ''
  );
  const [diaCobro, setDiaCobro] = useState<number>(initialProject?.dia_cobro || 5);

  // Venta Directa
  const [valorTotalVenta, setValorTotalVenta] = useState(
    initialProject?.valor_total_venta != null ? String(initialProject.valor_total_venta) : ''
  );
  const [modalidadPagoVenta, setModalidadPagoVenta] = useState<'pago_unico' | 'etapas_hitos'>(
    initialProject?.modalidad_pago_venta || 'pago_unico'
  );

  // Pruebas gratis
  const [diasPrueba, setDiasPrueba] = useState<number>(
    initialProject?.dias_prueba || 7
  );

  // Implementación (Cobro único)
  const [valorImplementacion, setValorImplementacion] = useState(
    initialProject?.valor_implementacion !== undefined ? String(initialProject.valor_implementacion) : '0'
  );
  const [estadoImplementacion, setEstadoImplementacion] = useState<ImplementacionEstado>(
    initialProject?.estado_implementacion || 'pendiente'
  );

  // Creador de campos dinámicos de recursos técnicos & credenciales
  const [recursosTecnicos, setRecursosTecnicos] = useState<RecursoTecnico[]>(
    initialProject?.recursos_tecnicos || [
      {
        id: generateUUID(),
        nombre_campo: 'Repositorio GitHub',
        url_recurso: '',
        correo_vinculado: '',
        notas: '',
      },
      {
        id: generateUUID(),
        nombre_campo: 'Hosting / Servidor',
        url_recurso: '',
        correo_vinculado: '',
        notas: '',
      },
      {
        id: generateUUID(),
        nombre_campo: 'Dominio Principal',
        url_recurso: '',
        correo_vinculado: '',
        notas: '',
      },
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic field helper methods
  const handleAddRecurso = (presetName: string = '') => {
    setRecursosTecnicos((prev) => [
      ...prev,
      {
        id: generateUUID(),
        nombre_campo: presetName || 'Nuevo Recurso / Campo',
        url_recurso: '',
        correo_vinculado: '',
        notas: '',
      },
    ]);
  };

  const handleUpdateRecurso = (id: string, field: keyof RecursoTecnico, val: string) => {
    setRecursosTecnicos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleRemoveRecurso = (id: string) => {
    setRecursosTecnicos((prev) => prev.filter((r) => r.id !== id));
  };

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

    const numMonto = parseFloat(valorMensual) || 0;
    const numVentaTotal = parseFloat(valorTotalVenta) || 0;

    if (modeloCobro === 'mensual_alquiler' && numMonto < 0) {
      setErrorMsg('Ingresa un valor mensual válido (MRR).');
      return;
    }
    if (diaCobro < 1 || diaCobro > 31) {
      setErrorMsg('El día de cobro debe estar entre 1 y 31.');
      return;
    }

    const numImplementacion = parseFloat(valorImplementacion) || 0;

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialProject?.id,
        cliente_id: clienteId,
        nombre_proyecto: nombreProyecto.trim(),
        estado,
        fecha_inicio: fechaInicio,
        modelo_cobro: modeloCobro,
        valor_mensual: numMonto,
        dia_cobro: diaCobro,
        valor_total_venta: numVentaTotal,
        modalidad_pago_venta: modalidadPagoVenta,
        dias_prueba: estado === 'en_prueba' ? diasPrueba : undefined,
        valor_implementacion: numImplementacion,
        estado_implementacion: estadoImplementacion,
        recursos_tecnicos: recursosTecnicos.filter((r) => r.nombre_campo.trim() !== ''),
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
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {initialProject ? 'Editar Proyecto & Recursos' : 'Nuevo Proyecto & Recursos Técnicos'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Información Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nombre del Proyecto *</span>
              </label>
              <input
                type="text"
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                placeholder="Ej: Software de Gestión Médica & API Cloud"
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

          {/* Estado del Proyecto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Estado del Proyecto *
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as ProyectoEstado)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="activo">🟢 Activo (En Producción / Facturando)</option>
              <option value="en_desarrollo">🛠️ En Desarrollo (Construcción base)</option>
              <option value="en_prueba">🟣 En Prueba Gratis (Trial 7/14 días)</option>
              <option value="pausado">🟡 Pausado (En espera)</option>
              <option value="finalizado">⚪ Finalizado / Entregado</option>
            </select>
          </div>

          {/* Pruebas gratis en caso de seleccionar en_prueba */}
          {estado === 'en_prueba' && (
            <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-purple-200">Prueba Gratis para el Cliente</h4>
              </div>
              <p className="text-[11px] text-purple-300/80">
                Determina los días gratis otorgados. El CRM indicará automáticamente si está activa o vencida.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDiasPrueba(7)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    diasPrueba === 7
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  7 Días
                </button>
                <button
                  type="button"
                  onClick={() => setDiasPrueba(14)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    diasPrueba === 14
                      ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  14 Días
                </button>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs text-slate-400">Otro:</span>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={diasPrueba}
                    onChange={(e) => setDiasPrueba(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono text-center"
                  />
                  <span className="text-xs text-slate-400">días</span>
                </div>
              </div>
            </div>
          )}

          {/* Modelo de Cobro / Modelo de Venta */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-slate-200">
              Modelo de Negocio & Facturación *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModeloCobro('mensual_alquiler')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  modeloCobro === 'mensual_alquiler'
                    ? 'bg-cyan-950/50 border-cyan-500 text-cyan-200 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Alquiler / Retainer Mensual</span>
                </div>
                <p className="text-[11px] opacity-80">
                  El cliente paga una cuota recurrente todos los meses (MRR).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setModeloCobro('venta_directa')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  modeloCobro === 'venta_directa'
                    ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <Code className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Venta Directa del Programa</span>
                </div>
                <p className="text-[11px] opacity-80">
                  Compra del software / Desarrollo a la medida. Pago único o por etapas.
                </p>
              </button>
            </div>

            {/* Campos condicionales según Modelo */}
            {modeloCobro === 'mensual_alquiler' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Valor Mensual / MRR (COP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={valorMensual}
                      onChange={(e) => setValorMensual(e.target.value)}
                      placeholder="2500000"
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Día de Cobro Mensual *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={diaCobro}
                    onChange={(e) => setDiaCobro(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Valor Total del Programa / Proyecto (COP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">$</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={valorTotalVenta}
                      onChange={(e) => setValorTotalVenta(e.target.value)}
                      placeholder="8500000"
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Modalidad de Pago de la Venta
                  </label>
                  <select
                    value={modalidadPagoVenta}
                    onChange={(e) => setModalidadPagoVenta(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="pago_unico">1 Pago Único Completo</option>
                    <option value="etapas_hitos">Pago por Etapas / Hitos de Entrega</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Configuración de Implementación (Pago Único) */}
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-amber-200">Tarifa de Implementación / Puesta en Producción</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Valor Implementación (COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={valorImplementacion}
                    onChange={(e) => setValorImplementacion(e.target.value)}
                    placeholder="1500000"
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Estado de Implementación
                </label>
                <select
                  value={estadoImplementacion}
                  onChange={(e) => setEstadoImplementacion(e.target.value as ImplementacionEstado)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="pendiente">🟠 Pendiente de Pago</option>
                  <option value="pagado">🟢 Pagado (Ingreso Realizado)</option>
                  <option value="no_aplica">⚪ No Aplica ($0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CREADOR DE CAMPOS DINÁMICOS: Recursos Técnicos & Credenciales */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Creador de Recursos Técnicos & Credenciales Vincular</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Agrega campos dinámicos para vincular GitHub, Dominio, Hosting, Email, Mapbox y correos de acceso.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddRecurso('')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Campo</span>
              </button>
            </div>

            {/* Presets de agregación rápida */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Presets rápidos:</span>
              {[
                { name: 'GitHub Repo', icon: Code },
                { name: 'Hosting / Servidor', icon: Rocket },
                { name: 'Dominio Principal', icon: Globe },
                { name: 'Envío Email / Resend', icon: Mail },
                { name: 'Mapbox API', icon: Globe },
                { name: 'Base de Datos', icon: Database },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddRecurso(preset.name)}
                  className="text-[10px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  + {preset.name}
                </button>
              ))}
            </div>

            {/* Lista de campos agregados */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {recursosTecnicos.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  Sin servicios o credenciales vinculadas aún. Haz clic en "Nuevo Campo".
                </div>
              ) : (
                recursosTecnicos.map((rec, index) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <input
                          type="text"
                          value={rec.nombre_campo}
                          onChange={(e) => handleUpdateRecurso(rec.id, 'nombre_campo', e.target.value)}
                          placeholder="Nombre del servicio (ej: Mapbox API, GitHub, Dominio)"
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRecurso(rec.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
                        title="Eliminar este campo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                          <Link className="w-3 h-3 text-cyan-400" />
                          <span>Link / URL del Servicio</span>
                        </div>
                        <input
                          type="url"
                          value={rec.url_recurso}
                          onChange={(e) => handleUpdateRecurso(rec.id, 'url_recurso', e.target.value)}
                          placeholder="https://github.com/... o https://mapbox.com"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                          <Mail className="w-3 h-3 text-indigo-400" />
                          <span>Correo Vinculado</span>
                        </div>
                        <input
                          type="text"
                          value={rec.correo_vinculado}
                          onChange={(e) => handleUpdateRecurso(rec.id, 'correo_vinculado', e.target.value)}
                          placeholder="admin@cliente.com"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 shrink-0">
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
