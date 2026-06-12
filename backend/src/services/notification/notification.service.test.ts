import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchNotifications, checkFatigueCap } from './notification.service.js';
import * as fcmService from './fcm.service.js';

// Mock BullMQ Queue
const { mockQueueAdd } = vi.hoisted(() => ({
  mockQueueAdd: vi.fn(),
}));

vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: mockQueueAdd,
    })),
    Worker: vi.fn().mockImplementation((name, processor) => {
      if (name === 'notification-retry') {
        (globalThis as any).capturedWorkerProcessor = processor;
      }
      return {
        on: vi.fn(),
      };
    }),
  };
});

// Mock Redis connection
vi.mock('../../config/redis.js', () => ({
  redis: {},
}));

// Mock FCM service
vi.mock('./fcm.service.js', () => ({
  sendPushNotification: vi.fn(),
}));

// Mock Supabase
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();

const mockQueryBuilder = {
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
  eq: mockEq,
  gte: mockGte,
  single: mockSingle,
};

mockInsert.mockReturnValue(mockQueryBuilder);
mockUpdate.mockReturnValue(mockQueryBuilder);
mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockGte.mockReturnValue(mockQueryBuilder);

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

describe('notification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkFatigueCap', () => {
    it('should return true if under fatigue cap', async () => {
      // Return 2 records (cap is 3)
      mockGte.mockResolvedValueOnce({ data: [1, 2], error: null });

      const result = await checkFatigueCap('donor-123');

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('donation_responses');
    });

    it('should return false if fatigue cap is reached (3 or more notifications)', async () => {
      // Return 3 records
      mockGte.mockResolvedValueOnce({ data: [1, 2, 3], error: null });

      const result = await checkFatigueCap('donor-123');

      expect(result).toBe(false);
    });
  });

  describe('dispatchNotifications', () => {
    it('should dispatch notifications to matched donors up to batch size for Scheduled priority (3)', async () => {
      const matchedDonors = [
        { id: 'donor-1', fcm_token: 'tok-1', distance_km: 5 },
        { id: 'donor-2', fcm_token: 'tok-2', distance_km: 10 },
        { id: 'donor-3', fcm_token: 'tok-3', distance_km: 15 },
        { id: 'donor-4', fcm_token: 'tok-4', distance_km: 20 },
      ];

      // FCM returns success
      vi.mocked(fcmService.sendPushNotification).mockResolvedValue(true);

      // Setup clean mock returns for the database chains in dispatch
      mockSingle.mockResolvedValue({ data: { id: 'resp-999', total_responses: 0 }, error: null });

      // BullMQ add resolves to mock job
      mockQueueAdd.mockResolvedValue({ id: 'job-777' });

      await dispatchNotifications('req-abc', 'hosp-xyz', matchedDonors, 'scheduled');

      // Scheduled batch size is 3, so only top 3 should be notified
      expect(fcmService.sendPushNotification).toHaveBeenCalledTimes(3);
      expect(fcmService.sendPushNotification).toHaveBeenNthCalledWith(1, 'tok-1', expect.any(Object));
      expect(fcmService.sendPushNotification).toHaveBeenNthCalledWith(2, 'tok-2', expect.any(Object));
      expect(fcmService.sendPushNotification).toHaveBeenNthCalledWith(3, 'tok-3', expect.any(Object));

      // BullMQ should be queued 3 times
      expect(mockQueueAdd).toHaveBeenCalledTimes(3);
      expect(mockQueueAdd).toHaveBeenCalledWith('retry-check', { responseId: 'resp-999' }, { delay: 600000 });
    });
  });
});
