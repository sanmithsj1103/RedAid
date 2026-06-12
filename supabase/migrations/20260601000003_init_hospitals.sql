-- Migration: Create hospitals table
-- Stores hospital profiles, verification status, and location for surplus coordination.

CREATE TABLE hospitals (
  -- Identity
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id          UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Hospital Information
  name                  TEXT        NOT NULL,
  registration_number   TEXT        NOT NULL UNIQUE,
  department            TEXT,

  -- Contact
  phone                 TEXT        NOT NULL,
  email                 TEXT        NOT NULL,

  -- Location
  address               TEXT        NOT NULL,
  city                  TEXT        NOT NULL,
  state                 TEXT        NOT NULL,
  location              GEOGRAPHY(POINT, 4326),

  -- Verification & Status
  is_verified           BOOLEAN     NOT NULL DEFAULT false,
  is_active             BOOLEAN     NOT NULL DEFAULT true,
  is_blacklisted        BOOLEAN     NOT NULL DEFAULT false,

  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
