// Donor-related database queries
// Phase 1 + Phase 5 Implementation

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase as any;
}

/**
 * Get donor by their donors.id
 */
export async function getDonorById(donorId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('id', donorId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get donor by auth_user_id (from JWT sub claim)
 */
export async function getDonorByAuthUserId(authUserId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('donors')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update donor profile fields
 */
export async function updateDonorProfile(
  donorId: string,
  updates: {
    full_name?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  const supabase = getSupabase();
  const updateData: Record<string, unknown> = {};

  if (updates.full_name) updateData['full_name'] = updates.full_name;
  if (updates.city) updateData['city'] = updates.city;
  if (updates.state) updateData['state'] = updates.state;
  if (updates.latitude !== undefined && updates.longitude !== undefined) {
    updateData['location'] = `SRID=4326;POINT(${updates.longitude} ${updates.latitude})`;
  }

  const { data, error } = await supabase
    .from('donors')
    .update(updateData)
    .eq('id', donorId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update donor availability
 */
export async function updateDonorAvailability(
  donorId: string,
  availability: 'active' | 'snoozed' | 'unavailable',
  snoozeUntil?: string
) {
  const supabase = getSupabase();
  const updateData: Record<string, unknown> = {
    availability,
    snooze_until: availability === 'snoozed' ? snoozeUntil : null,
  };

  const { data, error } = await supabase
    .from('donors')
    .update(updateData)
    .eq('id', donorId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update donor FCM token
 */
export async function updateFcmToken(donorId: string, fcmToken: string | null) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('donors')
    .update({ fcm_token: fcmToken })
    .eq('id', donorId);

  if (error) throw error;
}

/**
 * Get donation history for a donor (paginated)
 */
export async function getDonationHistory(
  donorId: string,
  page: number = 1,
  limit: number = 10
) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('donation_history')
    .select(`
      *,
      hospitals:hospital_id (name, city)
    `, { count: 'exact' })
    .eq('donor_id', donorId)
    .order('donated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data ?? [], total: count ?? 0, page, limit };
}

/**
 * Get single donation history entry
 */
export async function getDonationHistoryById(donorId: string, historyId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('donation_history')
    .select(`
      *,
      hospitals:hospital_id (name, city, address, phone),
      blood_requests:request_id (priority, units_required, created_at)
    `)
    .eq('id', historyId)
    .eq('donor_id', donorId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all badges for a donor
 */
export async function getDonorBadges(donorId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('donor_badges')
    .select('*')
    .eq('donor_id', donorId)
    .order('awarded_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get active response for a donor (where status is 'accepted', and request is active)
 */
export async function getActiveResponseForDonor(donorId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('donation_responses')
    .select(`
      *,
      blood_requests:request_id (
        id, blood_group, priority, status, units_required, units_fulfilled, notes,
        hospitals:hospital_id (name, address, city, phone, location)
      )
    `)
    .eq('donor_id', donorId)
    .in('status', ['accepted'])
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
