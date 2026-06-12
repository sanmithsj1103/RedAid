import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Supabase client (anon-equivalent) — respects Row-Level Security.
 * Used for operations scoped to authenticated users.
 */
export const supabaseClient: any = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY, // In backend, we use service role but scope queries manually
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase admin client — bypasses all RLS policies.
 * Used ONLY for server-side operations: auth management, admin queries, audit logs.
 * NEVER expose this client or its key to any client-facing code.
 */
export const supabaseAdmin: any = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
