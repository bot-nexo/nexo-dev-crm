import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Mail,
  Calendar,
  DollarSign,
  Globe,
  Bell,
  Sparkles,
  Shield,
  Layers,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  SuscripcionStartup,
  SuscripcionCategoria,
  SuscripcionEstado,
  SuscripcionCiclo,
  MonedaTipo,
} from '../../types/database';
import { getStoredConfig } from '../../lib/supabase';

interface SubscriptionFormModalProps {
  initialSub?: SuscripcionStartup | null;
  onClose: () => void;
  onSave: (sub: Partial<SuscripcionStartup> & { nombre_servicio: string; email_cuenta: string; costo: number }) => Promise<SuscripcionStartup>;
}

// Popular SaaS / Cloud presets for 1-click auto-fill
const PRESET_TOOLS = [
  {
    name: 'OpenAI API / ChatGPT Plus',
    provider: 'OpenAI',
    category: 'ia_apis' as SuscripcionCategoria,
    cost: 20,
    moneda: 'USD' as MonedaTipo,
    url: 'https://platform.openai.com/account/billing/overview',
    icon: '🤖',
  },
  {
    name: 'GitHub Copilot & Team',
    provider: 'GitHub / Microsoft',
    category: 'herramientas_dev' as SuscripcionCategoria,
    cost: 19,
    moneda: 'USD' as MonedaTipo,
    url: 'https://github.com/organizations/billing',
    icon: '🐙',
  },
  {
    name: 'Cursor AI Pro',
    provider: 'Anysphere',
    category: 'ia_apis' as SuscripcionCategoria,
    cost: 20,
    moneda: 'USD' as MonedaTipo,
    url: 'https://www.cursor.com/settings',
    icon: '✨',
  },
  {
    name: 'Vercel Pro',
    provider: 'Vercel Inc.',
    category: 'infraestructura_cloud' as SuscripcionCategoria,
    cost: 20,
    moneda: 'USD' as MonedaTipo,
    url: 'https://vercel.com/dashboard/billing',
    icon: '▲',
  },
  {
    name: 'Supabase Pro Plan',
    provider: 'Supabase',
    category: 'infraestructura_cloud' as SuscripcionCategoria,
    cost: 25,
    moneda: 'USD' as MonedaTipo,
    url: 'https://supabase.com/dashboard/org/billing',
    icon: '⚡',
  },
  {
    name: 'AWS Cloud Services',
    provider: 'Amazon Web Services',
    category: 'infraestructura_cloud' as SuscripcionCategoria,
    cost: 50,
    moneda: 'USD' as MonedaTipo,
    url: 'https://console.aws.amazon.com/billing/home',
    icon: '☁️',
  },
  {
    name: 'Google Workspace',
    provider: 'Google Cloud',
    category: 'productividad_email' as SuscripcionCategoria,
    cost: 18,
    moneda: 'USD' as MonedaTipo,
    url: 'https://admin.google.com/ac/billing',
    icon: '📬',
  },
  {
    name: 'Resend Email API',
    provider: 'Resend',
    category: 'productividad_email' as SuscripcionCategoria,
    cost: 20,
    moneda: 'USD' as MonedaTipo,
    url: 'https://resend.com/billing',
    icon: '✉️',
  },
  {
    name: 'Cloudflare Pro / Dominios',
    provider: 'Cloudflare',
    category: 'infraestructura_cloud' as SuscripcionCategoria,
    cost: 20,
    moneda: 'USD' as MonedaTipo,
    url: 'https://dash.cloudflare.com/billing',
    icon: '🛡️',
  },
  {
    name: 'Figma Professional',
    provider: 'Figma Inc.',
    category: 'diseno_frontend' as SuscripcionCategoria,
    cost: 15,
    moneda: 'USD' as MonedaTipo,
    url: 'https://www.figma.com/settings/billing',
    icon: '🎨',
  },
];

export const SubscriptionFormModal: React.FC<SubscriptionFormModalProps> = ({
  initialSub,
  onClose,
  onSave,
}) => {
  const config = getStoredConfig();

  const [nombreServicio, setNombreServicio] = useState(initialSub?.nombre_servicio || '');
  const [proveedor, setProveedor] = useState(initialSub?.proveedor || '');
  const [categoria, setCategoria] = useState<SuscripcionCategoria>(initialSub?.categoria || 'herramientas_dev');
  const [estado, setEstado] = useState<SuscripcionEstado>(initialSub?.estado || 'activa');
  
  // Cuenta y acceso
  const [emailCuenta, setEmailCuenta] = useState(initialSub?.email_cuenta || config.founderEmailAlerts || '');
  const [usuarioLogin, setUsuarioLogin] = useState(initialSub?.usuario_login || '');
  
  // Facturación
  const [costo, setCosto] = useState<number | string>(initialSub?.costo != null ? initialSub.costo : 20);
  const [moneda, setMoneda] = useState<MonedaTipo>(initialSub?.moneda || 'USD');
  const [cicloCobro, setCicloCobro] = useState<SuscripcionCiclo>(initialSub?.ciclo_cobro || 'mensual');
  const [diaCobro, setDiaCobro] = useState<number>(initialSub?.dia_cobro || 5);
  
  // Default proxima fecha pago: today or next month corresponding to diaCobro
  const getDefaultNextDate = (dayNum: number) => {
    const now = new Date();
    let y = now.getFullYear();
    let m = now.getMonth();
    if (now.getDate() > dayNum) {
      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(Math.min(dayNum, 28)).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const [proximaFechaPago, setProximaFechaPago] = useState(
    initialSub?.proxima_fecha_pago || getDefaultNextDate(initialSub?.dia_cobro || 5)
  );
  
  const [metodoPago, setMetodoPago] = useState(initialSub?.metodo_pago || '');
  const [autoRenovacion, setAutoRenovacion] = useState(
    initialSub?.auto_renovacion !== undefined ? initialSub.auto_renovacion : true
  );

  // Trial fields
  const [fechaFinPrueba, setFechaFinPrueba] = useState(initialSub?.fecha_fin_prueba || '');
  const [diasPrueba, setDiasPrueba] = useState<number | string>(initialSub?.dias_prueba || 14);

  // Alertas
  const [diasAnticipacion, setDiasAnticipacion] = useState<number>(initialSub?.dias_anticipacion_alerta || 3);
  const [emailAlerta, setEmailAlerta] = useState(
    initialSub?.email_notificacion_alerta || initialSub?.email_cuenta || config.founderEmailAlerts || ''
  );
  const [alertaActiva, setAlertaActiva] = useState(
    initialSub?.alerta_activa !== undefined ? initialSub.alerta_activa : true
  );

  // URLs & notas
  const [urlPanelGestion, setUrlPanelGestion] = useState(initialSub?.url_panel_gestion || '');
  const [notas, setNotas] = useState(initialSub?.notas || '');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto calculate proximaFechaPago when diaCobro changes if user didn't manually pick
  const handleDiaCobroChange = (val: number) => {
    setDiaCobro(val);
    setProximaFechaPago(getDefaultNextDate(val));
  };

  const handleApplyPreset = (preset: typeof PRESET_TOOLS[0]) => {
    setNombreServicio(preset.name);
    setProveedor(preset.provider);
    setCategoria(preset.category);
    setCosto(preset.cost);
    setMoneda(preset.moneda);
    setUrlPanelGestion(preset.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreServicio.trim()) {
      setErrorMsg('Por favor ingresa el nombre de la suscripción o herramienta.');
      return;
    }
    if (!emailCuenta.trim()) {
      setErrorMsg('Por favor especifica el correo donde está registrada la cuenta.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      await onSave({
        ...(initialSub?.id ? { id: initialSub.id } : {}),
        nombre_servicio: nombreServicio.trim(),
        proveedor: proveedor.trim() || nombreServicio.trim(),
        categoria,
        estado,
        email_cuenta: emailCuenta.trim(),
        usuario_login: usuarioLogin.trim(),
        costo: Number(costo) || 0,
        moneda,
        ciclo_cobro: cicloCobro,
        dia_cobro: Number(diaCobro) || 1,
        proxima_fecha_pago: proximaFechaPago,
        metodo_pago: metodoPago.trim(),
        auto_renovacion: autoRenovacion,
        fecha_fin_prueba: estado === 'en_prueba' ? fechaFinPrueba || proximaFechaPago : null,
        dias_prueba: estado === 'en_prueba' ? Number(diasPrueba) || 14 : null,
        dias_anticipacion_alerta: Number(diasAnticipacion) || 3,
        email_notificacion_alerta: emailAlerta.trim() || emailCuenta.trim(),
        alerta_activa: alertaActiva,
        url_panel_gestion: urlPanelGestion.trim(),
        notas: notas.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar la suscripción.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl my-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200 text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialSub ? 'Editar Suscripción de la Startup' : 'Registrar Nueva Suscripción / Herramienta'}
              </h2>
              <p className="text-xs text-slate-400">
                Control de costos SaaS, cuentas vinculadas y alertas automáticas a tu correo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets for New Subscriptions */}
        {!initialSub && (
          <div className="px-6 pt-4 pb-2 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Plantillas Rápidas (1 Clic para autocompletar):</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {PRESET_TOOLS.map((tool) => (
                <button
                  key={tool.name}
                  type="button"
                  onClick={() => handleApplyPreset(tool)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[11px] font-medium text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  <span>{tool.icon}</span>
                  <span>{tool.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Service Name & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre del Servicio / Herramienta *
              </label>
              <input
                type="text"
                required
                value={nombreServicio}
                onChange={(e) => setNombreServicio(e.target.value)}
                placeholder="Ej. OpenAI ChatGPT Plus, Vercel Pro, AWS"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Proveedor / Empresa
              </label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej. OpenAI, Microsoft, Google, AWS"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* Account Email & User Login */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Mail className="w-4 h-4 text-purple-400" />
              <span>¿En qué cuenta está registrada la suscripción?</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Correo Electrónico de la Cuenta *
                </label>
                <input
                  type="email"
                  required
                  value={emailCuenta}
                  onChange={(e) => {
                    setEmailCuenta(e.target.value);
                    if (!emailAlerta) setEmailAlerta(e.target.value);
                  }}
                  placeholder="ej. founder@startup.com o tech@empresa.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Usuario / Organización (Opcional)
                </label>
                <input
                  type="text"
                  value={usuarioLogin}
                  onChange={(e) => setUsuarioLogin(e.target.value)}
                  placeholder="ej. org-admin-nexo o lead-dev"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Categoría del Servicio
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as SuscripcionCategoria)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
              >
                <option value="ia_apis">🤖 IA & APIs (OpenAI, Anthropic, Cursor)</option>
                <option value="infraestructura_cloud">☁️ Infraestructura & Cloud (AWS, Vercel, Supabase)</option>
                <option value="herramientas_dev">🛠️ Herramientas Dev (GitHub, Docker, Jira)</option>
                <option value="productividad_email">📬 Productividad & Email (Google Workspace, Resend)</option>
                <option value="diseno_frontend">🎨 Diseño & Frontend (Figma, Canva, Adobe)</option>
                <option value="marketing_dominios">🌐 Dominios & Marketing (Namecheap, HubSpot)</option>
                <option value="seguridad_vpn">🛡️ Seguridad & VPN (1Password, Cloudflare)</option>
                <option value="otros">📦 Otros Servicios</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Estado Actual
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as SuscripcionEstado)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer font-semibold"
              >
                <option value="activa">🟢 Activa (Cobro Automático)</option>
                <option value="en_prueba">🎁 En Prueba Gratuita (Trial)</option>
                <option value="por_renovar">🟡 Por Renovar Próximamente</option>
                <option value="pausada">⏸️ Pausada Temporalmente</option>
                <option value="cancelada">🔴 Cancelada / Inactiva</option>
              </select>
            </div>
          </div>

          {/* Pricing & Billing Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monto / Tarifa *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                placeholder="20"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-cyan-300 font-bold font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Moneda
              </label>
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as MonedaTipo)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer font-mono"
              >
                <option value="USD">USD ($ Dólares)</option>
                <option value="COP">COP ($ Pesos Colombianos)</option>
                <option value="EUR">EUR (€ Euros)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ciclo de Facturación
              </label>
              <select
                value={cicloCobro}
                onChange={(e) => setCicloCobro(e.target.value as SuscripcionCiclo)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
              >
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
                <option value="trimestral">Trimestral</option>
                <option value="semanal">Semanal</option>
              </select>
            </div>
          </div>

          {/* Dates & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Día del Mes (1 - 31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaCobro}
                onChange={(e) => handleDiaCobroChange(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Próxima Fecha de Pago *
              </label>
              <input
                type="date"
                required
                value={proximaFechaPago}
                onChange={(e) => setProximaFechaPago(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Método de Pago
              </label>
              <input
                type="text"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                placeholder="Ej. Visa Corp *4112, PayPal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* Trial Details if en_prueba */}
          {estado === 'en_prueba' && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Clock className="w-4 h-4" />
                <span>Configuración de Período de Prueba (Trial)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Días Totales de Prueba
                  </label>
                  <input
                    type="number"
                    value={diasPrueba}
                    onChange={(e) => setDiasPrueba(e.target.value)}
                    placeholder="14"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Fecha de Finalización de Prueba
                  </label>
                  <input
                    type="date"
                    value={fechaFinPrueba || proximaFechaPago}
                    onChange={(e) => setFechaFinPrueba(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-200 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Email Alert Settings */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span>Configuración de Alertas a mi Correo</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertaActiva}
                  onChange={(e) => setAlertaActiva(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-semibold">Alerta Habilitada</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Días de Anticipación para Avisarme
                </label>
                <select
                  value={diasAnticipacion}
                  onChange={(e) => setDiasAnticipacion(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value={1}>1 Día Antes del Cobro</option>
                  <option value={2}>2 Días Antes del Cobro</option>
                  <option value={3}>3 Días Antes del Cobro (Recomendado)</option>
                  <option value={5}>5 Días Antes del Cobro</option>
                  <option value={7}>7 Días Antes del Cobro</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Correo Destino del Fundador / Admin
                </label>
                <input
                  type="email"
                  value={emailAlerta}
                  onChange={(e) => setEmailAlerta(e.target.value)}
                  placeholder="ej. founder@startup.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Management URL & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Enlace Directo al Panel de Facturación del Proveedor (URL)</span>
              </label>
              <input
                type="url"
                value={urlPanelGestion}
                onChange={(e) => setUrlPanelGestion(e.target.value)}
                placeholder="https://billing.stripe.com o https://platform.openai.com/billing"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Notas Adicionales / Instrucciones / Licencias</span>
              </label>
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. Plan Pro con 2 asientos de desarrollador. En caso de no renovación, descargar backups antes del día 10."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none"
              />
            </div>
          </div>

          {/* Auto Renewal checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="autoRenovacion"
              checked={autoRenovacion}
              onChange={(e) => setAutoRenovacion(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="autoRenovacion" className="text-xs text-slate-300 cursor-pointer">
              Auto-renovación habilitada en la tarjeta del proveedor
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{initialSub ? 'Guardar Cambios' : 'Registrar Suscripción'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
