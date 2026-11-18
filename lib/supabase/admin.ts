import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

/**
 * Cliente Supabase do servidor, com a service role key.
 *
 * NUNCA importe este modulo em codigo de cliente: a service role key ignora o
 * RLS. Toda a escrita em `accounts` passa por aqui.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv();

  cached = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cached;
}
