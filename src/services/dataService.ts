import { Cliente, Proyecto, Pago, Notificacion, FinancialSummary } from '../types/database';
import { getSupabaseClient } from '../lib/supabase';

const STORAGE_KEY_CLIENTES = 'nexo_data_clientes_v1';
const STORAGE_KEY_PROYECTOS = 'nexo_data_proyectos_v1';
const STORAGE_KEY_PAGOS = 'nexo_data_pagos_v1';
const STORAGE_KEY_NOTIFICACIONES = 'nexo_data_notificaciones_v1';

// Seed initial demo data (matching supabase-schema.sql)
const SEED_CLIENTES: Cliente[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    nombre: 'Lucas Morales',
    empresa: 'Aura Fintech',
    email: 'lucas@aurafintech.io',
    telefono: '+5491145678901',
    estado: 'activo',
    fecha_registro: '2026-01-10T10:00:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    nombre: 'Valeria Rossi',
    empresa: 'Kroma Digital',
    email: 'valeria@kromadigital.com',
    telefono: '+5491198765432',
    estado: 'activo',
    fecha_registro: '2026-02-14T14:30:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    nombre: 'Martín Gómez',
    empresa: 'Vortex Logistics',
    email: 'mgomez@vortexlog.com',
    telefono: '+525512345678',
    estado: 'activo',
    fecha_registro: '2026-01-20T09:15:00Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    nombre: 'Camila Benítez',
    empresa: 'Nova Retail Group',
    email: 'camila@novaretail.co',
    telefono: '+573105557890',
    estado: 'inactivo',
    fecha_registro: '2026-03-05T11:45:00Z',
  },
];

const SEED_PROYECTOS: Proyecto[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    cliente_id: 'a0000000-0000-0000-0000-000000000001',
    nombre_proyecto: 'Plataforma Core Banking & API',
    valor_mensual: 2800,
    dia_cobro: 5,
    estado: 'activo',
    fecha_inicio: '2026-01-15',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    cliente_id: 'a0000000-0000-0000-0000-000000000002',
    nombre_proyecto: 'Desarrollo E-Commerce Headless & PWA',
    valor_mensual: 1950,
    dia_cobro: 10,
    estado: 'activo',
    fecha_inicio: '2026-03-01',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    cliente_id: 'a0000000-0000-0000-0000-000000000003',
    nombre_proyecto: 'Sistema SaaS de Envíos en Tiempo Real',
    valor_mensual: 3400,
    dia_cobro: 1,
    estado: 'activo',
    fecha_inicio: '2026-02-10',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    cliente_id: 'a0000000-0000-0000-0000-000000000004',
    nombre_proyecto: 'App Mobile de Fidelización',
    valor_mensual: 1200,
    dia_cobro: 20,
    estado: 'pausado',
    fecha_inicio: '2026-04-01',
  },
];

const SEED_PAGOS: Pago[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    proyecto_id: 'b0000000-0000-0000-0000-000000000001',
    cliente_id: 'a0000000-0000-0000-0000-000000000001',
    monto: 2800,
    fecha_pago: '2026-10-05',
    periodo_mes: '2026-10',
    estado: 'pagado',
    comprobante_url: 'https://storage.googleapis.com/recibos/recibo-nexo-1001.pdf',
    notas: 'Pago mensual transferido vía Wise con éxito.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    proyecto_id: 'b0000000-0000-0000-0000-000000000002',
    cliente_id: 'a0000000-0000-0000-0000-000000000002',
    monto: 1950,
    fecha_pago: '2026-10-10',
    periodo_mes: '2026-10',
    estado: 'pendiente',
    comprobante_url: null,
    notas: 'Cobro programado para el día 10 de octubre.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    proyecto_id: 'b0000000-0000-0000-0000-000000000003',
    cliente_id: 'a0000000-0000-0000-0000-000000000003',
    monto: 3400,
    fecha_pago: '2026-10-01',
    periodo_mes: '2026-10',
    estado: 'vencido',
    comprobante_url: null,
    notas: 'Factura vencida hace 4 días. Se requiere aviso de mora urgente.',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    proyecto_id: 'b0000000-0000-0000-0000-000000000001',
    cliente_id: 'a0000000-0000-0000-0000-000000000001',
    monto: 2800,
    fecha_pago: '2026-09-05',
    periodo_mes: '2026-09',
    estado: 'pagado',
    comprobante_url: 'https://storage.googleapis.com/recibos/recibo-nexo-0901.pdf',
    notas: 'Mes de septiembre cancelado puntualmente.',
  },
];

const SEED_NOTIFICACIONES: Notificacion[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    cliente_id: 'a0000000-0000-0000-0000-000000000001',
    tipo: 'whatsapp',
    mensaje:
      'Hola Lucas! Desde Nexo Dev Studio confirmamos la recepción de tu pago por $2,800.00 USD correspondiente al periodo 2026-10. ¡Muchas gracias!',
    fecha_envio: '2026-10-05T10:15:00Z',
    estado: 'enviado',
    referencia_pago_id: 'c0000000-0000-0000-0000-000000000001',
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    cliente_id: 'a0000000-0000-0000-0000-000000000003',
    tipo: 'email',
    mensaje:
      'Estimado Martín Gómez, le recordamos que el abono mensual de Sistema SaaS de Envíos correspondiente a 2026-10 por $3,400.00 USD se encuentra en mora.',
    fecha_envio: '2026-10-04T09:00:00Z',
    estado: 'enviado',
    referencia_pago_id: 'c0000000-0000-0000-0000-000000000003',
  },
];

// Helper to generate UUIDs
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Local storage accessors
function getLocal<T>(key: string, seed: T[]): T[] {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return seed;
  }
}

function setLocal<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key}:`, e);
  }
}

export const DataService = {
  // CLIENTES
  async getClientes(): Promise<Cliente[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('clientes')
        .select('*')
        .order('fecha_registro', { ascending: false });
      if (!error && data) {
        setLocal(STORAGE_KEY_CLIENTES, data);
        return data as Cliente[];
      }
      console.warn('Supabase getClientes error, fallback to local:', error);
    }
    return getLocal<Cliente>(STORAGE_KEY_CLIENTES, SEED_CLIENTES);
  },

  async saveCliente(cliente: Partial<Cliente> & { nombre: string; email: string }): Promise<Cliente> {
    const isNew = !cliente.id;
    const client = getSupabaseClient();
    const itemToSave: Cliente = {
      id: cliente.id || generateUUID(),
      nombre: cliente.nombre,
      empresa: cliente.empresa || '',
      email: cliente.email,
      telefono: cliente.telefono || '',
      estado: cliente.estado || 'activo',
      fecha_registro: cliente.fecha_registro || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (client) {
      try {
        if (isNew) {
          const { data, error } = await client.from('clientes').insert([itemToSave]).select().single();
          if (!error && data) return data as Cliente;
        } else {
          const { data, error } = await client.from('clientes').update(itemToSave).eq('id', itemToSave.id).select().single();
          if (!error && data) return data as Cliente;
        }
      } catch (e) {
        console.warn('Supabase saveCliente failed, continuing locally:', e);
      }
    }

    // Local fallback
    const list = getLocal<Cliente>(STORAGE_KEY_CLIENTES, SEED_CLIENTES);
    const index = list.findIndex((c) => c.id === itemToSave.id);
    if (index >= 0) {
      list[index] = itemToSave;
    } else {
      list.unshift(itemToSave);
    }
    setLocal(STORAGE_KEY_CLIENTES, list);
    return itemToSave;
  },

  async deleteCliente(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('clientes').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }

    const clientes = getLocal<Cliente>(STORAGE_KEY_CLIENTES, SEED_CLIENTES).filter((c) => c.id !== id);
    setLocal(STORAGE_KEY_CLIENTES, clientes);

    // Cascade local delete
    const proyectos = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, SEED_PROYECTOS).filter((p) => p.cliente_id !== id);
    setLocal(STORAGE_KEY_PROYECTOS, proyectos);

    const pagos = getLocal<Pago>(STORAGE_KEY_PAGOS, SEED_PAGOS).filter((p) => p.cliente_id !== id);
    setLocal(STORAGE_KEY_PAGOS, pagos);

    return true;
  },

  // PROYECTOS
  async getProyectos(): Promise<Proyecto[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setLocal(STORAGE_KEY_PROYECTOS, data);
        return data as Proyecto[];
      }
    }
    return getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, SEED_PROYECTOS);
  },

  async saveProyecto(proyecto: Partial<Proyecto> & { nombre_proyecto: string; cliente_id: string }): Promise<Proyecto> {
    const isNew = !proyecto.id;
    const client = getSupabaseClient();
    const itemToSave: Proyecto = {
      id: proyecto.id || generateUUID(),
      cliente_id: proyecto.cliente_id,
      nombre_proyecto: proyecto.nombre_proyecto,
      valor_mensual: Number(proyecto.valor_mensual) || 0,
      dia_cobro: Math.max(1, Math.min(31, Number(proyecto.dia_cobro) || 1)),
      estado: proyecto.estado || 'activo',
      fecha_inicio: proyecto.fecha_inicio || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    };

    if (client) {
      try {
        if (isNew) {
          const { data, error } = await client.from('proyectos').insert([itemToSave]).select().single();
          if (!error && data) return data as Proyecto;
        } else {
          const { data, error } = await client.from('proyectos').update(itemToSave).eq('id', itemToSave.id).select().single();
          if (!error && data) return data as Proyecto;
        }
      } catch (e) {
        console.warn('Supabase saveProyecto failed, local saved:', e);
      }
    }

    const list = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, SEED_PROYECTOS);
    const index = list.findIndex((p) => p.id === itemToSave.id);
    if (index >= 0) {
      list[index] = itemToSave;
    } else {
      list.unshift(itemToSave);
    }
    setLocal(STORAGE_KEY_PROYECTOS, list);
    return itemToSave;
  },

  async deleteProyecto(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('proyectos').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteProyecto error:', e);
      }
    }

    const list = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, SEED_PROYECTOS).filter((p) => p.id !== id);
    setLocal(STORAGE_KEY_PROYECTOS, list);

    const pagos = getLocal<Pago>(STORAGE_KEY_PAGOS, SEED_PAGOS).filter((p) => p.proyecto_id !== id);
    setLocal(STORAGE_KEY_PAGOS, pagos);

    return true;
  },

  // PAGOS
  async getPagos(): Promise<Pago[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('pagos')
        .select('*')
        .order('fecha_pago', { ascending: false });
      if (!error && data) {
        setLocal(STORAGE_KEY_PAGOS, data);
        return data as Pago[];
      }
    }
    return getLocal<Pago>(STORAGE_KEY_PAGOS, SEED_PAGOS);
  },

  async savePago(pago: Partial<Pago> & { proyecto_id: string; cliente_id: string; monto: number }): Promise<Pago> {
    const isNew = !pago.id;
    const client = getSupabaseClient();
    const itemToSave: Pago = {
      id: pago.id || generateUUID(),
      proyecto_id: pago.proyecto_id,
      cliente_id: pago.cliente_id,
      monto: Number(pago.monto) || 0,
      fecha_pago: pago.fecha_pago || new Date().toISOString().split('T')[0],
      periodo_mes: pago.periodo_mes || new Date().toISOString().slice(0, 7),
      estado: pago.estado || 'pendiente',
      comprobante_url: pago.comprobante_url || null,
      notas: pago.notas || null,
      updated_at: new Date().toISOString(),
    };

    if (client) {
      try {
        if (isNew) {
          const { data, error } = await client.from('pagos').insert([itemToSave]).select().single();
          if (!error && data) return data as Pago;
        } else {
          const { data, error } = await client.from('pagos').update(itemToSave).eq('id', itemToSave.id).select().single();
          if (!error && data) return data as Pago;
        }
      } catch (e) {
        console.warn('Supabase savePago failed, local saved:', e);
      }
    }

    const list = getLocal<Pago>(STORAGE_KEY_PAGOS, SEED_PAGOS);
    const index = list.findIndex((p) => p.id === itemToSave.id);
    if (index >= 0) {
      list[index] = itemToSave;
    } else {
      list.unshift(itemToSave);
    }
    setLocal(STORAGE_KEY_PAGOS, list);
    return itemToSave;
  },

  async deletePago(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('pagos').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deletePago error:', e);
      }
    }
    const list = getLocal<Pago>(STORAGE_KEY_PAGOS, SEED_PAGOS).filter((p) => p.id !== id);
    setLocal(STORAGE_KEY_PAGOS, list);
    return true;
  },

  // NOTIFICACIONES
  async getNotificaciones(): Promise<Notificacion[]> {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('notificaciones')
        .select('*')
        .order('fecha_envio', { ascending: false });
      if (!error && data) {
        setLocal(STORAGE_KEY_NOTIFICACIONES, data);
        return data as Notificacion[];
      }
    }
    return getLocal<Notificacion>(STORAGE_KEY_NOTIFICACIONES, SEED_NOTIFICACIONES);
  },

  async logNotificacion(notif: Partial<Notificacion> & { cliente_id: string; mensaje: string; tipo: 'email' | 'whatsapp' }): Promise<Notificacion> {
    const client = getSupabaseClient();
    const itemToSave: Notificacion = {
      id: notif.id || generateUUID(),
      cliente_id: notif.cliente_id,
      tipo: notif.tipo,
      mensaje: notif.mensaje,
      fecha_envio: notif.fecha_envio || new Date().toISOString(),
      estado: notif.estado || 'enviado',
      referencia_pago_id: notif.referencia_pago_id || null,
    };

    if (client) {
      try {
        const { data, error } = await client.from('notificaciones').insert([itemToSave]).select().single();
        if (!error && data) return data as Notificacion;
      } catch (e) {
        console.warn('Supabase logNotificacion failed:', e);
      }
    }

    const list = getLocal<Notificacion>(STORAGE_KEY_NOTIFICACIONES, SEED_NOTIFICACIONES);
    list.unshift(itemToSave);
    setLocal(STORAGE_KEY_NOTIFICACIONES, list);
    return itemToSave;
  },

  // HYDRATED COMBINED DATA
  async getHydratedData(): Promise<{
    clientes: Cliente[];
    proyectos: Proyecto[];
    pagos: Pago[];
    notificaciones: Notificacion[];
  }> {
    const [rawClientes, rawProyectos, rawPagos, rawNotificaciones] = await Promise.all([
      this.getClientes(),
      this.getProyectos(),
      this.getPagos(),
      this.getNotificaciones(),
    ]);

    const clienteMap = new Map(rawClientes.map((c) => [c.id, c]));
    const proyectoMap = new Map(rawProyectos.map((p) => [p.id, p]));

    const proyectos = rawProyectos.map((p) => ({
      ...p,
      cliente: clienteMap.get(p.cliente_id),
    }));

    const pagos = rawPagos.map((p) => ({
      ...p,
      cliente: clienteMap.get(p.cliente_id),
      proyecto: proyectoMap.get(p.proyecto_id),
    }));

    const notificaciones = rawNotificaciones.map((n) => ({
      ...n,
      cliente: clienteMap.get(n.cliente_id),
    }));

    return {
      clientes: rawClientes,
      proyectos,
      pagos,
      notificaciones,
    };
  },

  // FINANCIAL SUMMARY COMPUTATION
  calculateFinancialSummary(proyectos: Proyecto[], pagos: Pago[], currentPeriodMonth: string): FinancialSummary {
    const activeProjects = proyectos.filter((p) => p.estado === 'activo');
    const proyeccionMRR = activeProjects.reduce((sum, p) => sum + (Number(p.valor_mensual) || 0), 0);

    const monthPayments = pagos.filter((p) => p.periodo_mes === currentPeriodMonth);

    let totalIngresosMes = 0;
    let totalPendienteMes = 0;
    let totalVencido = 0;

    let pagosCobradosCount = 0;
    let pagosPendientesCount = 0;
    let pagosVencidosCount = 0;

    pagos.forEach((p) => {
      const amount = Number(p.monto) || 0;
      if (p.estado === 'pagado') {
        if (p.periodo_mes === currentPeriodMonth) {
          totalIngresosMes += amount;
          pagosCobradosCount++;
        }
      } else if (p.estado === 'pendiente') {
        if (p.periodo_mes === currentPeriodMonth) {
          totalPendienteMes += amount;
          pagosPendientesCount++;
        }
      } else if (p.estado === 'vencido') {
        totalVencido += amount;
        pagosVencidosCount++;
      }
    });

    const activeClientsSet = new Set(activeProjects.map((p) => p.cliente_id));

    return {
      totalIngresosMes,
      totalPendienteMes,
      totalVencido,
      proyeccionMensualMRR: proyeccionMRR,
      clientesActivosCount: activeClientsSet.size,
      proyectosActivosCount: activeProjects.length,
      pagosCobradosCount,
      pagosPendientesCount,
      pagosVencidosCount,
    };
  },

  // SYNC UTILS
  async syncLocalToSupabase(): Promise<{ success: boolean; message: string; counts?: any }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'No se ha configurado la conexión con Supabase.' };
    }

    try {
      const clientes = getLocal<Cliente>(STORAGE_KEY_CLIENTES, SEED_CLIENTES);
      const proyectos = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, SEED_PROYECTOS);
      const pagos = getLocal<Pago>(STORAGE_KEY_PAGOS, SEED_PAGOS);
      const notificaciones = getLocal<Notificacion>(STORAGE_KEY_NOTIFICACIONES, SEED_NOTIFICACIONES);

      if (clientes.length) {
        const { error: err1 } = await client.from('clientes').upsert(clientes);
        if (err1) throw err1;
      }

      if (proyectos.length) {
        // Strip hydrated fields
        const cleanProyectos = proyectos.map(({ cliente, ...rest }) => rest);
        const { error: err2 } = await client.from('proyectos').upsert(cleanProyectos);
        if (err2) throw err2;
      }

      if (pagos.length) {
        const cleanPagos = pagos.map(({ cliente, proyecto, ...rest }) => rest);
        const { error: err3 } = await client.from('pagos').upsert(cleanPagos);
        if (err3) throw err3;
      }

      if (notificaciones.length) {
        const cleanNotif = notificaciones.map(({ cliente, ...rest }) => rest);
        const { error: err4 } = await client.from('notificaciones').upsert(cleanNotif);
        if (err4) throw err4;
      }

      return {
        success: true,
        message: '¡Datos sincronizados exitosamente a Supabase!',
        counts: {
          clientes: clientes.length,
          proyectos: proyectos.length,
          pagos: pagos.length,
          notificaciones: notificaciones.length,
        },
      };
    } catch (e: any) {
      return { success: false, message: `Error en la sincronización: ${e?.message || e}` };
    }
  },

  async resetToSeedData() {
    setLocal(STORAGE_KEY_CLIENTES, SEED_CLIENTES);
    setLocal(STORAGE_KEY_PROYECTOS, SEED_PROYECTOS);
    setLocal(STORAGE_KEY_PAGOS, SEED_PAGOS);
    setLocal(STORAGE_KEY_NOTIFICACIONES, SEED_NOTIFICACIONES);
  },
};
