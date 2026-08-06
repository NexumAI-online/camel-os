import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con service role (solo servidor) para el proyecto Camel.
 * NUNCA exponer la service role key al cliente.
 */

/** ¿Están las credenciales de Supabase presentes? */
export function supabaseConfigurada(): boolean {
  return (
    !!process.env.SUPABASE_URL?.trim() &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
