// Hospital routes — requests, inventory, surplus, donor actions
// Phase 1 (profile), Phase 2 (requests), Phase 3 (mark actions), Phase 4 (complete), Phase 6 (inventory, surplus)

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { notificationLimiter } from '../middleware/rate-limiter.js';
import { AppError } from '../utils/app-error.js';
import { logAuditEvent } from '../services/audit/audit.service.js';
import { BLOOD_GROUPS } from '../types/blood.js';
import { EXPIRY_HOURS } from '../types/request.js';
import {
  getHospitalById,
  getBloodInventory,
  updateInventoryLevel,
  getNearbySurplus,
  claimSurplus,
  getHospitalRequests,
  getRequestWithResponses,
} from '../db/queries/hospital.queries.js';

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

const router = Router();

// All hospital routes require auth + hospital role
router.use(requireAuth, requireRole('hospital'));

// ────────────────────────────────────────────────────────
// Validation Schemas
// ────────────────────────────────────────────────────────

const createRequestSchema = z.object({
  blood_group: z.enum(BLOOD_GROUPS as [string, ...string[]]),
  units_required: z.number().int().min(1).max(20),
  priority: z.enum(['critical', 'urgent', 'scheduled']),
  notes: z.string().max(500).optional(),
});

const inventoryUpdateSchema = z.object({
  units_available: z.number().int().min(0),
});

const surplusCreateSchema = z.object({
  blood_group: z.enum(BLOOD_GROUPS as [string, ...string[]]),
  units_available: z.number().int().min(1),
  expires_in_hours: z.number().int().min(1).max(48).default(24),
});

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(300).optional(),
});

// ────────────────────────────────────────────────────────
// Profile
// ────────────────────────────────────────────────────────

router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospital = await getHospitalById(req.entityId!);
    res.status(200).json({ data: hospital });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getSupabase();
    const allowedFields = ['name', 'department', 'email', 'address'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    const { data, error } = await supabase
      .from('hospitals')
      .update(updates)
      .eq('id', req.entityId!)
      .select('*')
      .single();

    if (error) throw new AppError(500, 'UPDATE_FAILED', 'Failed to update profile');
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Blood Requests
// ────────────────────────────────────────────────────────

router.post('/requests', notificationLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createRequestSchema.parse(req.body);
    const supabase = getSupabase();

    // Calculate expiry
    const expiryHours = EXPIRY_HOURS[body.priority as keyof typeof EXPIRY_HOURS];
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

    const { data: request, error } = await supabase
      .from('blood_requests')
      .insert({
        hospital_id: req.entityId!,
        blood_group: body.blood_group,
        units_required: body.units_required,
        priority: body.priority,
        notes: body.notes ?? null,
        expires_at: expiresAt,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError(500, 'REQUEST_CREATE_FAILED', 'Failed to create blood request');
    }

    void logAuditEvent({
      action: 'request.created',
      actor_id: req.user!.id,
      actor_role: 'hospital',
      entity_type: 'blood_request',
      entity_id: request.id,
      metadata: {
        blood_group: body.blood_group,
        units_required: body.units_required,
        priority: body.priority,
      },
      ip_address: req.ip,
    });

    // ────────────────────────────────────────────────────────
    // Donor Matching & Notification Dispatch (Phase 2 & 3)
    // ────────────────────────────────────────────────────────
    const { findDonorsWithExpansion } = await import('../services/matching/matcher.service.js');
    const { dispatchNotifications } = await import('../services/notification/notification.service.js');

    const { donors: matchedDonors } = await findDonorsWithExpansion(request.id);

    if (matchedDonors.length > 0) {
      await dispatchNotifications(
        request.id,
        req.entityId!,
        matchedDonors as any,
        body.priority as any
      );
    }

    // Fetch the updated request details
    const { data: updatedRequest } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', request.id)
      .single();

    res.status(201).json({ data: updatedRequest ?? request });
  } catch (err) {
    next(err);
  }
});

router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
    const status = req.query['status'] as string | undefined;
    const result = await getHospitalRequests(req.entityId!, page, limit, status);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/requests/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await getRequestWithResponses(req.params['id'] as string, req.entityId!);
    if (!request) throw AppError.notFound('Request not found');
    res.status(200).json({ data: request });
  } catch (err) {
    next(err);
  }
});

router.patch('/requests/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getSupabase();
    const requestId = req.params['id'] as string;

    // Only cancel if request is in an active state
    const { data, error } = await supabase
      .from('blood_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('hospital_id', req.entityId!)
      .in('status', ['pending', 'dispatched', 'accepted', 'en_route', 'arrived'])
      .select('*')
      .single();

    if (error || !data) {
      throw AppError.badRequest('Cannot cancel this request — it may already be completed or cancelled');
    }

    // Cancel all pending donation responses
    await supabase
      .from('donation_responses')
      .update({ status: 'cancelled' })
      .eq('request_id', requestId)
      .in('status', ['notified', 'accepted']);

    void logAuditEvent({
      action: 'request.cancelled',
      actor_id: req.user!.id,
      actor_role: 'hospital',
      entity_type: 'blood_request',
      entity_id: requestId,
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Request cancelled', data });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Donor Actions (hospital marks donation status)
// ────────────────────────────────────────────────────────

router.patch('/requests/:id/donors/:responseId/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getSupabase();
    const responseId = req.params['responseId'] as string;
    const requestId = req.params['id'] as string;

    // Verify the response exists and belongs to this hospital's request
    const { data: response, error: fetchErr } = await supabase
      .from('donation_responses')
      .select('*, blood_requests:request_id (hospital_id)')
      .eq('id', responseId)
      .eq('request_id', requestId)
      .single();

    if (fetchErr || !response) throw AppError.notFound('Response not found');
    if ((response.blood_requests as any)?.hospital_id !== req.entityId!) {
      throw AppError.forbidden('FORBIDDEN', 'This response does not belong to your hospital');
    }
    if (!['accepted', 'en_route', 'arrived'].includes(response.status)) {
      throw AppError.badRequest('Donor must be in accepted/en_route/arrived status to mark complete');
    }

    // Run post-donation hook
    const { runPostDonationHook } = await import('../services/post-donation/post-donation.service.js');
    await runPostDonationHook(responseId, requestId, response.donor_id, req.entityId!);

    void logAuditEvent({
      action: 'donation.completed',
      actor_id: req.user!.id,
      actor_role: 'hospital',
      entity_type: 'donation_response',
      entity_id: responseId,
      metadata: { request_id: requestId, donor_id: response.donor_id },
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Donation marked as complete' });
  } catch (err) {
    next(err);
  }
});

router.patch('/requests/:id/donors/:responseId/no-show', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getSupabase();
    const responseId = req.params['responseId'] as string;

    const { data, error } = await supabase
      .from('donation_responses')
      .update({ status: 'no_show' })
      .eq('id', responseId)
      .eq('request_id', req.params['id']!)
      .in('status', ['accepted', 'en_route', 'arrived'])
      .select('*')
      .single();

    if (error || !data) throw AppError.badRequest('Cannot mark as no-show');

    void logAuditEvent({
      action: 'donation.no_show',
      actor_id: req.user!.id,
      actor_role: 'hospital',
      entity_type: 'donation_response',
      entity_id: responseId,
      metadata: { donor_id: data.donor_id },
      ip_address: req.ip,
    });

    res.status(200).json({ message: 'Donor marked as no-show', data });
  } catch (err) {
    next(err);
  }
});

router.post('/requests/:id/donors/:responseId/rating', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, feedback } = ratingSchema.parse(req.body);
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('donation_responses')
      .update({
        hospital_rating: rating,
        hospital_feedback: feedback ?? null,
      })
      .eq('id', req.params['responseId']!)
      .eq('request_id', req.params['id']!)
      .eq('status', 'donated')
      .select('*')
      .single();

    if (error || !data) throw AppError.badRequest('Can only rate completed donations');
    res.status(200).json({ message: 'Rating submitted', data });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Blood Inventory
// ────────────────────────────────────────────────────────

router.get('/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await getBloodInventory(req.entityId!);
    res.status(200).json({ data: inventory });
  } catch (err) {
    next(err);
  }
});

router.patch('/inventory/:bloodGroup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bloodGroup = decodeURIComponent(req.params['bloodGroup'] as string) as any;
    if (!BLOOD_GROUPS.includes(bloodGroup)) {
      throw AppError.badRequest(`Invalid blood group: ${bloodGroup}`);
    }

    const { units_available } = inventoryUpdateSchema.parse(req.body);
    const inventory = await updateInventoryLevel(req.entityId!, bloodGroup, units_available);
    res.status(200).json({ data: inventory });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// Cross-Hospital Surplus
// ────────────────────────────────────────────────────────

router.get('/surplus', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const radius = parseInt(req.query['radius'] as string) || 50;
    const surplus = await getNearbySurplus(req.entityId!, radius);
    res.status(200).json({ data: surplus });
  } catch (err) {
    next(err);
  }
});

router.post('/surplus', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = surplusCreateSchema.parse(req.body);
    const supabase = getSupabase();

    const expiresAt = new Date(Date.now() + body.expires_in_hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('hospital_surplus')
      .insert({
        hospital_id: req.entityId!,
        blood_group: body.blood_group,
        units_available: body.units_available,
        expires_at: expiresAt,
      })
      .select('*')
      .single();

    if (error) throw new AppError(500, 'SURPLUS_CREATE_FAILED', 'Failed to publish surplus');
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.delete('/surplus/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('hospital_surplus')
      .delete()
      .eq('id', req.params['id']!)
      .eq('hospital_id', req.entityId!)
      .eq('is_claimed', false);

    if (error) throw AppError.badRequest('Cannot delete — surplus may be claimed or not found');
    res.status(200).json({ message: 'Surplus listing removed' });
  } catch (err) {
    next(err);
  }
});

router.patch('/surplus/:id/claim', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await claimSurplus(req.params['id'] as string, req.entityId!);
    if (!result) {
      throw AppError.conflict('Surplus already claimed or expired');
    }
    res.status(200).json({ message: 'Surplus claimed successfully', data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
