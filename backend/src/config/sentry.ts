// Sentry configuration will be initialised here in Phase 8.
// Placeholder for now — Sentry is a pre-launch concern.

// import * as Sentry from '@sentry/node';
// import { env } from './env.js';
//
// export function initSentry(): void {
//   if (env.SENTRY_DSN) {
//     Sentry.init({
//       dsn: env.SENTRY_DSN,
//       environment: env.NODE_ENV,
//       tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
//     });
//   }
// }

export function initSentry(): void {
  // No-op until Phase 8
}
