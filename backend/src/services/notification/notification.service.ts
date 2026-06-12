import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from './fcm.service.js';
import { Queue } from 'bullmq';
import { redis } from '../../config/redis.js';
import { logger } from '../../config/logger.js';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

let _supabaseAdmin: any = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

export const notificationQueue = new Queue('notification-retry', {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

/**
 * Checks the fatigue cap for a donor.
 * Returns true if the donor has NOT exceeded the cap (eligible to be notified).
 * Cap: Max 3 Critical notifications in the last 24 hours.
 */
export async function checkFatigueCap(donorId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // We query donation_responses that join with critical blood_requests
  const { data, error } = await supabase
    .from('donation_responses')
    .select(`
      id,
      blood_requests!inner(priority)
    `)
    .eq('donor_id', donorId)
    .eq('blood_requests.priority', 'critical')
    .gte('notified_at', twentyFourHoursAgo);

  if (error) {
    logger.error({ error, donorId }, 'Error checking fatigue cap');
    return true; // Fallback to true so we don't block emergency notifications on database error
  }

  return (data?.length ?? 0) < 3;
}

/**
 * Orchestrates sending push notifications and scheduling retry checks based on request priority.
 */
export async function dispatchNotifications(
  requestId: string,
  _hospitalId: string,
  matchedDonors: { id: string; fcm_token: string | null; distance_km: number }[],
  priority: 'critical' | 'urgent' | 'scheduled'
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // 1. Determine batch size
  let batchSize = matchedDonors.length;
  if (priority === 'urgent') batchSize = Math.min(batchSize, 5);
  else if (priority === 'scheduled') batchSize = Math.min(batchSize, 3);

  const donorsToNotify = matchedDonors.slice(0, batchSize);
  let notifiedCount = 0;

  for (const donor of donorsToNotify) {
    if (!donor.fcm_token) continue;

    // Fatigue check for Critical priority
    if (priority === 'critical') {
      const passesCap = await checkFatigueCap(donor.id);
      if (!passesCap) {
        logger.info({ donorId: donor.id, requestId }, 'Donor skipped due to Critical fatigue cap');
        continue;
      }
    }

    // A. Send push notification
    const payload = {
      title: `Emergency Blood Request (${priority.toUpperCase()})`,
      body: `A hospital nearby needs compatible blood units immediately.`,
      data: {
        requestId,
        priority,
      },
    };

    const sent = await sendPushNotification(donor.fcm_token, payload);
    if (!sent) continue;

    notifiedCount++;

    // B. Insert donation_responses row with status = 'notified'
    const { data: response, error: responseErr } = await supabase
      .from('donation_responses')
      .insert({
        request_id: requestId,
        donor_id: donor.id,
        status: 'notified',
        distance_km: donor.distance_km,
        notified_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (responseErr || !response) {
      logger.error({ error: responseErr, donorId: donor.id }, 'Failed to insert response row');
      continue;
    }

    // C. Add delayed BullMQ job (10 minutes delay)
    const delayMs = 10 * 60 * 1000;
    try {
      const job = await notificationQueue.add(
        'retry-check',
        { responseId: response.id },
        { delay: delayMs }
      );

      // Store bull_job_id in donation_responses
      await supabase
        .from('donation_responses')
        .update({ bull_job_id: job.id })
        .eq('id', response.id);
    } catch (jobErr) {
      logger.error({ error: jobErr, responseId: response.id }, 'Failed to schedule BullMQ retry job');
    }

    // D. Increment total_responses count on donor
    try {
      const { data: donorData } = await supabase
        .from('donors')
        .select('total_responses')
        .eq('id', donor.id)
        .single();

      await supabase
        .from('donors')
        .update({ total_responses: (donorData?.total_responses ?? 0) + 1 })
        .eq('id', donor.id);
    } catch (err) {
      logger.warn({ err, donorId: donor.id }, 'Failed to increment donor total_responses');
    }
  }

  // Update blood_requests count of notified donors and status
  await supabase
    .from('blood_requests')
    .update({
      status: notifiedCount > 0 ? 'dispatched' : 'pending',
      donors_notified: notifiedCount,
    })
    .eq('id', requestId);
}
