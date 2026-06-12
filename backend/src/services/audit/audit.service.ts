// Centralised audit logging service
// Phase 1 Implementation

import { createClient } from '@supabase/supabase-js';
import { logger } from '../../config/logger.js';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin as any;
}

export interface AuditLogEntry {
  action: string;
  actor_id?: string | null;
  actor_role?: 'donor' | 'hospital' | 'admin' | 'system';
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * Insert an immutable audit log entry.
 * Uses service_role to bypass RLS (audit_logs has no permissive SELECT for non-admin).
 * Failures are logged but never thrown — audit logging must not break the main flow.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('audit_logs').insert({
      action: entry.action,
      actor_id: entry.actor_id ?? null,
      actor_role: entry.actor_role ?? 'system',
      entity_type: entry.entity_type ?? null,
      entity_id: entry.entity_id ?? null,
      metadata: entry.metadata ?? null,
      ip_address: entry.ip_address ?? null,
    });

    if (error) {
      logger.error({ error, entry }, 'Failed to insert audit log');
    } else {
      logger.debug({ action: entry.action, entity_id: entry.entity_id }, 'Audit log inserted');
    }
  } catch (err) {
    // Never throw from audit logging — it's a side effect
    logger.error({ err, entry }, 'Audit logging exception');
  }
}
