import admin from 'firebase-admin';
import { env } from './env.js';

/**
 * Firebase Admin SDK — used for FCM push notifications.
 * Initialised once at startup from environment credentials.
 */
if (!admin.apps.length && process.env['NODE_ENV'] !== 'test') {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export const firebaseAdmin = admin;
export const messaging = process.env['NODE_ENV'] === 'test' ? ({} as any) : admin.messaging();
