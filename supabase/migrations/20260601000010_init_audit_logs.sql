-- Migration: Create audit_logs table
-- Immutable, append-only log. INSERT only — no UPDATE or DELETE.

CREATE TABLE audit_logs (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  actor_id          UUID,
  actor_role        TEXT        CHECK (actor_role IN ('donor', 'hospital', 'admin', 'system')),

  -- Action
  action            TEXT        NOT NULL,
  entity_type       TEXT,
  entity_id         UUID,

  -- Context
  metadata          JSONB,
  ip_address        TEXT,

  -- Timestamp
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
