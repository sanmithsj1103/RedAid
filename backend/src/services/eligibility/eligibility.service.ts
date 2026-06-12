import { BloodGroup, COMPATIBILITY } from '../../types/blood.js';
import { DonorProfile, EligibilityStatus } from '../../types/donor.js';

/**
 * Check if a donor is eligible to donate.
 * Evaluates the five rules:
 * 1. Not blacklisted
 * 2. Age between 18 and 65 (inclusive)
 * 3. Not within the 90-day post-donation lock period
 * 4. Available (status active, or status snoozed but snooze has expired)
 * 5. Blood group is compatible with the requested recipient blood group (if requestedBloodGroup is provided)
 */
export function checkDonorEligibility(
  donor: Partial<DonorProfile> & { date_of_birth: string; blood_group: BloodGroup },
  requestedBloodGroup?: BloodGroup
): EligibilityStatus {
  // 1. Not blacklisted or suspended
  if (donor.is_blacklisted) {
    return { eligible: false, reason: 'blacklisted' };
  }
  if (donor.is_suspended) {
    return { eligible: false, reason: 'suspended' };
  }

  // 2. Age 18-65
  const dob = new Date(donor.date_of_birth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 18) {
    return { eligible: false, reason: 'too_young' };
  }
  if (age > 65) {
    return { eligible: false, reason: 'too_old' };
  }

  // 3. 90-day lock
  if (donor.last_donated_at) {
    const lastDonated = new Date(donor.last_donated_at);
    const nextEligible = new Date(lastDonated.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (today < nextEligible) {
      const msRemaining = nextEligible.getTime() - today.getTime();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      return {
        eligible: false,
        reason: 'donation_lock',
        next_eligible_date: nextEligible.toISOString(),
        days_remaining: daysRemaining,
      };
    }
  }

  // 4. Availability active
  if (donor.availability === 'unavailable') {
    return { eligible: false, reason: 'unavailable' };
  }

  if (donor.availability === 'snoozed') {
    if (donor.snooze_until) {
      const snoozeUntil = new Date(donor.snooze_until);
      if (today < snoozeUntil) {
        return { eligible: false, reason: 'snoozed' };
      }
    } else {
      return { eligible: false, reason: 'snoozed' };
    }
  }

  // 5. Blood group compatible (optional check)
  if (requestedBloodGroup) {
    const donorGroup = donor.blood_group;
    const compatibleRecipients = COMPATIBILITY[donorGroup];
    if (!compatibleRecipients || !compatibleRecipients.includes(requestedBloodGroup)) {
      return { eligible: false };
    }
  }

  return { eligible: true };
}
