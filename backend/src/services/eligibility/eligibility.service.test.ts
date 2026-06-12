import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkDonorEligibility } from './eligibility.service.js';
import { BloodGroup } from '../../types/blood.js';

describe('checkDonorEligibility', () => {
  beforeEach(() => {
    // Mock Date to have a stable "now"
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-10T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseDonor = {
    date_of_birth: '1995-06-10', // exactly 31 years old
    blood_group: BloodGroup.O_NEG,
    is_blacklisted: false,
    availability: 'active' as const,
    snooze_until: null,
    last_donated_at: null,
  };

  it('should return eligible: true for a valid active donor', () => {
    const status = checkDonorEligibility(baseDonor);
    expect(status).toEqual({ eligible: true });
  });

  it('should return ineligible if blacklisted', () => {
    const status = checkDonorEligibility({ ...baseDonor, is_blacklisted: true });
    expect(status).toEqual({ eligible: false, reason: 'blacklisted' });
  });

  it('should return too_young if age is under 18', () => {
    // 17 years old
    const status = checkDonorEligibility({ ...baseDonor, date_of_birth: '2009-06-11' });
    expect(status).toEqual({ eligible: false, reason: 'too_young' });
  });

  it('should return too_old if age is over 65', () => {
    // 66 years old
    const status = checkDonorEligibility({ ...baseDonor, date_of_birth: '1960-06-09' });
    expect(status).toEqual({ eligible: false, reason: 'too_old' });
  });

  it('should return donation_lock if last_donated_at is within 90 days', () => {
    // Donated 30 days ago
    const lastDonated = new Date('2026-05-11T12:00:00.000Z').toISOString();
    const status = checkDonorEligibility({ ...baseDonor, last_donated_at: lastDonated });

    expect(status.eligible).toBe(false);
    expect(status.reason).toBe('donation_lock');
    expect(status.days_remaining).toBe(60);
    expect(status.next_eligible_date).toBe(new Date(new Date(lastDonated).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString());
  });

  it('should return eligible if last_donated_at is 90 days ago or more', () => {
    // Donated 91 days ago
    const lastDonated = new Date('2026-03-11T12:00:00.000Z').toISOString();
    const status = checkDonorEligibility({ ...baseDonor, last_donated_at: lastDonated });
    expect(status).toEqual({ eligible: true });
  });

  it('should return unavailable if availability is unavailable', () => {
    const status = checkDonorEligibility({ ...baseDonor, availability: 'unavailable' });
    expect(status).toEqual({ eligible: false, reason: 'unavailable' });
  });

  it('should return snoozed if availability is snoozed and snooze has not expired', () => {
    const status = checkDonorEligibility({
      ...baseDonor,
      availability: 'snoozed',
      snooze_until: '2026-06-11T12:00:00.000Z',
    });
    expect(status).toEqual({ eligible: false, reason: 'snoozed' });
  });

  it('should return snoozed if availability is snoozed and no snooze_until is set', () => {
    const status = checkDonorEligibility({
      ...baseDonor,
      availability: 'snoozed',
      snooze_until: null,
    });
    expect(status).toEqual({ eligible: false, reason: 'snoozed' });
  });

  it('should return eligible if availability is snoozed but snooze has expired', () => {
    const status = checkDonorEligibility({
      ...baseDonor,
      availability: 'snoozed',
      snooze_until: '2026-06-09T12:00:00.000Z',
    });
    expect(status).toEqual({ eligible: true });
  });

  it('should check blood group compatibility if requestedBloodGroup is provided', () => {
    // O- is universal donor, so it should be compatible with AB+
    const status1 = checkDonorEligibility(baseDonor, BloodGroup.AB_POS);
    expect(status1).toEqual({ eligible: true });

    // AB+ donor trying to give to O- recipient (incompatible)
    const status2 = checkDonorEligibility(
      { ...baseDonor, blood_group: BloodGroup.AB_POS },
      BloodGroup.O_NEG
    );
    expect(status2).toEqual({ eligible: false });
  });
});
