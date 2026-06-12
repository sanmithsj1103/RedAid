import { messaging } from '../../config/firebase.js';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../config/logger.js';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

let _supabaseAdmin: any = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send a push notification to a device token using Firebase Cloud Messaging (FCM).
 * Handles expired/invalid token cleanup in the database automatically.
 */
export async function sendPushNotification(
  token: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    const response = await messaging.send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          sound: 'default',
          requireInteraction: true,
        },
      },
    });

    logger.debug({ response, token }, 'FCM notification sent successfully');
    return true;
  } catch (error: any) {
    logger.warn({ error: error.message, code: error.code, token }, 'FCM notification send failed');

    // Handle token expiration/invalidation
    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-argument'
    ) {
      logger.info({ token }, 'FCM token is invalid or expired. Cleaning up in database.');
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('donors')
          .update({ fcm_token: null })
          .eq('fcm_token', token);
      } catch (dbErr) {
        logger.error({ error: dbErr, token }, 'Failed to clear invalid FCM token in database');
      }
    }

    return false;
  }
}
