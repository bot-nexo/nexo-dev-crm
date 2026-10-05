/**
 * TypeScript Data Models for Nexo Dev Studio CRM
 */

export type ClienteEstado = 'activo' | 'inactivo';
export type ProyectoEstado = 'activo' | 'pausado' | 'finalizado';
export type PagoEstado = 'pagado' | 'pendiente' | 'vencido';
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

export interface Proyecto {
  id: string;
  cliente_id: string;
  nombre_proyecto: string;
  valor_mensual: number; // MRR in USD
  dia_cobro: number; // 1 to 31
  estado: ProyectoEstado;
  fecha_inicio: string;
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
  proyeccionMensualMRR: number;
  clientesActivosCount: number;
  proyectosActivosCount: number;
  pagosCobradosCount: number;
  pagosPendientesCount: number;
  pagosVencidosCount: number;
}
