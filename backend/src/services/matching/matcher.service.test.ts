import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findEligibleDonors, findDonorsWithExpansion } from './matcher.service.js';
import { BloodGroup } from '../../types/blood.js';
import * as socketConfig from '../../config/socket.js';

// Mock getSupabaseAdmin
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({
  eq: vi.fn(() => ({
    single: mockSingle,
  })),
}));
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}));
const mockRpc = vi.fn();

const mockSupabase = {
  rpc: mockRpc,
  from: vi.fn((table: string) => {
    if (table === 'blood_requests') {
      return {
        select: mockSelect,
        update: mockUpdate,
      };
    }
    return {};
  }),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

vi.mock('../../config/socket.js', () => ({
  emitToHospital: vi.fn(),
}));

describe('matcher.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findEligibleDonors', () => {
    it('should call supabase rpc find_eligible_donors and return the matching donors', async () => {
      const mockDonors = [
        { id: '1', full_name: 'Donor 1', fcm_token: 'tok1', trust_score: 95, distance_km: 5 },
        { id: '2', full_name: 'Donor 2', fcm_token: 'tok2', trust_score: 80, distance_km: 12 },
      ];
      mockRpc.mockResolvedValueOnce({ data: mockDonors, error: null });

      const result = await findEligibleDonors('req-123', 'hosp-456', BloodGroup.A_POS, 15);

      expect(mockRpc).toHaveBeenCalledWith('find_eligible_donors', {
        req_id: 'req-123',
        hosp_id: 'hosp-456',
        comp_groups: ['A+', 'A-', 'O+', 'O-'], // Compatible with A+ recipient
        radius_km: 15,
      });
      expect(result).toEqual(mockDonors);
    });

    it('should throw an error if rpc returns an error', async () => {
      const mockError = new Error('Database error');
      mockRpc.mockResolvedValueOnce({ data: null, error: mockError });

      await expect(
        findEligibleDonors('req-123', 'hosp-456', BloodGroup.A_POS, 15)
      ).rejects.toThrow('Database error');
    });
  });

  describe('findDonorsWithExpansion', () => {
    it('should stop at first radius step (15km) if enough donors are found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { hospital_id: 'hosp-456', blood_group: BloodGroup.O_NEG },
        error: null,
      });

      const mockDonors = [
        { id: '1', full_name: 'Donor 1', fcm_token: 'tok1', trust_score: 95, distance_km: 5 },
        { id: '2', full_name: 'Donor 2', fcm_token: 'tok2', trust_score: 80, distance_km: 12 },
        { id: '3', full_name: 'Donor 3', fcm_token: 'tok3', trust_score: 85, distance_km: 14 },
      ];
      mockRpc.mockResolvedValueOnce({ data: mockDonors, error: null });

      const result = await findDonorsWithExpansion('req-123');

      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith('find_eligible_donors', expect.objectContaining({
        radius_km: 15,
      }));
      expect(result.donors).toEqual(mockDonors);
      expect(result.radiusUsed).toBe(15);
      expect(mockUpdate).toHaveBeenCalledWith({ search_radius: 15 });
    });

    it('should expand search radius if not enough donors are found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { hospital_id: 'hosp-456', blood_group: BloodGroup.O_NEG },
        error: null,
      });

      // Step 1: 15km returns 1 donor
      mockRpc.mockResolvedValueOnce({ data: [{ id: '1' }], error: null });
      // Step 2: 25km returns 2 donors
      mockRpc.mockResolvedValueOnce({ data: [{ id: '1' }, { id: '2' }], error: null });
      // Step 3: 40km returns 4 donors
      const finalDonors = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
      mockRpc.mockResolvedValueOnce({ data: finalDonors, error: null });

      const result = await findDonorsWithExpansion('req-123');

      expect(mockRpc).toHaveBeenCalledTimes(3);
      expect(result.donors).toEqual(finalDonors);
      expect(result.radiusUsed).toBe(40);
      expect(mockUpdate).toHaveBeenCalledWith({ search_radius: 40 });

      // Verifying Socket.IO notifications sent for expansions
      expect(socketConfig.emitToHospital).toHaveBeenCalledWith('hosp-456', 'request:radius_expanded', {
        requestId: 'req-123',
        radius: 15,
      });
      expect(socketConfig.emitToHospital).toHaveBeenCalledWith('hosp-456', 'request:radius_expanded', {
        requestId: 'req-123',
        radius: 25,
      });
    });
  });
});
