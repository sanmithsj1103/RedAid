-- Migration: Create donation_responses table
-- One row per (request, donor) pair — tracks the full lifecycle of a donor's involvement.

CREATE TABLE donation_responses (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID        NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id          UUID        NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,

  -- Status
  status            TEXT        NOT NULL DEFAULT 'notified'
                    CHECK (status IN (
                      'notified',
                      'accepted',
                      'declined',
                      'no_response',
                      'no_show',
                      'donated',
                      'cancelled'
                    )),

  -- Timeline
  notified_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at      TIMESTAMPTZ,
  arrived_at        TIMESTAMPTZ,
  donated_at        TIMESTAMPTZ,

  -- Hospital Feedback
  hospital_rating   INT         CHECK (hospital_rating BETWEEN 1 AND 5),
  hospital_feedback TEXT        CHECK (char_length(hospital_feedback) <= 300),

  -- Queue Management
  notification_seq  INT         NOT NULL DEFAULT 1,
  bull_job_id       TEXT,

  -- Uniqueness: one response per donor per request
  UNIQUE (request_id, donor_id)
);
