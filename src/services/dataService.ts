import { Cliente, Proyecto, Pago, Notificacion, FinancialSummary, RecursoTecnico, EtapaPago } from '../types/database';
import { getSupabaseClient } from '../lib/supabase';

const STORAGE_KEY_CLIENTES = 'nexo_data_clientes_v1';
const STORAGE_KEY_PROYECTOS = 'nexo_data_proyectos_v1';
const STORAGE_KEY_PAGOS = 'nexo_data_pagos_v1';
const STORAGE_KEY_NOTIFICACIONES = 'nexo_data_notificaciones_v1';

// Empty seeds - strictly real database data
const SEED_CLIENTES: Cliente[] = [];
const SEED_PROYECTOS: Proyecto[] = [];
const SEED_PAGOS: Pago[] = [];
const SEED_NOTIFICACIONES: Notificacion[] = [];

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
function getLocal<T>(key: string, defaultValue: T[] = []): T[] {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return defaultValue;
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
      if (error) console.warn('Supabase getClientes error:', error.message);
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
          if (error) throw error;
          if (data) {
            const list = getLocal<Cliente>(STORAGE_KEY_CLIENTES, []);
            list.unshift(data as Cliente);
            setLocal(STORAGE_KEY_CLIENTES, list);
            return data as Cliente;
          }
        } else {
          const { data, error } = await client.from('clientes').update(itemToSave).eq('id', itemToSave.id).select().single();
          if (error) throw error;
          if (data) {
            const list = getLocal<Cliente>(STORAGE_KEY_CLIENTES, []);
            const idx = list.findIndex((c) => c.id === itemToSave.id);
            if (idx >= 0) list[idx] = data as Cliente;
            else list.unshift(data as Cliente);
            setLocal(STORAGE_KEY_CLIENTES, list);
            return data as Cliente;
          }
        }
      } catch (e: any) {
        console.error('Supabase saveCliente error:', e);
        // Save locally so the user never loses data
        const list = getLocal<Cliente>(STORAGE_KEY_CLIENTES, SEED_CLIENTES);
        const index = list.findIndex((c) => c.id === itemToSave.id);
        if (index >= 0) list[index] = itemToSave;
        else list.unshift(itemToSave);
        setLocal(STORAGE_KEY_CLIENTES, list);
        return itemToSave;
      }
    }

    // Local storage fallback when offline
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
        const { error } = await client.from('clientes').delete().eq('id', id);
        if (error) throw error;
      } catch (e: any) {
        console.error('Supabase deleteCliente error:', e);
      }
    }

    const clientes = getLocal<Cliente>(STORAGE_KEY_CLIENTES, []).filter((c) => c.id !== id);
    setLocal(STORAGE_KEY_CLIENTES, clientes);

    const proyectos = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, []).filter((p) => p.cliente_id !== id);
    setLocal(STORAGE_KEY_PROYECTOS, proyectos);

    const pagos = getLocal<Pago>(STORAGE_KEY_PAGOS, []).filter((p) => p.cliente_id !== id);
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
      if (error) console.warn('Supabase getProyectos error:', error.message);
    }
    return getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, SEED_PROYECTOS);
  },

  async saveProyecto(proyecto: Partial<Proyecto> & { nombre_proyecto: string; cliente_id: string }): Promise<Proyecto> {
    const isNew = !proyecto.id;
    const client = getSupabaseClient();

    // Auto calculate fecha_fin_prueba if estado is en_prueba
    let diasPrueba = proyecto.dias_prueba != null ? Number(proyecto.dias_prueba) : null;
    let fechaFinPrueba = proyecto.fecha_fin_prueba || null;

    if (proyecto.estado === 'en_prueba') {
      diasPrueba = diasPrueba || 7;
      if (!fechaFinPrueba) {
        const startStr = proyecto.fecha_inicio || new Date().toISOString().split('T')[0];
        const [y, m, d] = startStr.split('T')[0].split('-').map(Number);
        const startDate = new Date(y, m - 1, d);
        startDate.setDate(startDate.getDate() + diasPrueba);
        const fy = startDate.getFullYear();
        const fm = String(startDate.getMonth() + 1).padStart(2, '0');
        const fd = String(startDate.getDate()).padStart(2, '0');
        fechaFinPrueba = `${fy}-${fm}-${fd}`;
      }
    }

    const itemToSave: Proyecto = {
      id: proyecto.id || generateUUID(),
      cliente_id: proyecto.cliente_id,
      nombre_proyecto: proyecto.nombre_proyecto,
      estado: proyecto.estado || 'activo',
      fecha_inicio: proyecto.fecha_inicio || new Date().toISOString().split('T')[0],
      
      modelo_cobro: proyecto.modelo_cobro || 'mensual_alquiler',
      valor_mensual: Number(proyecto.valor_mensual) || 0,
      dia_cobro: Math.max(1, Math.min(31, Number(proyecto.dia_cobro) || 5)),

      valor_total_venta: proyecto.valor_total_venta != null ? Number(proyecto.valor_total_venta) : null,
      modalidad_pago_venta: proyecto.modalidad_pago_venta || null,
      etapas_pago: proyecto.etapas_pago || null,

      dias_prueba: diasPrueba,
      fecha_fin_prueba: fechaFinPrueba,
      valor_implementacion: Number(proyecto.valor_implementacion) || 0,
      estado_implementacion: proyecto.estado_implementacion || (Number(proyecto.valor_implementacion) > 0 ? 'pendiente' : 'no_aplica'),
      fecha_pago_implementacion: proyecto.fecha_pago_implementacion || null,

      recursos_tecnicos: proyecto.recursos_tecnicos || [],

      updated_at: new Date().toISOString(),
    };

    if (client) {
      try {
        if (isNew) {
          const { data, error } = await client.from('proyectos').insert([itemToSave]).select().single();
          if (error) {
            // Fallback for missing new columns on older Supabase tables
            console.warn('Retrying saveProyecto with basic columns due to Supabase error:', error.message);
            const basicPayload = {
              id: itemToSave.id,
              cliente_id: itemToSave.cliente_id,
              nombre_proyecto: itemToSave.nombre_proyecto,
              valor_mensual: itemToSave.valor_mensual,
              dia_cobro: itemToSave.dia_cobro,
              estado: itemToSave.estado === 'en_desarrollo' || itemToSave.estado === 'en_prueba' ? 'activo' : itemToSave.estado,
              fecha_inicio: itemToSave.fecha_inicio,
            };
            await client.from('proyectos').insert([basicPayload]);
          } else if (data) {
            const list = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, []);
            list.unshift(itemToSave);
            setLocal(STORAGE_KEY_PROYECTOS, list);
            return itemToSave;
          }
        } else {
          const { data, error } = await client.from('proyectos').update(itemToSave).eq('id', itemToSave.id).select().single();
          if (error) {
            console.warn('Retrying updateProyecto with basic columns due to Supabase error:', error.message);
            const basicPayload = {
              nombre_proyecto: itemToSave.nombre_proyecto,
              valor_mensual: itemToSave.valor_mensual,
              dia_cobro: itemToSave.dia_cobro,
              fecha_inicio: itemToSave.fecha_inicio,
            };
            await client.from('proyectos').update(basicPayload).eq('id', itemToSave.id);
          } else if (data) {
            const list = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, []);
            const idx = list.findIndex((p) => p.id === itemToSave.id);
            if (idx >= 0) list[idx] = itemToSave;
            else list.unshift(itemToSave);
            setLocal(STORAGE_KEY_PROYECTOS, list);
            return itemToSave;
          }
        }
      } catch (e: any) {
        console.error('Supabase saveProyecto exception:', e);
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
        const { error } = await client.from('proyectos').delete().eq('id', id);
        if (error) console.warn('Supabase deleteProyecto warning:', error.message);
      } catch (e: any) {
        console.error('Supabase deleteProyecto exception:', e);
      }
    }

    const list = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, []).filter((p) => p.id !== id);
    setLocal(STORAGE_KEY_PROYECTOS, list);

    const pagos = getLocal<Pago>(STORAGE_KEY_PAGOS, []).filter((p) => p.proyecto_id !== id);
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
      if (error) console.warn('Supabase getPagos error:', error.message);
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
      tipo_pago: pago.tipo_pago || 'cuota_mensual',
      comprobante_url: pago.comprobante_url || null,
      notas: pago.notas || null,
      updated_at: new Date().toISOString(),
    };

    let savedResult: Pago = itemToSave;

    if (client) {
      try {
        if (isNew) {
          const { data, error } = await client.from('pagos').insert([itemToSave]).select().single();
          if (error) {
            // Handle missing column "tipo_pago" on older Supabase tables
            console.warn('Retrying savePago without tipo_pago due to Supabase error:', error.message);
            const { tipo_pago, ...basicPayload } = itemToSave;
            await client.from('pagos').insert([basicPayload]);
          } else if (data) {
            savedResult = data as Pago;
          }
        } else {
          const { data, error } = await client.from('pagos').update(itemToSave).eq('id', itemToSave.id).select().single();
          if (error) {
            console.warn('Retrying updatePago without tipo_pago due to Supabase error:', error.message);
            const { tipo_pago, ...basicPayload } = itemToSave;
            await client.from('pagos').update(basicPayload).eq('id', itemToSave.id);
          } else if (data) {
            savedResult = data as Pago;
          }
        }
      } catch (e: any) {
        console.error('Supabase savePago exception:', e);
      }
    }

    // Always update local storage as reliable source of truth
    const list = getLocal<Pago>(STORAGE_KEY_PAGOS, SEED_PAGOS);
    const index = list.findIndex((p) => p.id === itemToSave.id);
    if (index >= 0) {
      list[index] = itemToSave;
    } else {
      list.unshift(itemToSave);
    }
    setLocal(STORAGE_KEY_PAGOS, list);

    // Auto-update project implementation status if payment is of type 'implementacion' and 'pagado'
    if (itemToSave.tipo_pago === 'implementacion' && itemToSave.estado === 'pagado') {
      try {
        const proyectos = await this.getProyectos();
        const targetProj = proyectos.find((p) => p.id === itemToSave.proyecto_id);
        if (targetProj) {
          await this.saveProyecto({
            ...targetProj,
            estado_implementacion: 'pagado',
            fecha_pago_implementacion: itemToSave.fecha_pago,
          });
        }
      } catch (err) {
        console.warn('Could not auto-update project implementation status:', err);
      }
    }

    return itemToSave;
  },

  async deletePago(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('pagos').delete().eq('id', id);
        if (error) console.warn('Supabase deletePago warning:', error.message);
      } catch (e: any) {
        console.error('Supabase deletePago exception:', e);
      }
    }
    const list = getLocal<Pago>(STORAGE_KEY_PAGOS, []).filter((p) => p.id !== id);
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
      if (error) console.warn('Supabase getNotificaciones error:', error.message);
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
        if (!error && data) {
          const list = getLocal<Notificacion>(STORAGE_KEY_NOTIFICACIONES, []);
          list.unshift(data as Notificacion);
          setLocal(STORAGE_KEY_NOTIFICACIONES, list);
          return data as Notificacion;
        }
      } catch (e: any) {
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
    const devProjects = proyectos.filter((p) => p.estado === 'en_desarrollo');
    const trialProjects = proyectos.filter((p) => p.estado === 'en_prueba');
    
    const proyeccionMRR = activeProjects
      .filter((p) => (p.modelo_cobro || 'mensual_alquiler') === 'mensual_alquiler')
      .reduce((sum, p) => sum + (Number(p.valor_mensual) || 0), 0);

    let totalIngresosMes = 0;
    let totalPendienteMes = 0;
    let totalVencido = 0;
    let totalIngresosImplementacion = 0;
    let totalIngresosVentaDirecta = 0;

    let pagosCobradosCount = 0;
    let pagosPendientesCount = 0;
    let pagosVencidosCount = 0;

    pagos.forEach((p) => {
      const amount = Number(p.monto) || 0;
      if (p.estado === 'pagado') {
        if (p.tipo_pago === 'implementacion') {
          totalIngresosImplementacion += amount;
          totalIngresosMes += amount;
          pagosCobradosCount++;
        } else if (p.tipo_pago === 'venta_directa_hito') {
          totalIngresosVentaDirecta += amount;
          totalIngresosMes += amount;
          pagosCobradosCount++;
        } else if (p.periodo_mes === currentPeriodMonth) {
          totalIngresosMes += amount;
          pagosCobradosCount++;
        }
      } else if (p.estado === 'pendiente') {
        if (p.periodo_mes === currentPeriodMonth || p.tipo_pago === 'implementacion' || p.tipo_pago === 'venta_directa_hito') {
          totalPendienteMes += amount;
          pagosPendientesCount++;
        }
      } else if (p.estado === 'vencido') {
        totalVencido += amount;
        pagosVencidosCount++;
      }
    });

    // Count expired trials
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let pruebasVencidasCount = 0;

    trialProjects.forEach((p) => {
      const days = p.dias_prueba || 7;
      let fechaFin = p.fecha_fin_prueba;
      if (!fechaFin && p.fecha_inicio) {
        const parts = p.fecha_inicio.split('T')[0].split('-').map(Number);
        const startDate = new Date(parts[0], parts[1] - 1, parts[2]);
        startDate.setDate(startDate.getDate() + days);
        const fy = startDate.getFullYear();
        const fm = String(startDate.getMonth() + 1).padStart(2, '0');
        const fd = String(startDate.getDate()).padStart(2, '0');
        fechaFin = `${fy}-${fm}-${fd}`;
      }
      if (fechaFin) {
        const parts = fechaFin.split('-').map(Number);
        const finDate = new Date(parts[0], parts[1] - 1, parts[2]);
        finDate.setHours(0, 0, 0, 0);
        if (finDate.getTime() < today.getTime()) {
          pruebasVencidasCount++;
        }
      }
    });

    // Calculate implementation fee metrics
    let implementacionesPendientesCount = 0;
    let totalPendienteImplementacion = 0;

    proyectos.forEach((p) => {
      const implVal = Number(p.valor_implementacion) || 0;
      if (implVal > 0 && p.estado_implementacion === 'pendiente') {
        implementacionesPendientesCount++;
        totalPendienteImplementacion += implVal;
      }
    });

    const activeClientsSet = new Set(activeProjects.map((p) => p.cliente_id));

    return {
      totalIngresosMes,
      totalPendienteMes,
      totalVencido,
      totalIngresosImplementacion,
      totalIngresosVentaDirecta,
      proyeccionMensualMRR: proyeccionMRR,
      clientesActivosCount: activeClientsSet.size,
      proyectosActivosCount: activeProjects.length,
      proyectosEnDesarrolloCount: devProjects.length,
      proyectosEnPruebaCount: trialProjects.length,
      pruebasVencidasCount,
      implementacionesPendientesCount,
      totalPendienteImplementacion,
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
      const clientes = getLocal<Cliente>(STORAGE_KEY_CLIENTES, []);
      const proyectos = getLocal<Proyecto>(STORAGE_KEY_PROYECTOS, []);
      const pagos = getLocal<Pago>(STORAGE_KEY_PAGOS, []);
      const notificaciones = getLocal<Notificacion>(STORAGE_KEY_NOTIFICACIONES, []);

      if (clientes.length) {
        const { error: err1 } = await client.from('clientes').upsert(clientes);
        if (err1) throw err1;
      }

      if (proyectos.length) {
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

  async clearLocalCache() {
    localStorage.removeItem(STORAGE_KEY_CLIENTES);
    localStorage.removeItem(STORAGE_KEY_PROYECTOS);
    localStorage.removeItem(STORAGE_KEY_PAGOS);
    localStorage.removeItem(STORAGE_KEY_NOTIFICACIONES);
  },
};
