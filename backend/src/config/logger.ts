import pino from 'pino';
import { randomUUID } from 'crypto';

/**
 * Structured JSON logger using pino.
 * In development: pretty-printed. In production: raw JSON for log ingestion.
 * Reads NODE_ENV directly to avoid circular dependency with env.ts.
 */
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

export const logger = pino({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: {
    service: 'redaid-api',
    env: NODE_ENV,
  },
});

/**
 * Generate a unique request ID for log correlation.
 */
export function generateRequestId(): string {
  return randomUUID();
}
