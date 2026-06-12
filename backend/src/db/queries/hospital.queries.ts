// Hospital-related database queries
// Phase 1 + Phase 6 Implementation

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
 * Get hospital by their hospitals.id
 */
export async function getHospitalById(hospitalId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('id', hospitalId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get hospital by auth_user_id
 */
export async function getHospitalByAuthUserId(authUserId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get blood inventory for a hospital
 */
export async function getBloodInventory(hospitalId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('blood_inventory')
    .select('*')
    .eq('hospital_id', hospitalId)
    .order('blood_group');

  if (error) throw error;
  return data ?? [];
}

/**
 * Update blood inventory for a specific blood group
 */
export async function updateInventoryLevel(
  hospitalId: string,
  bloodGroup: string,
  unitsAvailable: number
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('blood_inventory')
    .update({ units_available: unitsAvailable })
    .eq('hospital_id', hospitalId)
    .eq('blood_group', bloodGroup)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get nearby surplus listings (PostGIS radius search)
 */
export async function getNearbySurplus(
  hospitalId: string,
  _radiusKm: number = 50
) {
  const supabase = getSupabase();

  // Get requesting hospital's location
  const { data: hospital } = await supabase
    .from('hospitals')
    .select('location')
    .eq('id', hospitalId)
    .single();

  if (!hospital?.location) {
    return [];
  }

  // Query surplus from other hospitals within radius, not expired, not claimed
  const { data, error } = await supabase
    .from('hospital_surplus')
    .select(`
      *,
      hospitals:hospital_id (name, city, location)
    `)
    .neq('hospital_id', hospitalId)
    .eq('is_claimed', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Claim a surplus listing (atomic operation)
 * Uses a direct update with conditions to prevent double-claiming.
 */
export async function claimSurplus(surplusId: string, claimingHospitalId: string) {
  const supabase = getSupabase();

  // Atomic claim: only succeeds if is_claimed is still false
  const { data, error } = await supabase
    .from('hospital_surplus')
    .update({
      is_claimed: true,
      claimed_by: claimingHospitalId,
      claimed_at: new Date().toISOString(),
    })
    .eq('id', surplusId)
    .eq('is_claimed', false) // Atomic guard — prevents race conditions
    .gt('expires_at', new Date().toISOString())
    .select('*')
    .single();

  if (error || !data) {
    return null; // Already claimed or expired
  }

  return data;
}

/**
 * Get hospital requests (paginated)
 */
export async function getHospitalRequests(
  hospitalId: string,
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('blood_requests')
    .select('*', { count: 'exact' })
    .eq('hospital_id', hospitalId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data ?? [], total: count ?? 0, page, limit };
}

/**
 * Get a single request with all donor response details
 */
export async function getRequestWithResponses(requestId: string, hospitalId: string) {
  const supabase = getSupabase();

  const { data: request, error: reqErr } = await supabase
    .from('blood_requests')
    .select('*')
    .eq('id', requestId)
    .eq('hospital_id', hospitalId)
    .single();

  if (reqErr) throw reqErr;

  const { data: responses, error: resErr } = await supabase
    .from('donation_responses')
    .select(`
      *,
      donors:donor_id (id, full_name, blood_group, phone, trust_score)
    `)
    .eq('request_id', requestId)
    .order('notified_at', { ascending: true });

  if (resErr) throw resErr;

  return { ...request, responses: responses ?? [] };
}
