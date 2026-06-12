import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment variable schema — validated at startup.
 * The server crashes immediately if any required variable is missing,
 * preventing silent failures in production.
 */
const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(1),

  // Redis (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),

  // Resend
  RESEND_API_KEY: z.string().min(1),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),

  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  if (process.env['NODE_ENV'] === 'test') {
    process.env['SUPABASE_URL'] = process.env['SUPABASE_URL'] || 'https://mock-supabase.co';
    process.env['SUPABASE_SERVICE_ROLE_KEY'] = process.env['SUPABASE_SERVICE_ROLE_KEY'] || 'mock-key';
    process.env['SUPABASE_JWT_SECRET'] = process.env['SUPABASE_JWT_SECRET'] || 'mock-secret';
    process.env['UPSTASH_REDIS_REST_URL'] = process.env['UPSTASH_REDIS_REST_URL'] || 'https://mock-redis.co';
    process.env['UPSTASH_REDIS_REST_TOKEN'] = process.env['UPSTASH_REDIS_REST_TOKEN'] || 'mock-token';
    process.env['FIREBASE_PROJECT_ID'] = process.env['FIREBASE_PROJECT_ID'] || 'mock-project';
    process.env['FIREBASE_CLIENT_EMAIL'] = process.env['FIREBASE_CLIENT_EMAIL'] || 'mock@mock.com';
    process.env['FIREBASE_PRIVATE_KEY'] = process.env['FIREBASE_PRIVATE_KEY'] || 'mock-key';
    process.env['RESEND_API_KEY'] = process.env['RESEND_API_KEY'] || 'mock-api-key';
    process.env['SENTRY_DSN'] = process.env['SENTRY_DSN'] || 'https://mock-sentry.co';
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
