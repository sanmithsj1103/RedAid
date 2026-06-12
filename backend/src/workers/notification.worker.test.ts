import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Job, Worker } from 'bullmq';

// vi.hoisted ensures these are available for vi.mock factories (which get hoisted)
const { mockQueueAdd } = vi.hoisted(() => ({
  mockQueueAdd: vi.fn(),
}));

// Mock BullMQ Queue and Worker
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

import * as fcmService from '../services/notification/fcm.service.js';
import * as matcherService from '../services/matching/matcher.service.js';
import * as socketConfig from '../config/socket.js';

// Mock Redis connection
vi.mock('../config/redis.js', () => ({
  redis: {},
}));

// Mock FCM service
vi.mock('../services/notification/fcm.service.js', () => ({
  sendPushNotification: vi.fn(),
}));

// Mock matcher service
vi.mock('../services/matching/matcher.service.js', () => ({
  findEligibleDonors: vi.fn(),
}));

// Mock socket config
vi.mock('../config/socket.js', () => ({
  emitToHospital: vi.fn(),
}));

// Mock audit service
vi.mock('../services/audit/audit.service.js', () => ({
  logAuditEvent: vi.fn(),
}));

// Mock Supabase
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();

const mockQueryBuilder = {
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  single: mockSingle,
};

mockInsert.mockReturnValue(mockQueryBuilder);
mockUpdate.mockReturnValue(mockQueryBuilder);
mockSelect.mockReturnValue(mockQueryBuilder);

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

describe('notificationWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process retry-check job: update status to no_response and dispatch next donor if status is notified', async () => {
    vi.resetModules();
    await import('./notification.worker.js');

    // Retrieve processor function passed to Worker constructor
    const processor = (globalThis as any).capturedWorkerProcessor;

    if (!processor) {
      throw new Error('Processor was not captured');
    }

    const mockResponse = {
      id: 'resp-111',
      status: 'notified',
      request_id: 'req-222',
      blood_requests: {
        id: 'req-222',
        hospital_id: 'hosp-333',
        blood_group: 'O-',
        priority: 'critical',
        search_radius: 15,
        status: 'dispatched',
      },
    };

    const nextDonor = {
      id: 'donor-444',
      fcm_token: 'tok-444',
      distance_km: 8,
    };

    // 1. Fetch response row -> returns notified response
    mockSingle.mockResolvedValueOnce({ data: mockResponse, error: null });

    // 2. Find next donor
    vi.mocked(matcherService.findEligibleDonors).mockResolvedValueOnce([nextDonor]);

    // 3. Send FCM push
    vi.mocked(fcmService.sendPushNotification).mockResolvedValueOnce(true);

    // 4. Insert new response row
    mockInsert.mockReturnValueOnce(mockQueryBuilder);
    mockSingle.mockResolvedValueOnce({ data: { id: 'resp-555' }, error: null });

    // 5. Add next job
    mockQueueAdd.mockResolvedValueOnce({ id: 'job-next' });

    // 6. Fetch donors/blood_requests count mocks
    mockSingle.mockResolvedValue({ data: { total_responses: 2, donors_notified: 1 }, error: null });

    // Run processor
    const mockJob = {
      name: 'retry-check',
      data: { responseId: 'resp-111' },
    } as Job;

    await processor(mockJob);

    // Verify status updated to no_response
    expect(mockSupabase.from).toHaveBeenCalledWith('donation_responses');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'no_response' });

    // Verify next donor matched and notified
    expect(matcherService.findEligibleDonors).toHaveBeenCalledWith('req-222', 'hosp-333', 'O-', 15);
    expect(fcmService.sendPushNotification).toHaveBeenCalledWith('tok-444', expect.any(Object));

    // Verify Socket.IO event emitted
    expect(socketConfig.emitToHospital).toHaveBeenCalledWith('hosp-333', 'notification:retry', {
      requestId: 'req-222',
      donorId: 'donor-444',
    });
  });
});
