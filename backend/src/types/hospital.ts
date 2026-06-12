import { BloodGroup } from './blood.js';

/**
 * Hospital profile shape as stored in the database.
 */
export interface HospitalProfile {
  id: string;
  auth_user_id: string;
  name: string;
  registration_number: string;
  department: string | null;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  location: unknown; // PostGIS GEOGRAPHY point
  is_verified: boolean;
  is_active: boolean;
  is_blacklisted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Blood inventory row — one per (hospital, blood_group) pair.
 */
export interface BloodInventory {
  id: string;
  hospital_id: string;
  blood_group: BloodGroup;
  units_available: number;
  low_stock_threshold: number;
  updated_at: string;
}

/**
 * Hospital surplus listing for cross-hospital coordination.
 */
export interface HospitalSurplus {
  id: string;
  hospital_id: string;
  blood_group: BloodGroup;
  units_available: number;
  expires_at: string;
  is_claimed: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
}
