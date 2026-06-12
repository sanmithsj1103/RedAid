import { BloodGroup } from './blood.js';

/**
 * Donor profile shape as stored in the database.
 */
export interface DonorProfile {
  id: string;
  auth_user_id: string;
  full_name: string;
  phone: string;
  date_of_birth: string; // ISO date string
  blood_group: BloodGroup;
  location: unknown; // PostGIS GEOGRAPHY point
  city: string;
  state: string;
  availability: Availability;
  snooze_until: string | null;
  last_donated_at: string | null;
  is_verified: boolean;
  is_blacklisted: boolean;
  is_suspended: boolean;
  trust_score: number;
  total_donations: number;
  total_responses: number;
  total_accepted: number;
  fcm_token: string | null;
  health_declaration: HealthDeclaration | null;
  created_at: string;
  updated_at: string;
}

export type Availability = 'active' | 'snoozed' | 'unavailable';

/**
 * Eligibility check result returned by GET /v1/donor/eligibility.
 */
export interface EligibilityStatus {
  eligible: boolean;
  reason?:
    | 'too_young'
    | 'too_old'
    | 'donation_lock'
    | 'snoozed'
    | 'unavailable'
    | 'blacklisted'
    | 'suspended';
  next_eligible_date?: string; // ISO 8601
  days_remaining?: number;
}

/**
 * Health declaration JSONB shape stored at registration.
 */
export interface HealthDeclaration {
  consent_given: boolean;
  consent_timestamp: string;
  questions: {
    recent_illness: boolean;
    recent_surgery: boolean;
    current_medications: boolean;
    chronic_conditions: boolean;
    recent_transfusion: boolean;
    pregnancy: boolean;
  };
  declaration_version: string;
}
