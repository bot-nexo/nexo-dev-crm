import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_CONFIG = 'nexo_studio_app_config_v1';

export function getStoredConfig() {
  const defaults = {
    supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
    evolutionApiUrl: (import.meta.env.VITE_EVOLUTION_API_URL as string) || '',
    evolutionApiKey: (import.meta.env.VITE_EVOLUTION_API_KEY as string) || '',
    evolutionInstance: 'nexo-crm',
    resendApiKey: (import.meta.env.VITE_RESEND_API_KEY as string) || '',
    resendFromEmail: 'Nexo Dev Studio <billing@nexodevstudio.com>',
    currencySymbol: '$',
    agencyName: 'Nexo Dev Studio',
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      return { ...defaults, ...JSON.parse(saved) };
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
  return updated;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredConfig();
  const url = config.supabaseUrl?.trim();
  const key = config.supabaseAnonKey?.trim();

  // Basic validation that looks like a Supabase URL
  if (url && key && url.startsWith('http') && key.length > 20) {
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
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
