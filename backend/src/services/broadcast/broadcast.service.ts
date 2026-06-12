import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { sendPushNotification } from '../notification/fcm.service.js';
import { logAuditEvent } from '../audit/audit.service.js';

export interface BroadcastFilters {
  role: 'donor' | 'all';
  city?: string;
  blood_group?: string;
}

/**
 * Send a broadcast push notification to a targeted audience of donors.
 */
export async function sendBroadcast(
  filters: BroadcastFilters,
  title: string,
  body: string
): Promise<{ successCount: number; totalCount: number }> {
  try {
    logger.info({ filters, title }, 'Initiating target multicast push broadcast');

    // Build the query to fetch matching FCM tokens
    let query = supabaseAdmin
      .from('donors')
      .select('fcm_token')
      .not('fcm_token', 'is', null)
      .eq('is_blacklisted', false)
      .eq('is_suspended', false);

    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.blood_group) {
      query = query.eq('blood_group', filters.blood_group);
    }

    const { data: donors, error } = await query;
    if (error) {
      throw new Error(`Failed to query donor FCM tokens: ${error.message}`);
    }

    const tokens = (donors ?? []).map((d: { fcm_token?: string }) => d.fcm_token) as string[];

    if (tokens.length === 0) {
      logger.info('No matching device tokens found for broadcast');
      return { successCount: 0, totalCount: 0 };
    }

    logger.info({ tokenCount: tokens.length }, 'Dispatching multicast notifications');

    let successCount = 0;
    // Dispatch notifications in parallel
    const results = await Promise.all(
      tokens.map((token) => sendPushNotification(token, { title, body }))
    );

    successCount = results.filter(Boolean).length;

    // Log administrative broadcast audit event
    void logAuditEvent({
      action: 'admin.broadcast_sent',
      actor_role: 'admin',
      entity_type: 'system',
      metadata: {
        filters,
        title,
        recipient_count: tokens.length,
        success_count: successCount,
      },
    });

    return { successCount, totalCount: tokens.length };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to execute broadcast');
    throw err;
  }
}
