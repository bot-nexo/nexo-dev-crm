import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_CONFIG = 'nexo_studio_app_config_v1';

export function getStoredConfig() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  const envEvoUrl = (import.meta.env.VITE_EVOLUTION_API_URL as string) || '';
  const envEvoKey = (import.meta.env.VITE_EVOLUTION_API_KEY as string) || '';
  const envResendKey = (import.meta.env.VITE_RESEND_API_KEY as string) || '';

  const defaults = {
    supabaseUrl: envUrl,
    supabaseAnonKey: envAnonKey,
    evolutionApiUrl: envEvoUrl,
    evolutionApiKey: envEvoKey,
    evolutionInstance: 'nexo-crm',
    resendApiKey: envResendKey,
    resendFromEmail: 'Nexo Dev Studio <billing@nexodevstudio.com>',
    currencySymbol: '$',
    agencyName: 'Nexo Dev Studio',
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
        supabaseUrl: parsed.supabaseUrl?.trim() || envUrl,
        supabaseAnonKey: parsed.supabaseAnonKey?.trim() || envAnonKey,
        evolutionApiUrl: parsed.evolutionApiUrl?.trim() || envEvoUrl,
        evolutionApiKey: parsed.evolutionApiKey?.trim() || envEvoKey,
        resendApiKey: parsed.resendApiKey?.trim() || envResendKey,
      };
    }
  } catch (e) {
    console.error('Error reading stored config:', e);
  }
  return defaults;
}

export function saveStoredConfig(newConfig: Partial<ReturnType<typeof getStoredConfig>>) {
  const current = getStoredConfig();
  const updated = { ...current, ...newConfig };
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  // Reset cached client
  cachedClient = null;
  cachedUrl = null;
  cachedKey = null;
  return updated;
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl: string | null = null;
let cachedKey: string | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredConfig();
  const url = config.supabaseUrl?.trim();
  const key = config.supabaseAnonKey?.trim();

  if (url && key && url.startsWith('http') && key.length > 20) {
    if (cachedClient && cachedUrl === url && cachedKey === key) {
      return cachedClient;
    }
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      cachedUrl = url;
      cachedKey = key;
      return cachedClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return null;
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  try {
    const config = getStoredConfig();
    const targetUrl = (url || config.supabaseUrl)?.trim();
    const targetKey = (key || config.supabaseAnonKey)?.trim();

    if (!targetUrl || !targetKey) {
      return { success: false, message: 'URL o Clave Anon no proporcionada.' };
    }

    const client = createClient(targetUrl, targetKey);
    // Ping clientes table
    const { error } = await client.from('clientes').select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.clientes" does not exist')) {
        return {
          success: false,
          message: 'Conectó a Supabase pero las tablas no existen. Ejecuta el archivo SQL "supabase-schema.sql" en el Editor SQL de Supabase.',
        };
      }
      return { success: false, message: `Error de Supabase: ${error.message}` };
    }

    return { success: true, message: '¡Conexión exitosa con Supabase PostgreSQL!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error de red al conectar con Supabase.' };
  }
}
