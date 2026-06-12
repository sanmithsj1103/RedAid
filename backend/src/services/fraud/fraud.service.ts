import cron from 'node-cron';
import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { logAuditEvent } from '../audit/audit.service.js';

/**
 * Nightly cron job to scan and flag high no-show donors.
 * Criteria: total_accepted >= 5 and no_show_rate > 30%.
 */
export async function checkAndFlagNoShowFraud(): Promise<void> {
  try {
    logger.info('Starting nightly no-show fraud detection check');

    // 1. Fetch all active/non-suspended donors who have total_accepted >= 5
    const { data: donors, error: donorErr } = await supabaseAdmin
      .from('donors')
      .select('id, full_name, total_accepted')
      .gte('total_accepted', 5)
      .eq('is_blacklisted', false)
      .eq('is_suspended', false);

    if (donorErr) {
      throw new Error(`Failed to fetch donors: ${donorErr.message}`);
    }

    if (!donors || donors.length === 0) {
      logger.info('No donors with total_accepted >= 5 to check');
      return;
    }

    let flaggedCount = 0;

    for (const donor of donors) {
      // 2. Query donation_responses to get no_show count
      const { count, error: responseErr } = await supabaseAdmin
        .from('donation_responses')
        .select('*', { count: 'exact', head: true })
        .eq('donor_id', donor.id)
        .eq('status', 'no_show');

      if (responseErr) {
        logger.error({ donorId: donor.id, error: responseErr }, 'Failed to query donation responses for donor');
        continue;
      }

      const noShows = count ?? 0;
      const totalAccepted = donor.total_accepted;
      const noShowRate = noShows / totalAccepted;

      // If no_show_rate > 30% (i.e. > 0.3)
      if (noShowRate > 0.3) {
        logger.warn(
          { donorId: donor.id, name: donor.full_name, totalAccepted, noShows, noShowRate },
          'High no-show rate detected. Suspending donor.'
        );

        // 3. Suspend the donor
        const { error: updateErr } = await supabaseAdmin
          .from('donors')
          .update({ is_suspended: true })
          .eq('id', donor.id);

        if (updateErr) {
          logger.error({ donorId: donor.id, error: updateErr }, 'Failed to suspend fraud donor');
          continue;
        }

        flaggedCount++;

        // 4. Log audit event
        void logAuditEvent({
          action: 'fraud.no_show_flagged',
          actor_role: 'system',
          entity_type: 'donor',
          entity_id: donor.id,
          metadata: {
            total_accepted: totalAccepted,
            no_show_count: noShows,
            no_show_rate: noShowRate,
          },
        });
      }
    }

    logger.info({ flaggedCount }, 'Nightly no-show fraud detection check completed');
  } catch (err: any) {
    logger.error({ error: err.message }, 'Nightly no-show fraud detection check failed');
  }
}

/**
 * Initializes the fraud nightly cron job at 02:00 IST (20:30 UTC).
 */
export function initFraudCron(): void {
  // Cron schedule: 30 20 * * * (20:30 UTC / 02:00 IST)
  cron.schedule('30 20 * * *', async () => {
    logger.info('Nightly fraud detection cron triggered');
    await checkAndFlagNoShowFraud();
  });
  logger.info('✅ Fraud detection nightly cron registered (02:00 IST / 20:30 UTC)');
}
