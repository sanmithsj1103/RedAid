/**
 * Trust score calculator.
 * Recalculated after every completed or no-show donation event.
 * Weighted formula: 30% donations component, 35% response rate, 35% reliability rate.
 * New donors (with 0 responses and 0 accepted) default to 100.
 */
export function computeTrustScore(donor: {
  total_donations: number;
  total_responses: number;
  total_accepted: number;
}): number {
  if (donor.total_responses === 0) {
    return 100;
  }

  const donationsComponent = Math.min(donor.total_donations / 10, 1) * 100;

  const responseRate = (donor.total_accepted / donor.total_responses) * 100;

  const reliabilityRate = donor.total_accepted === 0
    ? 100
    : (donor.total_donations / donor.total_accepted) * 100;

  const score = (0.30 * donationsComponent)
              + (0.35 * responseRate)
              + (0.35 * reliabilityRate);

  return Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;
}
