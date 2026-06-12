import Redis from 'ioredis';
import { env } from './env.js';

/**
 * Upstash Redis connection — shared by BullMQ queue and workers.
 * Uses TLS by default for Upstash connections.
 * Free tier: 10K commands/day, 256MB storage.
 */
const redisHost = env.UPSTASH_REDIS_REST_URL.replace(/^https?:\/\//, '');

export const redis = new Redis({
  host: redisHost,
  port: 6379,
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
