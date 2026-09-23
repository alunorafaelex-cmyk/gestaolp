import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'lp_supabase_url';
const STORAGE_KEY_KEY = 'lp_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string; isCustom: boolean } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return { url: envUrl, anonKey: envKey, isCustom: false };
  }

  // Fallback to local stored keys if environment vars are not yet configured
  const localUrl = localStorage.getItem(STORAGE_KEY_URL)?.trim() || '';
  const localKey = localStorage.getItem(STORAGE_KEY_KEY)?.trim() || '';

  if (localUrl && localKey) {
    return { url: localUrl, anonKey: localKey, isCustom: true };
  }

  return { url: envUrl, anonKey: envKey, isCustom: false };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  window.location.reload();
}

export function clearCustomSupabaseCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_KEY);
  window.location.reload();
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseCredentials();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

// Fallback dummy URL/key to avoid initialization crash when credentials are not yet entered
const effectiveUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const effectiveKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
