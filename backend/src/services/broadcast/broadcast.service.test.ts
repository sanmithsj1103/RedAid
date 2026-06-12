import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendBroadcast } from './broadcast.service.js';

const { mockSupabase, mockQueryBuilder, setQueryResultsQueue } = vi.hoisted(() => {
  let queryResultsQueue: any[] = [];

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
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

const mockSendPushNotification = vi.fn();
vi.mock('../notification/fcm.service.js', () => ({
  sendPushNotification: (...args: any[]) => mockSendPushNotification(...args),
}));

vi.mock('../audit/audit.service.js', () => ({
  logAuditEvent: vi.fn(),
}));

describe('broadcast.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches multicast notifications to matching FCM tokens and logs audit event', async () => {
    setQueryResultsQueue([
      { data: [{ fcm_token: 'token-1' }, { fcm_token: 'token-2' }], error: null },
    ]);

    mockSendPushNotification
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false); // one success, one fail

    const result = await sendBroadcast(
      { role: 'donor', city: 'Bangalore', blood_group: 'O+' },
      'Emergency Announcement',
      'Please donate today!'
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('donors');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('city', 'Bangalore');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('blood_group', 'O+');
    expect(mockSendPushNotification).toHaveBeenCalledTimes(2);

    expect(result.successCount).toBe(1);
    expect(result.totalCount).toBe(2);
  });

  it('returns zero if no device tokens are found', async () => {
    setQueryResultsQueue([
      { data: [], error: null },
    ]);

    const result = await sendBroadcast(
      { role: 'donor' },
      'Announcement',
      'Hello'
    );

    expect(mockSendPushNotification).not.toHaveBeenCalled();
    expect(result.successCount).toBe(0);
    expect(result.totalCount).toBe(0);
  });
});
