import { describe, it, expect } from 'vitest';
import { computeTrustScore } from './calculator.js';

describe('computeTrustScore', () => {
  it('should return 100 for a new donor (no responses, no acceptances, no donations)', () => {
    const score = computeTrustScore({
      total_donations: 0,
      total_responses: 0,
      total_accepted: 0,
    });
    expect(score).toBe(100);
  });

  it('should return 100 for a perfect donor with 10 or more donations', () => {
    const score = computeTrustScore({
      total_donations: 10,
      total_responses: 10,
      total_accepted: 10,
    });
    expect(score).toBe(100);
  });

  it('should cap the donations component at 100 (for > 10 donations)', () => {
    const score = computeTrustScore({
      total_donations: 15,
      total_responses: 15,
      total_accepted: 15,
    });
    expect(score).toBe(100);
  });

  it('should calculate trust score correctly for a semi-active donor', () => {
    // donationsComponent: min(3/10, 1) * 100 = 30
    // responseRate: (4 / 5) * 100 = 80
    // reliabilityRate: (3 / 4) * 100 = 75
    // score: 0.30 * 30 + 0.35 * 80 + 0.35 * 75 = 9 + 28 + 26.25 = 63.25
    const score = computeTrustScore({
      total_donations: 3,
      total_responses: 5,
      total_accepted: 4,
    });
    expect(score).toBe(63.25);
  });

  it('should return 35 for a donor who has never accepted but has been notified (total_accepted = 0)', () => {
    // donationsComponent: 0
    // responseRate: 0
    // reliabilityRate: 100 (default because total_accepted = 0)
    // score: 0.30 * 0 + 0.35 * 0 + 0.35 * 100 = 35
    const score = computeTrustScore({
      total_donations: 0,
      total_responses: 5,
      total_accepted: 0,
    });
    expect(score).toBe(35);
  });

  it('should calculate trust score correctly for a donor with low reliability (no-shows)', () => {
    // donationsComponent: min(1/10, 1) * 100 = 10
    // responseRate: (5 / 10) * 100 = 50
    // reliabilityRate: (1 / 5) * 100 = 20
    // score: 0.30 * 10 + 0.35 * 50 + 0.35 * 20 = 3 + 17.5 + 7 = 27.5
    const score = computeTrustScore({
      total_donations: 1,
      total_responses: 10,
      total_accepted: 5,
    });
    expect(score).toBe(27.5);
  });

  it('should bound trust score between 0 and 100', () => {
    // Extremely negative/bad stats (if somehow total_donations or total_accepted is zero and we had lower limits, but let's check basic bounds)
    const score = computeTrustScore({
      total_donations: 0,
      total_responses: 100,
      total_accepted: 0,
    });
    // donationsComponent = 0
    // responseRate = 0
    // reliabilityRate = 100 (accepted = 0)
    // score = 35. Bounded: 35.
    expect(score).toBe(35);
  });
});
