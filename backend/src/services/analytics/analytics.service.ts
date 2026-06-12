import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * Interface for KPI metrics returned by overview analytics
 */
export interface OverviewKPIs {
  donors: {
    total: number;
    verified: number;
    blacklisted: number;
    suspended: number;
  };
  hospitals: {
    total: number;
    verified: number;
    active: number;
  };
  requests: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  donations: {
    total_completed: number;
    units_fulfilled: number;
  };
}

/**
 * Interface for demand zone statistics
 */
export interface DemandZone {
  city: string;
  blood_group: string;
  request_count: number;
  total_units_required: number;
  total_units_fulfilled: number;
}

/**
 * Fetch platform-wide KPI metrics, optionally filtered by a date range.
 */
export async function getOverviewKPIs(
  startDate?: string,
  endDate?: string
): Promise<OverviewKPIs> {
  try {
    logger.info({ startDate, endDate }, 'Fetching overview KPIs');

    // Build base queries
    let donorQuery = supabaseAdmin.from('donors').select('*', { count: 'exact', head: true });
    let hospitalQuery = supabaseAdmin.from('hospitals').select('*', { count: 'exact', head: true });
    let requestQuery = supabaseAdmin.from('blood_requests').select('*', { count: 'exact', head: true });
    let historyQuery = supabaseAdmin.from('donation_history').select('*', { count: 'exact', head: true });

    // Apply date range filters if provided
    if (startDate) {
      donorQuery = donorQuery.gte('created_at', startDate);
      hospitalQuery = hospitalQuery.gte('created_at', startDate);
      requestQuery = requestQuery.gte('created_at', startDate);
      historyQuery = historyQuery.gte('donated_at', startDate);
    }
    if (endDate) {
      donorQuery = donorQuery.lte('created_at', endDate);
      hospitalQuery = hospitalQuery.lte('created_at', endDate);
      requestQuery = requestQuery.lte('created_at', endDate);
      historyQuery = historyQuery.lte('donated_at', endDate);
    }

    // Execute counts in parallel
    const [
      { count: totalDonors },
      { count: totalHospitals },
      { count: totalRequests },
      { count: totalHistory },
    ] = await Promise.all([
      donorQuery,
      hospitalQuery,
      requestQuery,
      historyQuery,
    ]);

    // Fetch verified/status breakdowns
    const [
      { count: verifiedDonors },
      { count: blacklistedDonors },
      { count: suspendedDonors },
      { count: verifiedHospitals },
      { count: activeHospitals },
      { count: completedRequests },
      { count: cancelledRequests },
      { count: pendingRequests },
    ] = await Promise.all([
      supabaseAdmin.from('donors').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabaseAdmin.from('donors').select('*', { count: 'exact', head: true }).eq('is_blacklisted', true),
      supabaseAdmin.from('donors').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
      supabaseAdmin.from('hospitals').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabaseAdmin.from('hospitals').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('blood_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('blood_requests').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabaseAdmin.from('blood_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // Calculate total units fulfilled from request data
    let sumQuery = supabaseAdmin.from('blood_requests').select('units_fulfilled');
    if (startDate) sumQuery = sumQuery.gte('created_at', startDate);
    if (endDate) sumQuery = sumQuery.lte('created_at', endDate);

    const { data: unitsData } = await sumQuery;
    const unitsFulfilled = (unitsData ?? []).reduce(
      (sum: number, row: { units_fulfilled?: number }) => sum + (row.units_fulfilled ?? 0),
      0
    );

    return {
      donors: {
        total: totalDonors ?? 0,
        verified: verifiedDonors ?? 0,
        blacklisted: blacklistedDonors ?? 0,
        suspended: suspendedDonors ?? 0,
      },
      hospitals: {
        total: totalHospitals ?? 0,
        verified: verifiedHospitals ?? 0,
        active: activeHospitals ?? 0,
      },
      requests: {
        total: totalRequests ?? 0,
        completed: completedRequests ?? 0,
        cancelled: cancelledRequests ?? 0,
        pending: pendingRequests ?? 0,
      },
      donations: {
        total_completed: totalHistory ?? 0,
        units_fulfilled: unitsFulfilled,
      },
    };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to compile overview KPIs');
    throw err;
  }
}

/**
 * Aggregate blood request demand stats grouped by city and blood group.
 */
export async function getDemandZones(): Promise<DemandZone[]> {
  try {
    logger.info('Fetching demand zones metrics');

    // Query active and past requests with hospital details to group by city
    const { data: requests, error } = await supabaseAdmin
      .from('blood_requests')
      .select(`
        blood_group,
        units_required,
        units_fulfilled,
        hospitals:hospital_id (city)
      `);

    if (error) {
      throw error;
    }

    const zonesMap: Record<string, DemandZone> = {};

    for (const req of requests ?? []) {
      const city = (req.hospitals as any)?.city ?? 'Unknown';
      const bloodGroup = req.blood_group;
      const key = `${city}:${bloodGroup}`;

      if (!zonesMap[key]) {
        zonesMap[key] = {
          city,
          blood_group: bloodGroup,
          request_count: 0,
          total_units_required: 0,
          total_units_fulfilled: 0,
        };
      }

      const zone = zonesMap[key]!;
      zone.request_count += 1;
      zone.total_units_required += req.units_required ?? 0;
      zone.total_units_fulfilled += req.units_fulfilled ?? 0;
    }

    // Convert to sorted array (highest request count first)
    return Object.values(zonesMap).sort((a, b) => b.request_count - a.request_count);
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to fetch demand zones');
    throw err;
  }
}
