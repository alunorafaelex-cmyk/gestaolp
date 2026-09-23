import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'lp_supabase_url';
const STORAGE_KEY_KEY = 'lp_supabase_publishable_key';

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const envKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();

const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL)?.trim() : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY)?.trim() : '';

const supabaseUrl =
  envUrl ||
  localUrl ||
  'https://tmhklhgmvevgnilxojxv.supabase.co';

const supabaseKey =
  envKey ||
  localKey ||
  'sb_publishable_FIPOSJX5HbHtd9o_kS0l-w_G6VyTDld';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function getSupabaseCredentials() {
  return {
    url: supabaseUrl,
    key: supabaseKey,
    anonKey: supabaseKey,
    publishableKey: supabaseKey,
    isCustom: Boolean(localUrl && localKey),
  };
}

export function saveCustomSupabaseCredentials(url: string, key: string): void {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, key.trim());
  window.location.reload();
}

export function clearCustomSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  window.location.reload();
}
