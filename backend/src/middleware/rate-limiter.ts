// Rate limiters — API, OTP, notification creation
// Implementation: Phase 1 (basic), Phase 8 (final audit)

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 100 requests per 15-minute window per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

/**
 * OTP rate limiter — 5 OTP sends per hour per IP.
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many OTP requests. Please wait before trying again.',
    },
  },
});

/**
 * Notification creation rate limiter — 10 request creations per minute per IP.
 */
export const notificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests created. Please slow down.',
    },
  },
});
