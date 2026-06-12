import { createClient } from '@supabase/supabase-js';
import { getCompatibleDonorGroups, BloodGroup } from '../../types/blood.js';
import { emitToHospital } from '../../config/socket.js';
import { logger } from '../../config/logger.js';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

let _supabaseAdmin: any = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

export interface MatchedDonor {
  id: string;
  full_name: string;
  fcm_token: string | null;
  trust_score: number;
  distance_km: number;
}

export const RADIUS_STEPS = [15, 25, 40, 60]; // km
export const MIN_DONORS_THRESHOLD = 3;

/**
 * Execute the PostGIS query to find eligible donors within a specific radius.
 */
export async function findEligibleDonors(
  requestId: string,
  hospitalId: string,
  bloodGroup: BloodGroup,
  radiusKm: number
): Promise<MatchedDonor[]> {
  const supabase = getSupabaseAdmin();
  const compatibleGroups = getCompatibleDonorGroups(bloodGroup);

  const { data, error } = await supabase.rpc('find_eligible_donors', {
    req_id: requestId,
    hosp_id: hospitalId,
    comp_groups: compatibleGroups,
    radius_km: radiusKm,
  });

  if (error) {
    logger.error({ error, requestId, hospitalId, bloodGroup, radiusKm }, 'PostGIS matching query failed');
    throw error;
  }

  return data ?? [];
}

/**
 * Find eligible donors with auto-expanding radius search.
 */
export async function findDonorsWithExpansion(
  requestId: string
): Promise<{ donors: MatchedDonor[]; radiusUsed: number }> {
  const supabase = getSupabaseAdmin();

  // 1. Fetch request details to get hospital_id and blood_group
  const { data: request, error: reqErr } = await supabase
    .from('blood_requests')
    .select('hospital_id, blood_group')
    .eq('id', requestId)
    .single();

  if (reqErr || !request) {
    logger.error({ error: reqErr, requestId }, 'Failed to fetch request for donor matching');
    throw new Error(`Blood request not found: ${requestId}`);
  }

  const hospitalId = request.hospital_id;
  const bloodGroup = request.blood_group as BloodGroup;

  let donors: MatchedDonor[] = [];
  let radiusUsed = RADIUS_STEPS[0]!;

  for (const radius of RADIUS_STEPS) {
    radiusUsed = radius;
    donors = await findEligibleDonors(requestId, hospitalId, bloodGroup, radius);

    if (donors.length >= MIN_DONORS_THRESHOLD) {
      break;
    }

    // If we didn't find enough donors and it's not the last step, notify the hospital of expansion
    if (radius !== RADIUS_STEPS[RADIUS_STEPS.length - 1]) {
      try {
        emitToHospital(hospitalId, 'request:radius_expanded', { requestId, radius });
      } catch (err) {
        logger.warn({ err, hospitalId, radius }, 'Failed to emit radius expansion socket event');
      }
    }
  }

  // Update request with the final radius used
  await supabase
    .from('blood_requests')
    .update({ search_radius: radiusUsed })
    .eq('id', requestId);

  return { donors, radiusUsed };
}
