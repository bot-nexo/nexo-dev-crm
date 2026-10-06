/**
 * TypeScript Data Models for Nexo Dev Studio CRM
 */

export type ClienteEstado = 'activo' | 'inactivo';
export type ProyectoEstado = 'activo' | 'en_desarrollo' | 'en_prueba' | 'pausado' | 'finalizado';
export type ImplementacionEstado = 'pendiente' | 'pagado' | 'no_aplica';
export type PagoEstado = 'pagado' | 'pendiente' | 'vencido';
export type TipoPago = 'cuota_mensual' | 'implementacion' | 'venta_directa_hito';
export type ModeloCobro = 'mensual_alquiler' | 'venta_directa';
export type NotificacionTipo = 'email' | 'whatsapp';
export type NotificacionEstado = 'enviado' | 'fallido' | 'pendiente';

export interface Cliente {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string; // WhatsApp formatted (+...)
  estado: ClienteEstado;
  fecha_registro: string;
  created_at?: string;
  updated_at?: string;
}

export interface EtapaPago {
  id: string;
  nombre_etapa: string; // Ej: "50% Anticipo Inicio", "30% Entrega Beta", "20% Entrega Final"
  porcentaje?: number;
  monto: number;
  estado: 'pendiente' | 'pagado';
  fecha_pago?: string | null;
}

export interface RecursoTecnico {
  id: string;
  nombre_campo: string; // Ej: "GitHub Repo", "Hosting / VPS", "Dominio Principal", "Envío Email (Resend)", "Mapbox API", "Base de Datos", o cualquier campo personalizado
  url_recurso: string;  // Ej: "https://github.com/nexo/app-cliente"
  correo_vinculado: string; // Ej: "admin@empresa.com"
  notas?: string | null; // Credenciales, keys o instrucciones
}

export interface Proyecto {
  id: string;
  cliente_id: string;
  nombre_proyecto: string;
  estado: ProyectoEstado;
  fecha_inicio: string;

  // Modelo de cobro del negocio
  modelo_cobro: ModeloCobro; // 'mensual_alquiler' vs 'venta_directa'
  
  // Si es alquiler mensual
  valor_mensual: number; // MRR in COP
  dia_cobro: number; // 1 to 31

  // Si es Venta Directa / Compra del programa
  valor_total_venta?: number | null;
  modalidad_pago_venta?: 'pago_unico' | 'etapas_hitos' | null;
  etapas_pago?: EtapaPago[] | null;

  // Pruebas gratis (7 ó 14 días)
  dias_prueba?: number | null;
  fecha_fin_prueba?: string | null;

  // Implementación (Pago único de puesta en producción)
  valor_implementacion?: number | null;
  estado_implementacion?: ImplementacionEstado;
  fecha_pago_implementacion?: string | null;

  // Creador de campos de recursos técnicos y credenciales (GitHub, Dominio, Hosting, Email, Mapbox, etc.)
  recursos_tecnicos?: RecursoTecnico[] | null;

  created_at?: string;
  updated_at?: string;
  // Hydrated relation for UI ease
  cliente?: Cliente;
}

export interface Pago {
  id: string;
  proyecto_id: string;
  cliente_id: string;
  monto: number;
  fecha_pago: string; // YYYY-MM-DD
  periodo_mes: string; // YYYY-MM
  estado: PagoEstado;
  tipo_pago?: TipoPago; // 'cuota_mensual' | 'implementacion' | 'venta_directa_hito'
  comprobante_url?: string | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
  // Hydrated relations for UI
  proyecto?: Proyecto;
  cliente?: Cliente;
}

export interface Notificacion {
  id: string;
  cliente_id: string;
  tipo: NotificacionTipo;
  mensaje: string;
  fecha_envio: string;
  estado: NotificacionEstado;
  referencia_pago_id?: string | null;
  created_at?: string;
  // Hydrated relation
  cliente?: Cliente;
}

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  evolutionApiUrl: string;
  evolutionApiKey: string;
  evolutionInstance: string;
  resendApiKey: string;
  resendFromEmail: string;
  currencySymbol: string;
  agencyName: string;
}

export interface FinancialSummary {
  totalIngresosMes: number;
  totalPendienteMes: number;
  totalVencido: number;
  totalIngresosImplementacion: number;
  totalIngresosVentaDirecta: number;
  proyeccionMensualMRR: number;
  clientesActivosCount: number;
  proyectosActivosCount: number;
  proyectosEnDesarrolloCount: number;
  proyectosEnPruebaCount: number;
  pruebasVencidasCount: number;
  implementacionesPendientesCount: number;
  totalPendienteImplementacion: number;
  pagosCobradosCount: number;
  pagosPendientesCount: number;
  pagosVencidosCount: number;
}
