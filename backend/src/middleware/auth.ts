// Auth middleware — requireAuth + requireRole + account status checks
// Phase 1 Implementation

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../config/logger.js';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

// Lazy-init supabase client for auth verification
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabase;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phone?: string;
        user_metadata?: Record<string, unknown>;
      };
      role?: string;
      entityId?: string;
    }
  }
}

/**
 * Verifies the JWT Bearer token via supabase.auth.getUser().
 * Attaches req.user, req.role, req.entityId.
 * Returns 401 if missing or invalid.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw AppError.unauthorized('Missing token');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      logger.warn({ error: error?.message }, 'Auth verification failed');
      throw AppError.unauthorized('Invalid or expired token');
    }

    const user = data.user;
    const role = (user.user_metadata?.['role'] as string) ?? undefined;
    const entityId = (user.user_metadata?.['entity_id'] as string) ?? undefined;

    req.user = {
      id: user.id,
      phone: user.phone,
      user_metadata: user.user_metadata,
    };
    req.role = role;
    req.entityId = entityId;

    // Account status checks — only if role and entityId exist (not during registration)
    if (role && entityId) {
      await checkAccountStatus(supabase, role, entityId);
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Checks the account status (blacklisted, suspended, unverified)
 * by querying the relevant profile table.
 */
async function checkAccountStatus(
  supabase: any,
  role: string,
  entityId: string
): Promise<void> {
  if (role === 'donor') {
    const { data: donor } = await supabase
      .from('donors')
      .select('is_blacklisted, is_verified, is_suspended')
      .eq('id', entityId)
      .single();

    if (donor?.is_blacklisted) {
      throw AppError.forbidden('BLACKLISTED', 'Your account has been blacklisted');
    }
    if (donor?.is_suspended) {
      throw AppError.forbidden('SUSPENDED', 'Your account is currently suspended');
    }
    // Donors are verified by default, but check anyway
    if (donor && !donor.is_verified) {
      throw AppError.forbidden('UNVERIFIED', 'Your account is pending verification');
    }
  }

  if (role === 'hospital') {
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('is_blacklisted, is_verified, is_active')
      .eq('id', entityId)
      .single();

    if (hospital?.is_blacklisted) {
      throw AppError.forbidden('BLACKLISTED', 'Your hospital has been blacklisted');
    }
    if (hospital && !hospital.is_verified) {
      throw AppError.forbidden('UNVERIFIED', 'Your hospital is pending admin verification');
    }
    if (hospital && !hospital.is_active) {
      throw AppError.forbidden('SUSPENDED', 'Your hospital account is suspended');
    }
  }
}

/**
 * Checks req.role against allowed roles.
 * Returns 403 if the user's role is not in the allowed list.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.role || !roles.includes(req.role)) {
      next(AppError.forbidden('INSUFFICIENT_ROLE', `Requires one of: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}

/**
 * Lightweight auth — only verifies JWT and extracts user info.
 * Does NOT check account status. Used for registration endpoints
 * where the user doesn't have a profile yet.
 */
export async function requireAuthLight(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw AppError.unauthorized('Missing token');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw AppError.unauthorized('Invalid or expired token');
    }

    req.user = {
      id: data.user.id,
      phone: data.user.phone,
      user_metadata: data.user.user_metadata,
    };
    req.role = (data.user.user_metadata?.['role'] as string) ?? undefined;
    req.entityId = (data.user.user_metadata?.['entity_id'] as string) ?? undefined;

    next();
  } catch (err) {
    next(err);
  }
}
