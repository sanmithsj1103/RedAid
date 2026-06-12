-- Migration: Create donors table
-- Stores donor profiles, availability state, trust scores, and push notification tokens.

CREATE TABLE donors (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal Information
  full_name         TEXT        NOT NULL,
  phone             TEXT        NOT NULL UNIQUE,
  date_of_birth     DATE        NOT NULL,
  blood_group       TEXT        NOT NULL
                    CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),

  -- Location
  location          GEOGRAPHY(POINT, 4326),
  city              TEXT        NOT NULL,
  state             TEXT        NOT NULL DEFAULT 'Karnataka',

  -- Availability & Eligibility State
  availability      TEXT        NOT NULL DEFAULT 'active'
                    CHECK (availability IN ('active', 'snoozed', 'unavailable')),
  snooze_until      TIMESTAMPTZ,
  last_donated_at   TIMESTAMPTZ,
  is_verified       BOOLEAN     NOT NULL DEFAULT true,
  is_blacklisted    BOOLEAN     NOT NULL DEFAULT false,

  -- Trust & Gamification
  trust_score       NUMERIC(5,2) NOT NULL DEFAULT 100.00
                    CHECK (trust_score BETWEEN 0 AND 100),
  total_donations   INT         NOT NULL DEFAULT 0 CHECK (total_donations >= 0),
  total_responses   INT         NOT NULL DEFAULT 0 CHECK (total_responses >= 0),
  total_accepted    INT         NOT NULL DEFAULT 0 CHECK (total_accepted >= 0),

  -- Push Notifications
  fcm_token         TEXT,

  -- Registration Data
  health_declaration JSONB,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
