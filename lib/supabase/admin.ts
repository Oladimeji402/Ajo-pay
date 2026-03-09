import { createClient } from "@supabase/supabase-js";

function getAdminEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return { supabaseUrl, serviceRoleKey };
}

export function createSupabaseAdminClient() {
  const { supabaseUrl, serviceRoleKey } = getAdminEnv();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
