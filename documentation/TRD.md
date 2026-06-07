# Technical Requirements Document
## RedAid — Real-Time Emergency Blood Coordination Platform

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | June 2026 |
| **Status** | Approved for Development |
| **Document Owner** | Engineering Lead |
| **PRD Reference** | RedAid PRD v1.0 — Approved, May 2026 |

---

## Table of Contents

1. [Document Purpose](#1-document-purpose)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Repository & Project Structure](#4-repository--project-structure)
5. [Database Design](#5-database-design)
6. [API Design](#6-api-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Real-Time Infrastructure](#8-real-time-infrastructure)
9. [Notification Pipeline](#9-notification-pipeline)
10. [Geospatial Matching Engine](#10-geospatial-matching-engine)
11. [Eligibility Engine](#11-eligibility-engine)
12. [Trust & Reliability Score](#12-trust--reliability-score)
13. [Post-Donation Automation](#13-post-donation-automation)
14. [Certificate Generation](#14-certificate-generation)
15. [Frontend Architecture](#15-frontend-architecture)
16. [PWA Requirements](#16-pwa-requirements)
17. [Admin Panel](#17-admin-panel)
18. [Security & Compliance](#18-security--compliance)
19. [Performance Requirements](#19-performance-requirements)
20. [Error Handling & Monitoring](#20-error-handling--monitoring)
21. [Testing Strategy](#21-testing-strategy)
22. [Deployment & DevOps](#22-deployment--devops)
23. [Environment Variables](#23-environment-variables)
24. [Definition of Done — Engineering](#24-definition-of-done--engineering)

---

## 1. Document Purpose

This Technical Requirements Document translates the RedAid PRD v1.1 into concrete engineering specifications. It serves as the authoritative reference for all implementation decisions: data models, API contracts, infrastructure, and system behavior.

Every engineering decision made in this document is traceable to a PRD requirement. Where the PRD leaves implementation open, this document makes a binding technical decision.

**Audience:** Backend engineers, frontend engineers, DevOps, QA.

**Scope:** Version 1.0 — PWA only. Native iOS/Android is explicitly out of scope.

---

## 2. System Architecture Overview

RedAid follows a **three-tier architecture** with a clear separation between the client layer, API layer, and data layer.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Donor PWA     │  │ Hospital PWA │  │  Admin Panel  │  │
│  │  (React + Vite) │  │ (React+Vite) │  │ (React+Vite)  │  │
│  └────────┬────────┘  └──────┬───────┘  └───────┬───────┘  │
└───────────┼──────────────────┼──────────────────┼──────────┘
            │                  │                  │
            │         HTTPS / WebSocket           │
            │                  │                  │
┌───────────▼──────────────────▼──────────────────▼──────────┐
│                         API LAYER                           │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │           Express + TypeScript (Node.js)             │  │
│   │                                                      │  │
│   │  ┌──────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│   │  │  REST API    │  │  Socket.IO  │  │  BullMQ    │  │  │
│   │  │  Endpoints   │  │   Server    │  │  Workers   │  │  │
│   │  └──────────────┘  └─────────────┘  └────────────┘  │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
            │                  │                  │
┌───────────▼──────────────────▼──────────────────▼──────────┐
│                        DATA LAYER                           │
│                                                             │
│  ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │  PostgreSQL + PostGIS │   │    Upstash Redis           │  │
│  │  (via Supabase)       │   │  (BullMQ job queue)        │  │
│  │                       │   └───────────────────────────┘  │
│  │  Supabase Realtime ───┼──► WebSocket push to clients   │  │
│  │  Supabase Storage     │   (DB-change subscriptions)     │  │
│  └───────────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                        │
│                                                            │
│  Firebase Cloud Messaging  ──  Push notifications          │
│  Resend                    ──  Transactional email         │
│  Sentry                    ──  Error tracking              │
└────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **Two-folder repository** — The repository has two top-level folders: `frontend/` (React PWA) and `backend/` (Express API). They are managed as pnpm workspaces in a single Git repository. This keeps the codebase navigable while enabling shared TypeScript types via a path alias, and allows independent deployments of each folder.
- **Stateless API server** — The Express server holds no in-memory state. All state lives in PostgreSQL or Redis. This makes horizontal scaling trivial in V2.
- **Two real-time channels** — Supabase Realtime handles database-driven state changes (request status, inventory). Socket.IO handles application-level events (notification timer updates, system broadcasts). These are intentionally separate concerns.
- **Job queue for notifications** — The 10-minute re-notification logic lives in BullMQ, not in `setTimeout`. This survives server restarts and is observable.

---

## 3. Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Framework | React | 18.x | UI for all three portals |
| Build Tool | Vite | 5.x | Fast builds, PWA plugin support |
| PWA | vite-plugin-pwa | Latest | Service worker, offline, manifest |
| Styling | Tailwind CSS | 3.x | Utility-first CSS, design token alignment |
| Routing | React Router | 6.x | Client-side routing |
| Server State | TanStack Query | 5.x | Data fetching, caching, background sync |
| Client State | Zustand | 4.x | Lightweight global UI state |
| Forms | React Hook Form | 7.x | Performant form management |
| Validation | Zod | 3.x | Schema validation (shared client/server) |
| Icons | Lucide React | Latest | MIT licensed, as per design system |
| Backend Runtime | Node.js | 20 LTS | JavaScript runtime |
| Backend Framework | Express | 4.x | HTTP server |
| Language | TypeScript | 5.x | Type safety across entire stack |
| Database | PostgreSQL 15 | via Supabase | Relational data + PostGIS |
| Geospatial | PostGIS | 3.x | Radius-based donor matching |
| Auth | Supabase Auth | Latest | OTP phone auth, JWT roles |
| Realtime (DB) | Supabase Realtime | Latest | DB-change subscriptions |
| File Storage | Supabase Storage | Latest | Donation certificates (PDFs) |
| Job Queue | BullMQ | 4.x | Notification retry pipeline |
| Redis | Upstash Redis | Latest | BullMQ backing store |
| Push Notifications | Firebase Admin SDK | 12.x | FCM dispatch |
| PDF Generation | pdf-lib | 1.x | Donation certificates |
| Email | Resend SDK | Latest | Transactional email |
| WebSocket | Socket.IO | 4.x | App-level real-time events |
| Monitoring | Sentry | Latest | Error tracking + performance |
| Frontend Hosting | Vercel | — | Static PWA hosting, CDN |
| Backend Hosting | Render | — | Node.js web service |
| Package Manager | pnpm | 9.x | Workspace management (frontend + backend) |

---

## 4. Repository & Project Structure

### Repository Layout

The project uses **two separate top-level folders** — `frontend/` and `backend/` — within a single Git repository. Shared TypeScript types live inside `backend/` and are referenced by the frontend via a path alias. A root-level `pnpm-workspace.yaml` ties the two workspaces together.

```
redaid/
├── frontend/                         # React PWA (all three portals)
│   ├── src/
│   │   ├── portals/
│   │   │   ├── donor/                # Donor-facing screens
│   │   │   ├── hospital/             # Hospital-facing screens
│   │   │   └── admin/                # Admin panel screens
│   │   ├── components/               # Shared UI components
│   │   ├── hooks/                    # Shared custom hooks
│   │   ├── lib/                      # API client, supabase client
│   │   └── main.tsx
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   ├── .env
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                          # Express REST + Socket.IO server
│   ├── src/
│   │   ├── routes/                   # Express route handlers
│   │   ├── services/                 # Business logic
│   │   │   ├── eligibility/
│   │   │   ├── matching/
│   │   │   ├── notification/
│   │   │   ├── trust-score/
│   │   │   ├── certificate/
│   │   │   └── post-donation/
│   │   ├── workers/                  # BullMQ workers
│   │   ├── middleware/               # Auth, error handling, rate limiting
│   │   ├── db/                       # Supabase client + query helpers
│   │   ├── types/                    # Shared TypeScript interfaces + Zod schemas
│   │   │   ├── blood.ts              # BloodGroup enum, compatibility map
│   │   │   ├── request.ts            # BloodRequest, RequestStatus
│   │   │   ├── donor.ts              # DonorProfile, TrustScore
│   │   │   ├── hospital.ts           # HospitalProfile, Inventory
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   ├── migrations/                   # SQL migration files
│   └── seed.sql                      # Seed data for development
│
├── pnpm-workspace.yaml
├── package.json
└── .github/
    └── workflows/
        └── ci.yml
```

### Shared Types Strategy

The `backend/src/types/` directory is the single source of truth for all data shapes. The frontend references these types via a TypeScript path alias configured in `frontend/tsconfig.json`:

```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@redaid/types": ["../backend/src/types/index.ts"]
    }
  }
}
```

This eliminates type drift between API responses and frontend expectations without a separate npm package.

```typescript
// backend/src/types/blood.ts
export enum BloodGroup {
  A_POS = 'A+', A_NEG = 'A-',
  B_POS = 'B+', B_NEG = 'B-',
  AB_POS = 'AB+', AB_NEG = 'AB-',
  O_POS = 'O+', O_NEG = 'O-',
}

// Blood group compatibility matrix (donor → recipients)
export const COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.O_NEG]: [BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS,
                        BloodGroup.B_NEG, BloodGroup.B_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.O_POS]: [BloodGroup.O_POS, BloodGroup.A_POS, BloodGroup.B_POS, BloodGroup.AB_POS],
  [BloodGroup.A_NEG]: [BloodGroup.A_NEG, BloodGroup.A_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.A_POS]: [BloodGroup.A_POS, BloodGroup.AB_POS],
  [BloodGroup.B_NEG]: [BloodGroup.B_NEG, BloodGroup.B_POS, BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.B_POS]: [BloodGroup.B_POS, BloodGroup.AB_POS],
  [BloodGroup.AB_NEG]: [BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.AB_POS]: [BloodGroup.AB_POS],
};

// backend/src/types/request.ts
export enum RequestStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  ACCEPTED = 'accepted',
  EN_ROUTE = 'en_route',
  ARRIVED = 'arrived',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum RequestPriority {
  CRITICAL = 'critical',
  URGENT = 'urgent',
  SCHEDULED = 'scheduled',
}
```

---

## 5. Database Design

### Overview

All tables live in a single Supabase PostgreSQL project. PostGIS is enabled for geospatial donor matching. Row-Level Security (RLS) is enabled on all tables. All timestamps are stored in UTC.

### Entity Relationship Summary

```
donors ─────────────────────────────────────────────────────────┐
  │ (1:many) donation_responses                                  │
  │ (1:many) donation_history                                    │
  │ (1:many) donor_badges                                        │
  └─── blood_group → blood_inventory (cross-reference)          │
                                                                 │
hospitals ──────────────────────────────────────────────────────┤
  │ (1:many) blood_requests                                      │
  │ (1:many) blood_inventory                                     │
  └─── (1:many) hospital_surplus                                 │
                                                                 │
blood_requests ─────────────────────────────────────────────────┘
  │ (1:many) donation_responses (per donor notified)
  └─── (1:1) completed → donation_history entry
```

### Table Definitions

#### `donors`

```sql
CREATE TABLE donors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  phone             TEXT NOT NULL UNIQUE,
  date_of_birth     DATE NOT NULL,
  blood_group       TEXT NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  location          GEOGRAPHY(POINT, 4326),   -- PostGIS point (lng, lat)
  city              TEXT NOT NULL,
  state             TEXT NOT NULL DEFAULT 'Karnataka',
  availability      TEXT NOT NULL DEFAULT 'active'
                    CHECK (availability IN ('active', 'snoozed', 'unavailable')),
  snooze_until      TIMESTAMPTZ,              -- NULL unless snoozed
  last_donated_at   TIMESTAMPTZ,              -- NULL if never donated
  fcm_token         TEXT,                     -- Firebase device token for push
  trust_score       NUMERIC(5,2) DEFAULT 100, -- 0–100
  total_donations   INT NOT NULL DEFAULT 0,
  total_responses   INT NOT NULL DEFAULT 0,   -- notifications received
  total_accepted    INT NOT NULL DEFAULT 0,   -- accepted requests
  is_verified       BOOLEAN NOT NULL DEFAULT true,
  is_blacklisted    BOOLEAN NOT NULL DEFAULT false,
  health_declaration JSONB,                   -- form responses at registration
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_donors_blood_group ON donors(blood_group);
CREATE INDEX idx_donors_location ON donors USING GIST(location);
CREATE INDEX idx_donors_availability ON donors(availability);
CREATE INDEX idx_donors_last_donated ON donors(last_donated_at);
CREATE INDEX idx_donors_trust_score ON donors(trust_score DESC);
```

#### `hospitals`

```sql
CREATE TABLE hospitals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  phone             TEXT NOT NULL,
  email             TEXT NOT NULL,
  address           TEXT NOT NULL,
  city              TEXT NOT NULL,
  state             TEXT NOT NULL,
  location          GEOGRAPHY(POINT, 4326),
  department        TEXT,
  is_verified       BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_blacklisted    BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hospitals_location ON hospitals USING GIST(location);
```

#### `blood_requests`

```sql
CREATE TABLE blood_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID NOT NULL REFERENCES hospitals(id),
  blood_group       TEXT NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_required    INT NOT NULL CHECK (units_required BETWEEN 1 AND 20),
  units_fulfilled   INT NOT NULL DEFAULT 0,
  priority          TEXT NOT NULL CHECK (priority IN ('critical', 'urgent', 'scheduled')),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','dispatched','accepted','en_route','arrived','completed','cancelled','expired')),
  notes             TEXT,
  search_radius_km  INT NOT NULL DEFAULT 15,  -- current active search radius
  donors_notified   INT NOT NULL DEFAULT 0,
  donors_accepted   INT NOT NULL DEFAULT 0,
  expires_at        TIMESTAMPTZ,              -- auto-set based on priority
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_requests_hospital ON blood_requests(hospital_id);
CREATE INDEX idx_requests_status ON blood_requests(status);
CREATE INDEX idx_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX idx_requests_created ON blood_requests(created_at DESC);
```

#### `donation_responses`

One row per (request, donor) pair. Tracks the lifecycle of a single donor's involvement in a single request.

```sql
CREATE TABLE donation_responses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID NOT NULL REFERENCES blood_requests(id),
  donor_id          UUID NOT NULL REFERENCES donors(id),
  status            TEXT NOT NULL DEFAULT 'notified'
                    CHECK (status IN ('notified','accepted','declined','no_response','no_show','donated','cancelled')),
  notified_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at      TIMESTAMPTZ,
  arrived_at        TIMESTAMPTZ,
  donated_at        TIMESTAMPTZ,
  hospital_rating   INT CHECK (hospital_rating BETWEEN 1 AND 5),
  hospital_feedback TEXT,
  notification_seq  INT NOT NULL DEFAULT 1,  -- which round of notification (1st, 2nd, etc.)
  bull_job_id       TEXT,                    -- BullMQ job ID for retry cancellation

  UNIQUE(request_id, donor_id)
);

CREATE INDEX idx_responses_request ON donation_responses(request_id);
CREATE INDEX idx_responses_donor ON donation_responses(donor_id);
CREATE INDEX idx_responses_status ON donation_responses(status);
```

#### `donation_history`

Immutable audit log of completed donations. Written once on completion.

```sql
CREATE TABLE donation_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id          UUID NOT NULL REFERENCES donors(id),
  hospital_id       UUID NOT NULL REFERENCES hospitals(id),
  request_id        UUID NOT NULL REFERENCES blood_requests(id),
  blood_group       TEXT NOT NULL,
  units_donated     INT NOT NULL DEFAULT 1,
  donated_at        TIMESTAMPTZ NOT NULL,
  certificate_url   TEXT,                    -- Supabase Storage signed URL
  certificate_key   TEXT,                    -- Storage object key for re-generation
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_donor ON donation_history(donor_id);
CREATE INDEX idx_history_donated_at ON donation_history(donated_at DESC);
```

#### `blood_inventory`

```sql
CREATE TABLE blood_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID NOT NULL REFERENCES hospitals(id),
  blood_group       TEXT NOT NULL CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_available   INT NOT NULL DEFAULT 0 CHECK (units_available >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 2,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(hospital_id, blood_group)
);
```

#### `hospital_surplus`

```sql
CREATE TABLE hospital_surplus (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID NOT NULL REFERENCES hospitals(id),
  blood_group       TEXT NOT NULL,
  units_available   INT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,    -- surplus offer expiry
  is_claimed        BOOLEAN NOT NULL DEFAULT false,
  claimed_by        UUID REFERENCES hospitals(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `donor_badges`

```sql
CREATE TABLE donor_badges (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id          UUID NOT NULL REFERENCES donors(id),
  badge_type        TEXT NOT NULL,           -- 'first_donation', 'streak_5', 'lifesaver', etc.
  awarded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB,                   -- e.g., { streak_count: 5 }

  UNIQUE(donor_id, badge_type)
);
```

#### `audit_logs`

```sql
CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id          UUID,                    -- who performed the action (NULL = system)
  actor_role        TEXT,                    -- 'donor', 'hospital', 'admin', 'system'
  action            TEXT NOT NULL,           -- e.g., 'request.created', 'donor.blacklisted'
  entity_type       TEXT,                    -- e.g., 'blood_request', 'donor'
  entity_id         UUID,
  metadata          JSONB,                   -- additional context
  ip_address        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

### Row-Level Security Policies

```sql
-- Donors can only read/update their own profile
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
CREATE POLICY donors_self ON donors
  USING (auth.uid() = auth_user_id);

-- Hospitals can only manage their own data
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY hospitals_self ON hospitals
  USING (auth.uid() = auth_user_id);

-- Donation responses: donor sees own rows; hospital sees rows for its requests
ALTER TABLE donation_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY responses_donor ON donation_responses
  FOR SELECT USING (
    donor_id = (SELECT id FROM donors WHERE auth_user_id = auth.uid())
  );
CREATE POLICY responses_hospital ON donation_responses
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM blood_requests WHERE hospital_id =
        (SELECT id FROM hospitals WHERE auth_user_id = auth.uid())
    )
  );

-- Admins bypass RLS via service role key (server-side only)
```

---

## 6. API Design

### Base URL

```
Production: https://api.redaid.in/v1
Development: http://localhost:3001/v1
```

### Conventions

- All requests and responses use `application/json`
- All timestamps in ISO 8601 UTC format: `2026-06-01T10:30:00Z`
- Pagination uses `limit` / `offset` query params; responses include `{ data, total, limit, offset }`
- Errors follow the structure: `{ error: { code: string, message: string, details?: any } }`
- All protected routes require `Authorization: Bearer <jwt>` header
- The JWT is issued by Supabase Auth and verified using the Supabase JWT secret

### Error Codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body failed Zod schema validation |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Valid JWT but insufficient role |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate entry (e.g., donor already responded) |
| 422 | `INELIGIBLE` | Donor failed eligibility check |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

### Route Inventory

#### Auth Routes

```
POST   /v1/auth/donor/register        Register new donor
POST   /v1/auth/hospital/register     Register new hospital
POST   /v1/auth/otp/send              Send OTP to phone number
POST   /v1/auth/otp/verify            Verify OTP, receive JWT
POST   /v1/auth/refresh               Refresh JWT
POST   /v1/auth/logout                Invalidate session
```

#### Donor Routes

```
GET    /v1/donor/profile              Get own profile
PATCH  /v1/donor/profile              Update profile fields
PATCH  /v1/donor/availability         Set availability + snooze_until
PATCH  /v1/donor/fcm-token            Update FCM device token

GET    /v1/donor/history              Donation history (paginated)
GET    /v1/donor/history/:id          Single donation detail
GET    /v1/donor/history/:id/certificate  Signed URL for certificate PDF

GET    /v1/donor/badges               Earned badges + points balance
GET    /v1/donor/eligibility          Returns { eligible: bool, next_eligible_date }

GET    /v1/donor/requests/active      Active request the donor has accepted
PATCH  /v1/donor/requests/:responseId/respond   Accept or decline (body: { action: 'accept'|'decline' })
PATCH  /v1/donor/requests/:responseId/status    Update to en_route | arrived
```

#### Hospital Routes

```
GET    /v1/hospital/profile           Get own profile
PATCH  /v1/hospital/profile           Update profile

POST   /v1/hospital/requests          Create blood request
GET    /v1/hospital/requests          List all requests (paginated, filterable)
GET    /v1/hospital/requests/:id      Get single request with live donor statuses
PATCH  /v1/hospital/requests/:id/cancel  Cancel active request

PATCH  /v1/hospital/requests/:id/donors/:responseId/complete  Mark donation complete
PATCH  /v1/hospital/requests/:id/donors/:responseId/no-show   Mark donor no-show
POST   /v1/hospital/requests/:id/donors/:responseId/rating    Submit donor rating

GET    /v1/hospital/inventory         Get blood inventory
PATCH  /v1/hospital/inventory/:bloodGroup  Update stock level

GET    /v1/hospital/surplus           View surplus from nearby hospitals
POST   /v1/hospital/surplus           Publish surplus availability
DELETE /v1/hospital/surplus/:id       Remove surplus listing
```

#### Admin Routes

```
GET    /v1/admin/donors               List donors (search, filter, paginate)
GET    /v1/admin/donors/:id           Get donor profile + full history
PATCH  /v1/admin/donors/:id/verify    Verify donor
PATCH  /v1/admin/donors/:id/suspend   Suspend donor
PATCH  /v1/admin/donors/:id/blacklist Blacklist donor

GET    /v1/admin/hospitals            List hospitals
GET    /v1/admin/hospitals/:id        Get hospital profile + request history
PATCH  /v1/admin/hospitals/:id/verify Verify hospital (enables them on platform)
PATCH  /v1/admin/hospitals/:id/suspend Suspend hospital
PATCH  /v1/admin/hospitals/:id/blacklist Blacklist hospital

GET    /v1/admin/requests             All requests across platform (paginated)
GET    /v1/admin/fraud/no-shows       Donors with high no-show rate
GET    /v1/admin/analytics/overview   Platform KPI summary
GET    /v1/admin/analytics/demand     Demand zone data (blood group × city × time)
GET    /v1/admin/audit-logs           Full audit log (filterable)

POST   /v1/admin/broadcast            Send system-wide push notification
```

### Request/Response Examples

#### `POST /v1/hospital/requests`

Request:
```json
{
  "blood_group": "O+",
  "units_required": 2,
  "priority": "critical",
  "notes": "Post-operative patient in ICU"
}
```

Response `201`:
```json
{
  "data": {
    "id": "req_abc123",
    "hospital_id": "hosp_xyz",
    "blood_group": "O+",
    "units_required": 2,
    "priority": "critical",
    "status": "dispatched",
    "donors_notified": 7,
    "search_radius_km": 15,
    "expires_at": "2026-06-01T11:00:00Z",
    "created_at": "2026-06-01T10:30:00Z"
  }
}
```

#### `PATCH /v1/donor/requests/:responseId/respond`

Request:
```json
{ "action": "accept" }
```

Response `200`:
```json
{
  "data": {
    "response_id": "resp_111",
    "status": "accepted",
    "request": {
      "id": "req_abc123",
      "hospital_name": "Manipal Hospital Whitefield",
      "address": "ITPL Main Road, Whitefield, Bangalore",
      "distance_km": 4.2,
      "blood_group": "O+",
      "priority": "critical",
      "google_maps_url": "https://maps.google.com/?q=12.9698,77.7499"
    }
  }
}
```

---

## 7. Authentication & Authorization

### OTP Phone Authentication Flow

```
1. Client calls POST /v1/auth/otp/send       { phone: "+919876543210" }
2. Supabase Auth sends SMS OTP via Twilio
3. Client calls POST /v1/auth/otp/verify     { phone, token: "123456" }
4. Supabase Auth returns { access_token, refresh_token, user }
5. Client stores tokens in memory (not localStorage)
   - access_token → in-memory (React state / Zustand)
   - refresh_token → httpOnly cookie
6. Client sends access_token as Bearer on all API requests
7. Express middleware verifies JWT signature against Supabase JWT secret
```

### Role Claim in JWT

On first login after registration, the Express server adds a custom claim to the user's Supabase metadata:

```typescript
// Supabase user metadata structure
{
  role: 'donor' | 'hospital' | 'admin',
  entity_id: string // donors.id or hospitals.id
}
```

### Express Auth Middleware

```typescript
// backend/src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: { code: 'UNAUTHORIZED' } });

  req.user = user;
  req.role = user.user_metadata.role;
  req.entityId = user.user_metadata.entity_id;
  next();
}

export function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    }
    next();
  };
}
```

### Token Storage Strategy

Storing JWTs in `localStorage` is a known XSS risk. RedAid uses a split-token approach:

- `access_token` — stored in memory (Zustand). Cleared on page close. Short expiry (1 hour).
- `refresh_token` — stored in an `httpOnly; Secure; SameSite=Strict` cookie. Not accessible to JavaScript. Refreshed silently by the API on expiry.

---

## 8. Real-Time Infrastructure

### Layer 1: Supabase Realtime (Database Changes)

Supabase Realtime listens to PostgreSQL logical replication and broadcasts row-level changes to subscribed clients over WebSocket.

**Used for:**

| Table | Event | Subscriber | Purpose |
|---|---|---|---|
| `blood_requests` | UPDATE | Hospital dashboard | Status changes on their requests |
| `donation_responses` | UPDATE/INSERT | Hospital live tracker | Donor accepted, arrived, donated |
| `blood_inventory` | UPDATE | Hospital inventory screen | Stock level changes |
| `hospital_surplus` | INSERT | Nearby hospitals | New surplus available |

**Frontend subscription example:**

```typescript
// Hospital live request tracker
const channel = supabase
  .channel(`request:${requestId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'donation_responses',
    filter: `request_id=eq.${requestId}`,
  }, (payload) => {
    queryClient.invalidateQueries(['request', requestId]);
  })
  .subscribe();
```

### Layer 2: Socket.IO (Application Events)

Socket.IO handles events that are not direct database row changes — application-level status updates and timer events.

**Used for:**

| Event | Direction | Purpose |
|---|---|---|
| `notification:dispatched` | Server → Hospital | "7 donors notified" |
| `notification:retry` | Server → Hospital | "No response — notifying next donor" |
| `request:radius_expanded` | Server → Hospital | "Expanded search to 25km" |
| `system:broadcast` | Server → All | Admin system-wide announcement |
| `donor:inbound` | Server → Hospital | Donor confirmed en route |

**Room strategy:** Each hospital joins a room named `hospital:{hospital_id}` on connect. Each request has a room `request:{request_id}`. Donors join `donor:{donor_id}`.

```typescript
// Server-side room join on WebSocket connection
io.on('connection', (socket) => {
  const { role, entityId } = socket.handshake.auth;
  socket.join(`${role}:${entityId}`);
});

// Emit to specific hospital when notification retry fires
io.to(`hospital:${hospitalId}`).emit('notification:retry', {
  requestId,
  donorSequence: 3,
  message: 'Previous donor did not respond. Notifying next eligible donor.',
});
```

---

## 9. Notification Pipeline

### Architecture

```
Hospital creates request
       │
       ▼
EligibilityService.findEligibleDonors(requestId)
       │
       ▼
Sorted donor list (by trust score DESC)
       │
       ▼
For each donor batch (priority: critical=all at once, others=sequential):
  ├── FCMService.send(donor.fcm_token, payload)
  ├── donation_responses row inserted { status: 'notified' }
  └── BullMQ: add delayed job { requestId, donorId, delay: 10 minutes }
       │
       ▼ (after 10 minutes if no response)
NotificationWorker picks up job
  ├── Check donation_responses.status → still 'notified'?
  │   ├── YES → update to 'no_response'
  │   │         → find next eligible donor
  │   │         → repeat cycle
  │   └── NO  → donor responded → cancel job (no-op)
```

### Priority-Based Dispatch Behaviour

| Priority | Notification Strategy |
|---|---|
| Critical | All eligible donors within radius notified simultaneously |
| Urgent | Top 5 donors by trust score notified; if no response after 10 min, next 5 |
| Scheduled | Top 3 donors notified; standard 10-minute retry cycle |

### FCM Payload Structure

```typescript
interface FCMPayload {
  notification: {
    title: string;   // e.g., "🆘 Critical Blood Request — O+"
    body: string;    // e.g., "Manipal Hospital needs O+ blood • 4.2 km away"
  };
  data: {
    type: 'blood_request';
    request_id: string;
    response_id: string;
    priority: 'critical' | 'urgent' | 'scheduled';
    blood_group: string;
    hospital_name: string;
    distance_km: string;
    deep_link: string;   // e.g., "redaid://request/req_abc123"
  };
  android: {
    priority: 'high';
    notification: { channel_id: 'blood_requests' };
  };
  webpush: {
    headers: { Urgency: 'high' };
  };
}
```

### BullMQ Queue Configuration

```typescript
// backend/src/workers/notification.worker.ts
const notificationQueue = new Queue('notifications', {
  connection: upstashRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// Adding a retry job when donor is notified
await notificationQueue.add(
  'retry-check',
  { requestId, donorId, responseId },
  { delay: 10 * 60 * 1000 } // 10 minutes
);

// Cancelling the job when donor responds
const job = await notificationQueue.getJob(jobId);
await job?.remove();
```

### Notification Fatigue Cap

For Critical requests, a single donor will not receive more than 3 Critical notifications per 24-hour window. This is enforced at dispatch time by checking `donation_responses` count within the past 24 hours per donor.

---

## 10. Geospatial Matching Engine

### PostGIS Donor Query

The core eligibility + location query runs as a single parameterized SQL statement:

```sql
-- Find eligible donors for a blood request
SELECT
  d.id,
  d.full_name,
  d.fcm_token,
  d.trust_score,
  ST_Distance(d.location, h.location) / 1000.0 AS distance_km
FROM donors d
JOIN hospitals h ON h.id = $1  -- hospital_id
WHERE
  -- Blood group compatibility
  d.blood_group = ANY($2::text[])       -- compatible_groups array

  -- Age constraint (18–65)
  AND date_part('year', age(d.date_of_birth)) BETWEEN 18 AND 65

  -- 90-day donation lock
  AND (d.last_donated_at IS NULL OR d.last_donated_at < now() - INTERVAL '90 days')

  -- Availability
  AND d.availability = 'active'
  AND (d.snooze_until IS NULL OR d.snooze_until < now())

  -- Not blacklisted
  AND d.is_blacklisted = FALSE

  -- Radius constraint
  AND ST_DWithin(d.location, h.location, $3 * 1000)  -- radius in metres

  -- Not already notified for this request
  AND d.id NOT IN (
    SELECT donor_id FROM donation_responses WHERE request_id = $4
  )

ORDER BY d.trust_score DESC, distance_km ASC;
```

### Radius Auto-Expansion

```typescript
// backend/src/services/matching/matcher.service.ts
const RADIUS_STEPS = [15, 25, 40, 60]; // km
const MIN_DONORS_THRESHOLD = 3;

async function findDonorsWithExpansion(requestId: string): Promise<Donor[]> {
  for (const radius of RADIUS_STEPS) {
    const donors = await queryEligibleDonors(requestId, radius);
    if (donors.length >= MIN_DONORS_THRESHOLD) {
      await updateRequestRadius(requestId, radius);
      return donors;
    }
    // Notify hospital of expansion via Socket.IO
    io.to(`hospital:${hospitalId}`).emit('request:radius_expanded', { radius });
  }
  // Return whatever we found even if below threshold
  return await queryEligibleDonors(requestId, RADIUS_STEPS[RADIUS_STEPS.length - 1]);
}
```

### Storing Donor Location

Location is stored as a PostGIS `GEOGRAPHY(POINT, 4326)` using WGS84 (standard GPS coordinates). This ensures `ST_Distance` returns values in metres, not degrees.

```typescript
// When saving donor location
const point = `SRID=4326;POINT(${longitude} ${latitude})`; // Note: lng first in WKT
await db.query('UPDATE donors SET location = $1 WHERE id = $2', [point, donorId]);
```

---

## 11. Eligibility Engine

The eligibility engine runs at two points: (1) at notification dispatch time via SQL, and (2) as an on-demand check for the donor's profile screen (`GET /v1/donor/eligibility`).

### Eligibility Rules (all must pass)

| Rule | Logic | Source of Truth |
|---|---|---|
| Age 18–65 | `date_of_birth` → computed age | `donors.date_of_birth` |
| 90-day lock | `last_donated_at < now() - 90 days` OR `last_donated_at IS NULL` | `donors.last_donated_at` |
| Availability active | `availability = 'active'` AND snooze expired | `donors.availability`, `donors.snooze_until` |
| Not blacklisted | `is_blacklisted = false` | `donors.is_blacklisted` |
| Blood group compatible | Donor group is in compatibility map for requested group | `COMPATIBILITY` constant |

### Eligibility Response

```typescript
interface EligibilityStatus {
  eligible: boolean;
  reason?: 'too_young' | 'too_old' | 'donation_lock' | 'snoozed' | 'unavailable' | 'blacklisted';
  next_eligible_date?: string; // ISO 8601 — set when reason is 'donation_lock'
  days_remaining?: number;
}
```

---

## 12. Trust & Reliability Score

### Score Formula

The trust score is a 0–100 numeric value stored on `donors.trust_score`. It is recalculated after every completed or no-show donation event.

```
trust_score = (W_donations × donations_component)
            + (W_response  × response_rate_component)
            + (W_reliability × reliability_rate_component)

Where:
  W_donations   = 0.30
  W_response    = 0.35
  W_reliability = 0.35

donations_component    = min(total_donations / 10, 1) × 100
  -- Caps out at 10 donations (full 100 for this component)

response_rate_component = (total_accepted / total_responses) × 100
  -- Ratio of times donor accepted vs total times notified

reliability_rate_component = (total_donations / total_accepted) × 100
  -- Ratio of times donor actually donated vs times they accepted
  -- Captures no-shows
```

**Edge case:** If `total_responses = 0`, response rate defaults to 100 (new donors start with full trust). If `total_accepted = 0`, reliability defaults to 100.

```typescript
// backend/src/services/trust-score/calculator.ts
export function computeTrustScore(donor: {
  total_donations: number;
  total_responses: number;
  total_accepted: number;
}): number {
  const donationsComponent = Math.min(donor.total_donations / 10, 1) * 100;

  const responseRate = donor.total_responses === 0
    ? 100
    : (donor.total_accepted / donor.total_responses) * 100;

  const reliabilityRate = donor.total_accepted === 0
    ? 100
    : (donor.total_donations / donor.total_accepted) * 100;

  const score = (0.30 * donationsComponent)
              + (0.35 * responseRate)
              + (0.35 * reliabilityRate);

  return Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;
}
```

### Badge Triggers

| Badge | Trigger Condition |
|---|---|
| `first_drop` | First completed donation |
| `streak_3` | 3 donations without a no-show |
| `streak_5` | 5 donations without a no-show |
| `streak_10` | 10 donations without a no-show |
| `lifesaver` | 5 total completed donations |
| `hero` | 10 total completed donations |
| `critical_responder` | 3 Critical priority donations |
| `trusted_donor` | Trust score ≥ 90 |

Badge checks run in the post-donation automation hook. Badges are idempotent — the `UNIQUE(donor_id, badge_type)` constraint prevents duplicates.

---

## 13. Post-Donation Automation

This is a critical system path. When a hospital calls `PATCH /hospital/requests/:id/donors/:responseId/complete`, the following sequence runs atomically:

```typescript
// backend/src/services/post-donation/post-donation.service.ts
async function runPostDonationHook(responseId: string): Promise<void> {
  const response = await getResponseWithContext(responseId);
  const { donorId, requestId, hospitalId } = response;

  // All DB writes in a single transaction
  await db.transaction(async (tx) => {
    // 1. Update donation_responses status
    await tx.updateResponseStatus(responseId, 'donated');

    // 2. Update donors table
    await tx.updateDonor(donorId, {
      last_donated_at: new Date(),
      total_donations: sql`total_donations + 1`,
    });

    // 3. Insert into donation_history (immutable record)
    const historyEntry = await tx.insertDonationHistory({
      donor_id: donorId,
      hospital_id: hospitalId,
      request_id: requestId,
      blood_group: response.blood_group,
      donated_at: new Date(),
    });

    // 4. Recalculate and update trust score
    const updatedDonor = await tx.getDonor(donorId);
    const newScore = computeTrustScore(updatedDonor);
    await tx.updateDonor(donorId, { trust_score: newScore });

    // 5. Update blood_requests fulfilled count
    await tx.incrementUnitsFulfilled(requestId);

    // 6. Check and update request completion
    const request = await tx.getRequest(requestId);
    if (request.units_fulfilled >= request.units_required) {
      await tx.updateRequestStatus(requestId, 'completed');
    }
  });

  // 7. Award badges (outside transaction — non-critical)
  await badgeService.checkAndAward(donorId);

  // 8. Generate certificate (async, non-blocking)
  certificateService.generate(donorId, historyEntryId).catch(logger.error);

  // 9. Send thank-you push notification
  const nextEligibleDate = addDays(new Date(), 90);
  await fcmService.send(donor.fcm_token, {
    title: '🙏 Thank you for donating blood!',
    body: `You can donate again after ${format(nextEligibleDate, 'dd MMM yyyy')}`,
    data: { type: 'donation_complete', next_eligible_date: nextEligibleDate.toISOString() },
  });

  // 10. Audit log
  await auditLog('donation.completed', 'donation_response', responseId, { donorId, hospitalId });
}
```

---

## 14. Certificate Generation

### PDF Generation with pdf-lib

```typescript
// backend/src/services/certificate/certificate.service.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function generateCertificate(donorId: string, historyId: string): Promise<string> {
  const donor = await getDonor(donorId);
  const history = await getDonationHistory(historyId);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 in points
  const { width, height } = page.getSize();

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Title
  page.drawText('Certificate of Blood Donation', {
    x: 50, y: height - 100,
    size: 28, font: boldFont,
    color: rgb(0.75, 0.22, 0.17), // Primary Red #C0392B
  });

  // Donor name
  page.drawText(`This certifies that ${donor.full_name}`, {
    x: 50, y: height - 170,
    size: 16, font: regularFont,
    color: rgb(0.1, 0.1, 0.18),
  });

  // ... additional fields: date, hospital, blood group, certificate ID

  // Unique certificate ID in footer
  const certId = `BL-${historyId.slice(0, 8).toUpperCase()}`;
  page.drawText(`Certificate ID: ${certId}`, {
    x: 50, y: 50, size: 10, font: regularFont,
    color: rgb(0.42, 0.45, 0.50),
  });

  const pdfBytes = await pdfDoc.save();

  // Upload to Supabase Storage
  const key = `certificates/${donorId}/${historyId}.pdf`;
  await supabaseAdmin.storage.from('certificates').upload(key, pdfBytes, {
    contentType: 'application/pdf',
    upsert: true,
  });

  // Generate signed URL valid for 7 days (renewable on request)
  const { data } = await supabaseAdmin.storage.from('certificates')
    .createSignedUrl(key, 7 * 24 * 60 * 60);

  // Save URL and key back to donation_history
  await updateDonationHistoryCertificate(historyId, data.signedUrl, key);

  return data.signedUrl;
}
```

### Certificate Regeneration

The storage key is persisted on `donation_history.certificate_key`. If the signed URL expires, the client calls `GET /v1/donor/history/:id/certificate` which regenerates a fresh signed URL from the stored key without re-rendering the PDF.

---

## 15. Frontend Architecture

### Portal Routing

The single Vite/React build serves all three portals. Routing is based on the authenticated user's role claim in the JWT.

```typescript
// frontend/src/App.tsx
function App() {
  const { role } = useAuth();

  if (!role) return <AuthRouter />;

  return (
    <Routes>
      {role === 'donor'    && <Route path="/*" element={<DonorPortal />} />}
      {role === 'hospital' && <Route path="/*" element={<HospitalPortal />} />}
      {role === 'admin'    && <Route path="/*" element={<AdminPortal />} />}
    </Routes>
  );
}
```

### State Management Architecture

| State Type | Tool | Examples |
|---|---|---|
| Server state | TanStack Query | Donor profile, request list, inventory |
| Global UI state | Zustand | Auth tokens, availability toggle, active alerts |
| Form state | React Hook Form | Registration, request creation |
| Real-time state | Supabase Realtime subscriptions | Live request tracker |

### TanStack Query Key Convention

```typescript
// Query keys are arrays — enables precise cache invalidation
['donor', 'profile']                  // Own profile
['donor', 'history']                  // Donation history list
['donor', 'eligibility']              // Eligibility check
['request', requestId]                // Single request detail
['request', requestId, 'responses']   // All donor responses for a request
['hospital', 'inventory']             // Blood inventory
['admin', 'donors', { page, filter }] // Admin donor list
```

### Zustand Auth Store

```typescript
// frontend/src/lib/store/auth.store.ts
interface AuthState {
  accessToken: string | null;
  user: User | null;
  role: 'donor' | 'hospital' | 'admin' | null;
  entityId: string | null;
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  role: null,
  entityId: null,
  setSession: (token, user) => set({
    accessToken: token,
    user,
    role: user.user_metadata.role,
    entityId: user.user_metadata.entity_id,
  }),
  clearSession: () => set({ accessToken: null, user: null, role: null, entityId: null }),
}));
```

---

## 16. PWA Requirements

### PWA Manifest (`public/manifest.json`)

```json
{
  "name": "RedAid",
  "short_name": "RedAid",
  "description": "Real-Time Emergency Blood Coordination",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1A1A2E",
  "theme_color": "#C0392B",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Service Worker Strategy (`vite-plugin-pwa`)

```typescript
// vite.config.ts PWA plugin configuration
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        // Cache API responses for donor profile (stale-while-revalidate)
        urlPattern: /^https:\/\/api\.redaid\.in\/v1\/donor\/profile/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'api-donor-profile', expiration: { maxAgeSeconds: 300 } },
      },
      {
        // Network-first for real-time request data
        urlPattern: /^https:\/\/api\.redaid\.in\/v1\/(hospital|donor)\/requests/,
        handler: 'NetworkFirst',
        options: { cacheName: 'api-requests', networkTimeoutSeconds: 5 },
      },
    ],
  },
})
```

### Push Notification Permission Flow

Push notification permission is requested contextually — never on first load. The prompt is shown after the donor completes registration and reaches their dashboard.

```typescript
async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  if (Notification.permission === 'granted') return true;

  const result = await Notification.requestPermission();
  if (result === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_FCM_VAPID_KEY,
    });
    // Send subscription to backend to store as FCM token
    await api.patch('/donor/fcm-token', { token: subscription });
    return true;
  }
  return false;
}
```

### Offline Behaviour

| Screen | Offline Behaviour |
|---|---|
| Donor dashboard | Show cached profile; show "Offline — data may be stale" banner |
| Donation history | Serve from cache |
| Incoming request alert | Cannot be received offline (push notification requires network) |
| Hospital dashboard | Show cached snapshot with stale warning |
| Blood request creation | Queue locally; show error if submit attempted offline |

---

## 17. Admin Panel

### Access Control

Admin accounts are created manually in the Supabase dashboard and have `role: 'admin'` set in user metadata. There is no self-registration flow for admins.

### Fraud Detection Logic

No-show flagging runs nightly via a scheduled cron job on the Express server:

```typescript
// Runs daily at 02:00 IST (20:30 UTC)
cron.schedule('30 20 * * *', async () => {
  // Flag donors with no-show rate > 30% and minimum 5 acceptances
  const flagged = await db.query(`
    SELECT donor_id,
           COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows,
           COUNT(*) FILTER (WHERE status IN ('donated','no_show')) AS total_completed,
           COUNT(*) FILTER (WHERE status = 'no_show')::float /
             NULLIF(COUNT(*) FILTER (WHERE status IN ('donated','no_show')), 0) AS no_show_rate
    FROM donation_responses
    WHERE status IN ('donated', 'no_show')
    GROUP BY donor_id
    HAVING COUNT(*) FILTER (WHERE status IN ('donated','no_show')) >= 5
       AND COUNT(*) FILTER (WHERE status = 'no_show')::float /
             COUNT(*) FILTER (WHERE status IN ('donated','no_show')) > 0.30
  `);

  for (const donor of flagged) {
    await auditLog('fraud.no_show_flagged', 'donor', donor.donor_id, {
      no_show_rate: donor.no_show_rate,
    });
    // Surface in admin fraud monitor screen
  }
});
```

### Analytics Queries

The admin analytics dashboard is built on raw PostgreSQL aggregations — no separate analytics database for V1.

```sql
-- Demand zone: blood group demand by city, last 30 days
SELECT
  h.city,
  br.blood_group,
  COUNT(*) AS total_requests,
  SUM(br.units_required) AS total_units_requested,
  SUM(br.units_fulfilled) AS total_units_fulfilled,
  ROUND(AVG(EXTRACT(EPOCH FROM (
    MIN(dr.responded_at) - br.created_at
  )) / 60), 1) AS avg_response_minutes
FROM blood_requests br
JOIN hospitals h ON h.id = br.hospital_id
LEFT JOIN donation_responses dr ON dr.request_id = br.id AND dr.status = 'accepted'
WHERE br.created_at > now() - INTERVAL '30 days'
GROUP BY h.city, br.blood_group
ORDER BY total_requests DESC;
```

---

## 18. Security & Compliance

### DPDPA 2023 Compliance

| Requirement | Implementation |
|---|---|
| Data minimisation | Health declaration stored as JSONB blob; only blood group and last donation date surfaced to matching |
| Consent at registration | Health declaration form with explicit consent checkbox; stored in `health_declaration.consent_timestamp` |
| Right to erasure | `DELETE /v1/donor/account` anonymises PII fields (replaces with hashed values), preserves donation history with anonymised donor reference |
| Data encryption at rest | Supabase encrypts all data at rest using AES-256 |
| Data encryption in transit | All endpoints served over TLS 1.3; Supabase connections use SSL |
| Cross-border data residency | Supabase project region: `ap-south-1` (Mumbai) |

### PII Handling Rules

- Donor phone numbers are never included in API responses visible to hospitals
- Hospitals see only: donor blood group, trust score, approximate distance, first name + last initial
- Full donor details (name, phone) are revealed to a hospital only after a donor accepts their specific request
- Admin access to full PII is logged in `audit_logs` for every access

### Input Validation

All incoming request bodies are validated with Zod schemas before hitting any business logic:

```typescript
// Request creation schema
const CreateRequestSchema = z.object({
  blood_group: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  units_required: z.number().int().min(1).max(20),
  priority: z.enum(['critical', 'urgent', 'scheduled']),
  notes: z.string().max(500).optional(),
});
```

### Rate Limiting

```typescript
// Per-IP rate limits using express-rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,               // general API
  standardHeaders: 'draft-7',
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,                 // OTP sends per IP per hour
});

const notificationLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  limit: 10,                // request creation attempts per hospital
});
```

### Security Headers

Express is configured with `helmet` to set:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'; connect-src api.redaid.in wss://...`

---

## 19. Performance Requirements

| Metric | Target | Measurement |
|---|---|---|
| API response time (p95) | < 500ms | Sentry performance traces |
| Notification dispatch | < 2 seconds from request creation | Audit log timestamps |
| FCM delivery rate | > 98% | Firebase Console metrics |
| Donor matching query | < 100ms | PostgreSQL `EXPLAIN ANALYZE` |
| Page load (First Contentful Paint) | < 2s on 4G | Lighthouse CI |
| App crash rate | < 0.5% | Sentry crash reporting |
| Realtime event latency | < 500ms | Manual measurement |
| Certificate generation | < 3 seconds | Service timing log |

### Database Query Optimisation Checklist

- [ ] `EXPLAIN ANALYZE` run on all queries before deployment
- [ ] Composite index on `(availability, blood_group, last_donated_at)` for eligibility pre-filter
- [ ] GIST index on `donors.location` for PostGIS queries
- [ ] Partial index: `CREATE INDEX ON donors(trust_score) WHERE is_blacklisted = false AND availability = 'active'`
- [ ] Connection pooling via Supabase's built-in PgBouncer (session mode)

---

## 20. Error Handling & Monitoring

### Express Global Error Handler

```typescript
// backend/src/middleware/error-handler.ts
app.use((err: Error, req, res, next) => {
  Sentry.captureException(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: err.flatten() }
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }

  // Unknown errors — never leak stack traces to client
  logger.error({ err, url: req.url, method: req.method });
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
});
```

### Structured Logging

All server logs output JSON (via `pino`) for structured log ingestion:

```json
{
  "level": "info",
  "time": "2026-06-01T10:30:00.000Z",
  "requestId": "req_xyz",
  "method": "POST",
  "url": "/v1/hospital/requests",
  "statusCode": 201,
  "duration": 87,
  "hospitalId": "hosp_abc"
}
```

### Sentry Configuration

Sentry is initialised in both the Express server and the React frontend. The React integration captures:
- Unhandled errors and promise rejections
- Web Vitals (LCP, FID, CLS)
- Session replays (10% sample rate — PII scrubbing enabled)

---

## 21. Testing Strategy

### Coverage Requirements

- Business logic services: minimum 80% line coverage
- API route handlers: 100% happy path + critical error paths
- Eligibility engine: 100% coverage (safety-critical)
- Trust score calculator: 100% coverage

### Testing Stack

| Layer | Tool |
|---|---|
| Unit tests | Vitest (shared across web and API) |
| API integration tests | Supertest + Vitest |
| Frontend component tests | React Testing Library |
| E2E tests (Phase 5) | Playwright |
| CI runner | GitHub Actions |

### Critical Test Cases

**Eligibility Engine:**
- Donor exactly 90 days post-donation → ineligible
- Donor 91 days post-donation → eligible
- Donor with `snooze_until` in the future → ineligible
- O- donor matched for AB+ request → compatible
- O+ donor matched for A- request → incompatible
- 17-year-old donor → ineligible
- 65-year-old donor → eligible
- 66-year-old donor → ineligible

**Notification Pipeline:**
- BullMQ job cancelled when donor accepts within 10 minutes
- BullMQ job fires and updates status to `no_response` when donor doesn't respond
- Critical request notifies all eligible donors simultaneously
- Notification cap (3 per 24hr) enforced for Critical requests

**Post-Donation Automation:**
- `last_donated_at` is set to current timestamp
- Trust score is recalculated correctly
- `donation_history` record is immutable (no UPDATE allowed by RLS)
- Badge awarded idempotently (no duplicate)
- Certificate URL is stored on `donation_history`

---

## 22. Deployment & DevOps

### Deployment Targets

| App | Platform | Trigger |
|---|---|---|
| React PWA (`frontend/`) | Vercel | Push to `main` branch |
| Express API (`backend/`) | Render | Push to `main` branch |

### GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test --coverage
      - run: pnpm run build

  test-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm run test --coverage
      - run: pnpm run build
```

### Database Migration Strategy

Migrations are written as plain SQL files in `supabase/migrations/`. Naming convention: `{timestamp}_{description}.sql`. Applied via Supabase CLI:

```bash
supabase db push           # apply pending migrations
supabase db reset          # reset to seed state (development only)
```

All migrations are non-destructive. Columns are soft-deleted (renamed with `_deprecated` suffix) before being removed in a later migration, providing a one-release rollback window.

### Environment Promotion

```
feature branch → PR → CI runs → review
PR merged → staging deployment (auto)
Manual approval → production deployment
```

---

## 23. Environment Variables

### API (`backend/.env`)

```bash
# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=         # Server-side only — full DB access, bypasses RLS
SUPABASE_JWT_SECRET=               # For verifying user JWTs

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Resend
RESEND_API_KEY=

# App
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://app.redaid.in
```

### Web (`frontend/.env`)

```bash
# Supabase (anon key — safe for client)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=

# API
VITE_API_URL=https://api.redaid.in/v1

# Firebase (VAPID key for web push)
VITE_FCM_VAPID_KEY=

# Sentry
VITE_SENTRY_DSN=
```

---

## 24. Definition of Done — Engineering

A feature branch may only be merged to `main` when all of the following are satisfied:

### Code Quality
- [ ] TypeScript compiles with zero errors (`tsc --noEmit`)
- [ ] ESLint passes with zero warnings
- [ ] No `any` types added without explicit comment justification
- [ ] All new functions have JSDoc comments for non-obvious logic

### Testing
- [ ] Unit tests written for all new service functions
- [ ] Integration test written for all new API endpoints
- [ ] Eligibility or trust-score changes have 100% coverage
- [ ] All existing tests pass

### Database
- [ ] Migration file created for any schema changes
- [ ] RLS policy added for any new table
- [ ] Indexes added and `EXPLAIN ANALYZE` reviewed for new queries

### Security
- [ ] No PII included in API error responses or logs
- [ ] Auth middleware applied to all new protected routes
- [ ] Zod validation on all new request bodies
- [ ] Audit log entry added for all state-changing actions

### Performance
- [ ] New API endpoints tested for < 500ms response time under normal load
- [ ] No N+1 queries introduced

### Pull Request
- [ ] PR description links to the PRD feature section being implemented
- [ ] At least one peer reviewer approved
- [ ] Sentry release tag created

---

*End of Document — TRD v1.0*
*This document is maintained alongside the codebase. Any schema or API contract change requires a TRD update in the same PR.*
