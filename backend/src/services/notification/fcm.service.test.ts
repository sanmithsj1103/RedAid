import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPushNotification } from './fcm.service.js';

// Mock messaging config
const mockSend = vi.fn();
vi.mock('../../config/firebase.js', () => ({
  messaging: {
    send: (...args: any[]) => mockSend(...args),
  },
}));

// Mock Supabase
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null })),
}));
const mockSupabase = {
  from: vi.fn(() => ({
    update: mockUpdate,
  })),
};
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase,
}));

describe('fcm.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send push notification successfully and return true', async () => {
    mockSend.mockResolvedValueOnce('msg-12345');

    const result = await sendPushNotification('token-abc', {
      title: 'Emergency Blood Request',
      body: 'Someone nearby needs your blood!',
      data: { requestId: 'req-789' },
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'token-abc',
        notification: {
          title: 'Emergency Blood Request',
          body: 'Someone nearby needs your blood!',
        },
        data: { requestId: 'req-789' },
      })
    );
    expect(result).toBe(true);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should clean up the token in the database and return false if FCM returns token not registered error', async () => {
    const error: any = new Error('Token not registered');
    error.code = 'messaging/registration-token-not-registered';
    mockSend.mockRejectedValueOnce(error);

    const result = await sendPushNotification('invalid-token', {
      title: 'Emergency Blood Request',
      body: 'Someone nearby needs your blood!',
    });

    expect(result).toBe(false);
    expect(mockSupabase.from).toHaveBeenCalledWith('donors');
    expect(mockUpdate).toHaveBeenCalledWith({ fcm_token: null });
  });

  it('should return false but not clean up token for other Firebase errors', async () => {
    const error: any = new Error('Quota exceeded');
    error.code = 'messaging/quota-exceeded';
    mockSend.mockRejectedValueOnce(error);

    const result = await sendPushNotification('token-abc', {
      title: 'Emergency Blood Request',
      body: 'Someone nearby needs your blood!',
    });

    expect(result).toBe(false);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });
});
