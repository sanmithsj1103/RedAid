-- Migration: Create donor_badges table
-- Gamification badges earned by donors. Each (donor, badge_type) pair is unique.

CREATE TABLE donor_badges (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id          UUID        NOT NULL REFERENCES donors(id) ON DELETE CASCADE,

  -- Badge
  badge_type        TEXT        NOT NULL,
  awarded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB,

  -- One badge type per donor
  UNIQUE (donor_id, badge_type)
);
