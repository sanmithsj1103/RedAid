import { Worker, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { redis } from '../config/redis.js';
import { sendPushNotification } from '../services/notification/fcm.service.js';
import { findEligibleDonors } from '../services/matching/matcher.service.js';
import { emitToHospital } from '../config/socket.js';
import { logAuditEvent } from '../services/audit/audit.service.js';
import { logger } from '../config/logger.js';
import { BloodGroup } from '../types/blood.js';
import { checkFatigueCap, notificationQueue } from '../services/notification/notification.service.js';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

let _supabaseAdmin: any = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin as any;
}

export const notificationWorker = new Worker(
  'notification-retry',
  async (job: Job) => {
    if (job.name !== 'retry-check') return;

    const { responseId } = job.data as { responseId: string };
    const supabase = getSupabaseAdmin();

    // 1. Fetch donation_responses row with request details
    const { data: response, error: respErr } = await supabase
      .from('donation_responses')
      .select(`
        *,
        blood_requests!inner(
          id, hospital_id, blood_group, priority, search_radius, status
        )
      `)
      .eq('id', responseId)
      .single();

    if (respErr || !response) {
      logger.error({ responseId, error: respErr }, 'BullMQ worker: donation response not found');
      return;
    }

    // 2. If status is still 'notified' -> update to 'no_response'
    if (response.status === 'notified') {
      logger.info({ responseId }, 'BullMQ worker: Donor did not respond. Updating status to no_response.');

      await supabase
        .from('donation_responses')
        .update({ status: 'no_response' })
        .eq('id', responseId);

      const request = response.blood_requests;
      if (!request) {
        logger.error({ responseId }, 'BullMQ worker: associated blood request not found');
        return;
      }

      // Check if the request is still active
      if (['completed', 'cancelled', 'expired'].includes(request.status)) {
        logger.info({ requestId: request.id, status: request.status }, 'Request is no longer active, stopping retry pipeline');
        return;
      }

      // 3. Find next eligible donor
      const remainingDonors = await findEligibleDonors(
        request.id,
        request.hospital_id,
        request.blood_group as BloodGroup,
        request.search_radius
      );

      if (remainingDonors.length > 0) {
        const nextDonor = remainingDonors[0]!;

        // Fatigue check for Critical priority
        if (request.priority === 'critical') {
          const passesCap = await checkFatigueCap(nextDonor.id);
          if (!passesCap) {
            logger.info({ donorId: nextDonor.id, requestId: request.id }, 'BullMQ worker: Next donor skipped due to fatigue cap');
            return;
          }
        }

        if (nextDonor.fcm_token) {
          // Send FCM push notification
          const payload = {
            title: `Emergency Blood Request (${request.priority.toUpperCase()})`,
            body: `A hospital nearby needs compatible blood units immediately.`,
            data: {
              requestId: request.id,
              priority: request.priority,
            },
          };

          const sent = await sendPushNotification(nextDonor.fcm_token, payload);
          if (sent) {
            // Insert new response row
            const { data: newResponse, error: newResponseErr } = await supabase
              .from('donation_responses')
              .insert({
                request_id: request.id,
                donor_id: nextDonor.id,
                status: 'notified',
                distance_km: nextDonor.distance_km,
                notified_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (!newResponseErr && newResponse) {
              // Add new BullMQ job
              try {
                const newJob = await notificationQueue.add(
                  'retry-check',
                  { responseId: newResponse.id },
                  { delay: 10 * 60 * 1000 }
                );

                await supabase
                  .from('donation_responses')
                  .update({ bull_job_id: newJob.id })
                  .eq('id', newResponse.id);
              } catch (jobErr) {
                logger.error({ error: jobErr }, 'BullMQ worker: failed to queue new retry job');
              }
            }

            // Increment next donor total_responses
            try {
              const { data: donorData } = await supabase
                .from('donors')
                .select('total_responses')
                .eq('id', nextDonor.id)
                .single();

              await supabase
                .from('donors')
                .update({ total_responses: (donorData?.total_responses ?? 0) + 1 })
                .eq('id', nextDonor.id);
            } catch (err) {
              // Ignore
            }

            // Update request count
            try {
              const { data: reqData } = await supabase
                .from('blood_requests')
                .select('donors_notified')
                .eq('id', request.id)
                .single();

              await supabase
                .from('blood_requests')
                .update({ donors_notified: (reqData?.donors_notified ?? 0) + 1 })
                .eq('id', request.id);
            } catch (err) {
              // Ignore
            }

            // Socket.IO event to hospital
            try {
              emitToHospital(request.hospital_id, 'notification:retry', {
                requestId: request.id,
                donorId: nextDonor.id,
              });
            } catch (err) {
              // Ignore
            }

            // Audit log
            void logAuditEvent({
              action: 'notification.retry_dispatched',
              actor_role: 'system',
              entity_type: 'donation_response',
              entity_id: newResponse?.id,
              metadata: { request_id: request.id, donor_id: nextDonor.id },
            });
          }
        }
      }
    }
  },
  {
    connection: redis as any,
  }
);

notificationWorker.on('error', (err) => {
  logger.error({ err }, 'BullMQ notification worker encountered an error');
});

notificationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'BullMQ notification job failed');
});
