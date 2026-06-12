/**
 * Custom application error class for structured error responses.
 * Thrown by service logic, caught by the global error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';

    // Capture stack trace (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 — Validation error */
  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  /** 401 — Missing or invalid auth */
  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  /** 403 — Valid auth, insufficient permissions */
  static forbidden(code = 'FORBIDDEN', message = 'Access denied'): AppError {
    return new AppError(403, code, message);
  }

  /** 404 — Resource not found */
  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, 'NOT_FOUND', message);
  }

  /** 409 — Conflict (duplicate entry) */
  static conflict(message = 'Resource already exists'): AppError {
    return new AppError(409, 'CONFLICT', message);
  }

  /** 422 — Unprocessable (e.g., donor ineligible) */
  static ineligible(message: string): AppError {
    return new AppError(422, 'INELIGIBLE', message);
  }

  /** 429 — Rate limited */
  static rateLimited(message = 'Too many requests'): AppError {
    return new AppError(429, 'RATE_LIMITED', message);
  }
}
