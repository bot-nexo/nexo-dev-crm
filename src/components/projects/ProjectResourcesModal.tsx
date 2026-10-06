import React, { useState } from 'react';
import {
  X,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Mail,
  Copy,
  Check,
  Code,
  Tag,
  Save,
  Link as LinkIcon,
} from 'lucide-react';
import { Proyecto, RecursoTecnico } from '../../types/database';
import { generateUUID } from '../../services/dataService';

interface ProjectResourcesModalProps {
  proyecto: Proyecto;
  onClose: () => void;
  onSave: (proyectoUpdated: Proyecto) => Promise<void>;
}

export const ProjectResourcesModal: React.FC<ProjectResourcesModalProps> = ({
  proyecto,
  onClose,
  onSave,
}) => {
  const [recursos, setRecursos] = useState<RecursoTecnico[]>(
    proyecto.recursos_tecnicos || []
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddRecurso = (presetName: string = '') => {
    setRecursos((prev) => [
      ...prev,
      {
        id: generateUUID(),
        nombre_campo: presetName || 'Nuevo Recurso',
        url_recurso: '',
        correo_vinculado: '',
        notas: '',
      },
    ]);
  };

  const handleUpdate = (id: string, field: keyof RecursoTecnico, value: string) => {
    setRecursos((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleRemove = (id: string) => {
    setRecursos((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...proyecto,
        recursos_tecnicos: recursos,
      });
      onClose();
    } catch (err) {
      console.error('Error saving resources:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Recursos Técnicos & Enlaces: {proyecto.nombre_proyecto}
              </h3>
              <p className="text-[11px] text-slate-400">
                Cliente: {proyecto.cliente?.nombre} ({proyecto.cliente?.empresa})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Servicios, Repositorios & Correos Vinculados ({recursos.length})
            </span>

            <button
              onClick={() => handleAddRecurso('')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Nuevo Campo</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Agregar rápido:</span>
            {['GitHub', 'Dominio', 'Hosting', 'Envío Email', 'Mapbox API', 'Base de Datos'].map((name) => (
              <button
                key={name}
                onClick={() => handleAddRecurso(name)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                + {name}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-3">
            {recursos.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                No hay recursos técnicos vinculados a este proyecto.
              </div>
            ) : (
              recursos.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Tag className="w-4 h-4 text-cyan-400 shrink-0" />
                      <input
                        type="text"
                        value={rec.nombre_campo}
                        onChange={(e) => handleUpdate(rec.id, 'nombre_campo', e.target.value)}
                        placeholder="Ej: Mapbox API, GitHub, Dominio"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      onClick={() => handleRemove(rec.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Eliminar campo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-cyan-400" /> URL / Enlace del Servicio
                        </span>
                        {rec.url_recurso && (
                          <a
                            href={rec.url_recurso}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Abrir</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </label>
                      <input
                        type="url"
                        value={rec.url_recurso}
                        onChange={(e) => handleUpdate(rec.id, 'url_recurso', e.target.value)}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-indigo-400" /> Correo Vinculado
                        </span>
                        {rec.correo_vinculado && (
                          <button
                            onClick={() => handleCopyText(rec.correo_vinculado, rec.id)}
                            className="text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            {copiedId === rec.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            <span>{copiedId === rec.id ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        )}
                      </label>
                      <input
                        type="text"
                        value={rec.correo_vinculado}
                        onChange={(e) => handleUpdate(rec.id, 'correo_vinculado', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
