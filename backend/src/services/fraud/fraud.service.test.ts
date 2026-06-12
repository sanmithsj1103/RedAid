import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAndFlagNoShowFraud, initFraudCron } from './fraud.service.js';

// vi.hoisted ensures these are available to the hoisted vi.mock call
const { mockSupabase, mockQueryBuilder, setQueryResultsQueue } = vi.hoisted(() => {
  let queryResultsQueue: any[] = [];

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve(queryResultsQueue.shift())),
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

vi.mock('../audit/audit.service.js', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn((pattern, fn) => fn()),
  },
}));

describe('fraud.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flags and suspends donor when no-show rate is > 30% and total_accepted >= 5', async () => {
    setQueryResultsQueue([
      { data: [{ id: 'donor-1', full_name: 'Fraud Donor', total_accepted: 5 }], error: null }, // 1. Fetch donors
      { count: 2, error: null }, // 2. Fetch no-show response count (2/5 = 40%)
      { error: null }, // 3. Update donor to is_suspended: true
    ]);

    await checkAndFlagNoShowFraud();

    expect(mockSupabase.from).toHaveBeenCalledWith('donors');
    expect(mockQueryBuilder.update).toHaveBeenCalledWith({ is_suspended: true });
  });

  it('does not flag donor when no-show rate is <= 30%', async () => {
    setQueryResultsQueue([
      { data: [{ id: 'donor-2', full_name: 'Good Donor', total_accepted: 5 }], error: null }, // 1. Fetch donors
      { count: 1, error: null }, // 2. Fetch no-show response count (1/5 = 20%)
    ]);

    await checkAndFlagNoShowFraud();

    expect(mockQueryBuilder.update).not.toHaveBeenCalled();
  });

  it('does not run checks if no donors meet the total_accepted threshold', async () => {
    setQueryResultsQueue([
      { data: [], error: null }, // 1. Fetch donors returns empty
    ]);

    await checkAndFlagNoShowFraud();

    expect(mockQueryBuilder.select).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.update).not.toHaveBeenCalled();
  });

  it('initializes node-cron schedule', () => {
    initFraudCron();
  });
});
