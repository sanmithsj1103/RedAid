# Backend Schema Document
## RedAid — Real-Time Emergency Blood Coordination Platform

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | June 2026 |
| **Status** | Approved for Development |
| **Document Owner** | Engineering Lead |
| **References** | RedAid PRD v1.0, RedAid TRD v1.0, RedAid AppFlow v1.0 |

---

## Table of Contents

1. [Overview & Principles](#1-overview--principles)
2. [Database Platform & Configuration](#2-database-platform--configuration)
3. [Entity Relationship Diagram](#3-entity-relationship-diagram)
4. [Table Definitions](#4-table-definitions)
   - 4.1 [donors](#41-donors)
   - 4.2 [hospitals](#42-hospitals)
   - 4.3 [blood_requests](#43-blood_requests)
   - 4.4 [donation_responses](#44-donation_responses)
   - 4.5 [donation_history](#45-donation_history)
   - 4.6 [blood_inventory](#46-blood_inventory)
   - 4.7 [hospital_surplus](#47-hospital_surplus)
   - 4.8 [donor_badges](#48-donor_badges)
   - 4.9 [audit_logs](#49-audit_logs)
5. [Relationships & Foreign Keys](#5-relationships--foreign-keys)
6. [Indexes & Query Optimisation](#6-indexes--query-optimisation)
7. [Row-Level Security (RLS) Policies](#7-row-level-security-rls-policies)
8. [Authentication Architecture](#8-authentication-architecture)
9. [Data Storage Strategy](#9-data-storage-strategy)
10. [Data Flow by Feature](#10-data-flow-by-feature)
11. [Data Lifecycle & Retention](#11-data-lifecycle--retention)
12. [Enums & Constrained Values](#12-enums--constrained-values)
13. [JSONB Field Schemas](#13-jsonb-field-schemas)
14. [Migration Strategy](#14-migration-strategy)
15. [Seed Data](#15-seed-data)

---

## 1. Overview & Principles

This document is the authoritative reference for all data storage decisions in RedAid V1. It defines every table, column, relationship, constraint, and storage rule used in the system.

### Core Principles

**Single PostgreSQL project.** All relational data lives in one Supabase PostgreSQL instance. There is no secondary relational database. Redis (Upstash) is used exclusively for the BullMQ job queue — it holds no application data that is not also in PostgreSQL.

**UUID primary keys everywhere.** All tables use `gen_random_uuid()` as the default PK. This prevents enumeration attacks and makes IDs safe to expose in API responses and URLs.

**All timestamps in UTC.** Every `TIMESTAMPTZ` column stores and returns UTC. The frontend is responsible for localising display to IST (UTC+5:30).

**PostGIS for location.** Donor and hospital coordinates are stored as `GEOGRAPHY(POINT, 4326)` — WGS84 standard GPS format — using PostGIS. This enables accurate `ST_Distance` and `ST_DWithin` queries in metres, not degrees.

**Immutability where it matters.** The `donation_history` and `audit_logs` tables are append-only. No `UPDATE` is ever issued against them after insert. This is enforced by RLS and convention.

**RLS on every table.** Row-Level Security is enabled on all tables. No table is world-readable. The service role key (bypasses RLS) is used exclusively server-side and is never exposed to clients.

**JSONB for variable structure.** Fields with variable or evolving internal structure (health declarations, badge metadata, audit metadata) are stored as `JSONB`. Indexed where queried.

---

## 2. Database Platform & Configuration

| Attribute | Value |
|---|---|
| **Platform** | Supabase (managed PostgreSQL) |
| **PostgreSQL Version** | 15.x |
| **PostGIS Version** | 3.x |
| **Region** | `ap-south-1` (Mumbai) — DPDPA 2023 data residency compliance |
| **Connection Pooling** | Supabase PgBouncer (session mode) |
| **Encryption at Rest** | AES-256 (managed by Supabase) |
| **Encryption in Transit** | TLS 1.3 on all connections |
| **Backups** | Supabase daily automated backups (7-day retention on free tier) |
| **Extensions Required** | `postgis`, `uuid-ossp` (for `gen_random_uuid` on older PG versions) |

### Enabling Required Extensions

```sql
-- Run once during initial project setup
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Schema Namespace

All application tables live in the `public` schema. Supabase Auth tables live in the `auth` schema (managed by Supabase, not modified directly).

---

## 3. Entity Relationship Diagram

```
auth.users (Supabase Auth — managed)
    │
    ├─── 1:1 ──► donors
    │               │
    │               ├─── 1:many ──► donation_responses
    │               │                     │
    │               ├─── 1:many ──► donation_history ◄─────────┐
    │               │                                           │
    │               └─── 1:many ──► donor_badges               │
    │                                                           │
    └─── 1:1 ──► hospitals                                     │
                    │                                           │
                    ├─── 1:many ──► blood_requests ────────────┤
                    │                     │                     │
                    │                     └─── 1:many ──► donation_responses
                    │
                    ├─── 1:8    ──► blood_inventory
                    │               (one row per blood group)
                    │
                    └─── 1:many ──► hospital_surplus
                                        │
                                        └─── claimed_by (FK) ──► hospitals


audit_logs (no FK — actor_id is soft reference only for immutability)
```

### Relationship Summary Table

| From Table | To Table | Cardinality | Foreign Key | Notes |
|---|---|---|---|---|
| `donors` | `auth.users` | 1:1 | `auth_user_id` | Each auth user maps to exactly one donor profile |
| `hospitals` | `auth.users` | 1:1 | `auth_user_id` | Each auth user maps to exactly one hospital profile |
| `blood_requests` | `hospitals` | many:1 | `hospital_id` | A hospital creates many requests |
| `donation_responses` | `blood_requests` | many:1 | `request_id` | Many donor interactions per request |
| `donation_responses` | `donors` | many:1 | `donor_id` | A donor may respond to many requests over time |
| `donation_history` | `donors` | many:1 | `donor_id` | Immutable record of completed donations per donor |
| `donation_history` | `hospitals` | many:1 | `hospital_id` | Which hospital the donation was completed at |
| `donation_history` | `blood_requests` | many:1 | `request_id` | Which request triggered the donation |
| `blood_inventory` | `hospitals` | many:1 | `hospital_id` | 8 rows per hospital (one per blood group) |
| `hospital_surplus` | `hospitals` | many:1 | `hospital_id` | Hospital that published the surplus |
| `hospital_surplus` | `hospitals` | many:1 | `claimed_by` | Hospital that claimed the surplus (nullable) |
| `donor_badges` | `donors` | many:1 | `donor_id` | Multiple badges per donor |

---

## 4. Table Definitions

### 4.1 `donors`

Stores the profile and operational state for every registered blood donor.

```sql
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
  location          GEOGRAPHY(POINT, 4326),   -- PostGIS point (longitude, latitude)
  city              TEXT        NOT NULL,
  state             TEXT        NOT NULL DEFAULT 'Karnataka',

  -- Availability & Eligibility State
  availability      TEXT        NOT NULL DEFAULT 'active'
                    CHECK (availability IN ('active', 'snoozed', 'unavailable')),
  snooze_until      TIMESTAMPTZ,              -- NULL unless availability = 'snoozed'
  last_donated_at   TIMESTAMPTZ,              -- NULL if donor has never donated
  is_verified       BOOLEAN     NOT NULL DEFAULT true,
  is_blacklisted    BOOLEAN     NOT NULL DEFAULT false,

  -- Trust & Gamification (denormalised counters for query performance)
  trust_score       NUMERIC(5,2) NOT NULL DEFAULT 100.00
                    CHECK (trust_score BETWEEN 0 AND 100),
  total_donations   INT         NOT NULL DEFAULT 0 CHECK (total_donations >= 0),
  total_responses   INT         NOT NULL DEFAULT 0 CHECK (total_responses >= 0),
  total_accepted    INT         NOT NULL DEFAULT 0 CHECK (total_accepted >= 0),

  -- Push Notifications
  fcm_token         TEXT,                     -- Firebase Cloud Messaging device token

  -- Registration Data
  health_declaration JSONB,                   -- see JSONB schema: Section 13.1

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Column Notes:**

| Column | Purpose | Rules |
|---|---|---|
| `auth_user_id` | Links donor profile to Supabase Auth user | Unique — one donor per phone number |
| `location` | PostGIS geography point for radius matching | `SRID=4326; POINT(lng lat)` format on insert |
| `snooze_until` | Auto-expiry of snooze window | Must be NULL when `availability != 'snoozed'` |
| `last_donated_at` | Drives 90-day eligibility lock | Set by post-donation automation only |
| `trust_score` | Priority in matching queue (0–100) | Recalculated by `computeTrustScore()` service |
| `total_responses` | Incremented when notification sent | Drives response rate component of trust score |
| `total_accepted` | Incremented when donor accepts | Drives reliability rate component |
| `total_donations` | Incremented on donation completion | Drives donation component of trust score |
| `fcm_token` | Push notification delivery | Updated via `PATCH /donor/fcm-token`; can be NULL if push denied |
| `health_declaration` | Consent record at registration | Stored once; not editable post-registration |

---

### 4.2 `hospitals`

Stores the profile and verification state for every registered hospital or blood bank.

```sql
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
```

**Column Notes:**

| Column | Purpose | Rules |
|---|---|---|
| `registration_number` | Govt-issued hospital registration ID | Unique — Admin verifies authenticity |
| `is_verified` | Enables platform access | Set to `true` only by Admin action |
| `is_active` | Soft toggle for operational status | Distinct from blacklisting |
| `is_blacklisted` | Permanent ban | Takes precedence over `is_active` |
| `location` | Used for surplus coordination proximity queries | Set during registration |

---

### 4.3 `blood_requests`

Every blood request created by a hospital. This is the central entity in the system — most other tables reference it.

```sql
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
  expires_at        TIMESTAMPTZ,              -- auto-set at creation based on priority
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Column Notes:**

| Column | Purpose | Rules |
|---|---|---|
| `units_fulfilled` | Running count of completed donations | Incremented by post-donation automation; `<= units_required` |
| `search_radius_km` | Current active search radius | Starts at 15; auto-expanded in steps: 15 → 25 → 40 → 60 |
| `donors_notified` | Total FCM dispatches for this request | Incremented each time a new donor is notified |
| `donors_accepted` | Count of current acceptances | Used to track fulfillment progress |
| `expires_at` | Request auto-expiry | Critical: +2hr, Urgent: +6hr, Scheduled: +24hr from `created_at` |
| `completed_at` | When all units were fulfilled | Set when `units_fulfilled >= units_required` |

**Status Transition Map:**

```
pending ──► dispatched ──► accepted ──► en_route ──► arrived ──► completed
    │            │                                                      ▲
    │            └─────────────────────────────────────────────────────┘
    │                   (any active status)
    └──► cancelled    ──► expired
```

---

### 4.4 `donation_responses`

One row per (request, donor) pair. Tracks the complete lifecycle of a single donor's involvement in a single request — from notification through to outcome.

```sql
CREATE TABLE donation_responses (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID        NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id          UUID        NOT NULL REFERENCES donors(id) ON DELETE RESTRICT,

  -- Status
  status            TEXT        NOT NULL DEFAULT 'notified'
                    CHECK (status IN (
                      'notified',   -- FCM sent, awaiting response
                      'accepted',   -- Donor accepted the request
                      'declined',   -- Donor explicitly declined
                      'no_response',-- 10-minute timer expired without action
                      'no_show',    -- Hospital marked donor as no-show
                      'donated',    -- Hospital marked donation as complete
                      'cancelled'   -- Request was cancelled by hospital
                    )),

  -- Timeline
  notified_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at      TIMESTAMPTZ,    -- Set when donor accepts or declines
  arrived_at        TIMESTAMPTZ,    -- Set when hospital marks 'arrived'
  donated_at        TIMESTAMPTZ,    -- Set when hospital marks 'donated'

  -- Hospital Feedback
  hospital_rating   INT         CHECK (hospital_rating BETWEEN 1 AND 5),
  hospital_feedback TEXT        CHECK (char_length(hospital_feedback) <= 300),

  -- Queue Management
  notification_seq  INT         NOT NULL DEFAULT 1,  -- Which round this donor was notified in
  bull_job_id       TEXT,                             -- BullMQ job ID for cancellation on accept

  -- Uniqueness constraint: a donor can only have one response row per request
  UNIQUE (request_id, donor_id)
);
```

**Column Notes:**

| Column | Purpose | Rules |
|---|---|---|
| `status` | Single source of truth for this donor's state in this request | Updated by donor, hospital, and system (BullMQ worker) |
| `notification_seq` | Which retry round this donor was dispatched in | 1 = first batch, 2 = after first 10-min expiry, etc. |
| `bull_job_id` | Reference to BullMQ retry job | Stored on insert so the job can be cancelled when donor accepts |
| `hospital_rating` | Hospital's 1–5 star rating of the donor | Optional; not shown to donor; visible to admin |
| `responded_at` | Timestamps when donor acted | Set by `PATCH /donor/requests/:responseId/respond` |

**Status Transition Map:**

```
notified ──► accepted   ──► (en_route, arrived) ──► donated
         │                                       └──► no_show
         ├──► declined
         ├──► no_response  (BullMQ timer fires)
         └──► cancelled    (hospital cancels request)
```

---

### 4.5 `donation_history`

Immutable audit record of every completed donation. Written once by the post-donation automation hook and never updated.

```sql
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
  certificate_url   TEXT,        -- Supabase Storage signed URL (7-day expiry, renewable)
  certificate_key   TEXT,        -- Storage object key for URL regeneration

  -- Record Creation
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate history records for the same donor + request
  UNIQUE (donor_id, request_id)
);
```

**Immutability Enforcement:**
- RLS policy allows `INSERT` only — no `UPDATE` or `DELETE`
- `ON DELETE RESTRICT` on all FKs ensures history is never lost when upstream records exist
- `UNIQUE(donor_id, request_id)` makes the post-donation hook idempotent — duplicate calls return `409 Conflict`

**Column Notes:**

| Column | Purpose | Rules |
|---|---|---|
| `certificate_key` | Storage path in Supabase Storage bucket | Persisted for URL re-generation when signed URL expires |
| `certificate_url` | Supabase Storage signed URL (7-day TTL) | Regenerated on `GET /donor/history/:id/certificate` |
| `donated_at` | Exact timestamp of donation | Copied from `donation_responses.donated_at` at completion |

---

### 4.6 `blood_inventory`

Current stock levels per blood group per hospital. One row per (hospital, blood_group) pair — 8 rows per hospital at maximum.

```sql
CREATE TABLE blood_inventory (
  -- Identity
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id           UUID        NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,

  -- Inventory
  blood_group           TEXT        NOT NULL
                        CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_available       INT         NOT NULL DEFAULT 0
                        CHECK (units_available >= 0),
  low_stock_threshold   INT         NOT NULL DEFAULT 2
                        CHECK (low_stock_threshold >= 0),

  -- Timestamps
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One row per blood group per hospital
  UNIQUE (hospital_id, blood_group)
);
```

**Initialisation:** When a hospital is verified, the post-verification hook inserts 8 rows (one per blood group) with `units_available = 0`.

**Low Stock Alert Logic:** The hospital dashboard shows an amber warning banner when `units_available <= low_stock_threshold` for any blood group. This is evaluated client-side from the inventory query result — no separate flag column is needed.

---

### 4.7 `hospital_surplus`

Published offers of surplus blood units from one hospital to nearby hospitals.

```sql
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
```

**Column Notes:**

| Column | Purpose | Rules |
|---|---|---|
| `expires_at` | Surplus offer auto-expiry | Set by offering hospital (4h / 8h / 24h / 48h) |
| `claimed_by` | Which hospital claimed the units | NULL until claimed |
| `claimed_at` | When claim was made | Set atomically with `is_claimed = true` |

---

### 4.8 `donor_badges`

Gamification badges earned by donors. Each (donor, badge_type) pair is unique — badges cannot be earned twice.

```sql
CREATE TABLE donor_badges (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id          UUID        NOT NULL REFERENCES donors(id) ON DELETE CASCADE,

  -- Badge
  badge_type        TEXT        NOT NULL,
  awarded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB,               -- see JSONB schema: Section 13.3

  -- One badge type per donor
  UNIQUE (donor_id, badge_type)
);
```

**Valid `badge_type` Values:**

| Badge Type | Display Name | Trigger |
|---|---|---|
| `first_drop` | First Drop 🩸 | First completed donation |
| `streak_3` | Streak × 3 🔥 | 3 donations without a no-show |
| `streak_5` | Streak × 5 🔥 | 5 consecutive donations without a no-show |
| `streak_10` | Streak × 10 🔥 | 10 consecutive donations without a no-show |
| `lifesaver` | Lifesaver 💚 | 5 total completed donations |
| `hero` | Hero 🦸 | 10 total completed donations |
| `critical_responder` | Critical Responder 🚨 | 3 Critical priority donations |
| `trusted_donor` | Trusted Donor ⭐ | Trust score ≥ 90 |

---

### 4.9 `audit_logs`

Immutable, append-only record of all significant state-changing actions across the platform. Used for compliance, fraud investigation, and admin review.

```sql
CREATE TABLE audit_logs (
  -- Identity
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  actor_id          UUID,                        -- NULL for system-initiated actions
  actor_role        TEXT        CHECK (actor_role IN ('donor', 'hospital', 'admin', 'system')),

  -- Action
  action            TEXT        NOT NULL,        -- e.g., 'donation.completed', 'donor.blacklisted'
  entity_type       TEXT,                        -- e.g., 'donor', 'blood_request', 'hospital'
  entity_id         UUID,                        -- PK of the affected entity

  -- Context
  metadata          JSONB,                       -- see JSONB schema: Section 13.4
  ip_address        TEXT,

  -- Timestamp
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Mandatory Audit Events:**

| Action String | Triggered By |
|---|---|
| `donor.registered` | Donor completes registration |
| `donor.availability_changed` | Donor updates their availability |
| `donor.blacklisted` | Admin blacklists a donor |
| `donor.suspended` | Admin suspends a donor |
| `donor.unsuspended` | Admin lifts suspension |
| `request.created` | Hospital creates a blood request |
| `request.cancelled` | Hospital cancels a request |
| `donation.accepted` | Donor accepts a request |
| `donation.declined` | Donor declines a request |
| `donation.no_response` | BullMQ timer fires; donor did not respond |
| `donation.no_show` | Hospital marks donor as no-show |
| `donation.completed` | Hospital marks donation complete |
| `hospital.registered` | Hospital completes registration |
| `hospital.verified` | Admin verifies hospital |
| `hospital.blacklisted` | Admin blacklists hospital |
| `fraud.no_show_flagged` | Nightly cron flags high no-show donor |
| `admin.broadcast_sent` | Admin sends system-wide notification |
| `certificate.generated` | Certificate PDF created and stored |

---

## 5. Relationships & Foreign Keys

### Full FK Reference

```sql
-- donors → auth.users (cascade delete: removing auth user removes donor profile)
ALTER TABLE donors
  ADD CONSTRAINT fk_donors_auth_user
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- hospitals → auth.users (cascade delete: removing auth user removes hospital profile)
ALTER TABLE hospitals
  ADD CONSTRAINT fk_hospitals_auth_user
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- blood_requests → hospitals (restrict: cannot delete hospital with active requests)
ALTER TABLE blood_requests
  ADD CONSTRAINT fk_requests_hospital
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE RESTRICT;

-- donation_responses → blood_requests (cascade: deleting request clears responses)
ALTER TABLE donation_responses
  ADD CONSTRAINT fk_responses_request
  FOREIGN KEY (request_id) REFERENCES blood_requests(id) ON DELETE CASCADE;

-- donation_responses → donors (restrict: cannot delete donor with response history)
ALTER TABLE donation_responses
  ADD CONSTRAINT fk_responses_donor
  FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE RESTRICT;

-- donation_history → donors (restrict: history must be preserved)
ALTER TABLE donation_history
  ADD CONSTRAINT fk_history_donor
  FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE RESTRICT;

-- donation_history → hospitals (restrict)
ALTER TABLE donation_history
  ADD CONSTRAINT fk_history_hospital
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE RESTRICT;

-- donation_history → blood_requests (restrict)
ALTER TABLE donation_history
  ADD CONSTRAINT fk_history_request
  FOREIGN KEY (request_id) REFERENCES blood_requests(id) ON DELETE RESTRICT;

-- blood_inventory → hospitals (cascade: deleting hospital removes inventory)
ALTER TABLE blood_inventory
  ADD CONSTRAINT fk_inventory_hospital
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- hospital_surplus → hospitals (offering hospital)
ALTER TABLE hospital_surplus
  ADD CONSTRAINT fk_surplus_hospital
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE;

-- hospital_surplus → hospitals (claiming hospital — nullable, set null on delete)
ALTER TABLE hospital_surplus
  ADD CONSTRAINT fk_surplus_claimed_by
  FOREIGN KEY (claimed_by) REFERENCES hospitals(id) ON DELETE SET NULL;

-- donor_badges → donors (cascade: badge history removed with donor)
ALTER TABLE donor_badges
  ADD CONSTRAINT fk_badges_donor
  FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE;
```

### Cascade Behaviour Summary

| Relationship | On Delete Behaviour | Rationale |
|---|---|---|
| `auth.users` → `donors` | CASCADE | Deleting account removes profile — DPDPA right to erasure |
| `auth.users` → `hospitals` | CASCADE | Same as above |
| `hospitals` → `blood_requests` | RESTRICT | Cannot delete hospital with request history (audit trail) |
| `donors` → `donation_responses` | RESTRICT | Response history must be preserved for fraud detection |
| `blood_requests` → `donation_responses` | CASCADE | If request deleted (edge case), clean up responses |
| `donors` → `donation_history` | RESTRICT | Donation history is a permanent medical record |
| `donors` → `donor_badges` | CASCADE | Badges follow the donor profile |

---

## 6. Indexes & Query Optimisation

### Standard B-Tree Indexes

```sql
-- donors
CREATE INDEX idx_donors_blood_group   ON donors(blood_group);
CREATE INDEX idx_donors_availability  ON donors(availability);
CREATE INDEX idx_donors_last_donated  ON donors(last_donated_at);
CREATE INDEX idx_donors_trust_score   ON donors(trust_score DESC);
CREATE INDEX idx_donors_phone         ON donors(phone);

-- hospitals
CREATE INDEX idx_hospitals_city       ON hospitals(city);
CREATE INDEX idx_hospitals_verified   ON hospitals(is_verified);

-- blood_requests
CREATE INDEX idx_requests_hospital    ON blood_requests(hospital_id);
CREATE INDEX idx_requests_status      ON blood_requests(status);
CREATE INDEX idx_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX idx_requests_created     ON blood_requests(created_at DESC);
CREATE INDEX idx_requests_priority    ON blood_requests(priority);

-- donation_responses
CREATE INDEX idx_responses_request    ON donation_responses(request_id);
CREATE INDEX idx_responses_donor      ON donation_responses(donor_id);
CREATE INDEX idx_responses_status     ON donation_responses(status);

-- donation_history
CREATE INDEX idx_history_donor        ON donation_history(donor_id);
CREATE INDEX idx_history_donated_at   ON donation_history(donated_at DESC);
CREATE INDEX idx_history_hospital     ON donation_history(hospital_id);

-- audit_logs
CREATE INDEX idx_audit_actor          ON audit_logs(actor_id);
CREATE INDEX idx_audit_action         ON audit_logs(action);
CREATE INDEX idx_audit_created        ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity         ON audit_logs(entity_type, entity_id);
```

### PostGIS Spatial Indexes

```sql
-- Critical for ST_DWithin and ST_Distance performance
CREATE INDEX idx_donors_location      ON donors    USING GIST(location);
CREATE INDEX idx_hospitals_location   ON hospitals USING GIST(location);
```

### Partial (Filtered) Indexes

```sql
-- Eligibility engine query — only indexes donors that can ever be matched
CREATE INDEX idx_donors_eligible_partial
  ON donors(trust_score DESC, blood_group, last_donated_at)
  WHERE is_blacklisted = false
    AND availability = 'active';

-- Active requests only — hospital dashboard query
CREATE INDEX idx_requests_active_partial
  ON blood_requests(hospital_id, created_at DESC)
  WHERE status IN ('pending', 'dispatched', 'accepted', 'en_route', 'arrived');

-- Unverified hospitals — admin verification queue
CREATE INDEX idx_hospitals_pending_partial
  ON hospitals(created_at ASC)
  WHERE is_verified = false AND is_blacklisted = false;
```

### Composite Index for Eligibility Pre-filter

```sql
-- Used by the PostGIS matching query to pre-filter before spatial check
CREATE INDEX idx_donors_eligibility_composite
  ON donors(blood_group, availability, last_donated_at, trust_score DESC)
  WHERE is_blacklisted = false;
```

---

## 7. Row-Level Security (RLS) Policies

RLS is enabled on every application table. The `service_role` key (server-side only) bypasses all RLS policies. The `anon` and `authenticated` keys respect all policies.

### Enabling RLS

```sql
ALTER TABLE donors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_surplus   ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_badges       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
```

### Policy Definitions

```sql
-- ─────────────────────────────
-- donors
-- ─────────────────────────────

-- Donors can read and update only their own profile
CREATE POLICY donors_select_own ON donors
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY donors_update_own ON donors
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- ─────────────────────────────
-- hospitals
-- ─────────────────────────────

CREATE POLICY hospitals_select_own ON hospitals
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY hospitals_update_own ON hospitals
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- ─────────────────────────────
-- blood_requests
-- ─────────────────────────────

-- Hospital can SELECT and manage their own requests
CREATE POLICY requests_hospital_own ON blood_requests
  FOR ALL USING (
    hospital_id = (
      SELECT id FROM hospitals WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- donation_responses
-- ─────────────────────────────

-- Donor can SELECT responses where they are the donor
CREATE POLICY responses_donor_select ON donation_responses
  FOR SELECT USING (
    donor_id = (
      SELECT id FROM donors WHERE auth_user_id = auth.uid()
    )
  );

-- Hospital can SELECT responses for their own requests
CREATE POLICY responses_hospital_select ON donation_responses
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM blood_requests
      WHERE hospital_id = (
        SELECT id FROM hospitals WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────
-- donation_history (INSERT only — immutable)
-- ─────────────────────────────

-- Donors can view their own history
CREATE POLICY history_donor_select ON donation_history
  FOR SELECT USING (
    donor_id = (
      SELECT id FROM donors WHERE auth_user_id = auth.uid()
    )
  );

-- INSERT allowed (server-side writes go through service role, so this is a safeguard)
-- No UPDATE or DELETE policies — immutability enforced by absence of permissive policies

-- ─────────────────────────────
-- blood_inventory
-- ─────────────────────────────

CREATE POLICY inventory_hospital_own ON blood_inventory
  FOR ALL USING (
    hospital_id = (
      SELECT id FROM hospitals WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- hospital_surplus
-- ─────────────────────────────

-- Any verified hospital can view surplus (for claiming)
CREATE POLICY surplus_verified_hospitals_select ON hospital_surplus
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM hospitals
      WHERE auth_user_id = auth.uid() AND is_verified = true
    )
  );

-- Hospital can only INSERT/UPDATE their own surplus listings
CREATE POLICY surplus_hospital_own_write ON hospital_surplus
  FOR INSERT WITH CHECK (
    hospital_id = (
      SELECT id FROM hospitals WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- donor_badges
-- ─────────────────────────────

CREATE POLICY badges_donor_select ON donor_badges
  FOR SELECT USING (
    donor_id = (
      SELECT id FROM donors WHERE auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────
-- audit_logs (INSERT only — immutable)
-- ─────────────────────────────

-- Admins cannot query audit_logs via client — only via service role (server-side)
-- No permissive SELECT policies for non-service roles
-- INSERT-only via server (service_role bypasses RLS)
```

---

## 8. Authentication Architecture

### Overview

RedAid uses **Supabase Auth** for all authentication. There are no passwords — every user authenticates via a one-time 6-digit OTP sent to their phone number. The OTP delivery service in V1 is Twilio (managed by Supabase).

### Authentication Flow

```
Step 1 — Client: POST /v1/auth/otp/send
         Body: { phone: "+919876543210" }
         ↓
         Express calls supabase.auth.signInWithOtp({ phone })
         Supabase sends SMS OTP via Twilio
         Response: { message: "OTP sent" }

Step 2 — Client: POST /v1/auth/otp/verify
         Body: { phone: "+919876543210", token: "482910" }
         ↓
         Express calls supabase.auth.verifyOtp({ phone, token, type: 'sms' })
         Supabase verifies OTP
         ↓
         ┌── New user (no profile in donors/hospitals)
         │       → Return { isNewUser: true, tempToken }
         │       → Client routes to registration form
         │
         └── Existing user (profile exists)
                 → Supabase returns { access_token, refresh_token, user }
                 → Express attaches role claim from user_metadata
                 → Return { access_token, role, entity_id }

Step 3 — Token Storage (client-side)
         access_token  → Zustand (in-memory only, never localStorage)
         refresh_token → httpOnly; Secure; SameSite=Strict cookie

Step 4 — Authenticated Request
         Client: GET /v1/donor/profile
         Header: Authorization: Bearer <access_token>
         ↓
         Express requireAuth middleware:
           supabase.auth.getUser(token)
           → Extracts user.user_metadata.role
           → Extracts user.user_metadata.entity_id
           → Attaches to req.user, req.role, req.entityId
         ↓
         requireRole('donor') middleware checks req.role
         ↓
         Route handler executes

Step 5 — Token Refresh
         access_token expires every 1 hour
         Client calls POST /v1/auth/refresh with refresh_token cookie
         Express calls supabase.auth.refreshSession({ refresh_token })
         New access_token returned in response body
         Refresh token rotated (new value set in httpOnly cookie)
```

### JWT Role Claim Structure

The JWT is issued by Supabase Auth. The Express server reads `user.user_metadata` to determine role and entity:

```json
{
  "sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "phone": "+919876543210",
  "user_metadata": {
    "role": "donor",
    "entity_id": "a1b2c3d4-..."
  },
  "iat": 1748880000,
  "exp": 1748883600
}
```

**Role-to-Table Mapping:**

| JWT Role | Profile Table | entity_id References |
|---|---|---|
| `donor` | `donors` | `donors.id` |
| `hospital` | `hospitals` | `hospitals.id` |
| `admin` | None (no profile table) | Not applicable |

### Admin Account Provisioning

Admin accounts are created manually in the Supabase Auth dashboard. There is no self-registration path for admins.

```sql
-- Run via Supabase service role (engineering only)
-- Creates the auth user, then sets the role in metadata
SELECT supabase_admin.create_user(
  '{"phone": "+91XXXXXXXXXX", "user_metadata": {"role": "admin"}}'
);
```

### Session States & Account Status Enforcement

Before any role check, the auth middleware also verifies account status by querying the relevant profile table:

```typescript
// backend/src/middleware/auth.ts (abridged)

// After verifying JWT, fetch profile and check status
if (req.role === 'donor') {
  const donor = await db.getDonorByEntityId(req.entityId);
  if (donor.is_blacklisted) return res.status(403).json({ error: { code: 'BLACKLISTED' } });
  if (!donor.is_verified)   return res.status(403).json({ error: { code: 'UNVERIFIED' } });
}

if (req.role === 'hospital') {
  const hospital = await db.getHospitalByEntityId(req.entityId);
  if (hospital.is_blacklisted)  return res.status(403).json({ error: { code: 'BLACKLISTED' } });
  if (!hospital.is_verified)    return res.status(403).json({ error: { code: 'UNVERIFIED' } });
  if (!hospital.is_active)      return res.status(403).json({ error: { code: 'SUSPENDED' } });
}
```

### OTP Rate Limiting

| Limit | Value | Scope |
|---|---|---|
| OTP sends per phone per hour | 5 | Per phone number |
| OTP sends per IP per hour | 5 | Per IP address |
| OTP verify attempts per token | 5 | Per issued OTP; locks out for 30 min after 5 failures |
| Resend cooldown | 30 seconds | Enforced client-side and server-side |

---

## 9. Data Storage Strategy

### Storage Layers

| Layer | Technology | What Lives Here |
|---|---|---|
| **Primary relational store** | Supabase PostgreSQL (PostGIS) | All application data — profiles, requests, responses, history, logs |
| **File storage** | Supabase Storage | Donation certificate PDFs |
| **Job queue store** | Upstash Redis (BullMQ) | Scheduled notification retry jobs — ephemeral, no persistent app data |

### Supabase Storage — Bucket Structure

```
certificates/                         (private bucket — no public access)
  └── {donor_id}/
        └── {history_id}.pdf          e.g., "a1b2c3.../f4e5d6....pdf"
```

**Access Rules:**
- Bucket is **private** — no public URL access
- PDFs are served via **signed URLs** with a 7-day expiry, generated on demand
- The storage key (`certificates/{donor_id}/{history_id}.pdf`) is persisted on `donation_history.certificate_key`
- When a signed URL expires, the backend re-generates a fresh URL from the stored key without regenerating the PDF

**Certificate Lifecycle:**

```
Post-donation hook triggers certificate generation
        ↓
pdf-lib generates PDF bytes in memory
        ↓
supabaseAdmin.storage.from('certificates').upload(key, pdfBytes)
        ↓
createSignedUrl(key, 7 * 24 * 60 * 60)
        ↓
URL and key stored on donation_history
        ↓
(7 days later — URL expires)
        ↓
Client calls GET /donor/history/:id/certificate
        ↓
Backend calls createSignedUrl again from stored certificate_key
        ↓
Fresh 7-day URL returned — no PDF re-generation needed
```

### Redis (Upstash) — BullMQ Queue Structure

Redis holds only job queue data — no application state is persisted here that is not also in PostgreSQL.

```
Queue: "notifications"
  Jobs:
    name: "retry-check"
    data: { requestId, donorId, responseId }
    delay: 600000 ms (10 minutes)
    attempts: 3
    backoff: exponential, 2000ms base
    removeOnComplete: 100     (keep last 100 completed job records)
    removeOnFail: 500         (keep last 500 failed job records for debugging)
```

**Job Lifecycle:**

```
Donor notified → BullMQ job added (10-min delay) → job ID stored in donation_responses.bull_job_id
      ↓
Scenario A: Donor accepts within 10 min
  → PATCH /respond {accept} sets status = 'accepted'
  → Backend fetches bull_job_id from donation_responses
  → job.remove() called — job never fires

Scenario B: Donor does not respond
  → Job fires after 10 minutes
  → Worker checks donation_responses.status
  → If still 'notified' → status = 'no_response'
  → Find next eligible donor → dispatch → new job created
```

### Updated Timestamps — `updated_at` Trigger

All tables with `updated_at` use a PostgreSQL trigger to auto-update the column:

```sql
-- Generic trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each relevant table
CREATE TRIGGER donors_updated_at
  BEFORE UPDATE ON donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER hospitals_updated_at
  BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER blood_requests_updated_at
  BEFORE UPDATE ON blood_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 10. Data Flow by Feature

### 10.1 Emergency Blood Request — Data Writes

```
POST /hospital/requests
  1. INSERT blood_requests → status='pending'
  2. Run eligibility query (read-only, PostGIS)
  3. For each eligible donor:
       INSERT donation_responses → status='notified'
       Increment donors.total_responses
       FCM dispatch
       BullMQ job add → response.bull_job_id stored
  4. UPDATE blood_requests SET status='dispatched', donors_notified=N
  5. INSERT audit_logs → action='request.created'

PATCH /donor/requests/:responseId/respond { action: 'accept' }
  1. UPDATE donation_responses SET status='accepted', responded_at=now()
  2. UPDATE blood_requests SET donors_accepted++
  3. UPDATE donors SET total_accepted++
  4. BullMQ job.remove(bull_job_id)
  5. Socket.IO emit to hospital room
  6. INSERT audit_logs → action='donation.accepted'

PATCH /hospital/requests/:id/donors/:responseId/complete
  (Entire sequence runs inside a DB transaction)
  1. UPDATE donation_responses SET status='donated', donated_at=now()
  2. UPDATE donors SET last_donated_at=now(), total_donations++
  3. INSERT donation_history (immutable record)
  4. Recompute trust score → UPDATE donors SET trust_score=newScore
  5. UPDATE blood_requests SET units_fulfilled++
  6. If units_fulfilled >= units_required:
       UPDATE blood_requests SET status='completed', completed_at=now()
  (Outside transaction — non-critical)
  7. badgeService.checkAndAward(donorId) → INSERT donor_badges if applicable
  8. certificateService.generate() → upload to Storage → UPDATE donation_history
  9. FCM thank-you notification to donor
  10. INSERT audit_logs → action='donation.completed'
```

### 10.2 No-Response Retry — Data Writes

```
BullMQ job fires (10 minutes after notification)
  1. SELECT donation_responses WHERE id=responseId
  2. If status = 'notified':
       UPDATE donation_responses SET status='no_response'
       Find next eligible donor (re-run eligibility query)
       INSERT donation_responses for next donor → status='notified'
       UPDATE donors.total_responses++ (next donor)
       FCM dispatch to next donor
       BullMQ: add new job for next donor
       Socket.IO emit to hospital: 'notification:retry'
       INSERT audit_logs → action='donation.no_response'
  3. If status != 'notified' (donor already responded):
       Job is a no-op — do nothing
```

### 10.3 Post-Donation Automation — Trust Score Recalculation

```
After UPDATE donors SET total_donations++:
  SELECT total_donations, total_responses, total_accepted FROM donors WHERE id=donorId

  donationsComponent    = min(total_donations / 10, 1) * 100
  responseRate          = total_responses = 0 ? 100 : (total_accepted / total_responses) * 100
  reliabilityRate       = total_accepted  = 0 ? 100 : (total_donations / total_accepted) * 100

  trust_score = (0.30 * donationsComponent)
              + (0.35 * responseRate)
              + (0.35 * reliabilityRate)

  UPDATE donors SET trust_score = ROUND(LEAST(100, GREATEST(0, trust_score)), 2)
```

---

## 11. Data Lifecycle & Retention

### Active Data

All profile, request, response, and inventory data is live and queryable at all times.

### Soft Delete / Anonymisation (DPDPA Right to Erasure)

RedAid does not hard-delete user records. When a donor requests account deletion:

```sql
-- Anonymise PII fields; preserve donation records for public health reporting
UPDATE donors SET
  full_name         = 'Deleted User',
  phone             = 'deleted_' || id,     -- unique placeholder
  date_of_birth     = '1900-01-01',
  location          = NULL,
  city              = 'Deleted',
  fcm_token         = NULL,
  health_declaration = NULL,
  availability      = 'unavailable'
WHERE id = :donorId;

-- Anonymise Supabase Auth user
-- (Handled via Supabase Admin API — deletes the auth record,
--  which cascade-deletes nothing because auth_user_id FK is SET NULL on anonymisation)
```

`donation_history` records are **preserved** with the anonymised donor reference. Blood donation records are medical data — they cannot be deleted under Indian healthcare regulations. The donor's identity is removed but the donation fact is retained.

### Archive Strategy (V1 — Minimal)

No separate archive database in V1. Completed requests and old audit logs are retained in the primary database. Query performance is managed through indexes and pagination. A data archival strategy will be introduced in V2 when table size warrants it.

### Retention Periods

| Data | Retention |
|---|---|
| Active donor profiles | Indefinitely (until deletion request) |
| Active hospital profiles | Indefinitely |
| `blood_requests` (all statuses) | Indefinitely |
| `donation_responses` | Indefinitely |
| `donation_history` | Indefinitely (medical record) |
| `audit_logs` | Minimum 5 years (compliance) |
| `blood_inventory` | Indefinitely (updated in place) |
| `hospital_surplus` (expired, unclaimed) | 30 days post-expiry, then prunable |
| BullMQ jobs (completed) | 100 most recent per queue |
| BullMQ jobs (failed) | 500 most recent per queue |
| Certificate PDFs (Supabase Storage) | Indefinitely (key persisted for re-generation) |

---

## 12. Enums & Constrained Values

All enum-like values use `CHECK` constraints directly on the column rather than PostgreSQL `ENUM` types. This makes schema evolution easier — adding a new value requires only an `ALTER TABLE ... ADD VALUE` or constraint modification, not a type migration.

### `donors.availability`

| Value | Meaning |
|---|---|
| `active` | Donor is available; eligible for matching |
| `snoozed` | Temporarily unavailable; `snooze_until` must be set |
| `unavailable` | Manually set indefinite unavailability |

### `donors.blood_group` / `hospitals.blood_group` (all tables)

`'A+'`, `'A-'`, `'B+'`, `'B-'`, `'AB+'`, `'AB-'`, `'O+'`, `'O-'`

### `blood_requests.priority`

| Value | Dispatch Behaviour | Auto-expiry |
|---|---|---|
| `critical` | All eligible donors simultaneously | 2 hours |
| `urgent` | Top 5 by trust score, sequential batches | 6 hours |
| `scheduled` | Top 3 by trust score, sequential batches | 24 hours |

### `blood_requests.status`

| Value | Meaning |
|---|---|
| `pending` | Created but no donors notified yet |
| `dispatched` | Notifications sent; awaiting responses |
| `accepted` | At least one donor has accepted |
| `en_route` | At least one accepted donor is travelling |
| `arrived` | At least one donor has arrived |
| `completed` | All required units fulfilled |
| `cancelled` | Cancelled by hospital |
| `expired` | `expires_at` passed without fulfilment |

### `donation_responses.status`

| Value | Set By |
|---|---|
| `notified` | System (on FCM dispatch) |
| `accepted` | Donor (via `PATCH /respond`) |
| `declined` | Donor (via `PATCH /respond`) |
| `no_response` | BullMQ worker (10-min timer) |
| `no_show` | Hospital (via `PATCH /no-show`) |
| `donated` | Hospital (via `PATCH /complete`) |
| `cancelled` | System (when hospital cancels request) |

### `audit_logs.actor_role`

`'donor'`, `'hospital'`, `'admin'`, `'system'`

---

## 13. JSONB Field Schemas

### 13.1 `donors.health_declaration`

Stored once at registration. Not editable by the donor post-submission.

```json
{
  "consent_given": true,
  "consent_timestamp": "2026-06-01T10:30:00Z",
  "questions": {
    "recent_illness": false,
    "recent_surgery": false,
    "current_medications": false,
    "chronic_conditions": false,
    "recent_transfusion": false,
    "pregnancy": false
  },
  "declaration_version": "1.0"
}
```

### 13.2 `blood_requests.notes`

Plain `TEXT` column — not JSONB. Free-form context from hospital staff (e.g., `"Post-operative patient in ICU — O+ critical"`). Max 500 characters.

### 13.3 `donor_badges.metadata`

Optional context about how and when the badge was earned.

```json
// streak_5 badge
{
  "streak_count": 5,
  "streak_start_date": "2026-01-15T00:00:00Z",
  "streak_end_date": "2026-06-01T00:00:00Z"
}

// trusted_donor badge
{
  "trust_score_at_award": 91.5
}

// critical_responder badge
{
  "critical_donations": 3,
  "request_ids": ["req_abc", "req_def", "req_ghi"]
}
```

### 13.4 `audit_logs.metadata`

Flexible context object. Shape varies by `action` type.

```json
// action: 'donation.no_show'
{
  "donor_id": "uuid",
  "request_id": "uuid",
  "no_show_count": 2,
  "trust_score_before": 87.5,
  "trust_score_after": 71.2
}

// action: 'donor.blacklisted'
{
  "reason": "Repeated no-shows — 5 out of 6 acceptances resulted in no-show",
  "blacklisted_by_admin_id": "uuid",
  "no_show_rate": 0.83
}

// action: 'request.created'
{
  "blood_group": "O+",
  "priority": "critical",
  "units_required": 2,
  "donors_notified_initial": 7,
  "search_radius_km": 15
}

// action: 'fraud.no_show_flagged'
{
  "no_show_count": 4,
  "total_accepted": 6,
  "no_show_rate": 0.67,
  "flag_source": "nightly_cron"
}
```

---

## 14. Migration Strategy

### File Naming Convention

```
supabase/migrations/
  20260601000001_init_donors.sql
  20260601000002_init_hospitals.sql
  20260601000003_init_blood_requests.sql
  20260601000004_init_donation_responses.sql
  20260601000005_init_donation_history.sql
  20260601000006_init_blood_inventory.sql
  20260601000007_init_hospital_surplus.sql
  20260601000008_init_donor_badges.sql
  20260601000009_init_audit_logs.sql
  20260601000010_rls_policies.sql
  20260601000011_indexes.sql
  20260601000012_triggers.sql
```

Format: `{YYYYMMDDHHmmss}_{description}.sql`

### Migration Rules

- All migrations are **non-destructive** — no `DROP COLUMN` or `DROP TABLE` in V1
- Columns to be removed are renamed with `_deprecated` suffix first; removed in a subsequent migration after one release cycle
- Each migration file is idempotent where possible (`CREATE INDEX IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`)
- RLS policies and indexes are in separate migration files from table creation for clarity

### Applying Migrations

```bash
# Apply pending migrations (Supabase CLI)
supabase db push

# Reset to seed state (development only — destructive)
supabase db reset

# Check current migration status
supabase migration list
```

---

## 15. Seed Data

The seed file at `supabase/seed.sql` populates development and staging environments with realistic test data.

### Seed Categories

```sql
-- 1. Auth users (inserted via Supabase Admin API in seed script, not raw SQL)
-- 2. Donors — 20 test donors across blood groups, cities, availability states
-- 3. Hospitals — 5 test hospitals (3 verified, 1 pending, 1 blacklisted)
-- 4. Blood inventory — pre-populated stock for verified hospitals
-- 5. Blood requests — a mix of active, completed, and cancelled requests
-- 6. Donation responses — sample accept/decline/no-show data for trust score testing
-- 7. Donation history — 10 completed donation records with certificate placeholders
-- 8. Donor badges — a few awarded badges for UI testing
-- 9. Audit logs — sample audit entries

-- Sample seed: 2 test donors
INSERT INTO donors (
  auth_user_id, full_name, phone, date_of_birth, blood_group,
  city, state, availability, trust_score,
  total_donations, total_responses, total_accepted
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',  -- matches test auth user
    'Arjun Sharma', '+919876543210', '1998-03-15', 'O+',
    'Bengaluru', 'Karnataka', 'active', 87.50,
    3, 5, 4
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Priya Menon', '+919876543211', '2001-07-22', 'A+',
    'Bengaluru', 'Karnataka', 'snoozed', 95.00,
    5, 6, 5
  );

-- Sample seed: 1 verified hospital
INSERT INTO hospitals (
  auth_user_id, name, registration_number, phone, email,
  address, city, state, is_verified, is_active
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Manipal Hospital Whitefield', 'KA-HOSP-2019-4821',
  '+918022222222', 'bloodbank@manipalwhitefield.com',
  'ITPL Main Road, Whitefield', 'Bengaluru', 'Karnataka',
  true, true
);
```

---

*End of Document — BackendSchema v1.0*
*This document is the authoritative reference for all data storage decisions in RedAid V1. Any schema change — new table, new column, constraint modification, or index addition — must be reflected here in the same PR as the migration file.*
