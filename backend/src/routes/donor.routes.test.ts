// Donor routes tests — Phase 3: accept/decline/status
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock response data store ────────────────────────────────────
// The route module lazily creates a single supabase client via createClient.
// We control what it returns by swapping `mockSingleResult` before each test.
let mockSingleResult: any = { data: null, error: null };
let mockUpdateResult: any = { data: null, error: null };

// Build a deep chainable mock where every method returns itself
// except terminal methods which resolve with the current mockSingleResult.
function buildChain(): any {
  const chain: any = {};
  const methods = [
    'from', 'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'in', 'gte', 'lte', 'gt', 'lt',
    'limit', 'order', 'range', 'is', 'not', 'or',
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // Override update to return a separate chain that resolves with mockUpdateResult
  const updateChain: any = {};
  for (const m of methods) {
    updateChain[m] = vi.fn(() => updateChain);
  }
  updateChain.single = vi.fn(() => Promise.resolve(mockUpdateResult));
  updateChain.maybeSingle = vi.fn(() => Promise.resolve(mockUpdateResult));
  chain.update = vi.fn(() => updateChain);

  chain.single = vi.fn(() => Promise.resolve(mockSingleResult));
  chain.maybeSingle = vi.fn(() => Promise.resolve(mockSingleResult));
  chain.rpc = vi.fn(() => Promise.resolve({ error: null }));
  chain.auth = { admin: { deleteUser: vi.fn() } };
  chain.storage = { from: vi.fn(() => ({ createSignedUrl: vi.fn() })) };
  return chain;
}

const supabaseInstance = buildChain();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseInstance),
}));

vi.mock('../middleware/auth.js', () => ({
  requireAuth: (_req: any, _res: any, next: any) => {
    _req.user = { id: 'auth-user-1' };
    _req.entityId = 'donor-1';
    next();
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../services/audit/audit.service.js', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../config/socket.js', () => ({
  emitToHospital: vi.fn(),
  emitToDonor: vi.fn(),
}));

const mockGetJob = vi.fn();
const mockRemove = vi.fn();
vi.mock('../services/notification/notification.service.js', () => ({
  notificationQueue: {
    getJob: (...args: any[]) => mockGetJob(...args),
  },
}));

vi.mock('../services/certificate/certificate.service.js', () => ({
  regenerateUrl: vi.fn().mockResolvedValue('https://mock-storage.co/new-signed-cert.pdf'),
}));

vi.mock('../db/queries/donor.queries.js', () => ({
  getDonorById: vi.fn().mockResolvedValue({
    id: 'donor-1',
    full_name: 'Test Donor',
    blood_group: 'O+',
    trust_score: 50,
    total_donations: 3,
    total_accepted: 2,
    total_responses: 10,
    availability: 'active',
  }),
  updateDonorProfile: vi.fn().mockResolvedValue({ id: 'donor-1' }),
  updateDonorAvailability: vi.fn().mockResolvedValue({ id: 'donor-1' }),
  updateFcmToken: vi.fn().mockResolvedValue(undefined),
  getDonationHistory: vi.fn().mockResolvedValue({
    data: [{
      id: 'hist-1',
      donor_id: 'donor-1',
      hospital_id: 'hosp-1',
      request_id: 'req-1',
      blood_group: 'O+',
      units_donated: 1,
      donated_at: '2026-06-11T12:00:00Z',
    }],
    total: 1,
    page: 1,
    limit: 10
  }),
  getDonationHistoryById: vi.fn().mockResolvedValue({
    id: 'hist-1',
    donor_id: 'donor-1',
    hospital_id: 'hosp-1',
    request_id: 'req-1',
    blood_group: 'O+',
    units_donated: 1,
    donated_at: '2026-06-11T12:00:00Z',
    certificate_key: 'certificates/donor-1/hist-1.pdf',
  }),
  getDonorBadges: vi.fn().mockResolvedValue([]),
  getActiveResponseForDonor: vi.fn().mockResolvedValue(null),
}));

import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import donorRouter from './donor.routes.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/v1/donor', donorRouter);
  // Error handler that mirrors the real one — Zod errors → 400
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err?.name === 'ZodError' || err?.issues) {
      return res.status(400).json({ error: 'Validation error', details: err.issues ?? err.errors });
    }
    const status = err.statusCode ?? err.status ?? 500;
    res.status(status).json({ error: err.message ?? 'Internal server error' });
  });
  return app;
}

describe('Donor Routes — Phase 3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingleResult = { data: null, error: null };
    mockUpdateResult = { data: null, error: null };
  });

  // ──────────────────────────────────────────────────
  // GET /v1/donor/requests/active
  // ──────────────────────────────────────────────────
  describe('GET /v1/donor/requests/active', () => {
    it('returns 200 with null when no active request', async () => {
      const app = createApp();
      const res = await request(app).get('/v1/donor/requests/active');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /v1/donor/requests/:responseId/respond
  // ──────────────────────────────────────────────────
  describe('PATCH /v1/donor/requests/:responseId/respond', () => {
    it('returns 400 for invalid action', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/requests/resp-1/respond')
        .send({ action: 'maybe' });
      expect(res.status).toBe(400);
    });

    it('accepts a request and cancels BullMQ job', async () => {
      const app = createApp();

      mockSingleResult = {
        data: {
          id: 'resp-1',
          request_id: 'req-1',
          donor_id: 'donor-1',
          status: 'notified',
          bull_job_id: 'job-123',
          blood_requests: { id: 'req-1', hospital_id: 'hosp-1', status: 'dispatched', donors_accepted: 0 },
        },
        error: null,
      };
      mockUpdateResult = { data: null, error: null };
      mockGetJob.mockResolvedValue({ remove: mockRemove });
      mockRemove.mockResolvedValue(undefined);

      const res = await request(app)
        .patch('/v1/donor/requests/resp-1/respond')
        .send({ action: 'accept' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Request accepted');
      expect(res.body.data.status).toBe('accepted');
      expect(mockGetJob).toHaveBeenCalledWith('job-123');
    });

    it('declines a request successfully', async () => {
      const app = createApp();

      mockSingleResult = {
        data: {
          id: 'resp-2',
          request_id: 'req-1',
          donor_id: 'donor-1',
          status: 'notified',
          bull_job_id: 'job-456',
          blood_requests: { id: 'req-1', hospital_id: 'hosp-1', status: 'dispatched' },
        },
        error: null,
      };
      mockUpdateResult = { data: null, error: null };
      mockGetJob.mockResolvedValue({ remove: mockRemove });

      const res = await request(app)
        .patch('/v1/donor/requests/resp-2/respond')
        .send({ action: 'decline' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Request declined');
      expect(res.body.data.status).toBe('declined');
    });

    it('returns 404 when response not found', async () => {
      const app = createApp();

      mockSingleResult = { data: null, error: { message: 'not found' } };

      const res = await request(app)
        .patch('/v1/donor/requests/resp-missing/respond')
        .send({ action: 'accept' });

      expect(res.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /v1/donor/requests/:responseId/status
  // ──────────────────────────────────────────────────
  describe('PATCH /v1/donor/requests/:responseId/status', () => {
    it('returns 400 for invalid status value', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/requests/resp-1/status')
        .send({ status: 'flying' });
      expect(res.status).toBe(400);
    });

    it('updates status to en_route from accepted', async () => {
      const app = createApp();

      mockSingleResult = {
        data: {
          id: 'resp-1',
          request_id: 'req-1',
          donor_id: 'donor-1',
          status: 'accepted',
        },
        error: null,
      };
      mockUpdateResult = { data: null, error: null };

      const res = await request(app)
        .patch('/v1/donor/requests/resp-1/status')
        .send({ status: 'en_route' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('en_route');
    });

    it('updates status to arrived', async () => {
      const app = createApp();

      mockSingleResult = {
        data: {
          id: 'resp-1',
          request_id: 'req-1',
          donor_id: 'donor-1',
          status: 'en_route',
        },
        error: null,
      };
      mockUpdateResult = { data: null, error: null };

      const res = await request(app)
        .patch('/v1/donor/requests/resp-1/status')
        .send({ status: 'arrived' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('arrived');
    });
  });

  // ──────────────────────────────────────────────────
  // GET /v1/donor/profile
  // ──────────────────────────────────────────────────
  describe('GET /v1/donor/profile', () => {
    it('returns 200 with donor profile', async () => {
      const app = createApp();
      const res = await request(app).get('/v1/donor/profile');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe('donor-1');
    });
  });

  // ──────────────────────────────────────────────────
  // GET /v1/donor/badges
  // ──────────────────────────────────────────────────
  describe('GET /v1/donor/badges', () => {
    it('returns 200 with badges and trust score', async () => {
      const app = createApp();
      const res = await request(app).get('/v1/donor/badges');
      expect(res.status).toBe(200);
      expect(res.body.data.badges).toBeDefined();
      expect(res.body.data.trust_score).toBe(50);
    });
  });

  // ──────────────────────────────────────────────────
  // GET /v1/donor/history
  // ──────────────────────────────────────────────────
  describe('GET /v1/donor/history', () => {
    it('returns 200 with donation history list', async () => {
      const app = createApp();
      const res = await request(app).get('/v1/donor/history');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data[0].id).toBe('hist-1');
    });
  });

  // ──────────────────────────────────────────────────
  // GET /v1/donor/history/:id
  // ──────────────────────────────────────────────────
  describe('GET /v1/donor/history/:id', () => {
    it('returns 200 with single history details', async () => {
      const app = createApp();
      const res = await request(app).get('/v1/donor/history/hist-1');
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe('hist-1');
    });
  });

  // ──────────────────────────────────────────────────
  // GET /v1/donor/history/:id/certificate
  // ──────────────────────────────────────────────────
  describe('GET /v1/donor/history/:id/certificate', () => {
    it('returns 200 with regenerated certificate URL', async () => {
      const app = createApp();
      const res = await request(app).get('/v1/donor/history/hist-1/certificate');
      expect(res.status).toBe(200);
      expect(res.body.data.certificate_url).toBe('https://mock-storage.co/new-signed-cert.pdf');
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /v1/donor/profile
  // ──────────────────────────────────────────────────
  describe('PATCH /v1/donor/profile', () => {
    it('returns 200 after successfully updating profile', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/profile')
        .send({ full_name: 'Updated Name', city: 'Mumbai' });
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('returns 400 when no fields are provided', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/profile')
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 when validation fails (invalid fields)', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/profile')
        .send({ latitude: 120 }); // Latitude max is 90
      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /v1/donor/availability
  // ──────────────────────────────────────────────────
  describe('PATCH /v1/donor/availability', () => {
    it('returns 200 after successfully updating availability', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/availability')
        .send({ availability: 'active' });
      expect(res.status).toBe(200);
    });

    it('returns 400 when availability is snoozed but snooze_until is missing', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/availability')
        .send({ availability: 'snoozed' });
      expect(res.status).toBe(400);
    });

    it('returns 200 when availability is snoozed with snooze_until provided', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/availability')
        .send({ availability: 'snoozed', snooze_until: new Date(Date.now() + 86400000).toISOString() });
      expect(res.status).toBe(200);
    });
  });

  // ──────────────────────────────────────────────────
  // PATCH /v1/donor/fcm-token
  // ──────────────────────────────────────────────────
  describe('PATCH /v1/donor/fcm-token', () => {
    it('returns 200 after updating FCM token', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/fcm-token')
        .send({ fcm_token: 'new-fcm-token-abc' });
      expect(res.status).toBe(200);
    });

    it('returns 400 if fcm_token is empty string', async () => {
      const app = createApp();
      const res = await request(app)
        .patch('/v1/donor/fcm-token')
        .send({ fcm_token: '' });
      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────────
  // DELETE /v1/donor/account
  // ──────────────────────────────────────────────────
  describe('DELETE /v1/donor/account', () => {
    it('returns 200 on successful account deletion/anonymization', async () => {
      const app = createApp();
      mockUpdateResult = { data: { id: 'donor-1' }, error: null };
      const res = await request(app).delete('/v1/donor/account');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Account deleted successfully');
    });
  });
});
