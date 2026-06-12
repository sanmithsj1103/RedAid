-- Migration: Create hospital_surplus table
-- Cross-hospital surplus coordination listings.

CREATE TABLE hospital_surplus (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,

  -- Surplus Details
  blood_group       TEXT        NOT NULL
                    CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_available   INT         NOT NULL CHECK (units_available > 0),

  -- Offer Lifecycle
  expires_at        TIMESTAMPTZ NOT NULL,
  is_claimed        BOOLEAN     NOT NULL DEFAULT false,
  claimed_by        UUID        REFERENCES hospitals(id) ON DELETE SET NULL,
  claimed_at        TIMESTAMPTZ,

  -- Record
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
