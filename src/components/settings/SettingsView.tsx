import React, { useState } from 'react';
import {
  Settings,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Mail,
  ShieldCheck,
  Server,
  ExternalLink,
  UploadCloud,
  FileCode,
} from 'lucide-react';
import { getStoredConfig, saveStoredConfig, testSupabaseConnection } from '../../lib/supabase';
import { DataService } from '../../services/dataService';

interface SettingsViewProps {
  onDataSyncRequested: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataSyncRequested }) => {
  const [config, setConfig] = useState(getStoredConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredConfig(config);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(config.supabaseUrl, config.supabaseAnonKey);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await DataService.syncLocalToSupabase();
    setIsSyncing(false);
    setSyncResult(res);
    await onDataSyncRequested();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Configuración del CRM, Supabase & Netlify</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Conecta tus credenciales de Supabase para persistencia en la nube PostgreSQL. Si dejas los campos vacíos,
          el sistema funciona de forma 100% autónoma en modo Offline-First con LocalStorage e IndexedDB sincronizado.
        </p>
      </div>

      {saveFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>¡Configuración guardada exitosamente en el navegador!</span>
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Supabase Box */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Conexión a Supabase (PostgreSQL & Auth)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Database
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                VITE_SUPABASE_URL (URL del Proyecto)
              </label>
              <input
                type="url"
                value={config.supabaseUrl}
                onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                placeholder="https://xyzabcdefg.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                VITE_SUPABASE_ANON_KEY (Clave Pública Anon)
              </label>
              <input
                type="password"
                value={config.supabaseAnonKey}
                onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* Test & Sync Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isTesting ? 'Probando conexión...' : 'Probar Conexión con Supabase'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Sincronizando...' : 'Subir Datos Locales a Supabase'}</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {syncResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                syncResult.success
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{syncResult.message}</span>
            </div>
          )}
        </div>

        {/* WhatsApp & Email Keys Box */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Integraciones de Notificaciones (WhatsApp & Resend)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Netlify Functions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>URL Servidor Evolution API (WhatsApp)</span>
              </label>
              <input
                type="url"
                value={config.evolutionApiUrl}
                onChange={(e) => setConfig({ ...config, evolutionApiUrl: e.target.value })}
                placeholder="https://api.tu-servidor-whatsapp.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                API Key de Evolution / Token
              </label>
              <input
                type="password"
                value={config.evolutionApiKey}
                onChange={(e) => setConfig({ ...config, evolutionApiKey: e.target.value })}
                placeholder="Tu apikey privada..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>API Key de Resend (Email)</span>
              </label>
              <input
                type="password"
                value={config.resendApiKey}
                onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
                placeholder="re_123456789..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Remitente de Correos (From Email)
              </label>
              <input
                type="text"
                value={config.resendFromEmail}
                onChange={(e) => setConfig({ ...config, resendFromEmail: e.target.value })}
                placeholder="Nexo Dev Studio <billing@nexodevstudio.com>"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Agency Branding Details */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Datos de Agencia y Comprobantes</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre de la Agencia / Startup
              </label>
              <input
                type="text"
                value={config.agencyName}
                onChange={(e) => setConfig({ ...config, agencyName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Símbolo de Moneda Principal
              </label>
              <input
                type="text"
                value={config.currencySymbol}
                onChange={(e) => setConfig({ ...config, currencySymbol: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Correo del Fundador para Avisos de Suscripciones</span>
              </label>
              <input
                type="email"
                value={config.founderEmailAlerts || ''}
                onChange={(e) => setConfig({ ...config, founderEmailAlerts: e.target.value })}
                placeholder="founder@startup.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                A este correo te llegarán las alertas cuando falten días para pagar tus herramientas SaaS.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tasa de Cambio Referencial USD a COP ($)
              </label>
              <input
                type="number"
                value={config.usdCopExchangeRate || 4200}
                onChange={(e) => setConfig({ ...config, usdCopExchangeRate: Number(e.target.value) || 4200 })}
                placeholder="4200"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Se usa para convertir los gastos en USD a Pesos Colombianos en las métricas.
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            Guardar Configuración
          </button>
        </div>
      </form>

      {/* NETLIFY DEPLOYMENT & SUPABASE INSTRUCTIONS (Deliverable 5) */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Server className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">
            Guía de Despliegue en Netlify & Conexión con Supabase
          </h3>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <h4 className="font-bold text-cyan-400 mb-1">Paso 1: Configurar Supabase</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Crea un nuevo proyecto en Supabase.</li>
              <li>Ve a <strong>SQL Editor</strong> &gt; copia el archivo <code className="text-cyan-300">supabase-schema.sql</code> y ejecútalo con RUN.</li>
              <li>Copia las variables de <strong>Project Settings &gt; API</strong>: <code className="text-cyan-300">Project URL</code> y <code className="text-cyan-300">anon public key</code>.</li>
            </ol>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <h4 className="font-bold text-cyan-400 mb-1">Paso 2: Conectar el Repositorio a Netlify</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Sube el código a GitHub / GitLab.</li>
              <li>En Netlify selecciona <strong>Add new site &gt; Import an existing project</strong>.</li>
              <li>El archivo <code className="text-cyan-300">netlify.toml</code> incluido configurará automáticamente el build command (<code className="text-cyan-300">npm run build</code>) y el directorio de publicación (<code className="text-cyan-300">dist</code>).</li>
            </ol>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <h4 className="font-bold text-cyan-400 mb-1">Paso 3: Variables de Entorno en Netlify</h4>
            <p className="text-slate-400 mb-1.5">
              En tu dashboard de Netlify, ve a <strong>Site settings &gt; Environment variables</strong> y añade:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 font-mono text-[11px]">
              <li><strong className="text-slate-200">VITE_SUPABASE_URL</strong>: Tu URL de Supabase</li>
              <li><strong className="text-slate-200">VITE_SUPABASE_ANON_KEY</strong>: Tu anon key de Supabase</li>
              <li><strong className="text-slate-200">RESEND_API_KEY</strong>: Tu API Key de Resend (para envío de correos)</li>
              <li><strong className="text-slate-200">EVOLUTION_API_URL / TWILIO</strong>: Opcional para gateway WhatsApp directo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
