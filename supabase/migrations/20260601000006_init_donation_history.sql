-- Migration: Create donation_history table
-- Immutable audit record of completed donations. INSERT only — no UPDATE or DELETE.

CREATE TABLE donation_history (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id          UUID        NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,
  hospital_id       UUID        NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
  request_id        UUID        NOT NULL REFERENCES blood_requests(id) ON DELETE RESTRICT,

  -- Donation Details
  blood_group       TEXT        NOT NULL,
  units_donated     INT         NOT NULL DEFAULT 1 CHECK (units_donated > 0),
  donated_at        TIMESTAMPTZ NOT NULL,

  -- Certificate
  certificate_url   TEXT,
  certificate_key   TEXT,

  -- Record Creation
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate history records
  UNIQUE (donor_id, request_id)
);
