/**
 * Blood request status and priority enums.
 */

export enum RequestStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  ACCEPTED = 'accepted',
  EN_ROUTE = 'en_route',
  ARRIVED = 'arrived',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum RequestPriority {
  CRITICAL = 'critical',
  URGENT = 'urgent',
  SCHEDULED = 'scheduled',
}

export enum ResponseStatus {
  NOTIFIED = 'notified',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  NO_RESPONSE = 'no_response',
  NO_SHOW = 'no_show',
  DONATED = 'donated',
  CANCELLED = 'cancelled',
}

/** Auto-expiry durations per priority (in hours) */
export const EXPIRY_HOURS: Record<RequestPriority, number> = {
  [RequestPriority.CRITICAL]: 2,
  [RequestPriority.URGENT]: 6,
  [RequestPriority.SCHEDULED]: 24,
};

/** Radius auto-expansion steps in km */
export const RADIUS_STEPS = [15, 25, 40, 60] as const;

/** Minimum donors needed before stopping radius expansion */
export const MIN_DONORS_THRESHOLD = 3;

/** Notification retry delay in milliseconds (10 minutes) */
export const NOTIFICATION_RETRY_DELAY_MS = 10 * 60 * 1000;

/** Batch sizes per priority for donor notification */
export const DISPATCH_BATCH_SIZE: Record<RequestPriority, number | 'all'> = {
  [RequestPriority.CRITICAL]: 'all',
  [RequestPriority.URGENT]: 5,
  [RequestPriority.SCHEDULED]: 3,
};
