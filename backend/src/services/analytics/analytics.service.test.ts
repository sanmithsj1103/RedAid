import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOverviewKPIs, getDemandZones } from './analytics.service.js';

const { mockSupabase, mockQueryBuilder, setQueryResultsQueue } = vi.hoisted(() => {
  let queryResultsQueue: any[] = [];

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve: any) => resolve(queryResultsQueue.shift()),
  };

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
  };

  return {
    mockSupabase,
    mockQueryBuilder,
    setQueryResultsQueue: (queue: any[]) => {
      queryResultsQueue = queue;
    },
  };
});

vi.mock('../../config/supabase.js', () => ({
  supabaseAdmin: mockSupabase,
}));

describe('analytics.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOverviewKPIs', () => {
    it('returns structured KPIs with correct counts', async () => {
      setQueryResultsQueue([
        { count: 10, error: null }, // totalDonors
        { count: 5, error: null }, // totalHospitals
        { count: 20, error: null }, // totalRequests
        { count: 12, error: null }, // totalHistory (donations)
        { count: 8, error: null }, // verifiedDonors
        { count: 1, error: null }, // blacklistedDonors
        { count: 1, error: null }, // suspendedDonors
        { count: 4, error: null }, // verifiedHospitals
        { count: 5, error: null }, // activeHospitals
        { count: 12, error: null }, // completedRequests
        { count: 4, error: null }, // cancelledRequests
        { count: 2, error: null }, // pendingRequests
        { data: [{ units_fulfilled: 2 }, { units_fulfilled: 3 }], error: null }, // units sum data
      ]);

      const kpis = await getOverviewKPIs();

      expect(kpis.donors.total).toBe(10);
      expect(kpis.donors.verified).toBe(8);
      expect(kpis.donors.suspended).toBe(1);
      expect(kpis.hospitals.verified).toBe(4);
      expect(kpis.requests.completed).toBe(12);
      expect(kpis.donations.units_fulfilled).toBe(5);
    });

    it('applies start and end date filters', async () => {
      setQueryResultsQueue([
        { count: 10, error: null }, // totalDonors
        { count: 5, error: null }, // totalHospitals
        { count: 20, error: null }, // totalRequests
        { count: 12, error: null }, // totalHistory
        { count: 8, error: null }, // verifiedDonors
        { count: 1, error: null }, // blacklistedDonors
        { count: 1, error: null }, // suspendedDonors
        { count: 4, error: null }, // verifiedHospitals
        { count: 5, error: null }, // activeHospitals
        { count: 12, error: null }, // completedRequests
        { count: 4, error: null }, // cancelledRequests
        { count: 2, error: null }, // pendingRequests
        { data: [], error: null }, // units sum data
      ]);

      await getOverviewKPIs('2026-06-01T00:00:00Z', '2026-06-10T00:00:00Z');

      expect(mockQueryBuilder.gte).toHaveBeenCalled();
      expect(mockQueryBuilder.lte).toHaveBeenCalled();
    });
  });

  describe('getDemandZones', () => {
    it('aggregates and groups requests by city and blood group', async () => {
      const mockRequests = [
        { blood_group: 'O+', units_required: 2, units_fulfilled: 1, hospitals: { city: 'Bangalore' } },
        { blood_group: 'O+', units_required: 3, units_fulfilled: 2, hospitals: { city: 'Bangalore' } },
        { blood_group: 'A-', units_required: 1, units_fulfilled: 0, hospitals: { city: 'Mysore' } },
      ];

      setQueryResultsQueue([
        { data: mockRequests, error: null },
      ]);

      const zones = await getDemandZones();

      expect(zones.length).toBe(2);
      // Bangalore O+ should be first since it has 2 requests
      expect(zones[0].city).toBe('Bangalore');
      expect(zones[0].blood_group).toBe('O+');
      expect(zones[0].request_count).toBe(2);
      expect(zones[0].total_units_required).toBe(5);
      expect(zones[0].total_units_fulfilled).toBe(3);

      expect(zones[1].city).toBe('Mysore');
      expect(zones[1].blood_group).toBe('A-');
      expect(zones[1].request_count).toBe(1);
    });
  });
});
