import Redis from 'ioredis';
import { env } from './env.js';

/**
 * Upstash Redis connection — shared by BullMQ queue and workers.
 * Uses TLS by default for Upstash connections.
 * Free tier: 10K commands/day, 256MB storage.
 */
export const redis = new Redis(env.UPSTASH_REDIS_REST_URL, {
  password: env.UPSTASH_REDIS_REST_TOKEN,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: false,
  },
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});
