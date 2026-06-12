import { addDays, format } from 'date-fns';
import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { computeTrustScore } from '../trust-score/calculator.js';
import { checkAndAward } from '../trust-score/badge.service.js';
import { generate } from '../certificate/certificate.service.js';
import { sendPushNotification } from '../notification/fcm.service.js';
import { logAuditEvent } from '../audit/audit.service.js';

/**
 * Runs the post-donation automation hook (10-step sequence) atomically.
 * Called when a hospital marks a donation as complete.
 */
export async function runPostDonationHook(
  responseId: string,
  requestId: string,
  _donorId: string,
  hospitalId: string
): Promise<void> {
  try {
    logger.info({ responseId, requestId }, 'Starting post-donation hook execution');

    // 1-6. Call the database RPC to run updates atomically in a transaction
    const { data: txResult, error: txErr } = await supabaseAdmin
      .rpc('complete_donation_transaction', { p_response_id: responseId });

    if (txErr || !txResult || txResult.length === 0) {
      throw new Error(`Database transaction failed: ${txErr?.message || 'empty result'}`);
    }

    const { history_id: historyId, donor_id: donorId, total_donations, total_responses, total_accepted } = txResult[0];

    // 4. Recalculate and update trust score
    const newScore = computeTrustScore({
      total_donations,
      total_responses,
      total_accepted,
    });

    const { error: scoreErr } = await supabaseAdmin
      .from('donors')
      .update({ trust_score: newScore })
      .eq('id', donorId);

    if (scoreErr) {
      logger.error({ donorId, error: scoreErr }, 'Post-donation hook: failed to update donor trust score');
    }

    // 7. Award badges (outside transaction)
    try {
      await checkAndAward(donorId);
    } catch (badgeErr) {
      logger.error({ donorId, error: badgeErr }, 'Post-donation hook: failed to evaluate/award badges');
    }

    // 8. Generate certificate (async, non-blocking)
    void generate(donorId, historyId).catch((certErr) => {
      logger.error({ donorId, historyId, error: certErr }, 'Post-donation hook: failed to generate certificate');
    });

    // 9. Send thank-you push notification
    try {
      const { data: donorData } = await supabaseAdmin
        .from('donors')
        .select('fcm_token')
        .eq('id', donorId)
        .single();

      if (donorData?.fcm_token) {
        const nextEligibleDate = addDays(new Date(), 90);
        const payload = {
          title: '🙏 Thank you for donating blood!',
          body: `You can donate again after ${format(nextEligibleDate, 'dd MMM yyyy')}`,
          data: {
            type: 'donation_complete',
            next_eligible_date: nextEligibleDate.toISOString(),
          },
        };
        await sendPushNotification(donorData.fcm_token, payload);
      }
    } catch (fcmErr) {
      logger.error({ donorId, error: fcmErr }, 'Post-donation hook: failed to dispatch thank-you notification');
    }

    // 10. Audit log
    void logAuditEvent({
      action: 'donation.completed',
      actor_role: 'system',
      entity_type: 'donation_response',
      entity_id: responseId,
      metadata: { request_id: requestId, donor_id: donorId, hospital_id: hospitalId, history_id: historyId },
    });

    logger.info({ responseId, donorId, historyId }, 'Post-donation hook execution completed successfully');
  } catch (err: any) {
    logger.error({ responseId, error: err.message }, 'Post-donation hook failed');
    throw err;
  }
}
