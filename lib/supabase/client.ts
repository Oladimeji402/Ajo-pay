import { createBrowserClient } from "@supabase/ssr";

type BrowserClientOptions = {
  persistSession?: boolean;
};

function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createSupabaseBrowserClient(options: BrowserClientOptions = {}) {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const persistSession = options.persistSession ?? true;

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: typeof window === "undefined"
      ? undefined
      : {
          persistSession,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: persistSession ? window.localStorage : window.sessionStorage,
        },
  });
}
