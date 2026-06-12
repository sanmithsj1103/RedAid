import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPostDonationHook } from './post-donation.service.js';

// vi.hoisted ensures these are available to the hoisted vi.mock call
const {
  mockSupabase,
  mockSingle,
  mockUpdate,
  mockQueryBuilder,
  mockCheckAndAward,
  mockGenerate,
  mockSendPushNotification,
  mockLogAuditEvent,
} = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockUpdate = vi.fn();

  const mockQueryBuilder = {
    update: mockUpdate,
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
  };

  mockUpdate.mockReturnValue(mockQueryBuilder);

  const mockSupabase = {
    rpc: vi.fn(),
    from: vi.fn(() => mockQueryBuilder),
  };

  return {
    mockSupabase,
    mockSingle,
    mockUpdate,
    mockQueryBuilder,
    mockCheckAndAward: vi.fn(),
    mockGenerate: vi.fn(),
    mockSendPushNotification: vi.fn(),
    mockLogAuditEvent: vi.fn(),
  };
});

vi.mock('../../config/supabase.js', () => ({
  supabaseAdmin: mockSupabase,
}));

vi.mock('../trust-score/badge.service.js', () => ({
  checkAndAward: mockCheckAndAward,
}));

vi.mock('../certificate/certificate.service.js', () => ({
  generate: mockGenerate,
}));

vi.mock('../notification/fcm.service.js', () => ({
  sendPushNotification: mockSendPushNotification,
}));

vi.mock('../audit/audit.service.js', () => ({
  logAuditEvent: mockLogAuditEvent,
}));

describe('post-donation.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully run the 10-step post donation hook sequence', async () => {
    // 1. Mock DB transaction RPC success
    const mockTxResult = [{
      history_id: 'hist-123',
      donor_id: 'donor-456',
      total_donations: 3,
      total_responses: 10,
      total_accepted: 5,
    }];
    vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({ data: mockTxResult, error: null });

    // 2. Mock trust score update success
    mockUpdate.mockReturnValueOnce(mockQueryBuilder);

    // 3. Mock badge service success
    mockCheckAndAward.mockResolvedValueOnce(['streak_3']);

    // 4. Mock certificate service generate success
    mockGenerate.mockResolvedValueOnce('http://mock-cert-url.pdf');

    // 5. Mock fetching donor fcm token
    mockSingle.mockResolvedValueOnce({
      data: { fcm_token: 'tok-fcm-789' },
      error: null,
    });

    // 6. Mock FCM push notification success
    mockSendPushNotification.mockResolvedValueOnce(true);

    // 7. Mock audit log success
    mockLogAuditEvent.mockResolvedValueOnce(undefined);

    await runPostDonationHook('resp-111', 'req-222', 'donor-456', 'hosp-333');

    // Assertions
    expect(mockSupabase.rpc).toHaveBeenCalledWith('complete_donation_transaction', { p_response_id: 'resp-111' });

    // Trust score calculation:
    // donationsComponent: min(3/10, 1) * 100 = 30
    // responseRate: (5/10) * 100 = 50
    // reliabilityRate: (3/5) * 100 = 60
    // score: 0.30 * 30 + 0.35 * 50 + 0.35 * 60 = 9 + 17.5 + 21 = 47.5
    expect(mockSupabase.from).toHaveBeenCalledWith('donors');
    expect(mockUpdate).toHaveBeenCalledWith({ trust_score: 47.5 });

    expect(mockCheckAndAward).toHaveBeenCalledWith('donor-456');
    expect(mockGenerate).toHaveBeenCalledWith('donor-456', 'hist-123');

    expect(mockSingle).toHaveBeenCalled();
    expect(mockSendPushNotification).toHaveBeenCalledWith('tok-fcm-789', expect.objectContaining({
      title: expect.any(String),
      body: expect.any(String),
      data: expect.objectContaining({
        type: 'donation_complete',
        next_eligible_date: expect.any(String),
      }),
    }));

    expect(mockLogAuditEvent).toHaveBeenCalledWith(expect.objectContaining({
      action: 'donation.completed',
      actor_role: 'system',
      entity_type: 'donation_response',
      entity_id: 'resp-111',
    }));
  });
});
