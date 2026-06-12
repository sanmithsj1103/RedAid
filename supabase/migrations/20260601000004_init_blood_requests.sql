-- Migration: Create blood_requests table
-- Central entity — every blood request created by a hospital.

CREATE TABLE blood_requests (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID        NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,

  -- Request Details
  blood_group       TEXT        NOT NULL
                    CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_required    INT         NOT NULL CHECK (units_required BETWEEN 1 AND 20),
  units_fulfilled   INT         NOT NULL DEFAULT 0
                    CHECK (units_fulfilled >= 0),
  priority          TEXT        NOT NULL
                    CHECK (priority IN ('critical', 'urgent', 'scheduled')),
  notes             TEXT        CHECK (char_length(notes) <= 500),

  -- Status & Matching State
  status            TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending', 'dispatched', 'accepted',
                      'en_route', 'arrived', 'completed',
                      'cancelled', 'expired'
                    )),
  search_radius_km  INT         NOT NULL DEFAULT 15,
  donors_notified   INT         NOT NULL DEFAULT 0,
  donors_accepted   INT         NOT NULL DEFAULT 0,

  -- Lifecycle Timestamps
  expires_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
