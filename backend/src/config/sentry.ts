import * as Sentry from '@sentry/node';
import { env } from './env.js';

/**
 * Initialise Sentry Node SDK for application-wide error tracking
 * and performance monitoring.
 */
export function initSentry(): void {
  if (env.SENTRY_DSN) {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  }
}
