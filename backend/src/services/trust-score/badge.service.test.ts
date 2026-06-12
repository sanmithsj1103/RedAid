import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAndAward } from './badge.service.js';

// vi.hoisted ensures these are available to the hoisted vi.mock call
const { mockSupabase, mockQueryBuilder, setQueryResultsQueue } = vi.hoisted(() => {
  let queryResultsQueue: any[] = [];

  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
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

describe('badge.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should award first_drop and trusted_donor when donor has 1 donation and trust score 95', async () => {
    setQueryResultsQueue([
      { data: { total_donations: 1, trust_score: 95 }, error: null }, // 1. Fetch donor
      { data: [], error: null }, // 2. Fetch responses for streak
      { data: [], error: null }, // 3. Fetch critical history
      { data: [], error: null }, // 4. Fetch existing badges
      { error: null }, // 5. Insert new badges
    ]);

    const awarded = await checkAndAward('donor-123');

    expect(awarded).toContain('first_drop');
    expect(awarded).toContain('trusted_donor');
    expect(awarded.length).toBe(2);

    expect(mockSupabase.from).toHaveBeenCalledWith('donor_badges');
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
      { donor_id: 'donor-123', badge_type: 'first_drop', metadata: expect.any(Object) },
      { donor_id: 'donor-123', badge_type: 'trusted_donor', metadata: expect.any(Object) },
    ]);
  });

  it('should calculate streak and award streak_3 when there are 3 donated responses and no no-shows', async () => {
    // Responses showing 3 donated responses (reverse chronological order)
    const mockResponses = [
      { status: 'donated', notified_at: '2026-06-10T12:00:00Z' },
      { status: 'donated', notified_at: '2026-06-09T12:00:00Z' },
      { status: 'donated', notified_at: '2026-06-08T12:00:00Z' },
    ];

    setQueryResultsQueue([
      { data: { total_donations: 3, trust_score: 85 }, error: null }, // 1. Fetch donor
      { data: mockResponses, error: null }, // 2. Fetch responses for streak
      { data: [], error: null }, // 3. Fetch critical history
      { data: [{ badge_type: 'first_drop' }], error: null }, // 4. Fetch existing badges (already has first_drop)
      { error: null }, // 5. Insert new badges
    ]);

    const awarded = await checkAndAward('donor-123');

    // Should award streak_3, first_drop is already awarded so not returned
    expect(awarded).toEqual(['streak_3']);
  });

  it('should stop streak calculation at first no_show', async () => {
    // Responses: 2 donated, then a no_show, then another donated
    const mockResponses = [
      { status: 'donated', notified_at: '2026-06-10T12:00:00Z' },
      { status: 'donated', notified_at: '2026-06-09T12:00:00Z' },
      { status: 'no_show', notified_at: '2026-06-08T12:00:00Z' },
      { status: 'donated', notified_at: '2026-06-07T12:00:00Z' },
    ];

    setQueryResultsQueue([
      { data: { total_donations: 4, trust_score: 75 }, error: null }, // 1. Fetch donor
      { data: mockResponses, error: null }, // 2. Fetch responses for streak
      { data: [], error: null }, // 3. Fetch critical history
      { data: [{ badge_type: 'first_drop' }], error: null }, // 4. Fetch existing badges
    ]);

    const awarded = await checkAndAward('donor-123');

    // Streak is 2, so streak_3 is not awarded
    expect(awarded).toEqual([]);
  });

  it('should award critical_responder when donor has 3 critical donations in history', async () => {
    // Critical history has 3 items
    const mockCriticalHistory = [
      { id: 'h-1', blood_requests: { priority: 'critical' } },
      { id: 'h-2', blood_requests: { priority: 'critical' } },
      { id: 'h-3', blood_requests: { priority: 'critical' } },
    ];

    setQueryResultsQueue([
      { data: { total_donations: 3, trust_score: 80 }, error: null }, // 1. Fetch donor
      { data: [], error: null }, // 2. Fetch responses for streak
      { data: mockCriticalHistory, error: null }, // 3. Fetch critical history
      { data: [{ badge_type: 'first_drop' }], error: null }, // 4. Fetch existing badges
      { error: null }, // 5. Insert new badges
    ]);

    const awarded = await checkAndAward('donor-123');

    expect(awarded).toEqual(['critical_responder']);
  });

  it('should not award any badges if all eligible badges are already owned', async () => {
    setQueryResultsQueue([
      { data: { total_donations: 1, trust_score: 95 }, error: null }, // 1. Fetch donor
      { data: [], error: null }, // 2. Fetch responses for streak
      { data: [], error: null }, // 3. Fetch critical history
      {
        data: [
          { badge_type: 'first_drop' },
          { badge_type: 'trusted_donor' },
        ],
        error: null,
      }, // 4. Fetch existing badges
    ]);

    const awarded = await checkAndAward('donor-123');

    expect(awarded).toEqual([]);
    expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
  });
});
