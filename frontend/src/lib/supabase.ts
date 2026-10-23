import { createClient, type SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local.',
  );
}

const REMEMBER_ME_KEY = 'pcc_auth_remember_me';

function getAuthStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REMEMBER_ME_KEY) === 'true'
    ? window.localStorage
    : window.sessionStorage;
}

// Supabase's default browser storage is localStorage. This adapter lets the
// LoginPage choose persistent (localStorage) or tab-only (sessionStorage)
// sessions before signing in. It stores tokens only in browser storage and
// never puts them in application state, URLs, or logs.
const conditionalAuthStorage: SupportedStorage = {
  getItem(key: string) {
    return getAuthStorage()?.getItem(key) ?? null;
  },
  setItem(key: string, value: string) {
    getAuthStorage()?.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export function setRememberMePreference(remember: boolean) {
  if (typeof window === 'undefined') return;

  if (remember) {
    window.localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    window.localStorage.removeItem(REMEMBER_ME_KEY);

    // Remove any old persistent Supabase session when the user explicitly
    // chooses a session limited to this browser tab.
    try {
      const projectRef = new URL(supabaseUrl!).hostname.split('.')[0];
      window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
    } catch {
      // The URL is validated by Supabase configuration; do not log secrets.
    }
  }
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: conditionalAuthStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
