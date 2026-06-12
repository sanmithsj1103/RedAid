// Auth routes — OTP send/verify, registration, refresh, logout
// Phase 1 Implementation

import { Router, Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { otpLimiter } from '../middleware/rate-limiter.js';
import { requireAuthLight } from '../middleware/auth.js';
import { AppError } from '../utils/app-error.js';
import { logAuditEvent } from '../services/audit/audit.service.js';
import { logger } from '../config/logger.js';
import { BLOOD_GROUPS } from '../types/blood.js';

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

// ────────────────────────────────────────────────────────
// Validation Schemas
// ────────────────────────────────────────────────────────

const otpSendSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Phone must be +91XXXXXXXXXX format'),
});

const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/),
  token: z.string().length(6, 'OTP must be 6 digits'),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
});

const donorRegisterSchema = z.object({
  full_name: z.string().min(2).max(100),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blood_group: z.enum(BLOOD_GROUPS as [string, ...string[]]),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100).default('Karnataka'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  health_declaration: z.object({
    consent_given: z.literal(true),
    questions: z.object({
      recent_illness: z.boolean(),
      recent_surgery: z.boolean(),
      current_medications: z.boolean(),
      chronic_conditions: z.boolean(),
      recent_transfusion: z.boolean(),
      pregnancy: z.boolean(),
    }),
  }),
});

const hospitalRegisterSchema = z.object({
  name: z.string().min(2).max(200),
  registration_number: z.string().min(3).max(50),
  department: z.string().max(100).optional(),
  email: z.string().email(),
  address: z.string().min(5).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ────────────────────────────────────────────────────────
// POST /v1/auth/otp/send
// ────────────────────────────────────────────────────────
router.post('/otp/send', otpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = otpSendSchema.parse(req.body);

    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
      logger.warn({ error: error.message, phone }, 'OTP send failed');
      throw new AppError(400, 'OTP_SEND_FAILED', error.message);
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// POST /v1/auth/otp/verify
// ────────────────────────────────────────────────────────
router.post('/otp/verify', otpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, token } = otpVerifySchema.parse(req.body);

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error || !data.session) {
      logger.warn({ error: error?.message, phone }, 'OTP verify failed');
      throw new AppError(401, 'OTP_VERIFY_FAILED', error?.message ?? 'Verification failed');
    }

    const user = data.user;
    const session = data.session;
    const role = user?.user_metadata?.['role'] as string | undefined;
    const entityId = user?.user_metadata?.['entity_id'] as string | undefined;

    // Determine if new or existing user
    const isNewUser = !role;

    if (isNewUser) {
      // New user — return temp token for registration
      res.status(200).json({
        isNewUser: true,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } else {
      // Existing user — set refresh token as httpOnly cookie
      res.cookie('refresh_token', session.refresh_token, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/v1/auth',
      });

      res.status(200).json({
        isNewUser: false,
        access_token: session.access_token,
        role,
        entity_id: entityId,
      });
    }
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// POST /v1/auth/login
// ────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phone, password } = loginSchema.parse(req.body);
    const supabase = getSupabase();

    let result;
    if (email) {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else if (phone) {
      result = await supabase.auth.signInWithPassword({ phone, password });
    } else {
      throw AppError.badRequest('Email or phone is required');
    }

    if (result.error || !result.data.session) {
      logger.warn({ error: result.error?.message, email, phone }, 'Login failed');
      throw new AppError(401, 'LOGIN_FAILED', result.error?.message ?? 'Invalid credentials');
    }

    const session = result.data.session;
    const user = result.data.user;
    const role = user?.user_metadata?.['role'] as string | undefined;
    const entityId = user?.user_metadata?.['entity_id'] as string | undefined;

    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', session.refresh_token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/v1/auth',
    });

    res.status(200).json({
      access_token: session.access_token,
      role,
      entity_id: entityId,
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// POST /v1/auth/donor/register
// ────────────────────────────────────────────────────────
router.post('/donor/register', requireAuthLight, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw AppError.unauthorized();

    const body = donorRegisterSchema.parse(req.body);
    const supabase = getSupabase();

    // Check if user already has a role
    if (req.role) {
      throw AppError.conflict('User already registered with a role');
    }

    // Create donor profile
    const { data: donor, error: donorError } = await supabase
      .from('donors')
      .insert({
        auth_user_id: req.user.id,
        full_name: body.full_name,
        phone: req.user.phone!,
        date_of_birth: body.date_of_birth,
        blood_group: body.blood_group,
        city: body.city,
        state: body.state,
        location: `SRID=4326;POINT(${body.longitude} ${body.latitude})`,
        health_declaration: {
          consent_given: body.health_declaration.consent_given,
          consent_timestamp: new Date().toISOString(),
          questions: body.health_declaration.questions,
          declaration_version: '1.0',
        },
      })
      .select('id')
      .single();

    if (donorError) {
      logger.error({ error: donorError }, 'Donor profile insert failed');
      if (donorError.code === '23505') {
        throw AppError.conflict('A donor profile already exists for this phone number');
      }
      throw new AppError(500, 'REGISTRATION_FAILED', 'Failed to create donor profile');
    }

    // Set role in user_metadata
    const { error: metaError } = await supabase.auth.admin.updateUserById(req.user.id, {
      user_metadata: {
        role: 'donor',
        entity_id: donor.id,
      },
    });

    if (metaError) {
      logger.error({ error: metaError }, 'Failed to set user metadata');
      // Rollback: delete the donor profile
      await supabase.from('donors').delete().eq('id', donor.id);
      throw new AppError(500, 'REGISTRATION_FAILED', 'Failed to set user role');
    }

    // Audit log
    void logAuditEvent({
      action: 'donor.registered',
      actor_id: req.user.id,
      actor_role: 'donor',
      entity_type: 'donor',
      entity_id: donor.id,
      ip_address: req.ip,
    });

    // Re-issue session with updated metadata
    // Client should re-verify OTP or refresh to get new token with role claim
    res.status(201).json({
      message: 'Donor registration successful',
      donor_id: donor.id,
      role: 'donor',
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// POST /v1/auth/hospital/register
// ────────────────────────────────────────────────────────
router.post('/hospital/register', requireAuthLight, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw AppError.unauthorized();

    const body = hospitalRegisterSchema.parse(req.body);
    const supabase = getSupabase();

    if (req.role) {
      throw AppError.conflict('User already registered with a role');
    }

    // Create hospital profile (is_verified defaults to false — admin must verify)
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .insert({
        auth_user_id: req.user.id,
        name: body.name,
        registration_number: body.registration_number,
        department: body.department ?? null,
        phone: req.user.phone!,
        email: body.email,
        address: body.address,
        city: body.city,
        state: body.state,
        location: `SRID=4326;POINT(${body.longitude} ${body.latitude})`,
      })
      .select('id')
      .single();

    if (hospitalError) {
      logger.error({ error: hospitalError }, 'Hospital profile insert failed');
      if (hospitalError.code === '23505') {
        throw AppError.conflict('A hospital with this registration number already exists');
      }
      throw new AppError(500, 'REGISTRATION_FAILED', 'Failed to create hospital profile');
    }

    // Auto-insert 8 blood inventory rows
    const inventoryRows = BLOOD_GROUPS.map((bg) => ({
      hospital_id: hospital.id,
      blood_group: bg,
      units_available: 0,
    }));

    const { error: invError } = await supabase
      .from('blood_inventory')
      .insert(inventoryRows);

    if (invError) {
      logger.error({ error: invError }, 'Blood inventory insert failed');
      // Non-fatal — inventory can be created later
    }

    // Set role in user_metadata
    const { error: metaError } = await supabase.auth.admin.updateUserById(req.user.id, {
      user_metadata: {
        role: 'hospital',
        entity_id: hospital.id,
      },
    });

    if (metaError) {
      logger.error({ error: metaError }, 'Failed to set user metadata');
      await supabase.from('hospitals').delete().eq('id', hospital.id);
      throw new AppError(500, 'REGISTRATION_FAILED', 'Failed to set user role');
    }

    // Audit log
    void logAuditEvent({
      action: 'hospital.registered',
      actor_id: req.user.id,
      actor_role: 'hospital',
      entity_type: 'hospital',
      entity_id: hospital.id,
      metadata: { registration_number: body.registration_number },
      ip_address: req.ip,
    });

    res.status(201).json({
      message: 'Hospital registration successful. Pending admin verification.',
      hospital_id: hospital.id,
      role: 'hospital',
      is_verified: false,
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// POST /v1/auth/refresh
// ────────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = (req.cookies?.['refresh_token'] || req.body?.refresh_token) as string | undefined;
    if (!refreshToken) {
      throw AppError.unauthorized('No refresh token provided');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw AppError.unauthorized('Failed to refresh session');
    }

    // Rotate refresh token in httpOnly cookie
    res.cookie('refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/v1/auth',
    });

    res.status(200).json({
      access_token: data.session.access_token,
      role: data.user?.user_metadata?.['role'],
      entity_id: data.user?.user_metadata?.['entity_id'],
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────────────────
// POST /v1/auth/logout
// ────────────────────────────────────────────────────────
router.post('/logout', async (_req: Request, res: Response) => {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    path: '/v1/auth',
  });

  res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
