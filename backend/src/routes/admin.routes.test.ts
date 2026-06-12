import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import adminRouter from './admin.routes.js';

// ─── Mock DB Layer ────────────────────────────────────────────────
const { mockSupabase, mockQueryBuilder, mockDbState } = vi.hoisted(() => {
  const mockDbState = {
    mockSingleResult: { data: null, error: null } as any,
    mockListResult: { data: [], error: null, count: 0 } as any,
  };

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn(() => Promise.resolve(mockDbState.mockSingleResult)),
    then: vi.fn((resolve: any) => resolve(mockDbState.mockListResult)),
  };

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
  };

  return {
    mockSupabase,
    mockQueryBuilder,
    mockDbState,
  };
});

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: mockSupabase,
}));

declare var mockSingleResult: any;
declare var mockListResult: any;

Object.defineProperty(globalThis, 'mockSingleResult', {
  get: () => mockDbState.mockSingleResult,
  set: (val) => { mockDbState.mockSingleResult = val; },
  configurable: true,
});

Object.defineProperty(globalThis, 'mockListResult', {
  get: () => mockDbState.mockListResult,
  set: (val) => { mockDbState.mockListResult = val; },
  configurable: true,
});

// Mock Auth middleware to set user as admin
vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'admin-auth-id' };
    req.role = 'admin';
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => next(),
}));

vi.mock('../services/audit/audit.service.js', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock services
const mockGetOverviewKPIs = vi.fn();
const mockGetDemandZones = vi.fn();
vi.mock('../services/analytics/analytics.service.js', () => ({
  getOverviewKPIs: (...args: any[]) => mockGetOverviewKPIs(...args),
  getDemandZones: (...args: any[]) => mockGetDemandZones(...args),
}));

const mockSendBroadcast = vi.fn();
vi.mock('../services/broadcast/broadcast.service.js', () => ({
  sendBroadcast: (...args: any[]) => mockSendBroadcast(...args),
}));

vi.mock('../services/fraud/fraud.service.js', () => ({
  checkAndFlagNoShowFraud: vi.fn().mockResolvedValue(undefined),
}));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/v1/admin', adminRouter);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err?.name === 'ZodError' || err?.issues) {
      return res.status(400).json({ error: 'Validation error', details: err.issues ?? err.errors });
    }
    const status = err.statusCode ?? err.status ?? 500;
    res.status(status).json({ error: err.message ?? 'Internal server error' });
  });
  return app;
}

describe('Admin Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingleResult = { data: null, error: null };
    mockListResult = { data: [], error: null, count: 0 };
  });

  describe('GET /v1/admin/donors', () => {
    it('lists donors successfully with search and pagination', async () => {
      mockListResult = {
        data: [{ id: 'donor-1', full_name: 'Test Donor' }],
        count: 1,
        error: null,
      };

      const app = createApp();
      const res = await request(app)
        .get('/v1/admin/donors')
        .query({ q: 'test', page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('GET /v1/admin/donors/:id', () => {
    it('returns full donor details, history, and badges', async () => {
      mockSingleResult = {
        data: { id: 'donor-1', full_name: 'Test Donor' },
        error: null,
      };

      mockListResult = {
        data: [{ id: 'hist-1', donated_at: '2026-06-11' }],
        error: null,
      };

      const app = createApp();
      const res = await request(app).get('/v1/admin/donors/donor-1');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('donor-1');
      expect(res.body.data.history.length).toBe(1);
    });
  });

  describe('PATCH verify, suspend, unsuspend, blacklist, unblacklist for donors', () => {
    it('verifies a donor successfully', async () => {
      mockSingleResult = { data: { id: 'donor-1', is_verified: true }, error: null };

      const app = createApp();
      const res = await request(app).patch('/v1/admin/donors/donor-1/verify');

      expect(res.status).toBe(200);
      expect(res.body.data.is_verified).toBe(true);
    });

    it('suspends a donor successfully', async () => {
      mockSingleResult = { data: { id: 'donor-1', is_suspended: true }, error: null };

      const app = createApp();
      const res = await request(app).patch('/v1/admin/donors/donor-1/suspend');

      expect(res.status).toBe(200);
      expect(res.body.data.is_suspended).toBe(true);
    });

    it('unsuspends a donor successfully', async () => {
      mockSingleResult = { data: { id: 'donor-1', is_suspended: false }, error: null };

      const app = createApp();
      const res = await request(app).patch('/v1/admin/donors/donor-1/unsuspend');

      expect(res.status).toBe(200);
      expect(res.body.data.is_suspended).toBe(false);
    });

    it('blacklists a donor successfully', async () => {
      mockSingleResult = { data: { id: 'donor-1', is_blacklisted: true }, error: null };

      const app = createApp();
      const res = await request(app).patch('/v1/admin/donors/donor-1/blacklist');

      expect(res.status).toBe(200);
      expect(res.body.data.is_blacklisted).toBe(true);
    });

    it('unblacklists a donor successfully', async () => {
      mockSingleResult = { data: { id: 'donor-1', is_blacklisted: false }, error: null };

      const app = createApp();
      const res = await request(app).patch('/v1/admin/donors/donor-1/unblacklist');

      expect(res.status).toBe(200);
      expect(res.body.data.is_blacklisted).toBe(false);
    });
  });

  describe('Hospital actions', () => {
    it('verifies a hospital and inserts inventory rows', async () => {
      mockSingleResult = { data: { id: 'hosp-1', is_verified: true }, error: null };

      const app = createApp();
      const res = await request(app).patch('/v1/admin/hospitals/hosp-1/verify');

      expect(res.status).toBe(200);
      expect(res.body.data.is_verified).toBe(true);
    });

    it('suspends a hospital (sets is_active = false) successfully', async () => {
      mockSingleResult = { data: { id: 'hosp-1', is_active: false }, error: null };

      const app = createApp();
      const res = await request(app).patch('/v1/admin/hospitals/hosp-1/suspend');

      expect(res.status).toBe(200);
      expect(res.body.data.is_active).toBe(false);
    });
  });

  describe('GET /v1/admin/fraud/no-shows', () => {
    it('calculates rates programmatically and returns flagged donors', async () => {
      // 1. Fetch donors query -> mockListResult returned first
      mockListResult = {
        data: [
          { id: 'donor-1', full_name: 'Fraud Donor', total_accepted: 5, is_suspended: false },
          { id: 'donor-2', full_name: 'Good Donor', total_accepted: 5, is_suspended: false },
        ],
        error: null,
      };

      // We need to override the list result dynamically for responses
      // but in our mock builder, the then() resolves to mockListResult.
      // So we must prepare mockListResult to return the responses on the second resolution.
      let callCount = 0;
      mockQueryBuilder.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) {
          return resolve(mockListResult); // return donors
        }
        return resolve({
          data: [
            { donor_id: 'donor-1' },
            { donor_id: 'donor-1' }, // 2 no shows for donor-1 (40% rate)
          ],
          error: null,
        });
      });

      const app = createApp();
      const res = await request(app).get('/v1/admin/fraud/no-shows');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe('donor-1');
      expect(res.body.data[0].no_show_rate).toBe(0.4);
    });
  });

  describe('POST /v1/admin/broadcast', () => {
    it('dispatches multicast push notification broadcast', async () => {
      mockSendBroadcast.mockResolvedValue({ successCount: 5, totalCount: 5 });

      const app = createApp();
      const res = await request(app)
        .post('/v1/admin/broadcast')
        .send({
          title: 'Urgent Announcement',
          body: 'We need blood types O+ immediately.',
          filters: { role: 'donor', city: 'Bangalore' },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.successCount).toBe(5);
    });

    it('returns 400 for validation errors', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/v1/admin/broadcast')
        .send({
          title: '', // empty
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/admin/analytics', () => {
    it('returns overview analytics KPIs', async () => {
      mockGetOverviewKPIs.mockResolvedValue({ donors: { total: 10 } });

      const app = createApp();
      const res = await request(app).get('/v1/admin/analytics/overview');

      expect(res.status).toBe(200);
      expect(res.body.data.donors.total).toBe(10);
    });

    it('returns demand zone analytics', async () => {
      mockGetDemandZones.mockResolvedValue([{ city: 'Bangalore', request_count: 5 }]);

      const app = createApp();
      const res = await request(app).get('/v1/admin/analytics/demand');

      expect(res.status).toBe(200);
      expect(res.body.data[0].city).toBe('Bangalore');
    });
  });
});
