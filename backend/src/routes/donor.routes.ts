// Donor routes — profile, eligibility, history, badges, request response
// Phase 1 (profile), Phase 2 (eligibility), Phase 3 (respond), Phase 5 (history, badges)

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AppError } from '../utils/app-error.js';
import { logAuditEvent } from '../services/audit/audit.service.js';
import { emitToHospital } from '../config/socket.js';
import { notificationQueue } from '../services/notification/notification.service.js';
import {
  getDonorById,
  updateDonorProfile,
  updateDonorAvailability,
  updateFcmToken,
  getDonationHistory,
  getDonationHistoryById,
  getDonorBadges,
  getActiveResponseForDonor,
} from '../db/queries/donor.queries.js';
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

const router = Router();

// All donor routes require auth + donor role
router.use(requireAuth, requireRole('donor'));

// ────────────────────────────────────────────────────────
// Validation Schemas
// ────────────────────────────────────────────────────────

const profileUpdateSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const availabilitySchema = z.object({
  availability: z.enum(['active', 'snoozed', 'unavailable']),
  snooze_until: z.string().datetime().optional(),
});

const fcmTokenSchema = z.object({
  fcm_token: z.string().min(1).nullable(),
});

const respondSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

const statusUpdateSchema = z.object({
  status: z.enum(['en_route', 'arrived']),
});

// ────────────────────────────────────────────────────────
// GET /v1/donor/profile
// ────────────────────────────────────────────────────────
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const donor = await getDonorById(req.entityId!);
    res.status(200).json({ data: donor });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// PATCH /v1/donor/profile
// ────────────────────────────────────────────────────────
router.patch('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = profileUpdateSchema.parse(req.body);

    if (Object.keys(updates).length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    const donor = await updateDonorProfile(req.entityId!, updates);
    res.status(200).json({ data: donor });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// PATCH /v1/donor/availability
// ────────────────────────────────────────────────────────
router.patch('/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { availability, snooze_until } = availabilitySchema.parse(req.body);

    if (availability === 'snoozed' && !snooze_until) {
      throw AppError.badRequest('snooze_until is required when setting availability to snoozed');
    }

    const donor = await updateDonorAvailability(req.entityId!, availability, snooze_until);

    void logAuditEvent({
      action: 'donor.availability_changed',
      actor_id: req.user!.id,
      actor_role: 'donor',
      entity_type: 'donor',
      entity_id: req.entityId!,
      metadata: { availability, snooze_until },
      ip_address: req.ip,
    });

    res.status(200).json({ data: donor });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// PATCH /v1/donor/fcm-token
// ────────────────────────────────────────────────────────
router.patch('/fcm-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fcm_token } = fcmTokenSchema.parse(req.body);
    await updateFcmToken(req.entityId!, fcm_token);
    res.status(200).json({ message: 'FCM token updated' });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// GET /v1/donor/eligibility — Phase 2
// ────────────────────────────────────────────────────────
router.get('/eligibility', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lazy import — implemented in Phase 2
    const { checkDonorEligibility } = await import('../services/eligibility/eligibility.service.js');
    const donor = await getDonorById(req.entityId!);
    const status = checkDonorEligibility(donor);
    res.status(200).json({ data: status });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// GET /v1/donor/history
// ────────────────────────────────────────────────────────
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 50);
    const result = await getDonationHistory(req.entityId!, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// GET /v1/donor/history/:id
// ────────────────────────────────────────────────────────
router.get('/history/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await getDonationHistoryById(req.entityId!, req.params['id'] as string);
    if (!history) throw AppError.notFound('Donation record not found');
    res.status(200).json({ data: history });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// GET /v1/donor/history/:id/certificate — Phase 4
// ────────────────────────────────────────────────────────
router.get('/history/:id/certificate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await getDonationHistoryById(req.entityId!, req.params['id'] as string);
    if (!history) throw AppError.notFound('Donation record not found');

    if (!history.certificate_key) {
      throw new AppError(404, 'NO_CERTIFICATE', 'No certificate generated for this donation');
    }

    // Regenerate signed URL from stored key using certificate service
    const { regenerateUrl } = await import('../services/certificate/certificate.service.js');
    const signedUrl = await regenerateUrl(history.id);

    res.status(200).json({ data: { certificate_url: signedUrl } });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// GET /v1/donor/badges
// ────────────────────────────────────────────────────────
router.get('/badges', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const badges = await getDonorBadges(req.entityId!);
    const donor = await getDonorById(req.entityId!);
    res.status(200).json({
      data: {
        badges,
        trust_score: donor.trust_score,
        total_donations: donor.total_donations,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// GET /v1/donor/notifications
// ────────────────────────────────────────────────────────
router.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('donation_responses')
      .select(`
        *,
        blood_requests:request_id (
          id, blood_group, priority, status, units_required, units_fulfilled, notes, created_at, expires_at,
          hospitals:hospital_id (name, address, city, phone, location)
        )
      `)
      .eq('donor_id', req.entityId!)
      .order('notified_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ data: data ?? [] });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// GET /v1/donor/requests/active
// ────────────────────────────────────────────────────────
router.get('/requests/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const active = await getActiveResponseForDonor(req.entityId!);
    res.status(200).json({ data: active });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// PATCH /v1/donor/requests/:responseId/respond — Phase 3
// ────────────────────────────────────────────────────────
router.patch('/requests/:responseId/respond', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = respondSchema.parse(req.body);
    const responseId = req.params['responseId'] as string;
    const supabase = getSupabase();

    // Verify this response belongs to the donor
    const { data: response, error: fetchErr } = await supabase
      .from('donation_responses')
      .select('*, blood_requests:request_id (id, hospital_id, status)')
      .eq('id', responseId)
      .eq('donor_id', req.entityId!)
      .single();

    if (fetchErr || !response) {
      throw AppError.notFound('Response not found');
    }

    if (response.status !== 'notified') {
      throw AppError.badRequest('Can only respond to notifications with status "notified"');
    }

    if (action === 'accept') {
      // Update response
      const { error: updateErr } = await supabase
        .from('donation_responses')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', responseId);

      if (updateErr) throw new AppError(500, 'UPDATE_FAILED', 'Failed to accept request');

      // Update request counters
      await supabase.rpc('increment_donors_accepted', {
        req_id: response.request_id,
      }).then(({ error: rpcErr }: { error: any }) => {
        if (rpcErr) {
          // Fallback: direct update
          return supabase
            .from('blood_requests')
            .update({ donors_accepted: (response.blood_requests as any)?.donors_accepted + 1 || 1 })
            .eq('id', response.request_id);
        }
      });

      // Increment total_accepted on donor
      const donor = await getDonorById(req.entityId!);
      await supabase
        .from('donors')
        .update({ total_accepted: (donor.total_accepted ?? 0) + 1 })
        .eq('id', req.entityId!);

      // Cancel BullMQ retry job so the system doesn't escalate to the next donor
      if (response.bull_job_id) {
        try {
          const job = await notificationQueue.getJob(response.bull_job_id);
          if (job) await job.remove();
        } catch (jobErr) {
          // Non-critical — log and continue
        }
      }

      // Real-time Socket.IO event to the hospital
      try {
        const hospitalId = (response.blood_requests as any)?.hospital_id;
        if (hospitalId) {
          emitToHospital(hospitalId, 'donor:accepted', {
            requestId: response.request_id,
            responseId,
            donorId: req.entityId!,
          });
        }
      } catch { /* non-critical */ }

      void logAuditEvent({
        action: 'donation.accepted',
        actor_id: req.user!.id,
        actor_role: 'donor',
        entity_type: 'donation_response',
        entity_id: responseId,
        metadata: { request_id: response.request_id },
        ip_address: req.ip,
      });

      res.status(200).json({ message: 'Request accepted', data: { status: 'accepted' } });
    } else {
      // Decline
      const { error: updateErr } = await supabase
        .from('donation_responses')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', responseId);

      if (updateErr) throw new AppError(500, 'UPDATE_FAILED', 'Failed to decline request');

      // Cancel BullMQ retry job on decline too
      if (response.bull_job_id) {
        try {
          const job = await notificationQueue.getJob(response.bull_job_id);
          if (job) await job.remove();
        } catch { /* non-critical */ }
      }

      // Real-time Socket.IO event to the hospital
      try {
        const hospitalId = (response.blood_requests as any)?.hospital_id;
        if (hospitalId) {
          emitToHospital(hospitalId, 'donor:declined', {
            requestId: response.request_id,
            responseId,
            donorId: req.entityId!,
          });
        }
      } catch { /* non-critical */ }

      void logAuditEvent({
        action: 'donation.declined',
        actor_id: req.user!.id,
        actor_role: 'donor',
        entity_type: 'donation_response',
        entity_id: responseId,
        metadata: { request_id: response.request_id },
        ip_address: req.ip,
      });

      res.status(200).json({ message: 'Request declined', data: { status: 'declined' } });
    }
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// PATCH /v1/donor/requests/:responseId/status — Phase 3
// ────────────────────────────────────────────────────────
router.patch('/requests/:responseId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = statusUpdateSchema.parse(req.body);
    const responseId = req.params['responseId'] as string;
    const supabase = getSupabase();

    const { data: response, error: fetchErr } = await supabase
      .from('donation_responses')
      .select('*')
      .eq('id', responseId)
      .eq('donor_id', req.entityId!)
      .single();

    if (fetchErr || !response) throw AppError.notFound('Response not found');

    if (response.status !== 'accepted' && status === 'en_route') {
      throw AppError.badRequest('Can only set en_route from accepted status');
    }
    if (response.status !== 'accepted' && response.status !== 'en_route' && status === 'arrived') {
      throw AppError.badRequest('Can only set arrived from accepted or en_route status');
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'arrived') {
      updateData['arrived_at'] = new Date().toISOString();
    }

    const { error: updateErr } = await supabase
      .from('donation_responses')
      .update(updateData)
      .eq('id', responseId);

    if (updateErr) throw new AppError(500, 'UPDATE_FAILED', 'Failed to update status');

    // Also update the blood_request status if this is the first en_route/arrived
    await supabase
      .from('blood_requests')
      .update({ status })
      .eq('id', response.request_id)
      .in('status', ['accepted', 'en_route']);

    // Real-time Socket.IO event for status change
    try {
      const hospitalId = (response as any)?.blood_requests?.hospital_id;
      if (!hospitalId) {
        // Fetch hospital_id from the request
        const { data: reqData } = await supabase
          .from('blood_requests')
          .select('hospital_id')
          .eq('id', response.request_id)
          .single();
        if (reqData?.hospital_id) {
          emitToHospital(reqData.hospital_id, `donor:${status}`, {
            requestId: response.request_id,
            responseId,
            donorId: req.entityId!,
          });
        }
      } else {
        emitToHospital(hospitalId, `donor:${status}`, {
          requestId: response.request_id,
          responseId,
          donorId: req.entityId!,
        });
      }
    } catch { /* non-critical */ }

    res.status(200).json({ message: `Status updated to ${status}`, data: { status } });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// DELETE /v1/donor/account — DPDPA account deletion
// ────────────────────────────────────────────────────────
router.delete('/account', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = getSupabase();

    // Anonymise donor data (DPDPA: right to erasure)
    await supabase
      .from('donors')
      .update({
        full_name: '[DELETED]',
        phone: `deleted_${Date.now()}`,
        date_of_birth: '1900-01-01',
        location: null,
        city: '[DELETED]',
        state: '[DELETED]',
        fcm_token: null,
        health_declaration: null,
        availability: 'unavailable',
      })
      .eq('id', req.entityId!);

    // Delete auth user (cascades to donor profile via FK)
    await supabase.auth.admin.deleteUser(req.user!.id);

    void logAuditEvent({
      action: 'donor.account_deleted',
      actor_id: req.user!.id,
      actor_role: 'system',
      entity_type: 'donor',
      entity_id: req.entityId!,
      ip_address: req.ip,
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      path: '/v1/auth',
    });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
