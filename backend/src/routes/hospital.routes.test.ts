import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import { BloodGroup } from '../types/blood.js';

// Mock auth middleware partially
vi.mock('../middleware/auth.js', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    requireAuth: (req: any, res: any, next: any) => {
      req.user = { id: 'auth-user-123', phone: '+919999999999' };
      req.role = 'hospital';
      req.entityId = 'hosp-456';
      next();
    },
    requireRole: (role: string) => (req: any, res: any, next: any) => {
      next();
    },
  };
});

const { mockSupabase, mockSingleRequest, mockSingleDonor, mockInsert, mockUpdate, mockSelect, mockQueryBuilder } = vi.hoisted(() => {
  const mockSingleRequest = vi.fn();
  const mockSingleDonor = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockSelect = vi.fn();

  const mockQueryBuilder = {
    insert: mockInsert,
    update: mockUpdate,
    select: mockSelect,
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: mockSingleRequest,
    then: vi.fn((resolve) => resolve({ data: null, error: null })),
  };

  const mockDonorQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingleDonor,
  };

  mockInsert.mockReturnValue(mockQueryBuilder);
  mockUpdate.mockReturnValue(mockQueryBuilder);
  mockSelect.mockReturnValue(mockQueryBuilder);

  const mockSupabase = {
    from: vi.fn((table: string) => {
      if (table === 'donors') {
        return mockDonorQueryBuilder;
      }
      return mockQueryBuilder;
    }),
  };

  return {
    mockSupabase,
    mockSingleRequest,
    mockSingleDonor,
    mockInsert,
    mockUpdate,
    mockSelect,
    mockQueryBuilder,
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

// Mock hospital queries
vi.mock('../db/queries/hospital.queries.js', () => ({
  getHospitalById: vi.fn().mockResolvedValue({ id: 'hosp-456', name: 'Mock Hospital' }),
  getBloodInventory: vi.fn().mockResolvedValue([
    { blood_group: 'O+', units_available: 5 }
  ]),
  updateInventoryLevel: vi.fn().mockResolvedValue({ blood_group: 'O+', units_available: 10 }),
  getNearbySurplus: vi.fn().mockResolvedValue([
    { id: 'surplus-1', hospital_id: 'other-hosp', blood_group: 'O-', units_available: 2, is_claimed: false }
  ]),
  claimSurplus: vi.fn().mockResolvedValue({ id: 'surplus-1', is_claimed: true }),
  getHospitalRequests: vi.fn().mockResolvedValue({
    data: [{ id: 'req-789', status: 'pending' }],
    total: 1,
    page: 1,
    limit: 10
  }),
  getRequestWithResponses: vi.fn().mockResolvedValue({
    id: 'req-789',
    hospital_id: 'hosp-456',
    responses: []
  }),
}));

// Mock post-donation service
vi.mock('../services/post-donation/post-donation.service.js', () => ({
  runPostDonationHook: vi.fn().mockResolvedValue(undefined),
}));

// Mock audit log service to prevent database writes during tests
vi.mock('../services/audit/audit.service.js', () => ({
  logAuditEvent: vi.fn(),
}));

// Mock matcher service
const mockFindDonorsWithExpansion = vi.fn();
vi.mock('../services/matching/matcher.service.js', () => ({
  findDonorsWithExpansion: (...args: any[]) => mockFindDonorsWithExpansion(...args),
}));

// Mock Redis connection
vi.mock('../config/redis.js', () => ({
  redis: {},
}));

// Mock BullMQ Queue
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
  })),
  Worker: vi.fn().mockImplementation((name, processor) => {
    if (name === 'notification-retry') {
      (globalThis as any).capturedWorkerProcessor = processor;
    }
    return {
      on: vi.fn(),
    };
  }),
}));

describe('POST /v1/hospital/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockSelect.mockReset();
    mockInsert.mockReturnValue(mockQueryBuilder);
    mockUpdate.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockSingleRequest.mockReset();
    mockSingleDonor.mockReset();
  });

  it('should successfully create blood request and dispatch matching', async () => {
    const mockRequest = {
      id: 'req-789',
      hospital_id: 'hosp-456',
      blood_group: BloodGroup.A_POS,
      units_required: 5,
      priority: 'critical',
      status: 'pending',
    };

    const mockDispatchedRequest = {
      ...mockRequest,
      status: 'dispatched',
      donors_notified: 2,
      search_radius: 15,
    };

    mockSingleRequest
      .mockResolvedValueOnce({
        data: mockRequest,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockDispatchedRequest,
        error: null,
      });

    // Mock matcher service finding 2 donors
    mockFindDonorsWithExpansion.mockResolvedValueOnce({
      donors: [
        { id: 'donor-1', distance_km: 5 },
        { id: 'donor-2', distance_km: 12 },
      ],
      radiusUsed: 15,
    });

    // Mock inserts: first is chained, second is direct
    mockInsert.mockReturnValueOnce(mockQueryBuilder);
    mockInsert.mockResolvedValueOnce({ error: null });

    // Mock donor counter increment single query
    mockSingleDonor.mockResolvedValue({ data: { total_responses: 5 }, error: null });

    const res = await request(app)
      .post('/v1/hospital/requests')
      .send({
        blood_group: 'A+',
        units_required: 5,
        priority: 'critical',
        notes: 'Urgent requirement',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(mockDispatchedRequest);
    expect(mockFindDonorsWithExpansion).toHaveBeenCalledWith('req-789');
  });

  it('should return 400 if validation fails', async () => {
    const res = await request(app)
      .post('/v1/hospital/requests')
      .send({
        blood_group: 'INVALID',
        units_required: -10,
        priority: 'not-real',
      });

    expect(res.status).toBe(400);
  });

  describe('PATCH /requests/:id/donors/:responseId/complete', () => {
    it('successfully marks donation as complete', async () => {
      mockSingleRequest.mockResolvedValueOnce({
        data: {
          id: 'resp-123',
          donor_id: 'donor-123',
          status: 'accepted',
          blood_requests: { hospital_id: 'hosp-456' }
        },
        error: null
      });

      const res = await request(app)
        .patch('/v1/hospital/requests/req-789/donors/resp-123/complete');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Donation marked as complete');
    });

    it('returns 404 if response not found', async () => {
      mockSingleRequest.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
      const res = await request(app)
        .patch('/v1/hospital/requests/req-789/donors/resp-missing/complete');
      expect(res.status).toBe(404);
    });

    it('returns 400 if response status is not en_route, accepted, or arrived', async () => {
      mockSingleRequest.mockResolvedValueOnce({
        data: {
          id: 'resp-123',
          status: 'donated',
          blood_requests: { hospital_id: 'hosp-456' }
        },
        error: null
      });
      const res = await request(app)
        .patch('/v1/hospital/requests/req-789/donors/resp-123/complete');
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /requests/:id/donors/:responseId/no-show', () => {
    it('successfully marks donor as no-show', async () => {
      mockSingleRequest.mockResolvedValueOnce({
        data: {
          id: 'resp-123',
          donor_id: 'donor-123',
          status: 'no_show'
        },
        error: null
      });

      const res = await request(app)
        .patch('/v1/hospital/requests/req-789/donors/resp-123/no-show');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Donor marked as no-show');
    });
  });

  describe('POST /requests/:id/donors/:responseId/rating', () => {
    it('submits rating successfully', async () => {
      mockSingleRequest.mockResolvedValueOnce({
        data: {
          id: 'resp-123',
          hospital_rating: 5,
          hospital_feedback: 'excellent donor'
        },
        error: null
      });

      const res = await request(app)
        .post('/v1/hospital/requests/req-789/donors/resp-123/rating')
        .send({ rating: 5, feedback: 'excellent donor' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Rating submitted');
    });

    it('fails if rating is out of bounds', async () => {
      const res = await request(app)
        .post('/v1/hospital/requests/req-789/donors/resp-123/rating')
        .send({ rating: 6 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /inventory', () => {
    it('returns inventory successfully', async () => {
      const res = await request(app).get('/v1/hospital/inventory');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data[0].blood_group).toBe('O+');
    });
  });

  describe('PATCH /inventory/:bloodGroup', () => {
    it('updates stock level successfully', async () => {
      const res = await request(app)
        .patch('/v1/hospital/inventory/O%2B')
        .send({ units_available: 10 });
      expect(res.status).toBe(200);
      expect(res.body.data.units_available).toBe(10);
    });

    it('returns 400 for invalid blood group', async () => {
      const res = await request(app)
        .patch('/v1/hospital/inventory/INVALID')
        .send({ units_available: 10 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /surplus', () => {
    it('returns nearby surplus listings', async () => {
      const res = await request(app).get('/v1/hospital/surplus');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data[0].id).toBe('surplus-1');
    });
  });

  describe('POST /surplus', () => {
    it('publishes surplus successfully', async () => {
      mockSingleRequest.mockResolvedValueOnce({
        data: {
          id: 'surplus-1',
          blood_group: 'O-',
          units_available: 3
        },
        error: null
      });

      const res = await request(app)
        .post('/v1/hospital/surplus')
        .send({ blood_group: 'O-', units_available: 3, expires_in_hours: 24 });

      expect(res.status).toBe(201);
      expect(res.body.data.units_available).toBe(3);
    });
  });

  describe('DELETE /surplus/:id', () => {
    it('removes surplus listing successfully', async () => {
      const res = await request(app).delete('/v1/hospital/surplus/surplus-1');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Surplus listing removed');
    });
  });

  describe('PATCH /surplus/:id/claim', () => {
    it('claims surplus successfully', async () => {
      const res = await request(app).patch('/v1/hospital/surplus/surplus-1/claim');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Surplus claimed successfully');
    });
  });
});
