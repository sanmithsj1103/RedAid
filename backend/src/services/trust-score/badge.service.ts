import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * Evaluates and awards badges to a donor based on their donation history,
 * responses, and current trust score.
 * Returns the list of newly awarded badge types.
 */
export async function checkAndAward(donorId: string): Promise<string[]> {
  try {
    // 1. Fetch donor profile (total_donations, trust_score)
    const { data: donor, error: donorErr } = await supabaseAdmin
      .from('donors')
      .select('total_donations, trust_score')
      .eq('id', donorId)
      .single();

    if (donorErr || !donor) {
      logger.error({ donorId, error: donorErr }, 'Badge service: donor not found');
      return [];
    }

    // 2. Calculate streak: count consecutive 'donated' responses in reverse chronological order until we hit 'no_show'
    const { data: responses, error: respErr } = await supabaseAdmin
      .from('donation_responses')
      .select('status, notified_at')
      .eq('donor_id', donorId)
      .in('status', ['donated', 'no_show'])
      .order('notified_at', { ascending: false });

    if (respErr) {
      logger.error({ donorId, error: respErr }, 'Badge service: failed to fetch donation responses');
      return [];
    }

    let streak = 0;
    for (const resp of responses || []) {
      if (resp.status === 'donated') {
        streak++;
      } else if (resp.status === 'no_show') {
        break;
      }
    }

    // 3. Count Critical priority donations in donation_history joined with blood_requests
    const { data: criticalHistory, error: historyErr } = await supabaseAdmin
      .from('donation_history')
      .select(`
        id,
        blood_requests!inner (
          priority
        )
      `)
      .eq('donor_id', donorId)
      .eq('blood_requests.priority', 'critical');

    if (historyErr) {
      logger.error({ donorId, error: historyErr }, 'Badge service: failed to fetch critical donation history');
      return [];
    }

    const criticalDonationsCount = criticalHistory?.length ?? 0;

    // 4. Determine eligible badges
    const eligibleBadges: string[] = [];

    if (donor.total_donations >= 1) {
      eligibleBadges.push('first_drop');
    }
    if (streak >= 3) {
      eligibleBadges.push('streak_3');
    }
    if (streak >= 5) {
      eligibleBadges.push('streak_5');
    }
    if (streak >= 10) {
      eligibleBadges.push('streak_10');
    }
    if (donor.total_donations >= 5) {
      eligibleBadges.push('lifesaver');
    }
    if (donor.total_donations >= 10) {
      eligibleBadges.push('hero');
    }
    if (criticalDonationsCount >= 3) {
      eligibleBadges.push('critical_responder');
    }
    if (donor.trust_score >= 90) {
      eligibleBadges.push('trusted_donor');
    }

    // 5. Fetch existing badges
    const { data: existingBadges, error: existingErr } = await supabaseAdmin
      .from('donor_badges')
      .select('badge_type')
      .eq('donor_id', donorId);

    if (existingErr) {
      logger.error({ donorId, error: existingErr }, 'Badge service: failed to fetch existing badges');
      return [];
    }

    const existingBadgeTypes = existingBadges?.map((b: any) => b.badge_type) ?? [];

    // 6. Award new badges
    const newBadgesToAward = eligibleBadges.filter(b => !existingBadgeTypes.includes(b));

    if (newBadgesToAward.length > 0) {
      const rows = newBadgesToAward.map(badgeType => ({
        donor_id: donorId,
        badge_type: badgeType,
        metadata: { awarded_at: new Date().toISOString() },
      }));

      const { error: insertErr } = await supabaseAdmin
        .from('donor_badges')
        .insert(rows);

      if (insertErr) {
        logger.error({ donorId, error: insertErr, newBadgesToAward }, 'Badge service: failed to insert new badges');
        return [];
      }

      logger.info({ donorId, newBadgesToAward }, 'Badge service: successfully awarded badges');
      return newBadgesToAward;
    }

    return [];
  } catch (err) {
    logger.error({ donorId, error: err }, 'Badge service: unexpected error');
    return [];
  }
}
