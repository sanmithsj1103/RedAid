-- Seed Data for RedAid Development
-- Creates test users, donors, hospitals, and sample data for local development.
-- Run with: supabase db reset (development only)

-- ═══════════════════════════════════════════════════
-- NOTE: Auth users must be created via Supabase Auth API,
-- not directly in the DB. The UUIDs below are placeholders
-- that should be replaced with actual auth user IDs after
-- creating test users through the Supabase dashboard or CLI.
-- ═══════════════════════════════════════════════════

-- Placeholder auth user IDs (replace after creating auth users)
-- Donor 1: 00000000-0000-0000-0000-000000000001
-- Donor 2: 00000000-0000-0000-0000-000000000002
-- Hospital 1 (verified): 00000000-0000-0000-0000-000000000003
-- Hospital 2 (pending): 00000000-0000-0000-0000-000000000004

-- ─────────────────────────────
-- Test Donors
-- ─────────────────────────────

INSERT INTO donors (
  id, auth_user_id, full_name, phone, date_of_birth, blood_group,
  location, city, state, availability, trust_score,
  total_donations, total_responses, total_accepted, health_declaration
) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Arjun Sharma',
  '+919876543210',
  '1995-03-15',
  'O+',
  ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::GEOGRAPHY,
  'Bangalore',
  'Karnataka',
  'active',
  85.50,
  3, 5, 4,
  '{"consent_given": true, "consent_timestamp": "2026-06-01T10:00:00Z", "questions": {"recent_illness": false, "recent_surgery": false, "current_medications": false, "chronic_conditions": false, "recent_transfusion": false, "pregnancy": false}, "declaration_version": "1.0"}'::JSONB
),
(
  'a1000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Priya Menon',
  '+919876543211',
  '1990-07-22',
  'A-',
  ST_SetSRID(ST_MakePoint(77.6100, 12.9350), 4326)::GEOGRAPHY,
  'Bangalore',
  'Karnataka',
  'active',
  100.00,
  0, 0, 0,
  '{"consent_given": true, "consent_timestamp": "2026-06-02T14:30:00Z", "questions": {"recent_illness": false, "recent_surgery": false, "current_medications": false, "chronic_conditions": false, "recent_transfusion": false, "pregnancy": false}, "declaration_version": "1.0"}'::JSONB
);

-- ─────────────────────────────
-- Test Hospitals
-- ─────────────────────────────

INSERT INTO hospitals (
  id, auth_user_id, name, registration_number, department,
  phone, email, address, city, state,
  location, is_verified, is_active
) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'Manipal Hospital Whitefield',
  'KA-HOSP-2024-001',
  'Blood Bank',
  '+918011234567',
  'bloodbank@manipal-whitefield.org',
  'ITPL Main Road, Whitefield',
  'Bangalore',
  'Karnataka',
  ST_SetSRID(ST_MakePoint(77.7480, 12.9698), 4326)::GEOGRAPHY,
  true,
  true
),
(
  'b1000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000004',
  'St. Johns Medical College Hospital',
  'KA-HOSP-2024-002',
  'Blood Bank',
  '+918022345678',
  'bloodbank@stjohns.org',
  'Sarjapur Road, Koramangala',
  'Bangalore',
  'Karnataka',
  ST_SetSRID(ST_MakePoint(77.6200, 12.9250), 4326)::GEOGRAPHY,
  false,
  true
);

-- ─────────────────────────────
-- Blood Inventory for Verified Hospital
-- ─────────────────────────────

INSERT INTO blood_inventory (hospital_id, blood_group, units_available)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'A+',  5),
  ('b1000000-0000-0000-0000-000000000001', 'A-',  2),
  ('b1000000-0000-0000-0000-000000000001', 'B+',  8),
  ('b1000000-0000-0000-0000-000000000001', 'B-',  1),
  ('b1000000-0000-0000-0000-000000000001', 'AB+', 3),
  ('b1000000-0000-0000-0000-000000000001', 'AB-', 0),
  ('b1000000-0000-0000-0000-000000000001', 'O+',  6),
  ('b1000000-0000-0000-0000-000000000001', 'O-',  2);
