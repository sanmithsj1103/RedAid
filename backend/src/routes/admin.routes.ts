// Admin routes — user management, fraud, analytics, audit, broadcast
// Implementation: Phase 7

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { logAuditEvent } from '../services/audit/audit.service.js';
import { getOverviewKPIs, getDemandZones } from '../services/analytics/analytics.service.js';
import { sendBroadcast } from '../services/broadcast/broadcast.service.js';
import { checkAndFlagNoShowFraud } from '../services/fraud/fraud.service.js';
import { AppError } from '../utils/app-error.js';

const router = Router();

// Protect all routes with admin authentication
router.use(requireAuth, requireRole('admin'));

// ────────────────────────────────────────────────────────
// Validation Schemas
// ────────────────────────────────────────────────────────

const broadcastSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  filters: z.object({
    role: z.enum(['donor', 'all']),
    city: z.string().optional(),
    blood_group: z.string().optional(),
  }),
});

const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// ────────────────────────────────────────────────────────
// Donor Management
// ────────────────────────────────────────────────────────

router.get('/donors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
    const offset = (page - 1) * limit;

    const bloodGroup = req.query['blood_group'] as string;
    const isVerified = req.query['is_verified'] === 'true' ? true : req.query['is_verified'] === 'false' ? false : undefined;
    const isBlacklisted = req.query['is_blacklisted'] === 'true' ? true : req.query['is_blacklisted'] === 'false' ? false : undefined;
    const isSuspended = req.query['is_suspended'] === 'true' ? true : req.query['is_suspended'] === 'false' ? false : undefined;
    const q = req.query['q'] as string;

    let dbQuery = supabaseAdmin
      .from('donors')
      .select('*', { count: 'exact' });

    if (bloodGroup) dbQuery = dbQuery.eq('blood_group', bloodGroup);
    if (isVerified !== undefined) dbQuery = dbQuery.eq('is_verified', isVerified);
    if (isBlacklisted !== undefined) dbQuery = dbQuery.eq('is_blacklisted', isBlacklisted);
    if (isSuspended !== undefined) dbQuery = dbQuery.eq('is_suspended', isSuspended);
    if (q) dbQuery = dbQuery.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/donors/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: donor, error: donorErr } = await supabaseAdmin
      .from('donors')
      .select('*')
      .eq('id', id)
      .single();

    if (donorErr || !donor) {
      throw AppError.notFound('Donor not found');
    }

    const { data: history } = await supabaseAdmin
      .from('donation_history')
      .select(`
        *,
        hospitals:hospital_id (name, city)
      `)
      .eq('donor_id', id)
      .order('donated_at', { ascending: false });

    const { data: badges } = await supabaseAdmin
      .from('donor_badges')
      .select('*')
      .eq('donor_id', id);

    res.status(200).json({
      data: {
        ...donor,
        history: history ?? [],
        badges: badges ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/donors/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('donors')
      .update({ is_verified: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Donor not found');

    void logAuditEvent({
      action: 'donor.verified',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'donor',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Donor verified successfully', data });
  } catch (err) {
    next(err);
  }
});

router.patch('/donors/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('donors')
      .update({ is_suspended: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Donor not found');

    void logAuditEvent({
      action: 'donor.suspended',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'donor',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Donor suspended successfully', data });
  } catch (err) {
    next(err);
  }
});

router.patch('/donors/:id/unsuspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('donors')
      .update({ is_suspended: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Donor not found');

    void logAuditEvent({
      action: 'donor.unsuspended',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'donor',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Donor unsuspended successfully', data });
  } catch (err) {
    next(err);
  }
});

router.patch('/donors/:id/blacklist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('donors')
      .update({ is_blacklisted: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Donor not found');

    void logAuditEvent({
      action: 'donor.blacklisted',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'donor',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Donor blacklisted successfully', data });
  } catch (err) {
    next(err);
  }
});

router.patch('/donors/:id/unblacklist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('donors')
      .update({ is_blacklisted: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Donor not found');

    void logAuditEvent({
      action: 'donor.unblacklisted',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'donor',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Donor unblacklisted successfully', data });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Hospital Management
// ────────────────────────────────────────────────────────

router.get('/hospitals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
    const offset = (page - 1) * limit;

    const isVerified = req.query['is_verified'] === 'true' ? true : req.query['is_verified'] === 'false' ? false : undefined;
    const isActive = req.query['is_active'] === 'true' ? true : req.query['is_active'] === 'false' ? false : undefined;
    const isBlacklisted = req.query['is_blacklisted'] === 'true' ? true : req.query['is_blacklisted'] === 'false' ? false : undefined;
    const q = req.query['q'] as string;

    let dbQuery = supabaseAdmin
      .from('hospitals')
      .select('*', { count: 'exact' });

    if (isVerified !== undefined) dbQuery = dbQuery.eq('is_verified', isVerified);
    if (isActive !== undefined) dbQuery = dbQuery.eq('is_active', isActive);
    if (isBlacklisted !== undefined) dbQuery = dbQuery.eq('is_blacklisted', isBlacklisted);
    if (q) dbQuery = dbQuery.or(`name.ilike.%${q}%,registration_number.ilike.%${q}%`);

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/hospitals/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: hospital, error: hospErr } = await supabaseAdmin
      .from('hospitals')
      .select('*')
      .eq('id', id)
      .single();

    if (hospErr || !hospital) {
      throw AppError.notFound('Hospital not found');
    }

    const { data: requests } = await supabaseAdmin
      .from('blood_requests')
      .select('*')
      .eq('hospital_id', id)
      .order('created_at', { ascending: false });

    res.status(200).json({
      data: {
        ...hospital,
        requests: requests ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/hospitals/:id/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({ is_verified: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Hospital not found');

    // Automatically initialize 8 inventory rows for verified hospital (if not already existing)
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    for (const bg of bloodGroups) {
      await supabaseAdmin
        .from('blood_inventory')
        .insert({ hospital_id: id, blood_group: bg, units_available: 0 })
        .maybeSingle()
        .catch(() => {}); // ignore duplicates
    }

    void logAuditEvent({
      action: 'hospital.verified',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'hospital',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Hospital verified successfully', data });
  } catch (err) {
    next(err);
  }
});

router.patch('/hospitals/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({ is_active: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Hospital not found');

    void logAuditEvent({
      action: 'hospital.suspended',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'hospital',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Hospital account suspended successfully', data });
  } catch (err) {
    next(err);
  }
});

router.patch('/hospitals/:id/unsuspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({ is_active: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Hospital not found');

    void logAuditEvent({
      action: 'hospital.unsuspended',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'hospital',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Hospital account unsuspended successfully', data });
  } catch (err) {
    next(err);
  }
});

router.patch('/hospitals/:id/blacklist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({ is_blacklisted: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Hospital not found');

    void logAuditEvent({
      action: 'hospital.blacklisted',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'hospital',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Hospital blacklisted successfully', data });
  } catch (err) {
    next(err);
  }
});

router.patch('/hospitals/:id/unblacklist', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('hospitals')
      .update({ is_blacklisted: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) throw AppError.notFound('Hospital not found');

    void logAuditEvent({
      action: 'hospital.unblacklisted',
      actor_id: req.user!.id,
      actor_role: 'admin',
      entity_type: 'hospital',
      entity_id: id,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Hospital unblacklisted successfully', data });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Cross-Hospital Requests (Audit)
// ────────────────────────────────────────────────────────

router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
    const offset = (page - 1) * limit;

    const status = req.query['status'] as string;
    const priority = req.query['priority'] as string;
    const bloodGroup = req.query['blood_group'] as string;

    let dbQuery = supabaseAdmin
      .from('blood_requests')
      .select(`
        *,
        hospitals:hospital_id (name, city)
      `, { count: 'exact' });

    if (status) dbQuery = dbQuery.eq('status', status);
    if (priority) dbQuery = dbQuery.eq('priority', priority);
    if (bloodGroup) dbQuery = dbQuery.eq('blood_group', bloodGroup);

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Fraud Monitoring
// ────────────────────────────────────────────────────────

router.get('/fraud/no-shows', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: donors, error: donorErr } = await supabaseAdmin
      .from('donors')
      .select('id, full_name, phone, blood_group, trust_score, total_accepted, is_suspended')
      .gte('total_accepted', 5);

    if (donorErr) throw donorErr;

    const { data: responses, error: responseErr } = await supabaseAdmin
      .from('donation_responses')
      .select('donor_id')
      .eq('status', 'no_show');

    if (responseErr) throw responseErr;

    const noShowCounts: Record<string, number> = {};
    for (const r of responses ?? []) {
      noShowCounts[r.donor_id] = (noShowCounts[r.donor_id] ?? 0) + 1;
    }

    const fraudDonors = (donors ?? [])
      .map((donor) => {
        const noShows = noShowCounts[donor.id] ?? 0;
        const rate = donor.total_accepted > 0 ? noShows / donor.total_accepted : 0;
        return {
          id: donor.id,
          full_name: donor.full_name,
          phone: donor.phone,
          blood_group: donor.blood_group,
          trust_score: donor.trust_score,
          total_accepted: donor.total_accepted,
          is_suspended: donor.is_suspended,
          no_show_count: noShows,
          no_show_rate: Math.round(rate * 100) / 100, // round to 2 decimals
        };
      })
      .filter((d) => d.no_show_rate > 0.3);

    res.status(200).json({ data: fraudDonors });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Analytics
// ────────────────────────────────────────────────────────

router.get('/analytics/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { start_date, end_date } = dateRangeSchema.parse(req.query);
    const kpis = await getOverviewKPIs(start_date, end_date);
    res.status(200).json({ data: kpis });
  } catch (err) {
    next(err);
  }
});

router.get('/analytics/demand', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const demand = await getDemandZones();
    res.status(200).json({ data: demand });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Audit Logs
// ────────────────────────────────────────────────────────

router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);
    const offset = (page - 1) * limit;

    const action = req.query['action'] as string;
    const actorRole = req.query['actor_role'] as string;

    let dbQuery = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (action) dbQuery = dbQuery.eq('action', action);
    if (actorRole) dbQuery = dbQuery.eq('actor_role', actorRole);

    const { data, count, error } = await dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Multicast FCM Broadcast
// ────────────────────────────────────────────────────────

router.post('/broadcast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body, filters } = broadcastSchema.parse(req.body);
    const result = await sendBroadcast(filters, title, body);
    res.status(200).json({ message: 'Broadcast dispatched successfully', data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
