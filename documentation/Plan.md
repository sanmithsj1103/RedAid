# Implementation Plan
## RedAid — Real-Time Emergency Blood Coordination Platform

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | June 2026 |
| **Status** | Approved for Development |
| **Document Owner** | Engineering Lead |
| **References** | PRD v1.0, TRD v1.0, AppFlow v1.0, BackendSchema v1.0 |

---

## Table of Contents

1. [How to Read This Plan](#1-how-to-read-this-plan)
2. [Build Phases Overview](#2-build-phases-overview)
3. [Phase 0 — Project Scaffolding & Infrastructure](#3-phase-0--project-scaffolding--infrastructure)
4. [Phase 1 — Authentication & User Registration](#4-phase-1--authentication--user-registration)
5. [Phase 2 — Core Request Engine](#5-phase-2--core-request-engine)
6. [Phase 3 — Real-Time Pipeline & Notifications](#6-phase-3--real-time-pipeline--notifications)
7. [Phase 4 — Post-Donation Automation](#7-phase-4--post-donation-automation)
8. [Phase 5 — Donor Engagement Layer](#8-phase-5--donor-engagement-layer)
9. [Phase 6 — Hospital Operations Tools](#9-phase-6--hospital-operations-tools)
10. [Phase 7 — Admin Panel](#10-phase-7--admin-panel)
11. [Phase 8 — Security, Polish & Pre-Launch](#11-phase-8--security-polish--pre-launch)
12. [Dependency Map](#12-dependency-map)
13. [Definition of Done — Per Phase](#13-definition-of-done--per-phase)

---

## 1. How to Read This Plan

Each phase in this document represents a **self-contained vertical slice** of the system. Every phase produces something testable and usable before the next begins. No phase starts until the previous one is fully done and its Definition of Done is met.

Within each phase, steps are numbered and ordered — step N must be complete before step N+1 begins. Steps are grouped into **Backend**, **Frontend**, and **Integration** tracks, but within a phase these tracks run sequentially, not in parallel, unless explicitly stated. Backend is always built and verified before the frontend that depends on it.

The guiding rule throughout: **build the data layer first, then the API, then the UI**. Never build a screen before its API contract is defined and working.

---

## 2. Build Phases Overview

```
Phase 0 — Scaffolding & Infrastructure
         Repo, tooling, CI, Supabase, environment variables, shared types

Phase 1 — Auth & Registration
         OTP flow, donor registration, hospital registration, role routing

Phase 2 — Core Request Engine
         Blood request creation, eligibility engine, PostGIS matching

Phase 3 — Real-Time Pipeline & Notifications
         FCM dispatch, BullMQ retry queue, Socket.IO, Supabase Realtime

Phase 4 — Post-Donation Automation
         Donation completion, trust score, history, certificates

Phase 5 — Donor Engagement Layer
         Donation history UI, badges, gamification, availability settings

Phase 6 — Hospital Operations Tools
         Blood inventory, cross-hospital surplus, donor feedback

Phase 7 — Admin Panel
         User management, fraud detection, analytics, audit logs

Phase 8 — Security, Polish & Pre-Launch
         Rate limiting, error hardening, PWA configuration, QA, deployment
```

Each phase gates the next. Phases 5, 6, and 7 have **no dependencies on each other** and may be built in any order once Phase 4 is done.

---

## 3. Phase 0 — Project Scaffolding & Infrastructure

This phase produces no user-visible features. Its output is a fully configured, running skeleton that every subsequent phase builds on. Rushing past this phase creates friction that compounds over the entire project.

### Step 0.1 — Initialise the Monorepo

Create the Git repository with the two-folder structure defined in the TRD.

```
redaid/
├── frontend/
├── backend/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── pnpm-workspace.yaml
├── package.json
└── .github/workflows/ci.yml
```

- Initialise `pnpm-workspace.yaml` linking `frontend` and `backend` as workspaces
- Create root `.gitignore` covering `node_modules`, `.env`, `dist`, `.supabase`
- Set up root `package.json` with workspace-level scripts: `dev`, `build`, `test`, `lint`

### Step 0.2 — Backend Project Setup

Inside `backend/`:

- Initialise `package.json` with all dependencies from the TRD tech stack: `express`, `typescript`, `@supabase/supabase-js`, `bullmq`, `socket.io`, `firebase-admin`, `resend`, `zod`, `pino`, `helmet`, `express-rate-limit`, `pdf-lib`, `node-cron`
- Configure `tsconfig.json` with strict mode, `ESNext` target, path aliases
- Create the full `src/` directory structure:
  ```
  src/
  ├── routes/
  ├── services/
  │   ├── eligibility/
  │   ├── matching/
  │   ├── notification/
  │   ├── trust-score/
  │   ├── certificate/
  │   └── post-donation/
  ├── workers/
  ├── middleware/
  ├── db/
  ├── types/
  └── index.ts
  ```
- Create `src/types/` with all shared TypeScript interfaces: `BloodGroup` enum, `COMPATIBILITY` map, `RequestStatus` enum, `RequestPriority` enum, `DonorProfile`, `HospitalProfile` — these are the shared types referenced throughout every service
- Set up `pino` logger instance
- Set up `helmet` and basic `express` app skeleton in `src/index.ts` — server boots and returns `200` on `GET /health`
- Create `.env.example` with all environment variables from TRD Section 23

### Step 0.3 — Frontend Project Setup

Inside `frontend/`:

- Scaffold with `pnpm create vite` using React + TypeScript template
- Install all dependencies: `react-router-dom`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `lucide-react`, `tailwindcss`, `@supabase/supabase-js`, `vite-plugin-pwa`, `sentry`
- Configure Tailwind with the design system from PRD Section 12: colour tokens, font stack (Plus Jakarta Sans + Inter), spacing base unit of 4px
- Create `frontend/tsconfig.json` path alias for `@redaid/types` pointing to `../backend/src/types/index.ts`
- Configure `vite.config.ts` with the `VitePWA` plugin (placeholder manifest for now)
- Create `src/` structure:
  ```
  src/
  ├── portals/
  │   ├── donor/
  │   ├── hospital/
  │   └── admin/
  ├── components/
  ├── hooks/
  ├── lib/
  │   ├── api.ts        (axios/fetch client with auth interceptor)
  │   ├── supabase.ts   (Supabase client instance)
  │   └── store/
  │       └── auth.store.ts
  └── main.tsx
  ```
- Set up the Zustand `AuthStore` with `accessToken`, `user`, `role`, `entityId`, `setSession`, `clearSession`
- Set up `TanStack Query` `QueryClient` with default stale time and retry config
- Verify: `pnpm dev` starts a working blank React app on `localhost:5173`

### Step 0.4 — Supabase Project Initialisation

- Create a Supabase project in the `ap-south-1` (Mumbai) region
- Enable the PostGIS extension in the Supabase SQL editor:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```
- Enable Supabase Auth with phone/OTP provider (Twilio integration or built-in for dev)
- Create the `certificates` Storage bucket as private (no public access)
- Initialise Supabase CLI in the project root: `supabase init`
- Link local CLI to the remote project: `supabase link --project-ref <ref>`
- Write migration `20260601000001_init_extensions.sql`:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```
- Apply and verify: `supabase db push`

### Step 0.5 — Database Schema Migration (All Tables)

Write and apply all table migrations from BackendSchema in dependency order. Each migration is a separate file:

```
20260601000002_init_donors.sql
20260601000003_init_hospitals.sql
20260601000004_init_blood_requests.sql
20260601000005_init_donation_responses.sql
20260601000006_init_donation_history.sql
20260601000007_init_blood_inventory.sql
20260601000008_init_hospital_surplus.sql
20260601000009_init_donor_badges.sql
20260601000010_init_audit_logs.sql
20260601000011_rls_policies.sql
20260601000012_indexes.sql
20260601000013_triggers.sql    (updated_at triggers)
```

Apply all migrations: `supabase db push`. Verify every table is created, every FK is valid, and all indexes exist by inspecting the Supabase dashboard Table Editor.

**Do not proceed to Phase 1 until all tables are verified in the database.**

### Step 0.6 — Seed Data

Write `supabase/seed.sql` with the test data from BackendSchema Section 15:
- 2 test donor auth users + donor rows
- 2 test hospital auth users + hospital rows (1 verified, 1 pending)
- Blood inventory rows for the verified hospital
- Run: `supabase db reset` (development only) to verify seed applies cleanly

### Step 0.7 — CI Pipeline

Create `.github/workflows/ci.yml` as defined in TRD Section 22. The pipeline must:
- Run `tsc --noEmit` on both backend and frontend
- Run `eslint` on both
- Run `vitest` on both
- Run `pnpm build` on both

Verify: push a commit, confirm the CI pipeline runs and passes (even with near-empty test suites).

### Step 0.8 — Upstash Redis & BullMQ Bootstrap

- Create an Upstash Redis database (free tier)
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `backend/.env`
- Create `backend/src/workers/notification.worker.ts` skeleton:
  - Initialise the Upstash Redis connection
  - Define the `notifications` queue with default job options from TRD Section 9
  - Worker loops and logs received jobs — no real processing yet
- Verify: queue instantiates without errors on server boot

### Step 0.9 — Firebase Admin SDK Bootstrap

- Create a Firebase project and enable Firebase Cloud Messaging
- Add the Firebase service account credentials to `backend/.env`
- Create `backend/src/services/notification/fcm.service.ts` skeleton:
  - Initialise Firebase Admin app
  - Export a `sendPushNotification(token, payload)` function that calls `firebase.messaging().send()`
- Verify: call the function with a test token — confirm no initialisation errors (delivery may fail for test token — that is fine)

**Phase 0 is complete when:** The repo is committed, CI is green, the database schema is fully applied, the server boots and returns `200` on `/health`, and the frontend dev server starts without errors.

---

## 4. Phase 1 — Authentication & User Registration

This phase produces the complete login, registration, and role-routing flows for all three user types. At the end of this phase, a donor can register and reach their dashboard shell; a hospital can register and see the pending screen; an admin account exists and can log in.

### Step 1.1 — Backend: OTP Auth Routes

Create `backend/src/routes/auth.routes.ts` with the following endpoints:

- `POST /v1/auth/otp/send` — calls `supabase.auth.signInWithOtp({ phone })`, returns `{ message: 'OTP sent' }`
- `POST /v1/auth/otp/verify` — calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`, determines if the user is new or existing, returns `{ isNewUser, access_token?, role?, entity_id? }`
- `POST /v1/auth/refresh` — reads refresh token from `httpOnly` cookie, calls `supabase.auth.refreshSession()`, returns new `access_token`
- `POST /v1/auth/logout` — clears the `httpOnly` cookie

Apply OTP-specific rate limiting (`otpLimiter`) on the `send` and `verify` endpoints.

Write unit tests for each route covering: valid OTP, expired OTP, wrong OTP, rate limit breach.

### Step 1.2 — Backend: Auth Middleware

Create `backend/src/middleware/auth.ts`:

- `requireAuth` — verifies the JWT Bearer token via `supabase.auth.getUser()`, attaches `req.user`, `req.role`, `req.entityId`; returns `401` if missing or invalid
- `requireRole(...roles)` — checks `req.role` against allowed roles; returns `403` if not permitted
- Account status check inside `requireAuth`: queries `donors` or `hospitals` table to verify `is_blacklisted` and `is_verified`; returns appropriate `403` codes

Write unit tests covering all middleware paths: valid token, expired token, wrong role, blacklisted user, unverified hospital.

### Step 1.3 — Backend: Donor Registration Route

Create `POST /v1/auth/donor/register`:

- Validates request body with Zod: `full_name`, `date_of_birth`, `blood_group`, `city`, `state`, `health_declaration`
- Age validation: must be 18–65 at time of registration — reject with `422 INELIGIBLE` otherwise
- Inserts a row into `donors` table
- Sets `user_metadata.role = 'donor'` and `user_metadata.entity_id = donors.id` on the Supabase Auth user
- Inserts `audit_logs` entry: `donor.registered`
- Returns the new donor profile

Write unit tests: valid registration, underage donor, overage donor, duplicate phone.

### Step 1.4 — Backend: Hospital Registration Route

Create `POST /v1/auth/hospital/register`:

- Validates request body with Zod: `name`, `registration_number`, `phone`, `email`, `address`, `city`, `state`, `department`
- Inserts a row into `hospitals` table with `is_verified = false`
- Sets `user_metadata.role = 'hospital'` and `user_metadata.entity_id = hospitals.id`
- Auto-inserts 8 rows into `blood_inventory` (one per blood group, `units_available = 0`)
- Inserts `audit_logs` entry: `hospital.registered`
- Returns the new hospital profile

Write unit tests: valid registration, duplicate registration number.

### Step 1.5 — Backend: Profile GET Routes

Create basic profile read endpoints needed immediately by the frontend:
- `GET /v1/donor/profile` — requires `requireAuth` + `requireRole('donor')`; returns own donor row
- `GET /v1/hospital/profile` — requires `requireAuth` + `requireRole('hospital')`; returns own hospital row

### Step 1.6 — Frontend: Supabase Client & API Client

- `frontend/src/lib/supabase.ts` — initialise `createClient` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `frontend/src/lib/api.ts` — create an `axios` (or `fetch` wrapper) instance pointing to `VITE_API_URL`, with a request interceptor that reads `accessToken` from the Zustand `AuthStore` and appends it as `Authorization: Bearer`; with a response interceptor that calls the refresh endpoint on `401`

### Step 1.7 — Frontend: Auth Pages

Build the shared auth screens. These live at `/login` and `/register/*` and are accessible to all unauthenticated users.

**Login Page (`/login`):**
- Phone number input with Indian phone formatting
- `Send OTP` button → calls `POST /v1/auth/otp/send`
- OTP input field (6 digits) appears after OTP is sent
- 30-second resend cooldown timer
- `Verify OTP` button → calls `POST /v1/auth/otp/verify`
- On success: stores `access_token` in Zustand; sets `httpOnly` refresh cookie (via API response); routes to the correct portal or to registration

**Role Selection Screen (`/register`):**
- Shown only to new users (when `isNewUser: true` is returned from verify)
- Two options: "I want to donate blood" → `/register/donor`; "I represent a hospital" → `/register/hospital`

**Donor Registration Form (`/register/donor`):**
- Fields: full name, date of birth, blood group (dropdown), city — all as per PRD Section 5
- Geolocation step: browser permission prompt; if granted, auto-fill coordinates; if denied, city-level fallback
- Health declaration form with consent checkbox — see BackendSchema Section 13.1 for field list
- Push notification permission prompt (contextual — after health declaration)
- Submits to `POST /v1/auth/donor/register`
- On success: routes to `/donor/dashboard`

**Hospital Registration Form (`/register/hospital`):**
- Fields: hospital name, registration number, department, address, city, contact phone, contact email
- Submits to `POST /v1/auth/hospital/register`
- On success: routes to `/hospital/pending`

### Step 1.8 — Frontend: Role-Based Routing

In `frontend/src/App.tsx`, set up route guards:
- Read `role` from the Zustand `AuthStore`
- Unauthenticated users: redirect all `/donor/*`, `/hospital/*`, `/admin/*` routes to `/login`
- `role: 'donor'` → can only access `/donor/*`; other portals redirect to `/donor/dashboard`
- `role: 'hospital'`, `is_verified: false` → `/hospital/pending` only; all other hospital routes redirect there
- `role: 'hospital'`, `is_verified: true` → `/hospital/*`
- `role: 'admin'` → `/admin/*`

### Step 1.9 — Frontend: Dashboard Shells

Create empty shell screens for all three portals — these are placeholder pages with correct routing, navbar, and a "Coming soon" body. They confirm routing works end-to-end before real content is added in later phases.

- `/donor/dashboard` — shell with donor navbar (Home, History, Badges, Profile)
- `/hospital/pending` — the full "Verification Pending" screen (this is not a shell — build it completely now as it is simple and complete)
- `/hospital/dashboard` — shell with hospital navbar (Dashboard, Requests, Inventory, Surplus, Profile)
- `/admin/dashboard` — shell with admin navbar (Dashboard, Donors, Hospitals, Fraud, Analytics, Notifications, Audit)

### Step 1.10 — Admin Account Provisioning

Using the Supabase Admin API (not a UI), manually create the first admin account:
- Create the auth user with phone and set `user_metadata.role = 'admin'`
- Verify: log in with the admin phone number and confirm routing to `/admin/dashboard`

**Phase 1 is complete when:** A donor can register, log in, and reach `/donor/dashboard`; a hospital can register, see `/hospital/pending`, and cannot access any other hospital routes; an admin account exists and routes to `/admin/dashboard`.

---

## 5. Phase 2 — Core Request Engine

This phase implements the heart of the platform: blood request creation and the eligibility + location matching engine. At the end of this phase, a hospital can create a request and the system can identify the correct eligible donors — though notifications are not yet sent (that is Phase 3).

### Step 2.1 — Backend: Blood Group Compatibility Service

Create `backend/src/types/blood.ts` (if not already done in Phase 0) with the `BloodGroup` enum and the full `COMPATIBILITY` map as defined in TRD Section 4. Wrap it in a helper:

```typescript
// getCompatibleDonorGroups(requestedGroup: BloodGroup): BloodGroup[]
// Returns the array of blood groups that can donate to the requested group.
```

Write unit tests covering all 8 blood groups and the universal donor (O-) case.

### Step 2.2 — Backend: Eligibility Engine

Create `backend/src/services/eligibility/eligibility.service.ts`:

Implement `checkDonorEligibility(donor)` — evaluates the five rules from TRD Section 11:
1. Age 18–65 (computed from `date_of_birth`)
2. 90-day donation lock (`last_donated_at < now() - 90 days` OR `last_donated_at IS NULL`)
3. Availability is `active` AND `snooze_until` is NULL or past
4. `is_blacklisted = false`
5. Blood group compatible with the requested group

Returns an `EligibilityStatus` object: `{ eligible, reason?, next_eligible_date?, days_remaining? }`.

**Write 100% test coverage** on this service — it is safety-critical. Cover every boundary condition: exactly 90 days, 91 days, age exactly 18, age exactly 65, age 66, snoozed with future vs past expiry, all blood group compatibility pairings.

### Step 2.3 — Backend: PostGIS Matching Query

Create `backend/src/services/matching/matcher.service.ts`:

Implement `findEligibleDonors(requestId, hospitalId, bloodGroup, radiusKm)` using the PostGIS query from TRD Section 10:

```sql
SELECT d.id, d.full_name, d.fcm_token, d.trust_score,
       ST_Distance(d.location, h.location) / 1000.0 AS distance_km
FROM donors d
JOIN hospitals h ON h.id = $1
WHERE d.blood_group = ANY($2::text[])
  AND date_part('year', age(d.date_of_birth)) BETWEEN 18 AND 65
  AND (d.last_donated_at IS NULL OR d.last_donated_at < now() - INTERVAL '90 days')
  AND d.availability = 'active'
  AND (d.snooze_until IS NULL OR d.snooze_until < now())
  AND d.is_blacklisted = FALSE
  AND ST_DWithin(d.location, h.location, $3 * 1000)
  AND d.id NOT IN (
    SELECT donor_id FROM donation_responses WHERE request_id = $4
  )
ORDER BY d.trust_score DESC, distance_km ASC;
```

Implement `findDonorsWithExpansion(requestId)` — the auto-expansion logic using the `RADIUS_STEPS = [15, 25, 40, 60]` array from TRD Section 10. Returns the donor list and the final radius used.

Write integration tests against the seeded database: verify that donors outside the radius are excluded, donors past the 90-day lock are excluded, and donors are ordered by trust score.

### Step 2.4 — Backend: Blood Request Routes

Create `backend/src/routes/hospital.routes.ts` and implement:

**`POST /v1/hospital/requests`**
- `requireAuth` + `requireRole('hospital')` + hospital must be `is_verified`
- Validate body with Zod: `blood_group`, `units_required`, `priority`, `notes?`
- Calculate `expires_at` based on priority (Critical: +2hr, Urgent: +6hr, Scheduled: +24hr)
- `INSERT blood_requests` with `status = 'pending'`
- Call `findDonorsWithExpansion()` to get the matched donor list
- For now: insert `donation_responses` rows for each matched donor with `status = 'notified'`, increment `donors.total_responses`, update `blood_requests.donors_notified` and `status = 'dispatched'`
- FCM notifications and BullMQ jobs are **not yet wired** — that is Phase 3. Log a `TODO: dispatch FCM` placeholder
- Insert `audit_logs` entry: `request.created`
- Return `201` with the created request

**`GET /v1/hospital/requests`** — paginated list of this hospital's requests (all statuses)

**`GET /v1/hospital/requests/:id`** — single request with all `donation_responses` joined

**`PATCH /v1/hospital/requests/:id/cancel`** — sets `status = 'cancelled'`, updates all `donation_responses` to `cancelled`; inserts audit log

Write integration tests for all four endpoints.

### Step 2.5 — Backend: Donor Eligibility Read Route

**`GET /v1/donor/eligibility`** — calls `checkDonorEligibility()` with the requesting donor's profile; returns `EligibilityStatus`

### Step 2.6 — Frontend: Blood Request Creation (Hospital)

Build `/hospital/requests/new`:

- Form with fields: blood group dropdown, units required (1–20), priority selector with inline descriptions, notes textarea
- Priority selector must show the definition of each priority level inline (per AppFlow Section 5.4)
- Submit → `POST /v1/hospital/requests`
- Success: navigate to Live Request Tracker (shell for now; fully built in Phase 3)
- Failure states: validation errors inline, "no donors found" message

### Step 2.7 — Frontend: Hospital Dashboard (Partial)

Partially populate the hospital dashboard shell from Phase 1:

- Active requests count and card list — each card shows blood group, priority badge, units needed, donors notified count, donors accepted count, and a "View Tracker" link
- Fetch from `GET /v1/hospital/requests` filtered to active statuses
- "Create New Request" primary CTA button routing to `/hospital/requests/new`
- Inventory snapshot panel (placeholder — shows all 8 blood groups as `0 units` for now; fully wired in Phase 6)

### Step 2.8 — Frontend: Donor Eligibility Status (Partial Dashboard)

In the donor dashboard shell, add the **Eligibility Status** component:
- Calls `GET /v1/donor/eligibility`
- Shows `✅ Eligible to donate` or `🔒 Next eligible date: [Date] (X days remaining)`
- This is the most important piece of information on the donor dashboard — build and verify it now

**Phase 2 is complete when:** A hospital can create a blood request, the eligibility + PostGIS query correctly identifies and ranks matching donors, `donation_responses` rows are created, and the hospital dashboard shows the active request with donor count.

---

## 6. Phase 3 — Real-Time Pipeline & Notifications

This phase wires the full real-time infrastructure: FCM push notifications, the BullMQ 10-minute retry queue, Socket.IO for live hospital updates, and Supabase Realtime for database-driven state changes. After this phase, the complete end-to-end emergency flow works.

### Step 3.1 — Backend: FCM Notification Service

Complete `backend/src/services/notification/fcm.service.ts`:

- Implement `sendPushNotification(token: string, payload: FCMPayload)` using `firebase.messaging().send()`
- Implement the full `FCMPayload` interface from TRD Section 9, including `android.priority: 'high'` and `webpush.headers.Urgency: 'high'` fields
- Handle FCM errors gracefully: expired/invalid tokens should be caught and logged (not thrown); mark the token as stale in `donors.fcm_token = null` for permanently invalid tokens
- Write unit tests: valid send, invalid token handling, network failure retry

### Step 3.2 — Backend: BullMQ Notification Worker

Complete `backend/src/workers/notification.worker.ts`:

- Implement the `retry-check` job processor:
  1. Fetch `donation_responses` row by `responseId`
  2. If `status = 'notified'`: update to `no_response`, call `findEligibleDonors()` for next donor, dispatch FCM to next donor, insert new `donation_responses` row, add new BullMQ delayed job, emit `notification:retry` Socket.IO event to hospital room, insert `audit_logs` entry
  3. If `status != 'notified'`: no-op — donor already responded
- Configure queue with `attempts: 3` and exponential backoff from TRD Section 9
- Write integration tests: job fires and updates status when no response; job is a no-op when donor already responded

### Step 3.3 — Backend: Wire FCM + BullMQ into Request Creation

Return to `POST /v1/hospital/requests` from Phase 2 and replace the `TODO` placeholder:

- After inserting `donation_responses` rows, call `fcmService.sendPushNotification()` for each matched donor
- Apply priority-based dispatch strategy from TRD Section 9: Critical → all at once; Urgent → top 5; Scheduled → top 3
- After FCM dispatch, call `notificationQueue.add('retry-check', payload, { delay: 10 * 60 * 1000 })` for each notified donor
- Store `bull_job_id` back into `donation_responses.bull_job_id`
- Apply notification fatigue cap: no donor receives more than 3 Critical notifications in 24 hours — check `donation_responses` count before dispatch

### Step 3.4 — Backend: Socket.IO Server

In `backend/src/index.ts`, attach Socket.IO to the Express HTTP server:

- On `connection`: read `role` and `entityId` from `socket.handshake.auth`; join the appropriate room (`hospital:{id}`, `donor:{id}`)
- Define all server-side emit functions that other services can call:
  - `emitToHospital(hospitalId, event, payload)` → `io.to(`hospital:${hospitalId}`).emit(...)`
  - `emitToDonor(donorId, event, payload)` → `io.to(`donor:${donorId}`).emit(...)`
- The events emitted in this phase are: `notification:dispatched`, `notification:retry`, `request:radius_expanded`, `donor:inbound`

### Step 3.5 — Backend: Donor Response Routes

Create the donor-side request interaction routes:

**`GET /v1/donor/requests/active`** — returns the active request the donor has accepted (if any)

**`PATCH /v1/donor/requests/:responseId/respond`**
- Body: `{ action: 'accept' | 'decline' }`
- **Accept path:**
  - Verify the response belongs to this donor and is in `notified` status
  - `UPDATE donation_responses SET status='accepted', responded_at=now()`
  - `UPDATE blood_requests SET donors_accepted++`
  - `UPDATE donors SET total_accepted++`
  - Cancel BullMQ job: `(await queue.getJob(bull_job_id))?.remove()`
  - `emitToHospital()` with `donor:inbound` event
  - Insert `audit_logs`: `donation.accepted`
  - Return the hospital's address, distance, Google Maps URL, and contact phone
- **Decline path:**
  - `UPDATE donation_responses SET status='declined', responded_at=now()`
  - Insert `audit_logs`: `donation.declined`
  - Return `200`

**`PATCH /v1/donor/requests/:responseId/status`**
- Body: `{ status: 'en_route' | 'arrived' }`
- Updates `donation_responses` and emits to hospital via Socket.IO

Write integration tests for both accept and decline paths, including BullMQ job cancellation verification.

### Step 3.6 — Backend: Hospital Mark Actions

Add to `hospital.routes.ts`:

**`PATCH /v1/hospital/requests/:id/donors/:responseId/no-show`**
- `UPDATE donation_responses SET status='no_show'`
- Trust score is recalculated in Phase 4 — for now just update status and insert audit log
- Insert `audit_logs`: `donation.no_show`

**`PATCH /v1/hospital/requests/:id/cancel`** (enhance from Phase 2)
- Update all `donation_responses` in `accepted` or `notified` status to `cancelled`
- Send FCM cancellation push to affected donors
- Cancel all pending BullMQ jobs for this request (fetch `bull_job_id` from all `notified` responses)
- Emit Socket.IO event to hospital room

### Step 3.7 — Backend: Supabase Realtime Subscriptions (Configuration)

Supabase Realtime is configured via the database, not application code. Enable Realtime publication for the tables that drive live UI updates:

```sql
-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE donation_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE blood_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE blood_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE hospital_surplus;
```

This is a one-time SQL migration: `20260601000014_realtime_publication.sql`.

### Step 3.8 — Frontend: Supabase Realtime Hook

Create `frontend/src/hooks/useRealtimeSubscription.ts`:
- Abstracts `supabase.channel().on('postgres_changes', ...).subscribe()`
- On change event: calls `queryClient.invalidateQueries([...])` for the affected query key
- Returns `{ status: 'subscribed' | 'error' }`

This hook will be used in the Hospital Live Tracker and the Donor Alert screens.

### Step 3.9 — Frontend: Donor Incoming Request Alert Screen

Build `/donor/request/:responseId` — the most time-critical screen in the app:

- Fetch response data from `GET /v1/donor/requests/active` on mount
- Display: blood group, hospital name, distance, priority level (with colour coding), units needed
- **Accept button**: calls `PATCH /respond { action: 'accept' }` → navigate to Request Detail
- **Decline button**: confirmation dialog → `PATCH /respond { action: 'decline' }` → navigate to dashboard
- **10-minute countdown timer**: shows time remaining; on expiry shows "This request has been assigned to another donor"
- Subscribe to donor's Socket.IO room for cancellation events

### Step 3.10 — Frontend: Donor Request Detail Screen (Post-Accept)

Build `/donor/request/:responseId/detail`:

- Shows hospital name, full address, Google Maps deep-link, contact phone, blood group, priority
- "I am on my way" button → `PATCH /status { status: 'en_route' }` → button changes to "I have arrived"
- "I have arrived" button → `PATCH /status { status: 'arrived' }` → both buttons disabled, message: "Waiting for hospital to confirm..."
- After hospital marks donation complete (Phase 4 event), screen shows "Thank you for donating! Certificate ready."

### Step 3.11 — Frontend: Hospital Live Request Tracker

Build `/hospital/requests/:id/live`:

- Subscribe to `donation_responses` table changes via `useRealtimeSubscription` for this `request_id`
- Subscribe to Socket.IO events for this hospital room: `notification:retry`, `donor:inbound`, `request:radius_expanded`
- Render the donor pipeline as defined in AppFlow Section 5.5: each donor row with name, current status, timeline timestamps, and action buttons
- **"Mark Arrived"** → `PATCH /hospital/requests/:id/donors/:responseId/complete` (wired in Phase 4)
- **"Mark No-Show"** → `PATCH /no-show` → confirmation dialog → triggers next donor notification via the backend
- **"Cancel Request"** → `PATCH /cancel` → confirmation dialog
- Units fulfilled counter updates in real time

### Step 3.12 — Frontend: Active Alert Banner on Donor Dashboard

In the donor dashboard, add the red pulsing **Active Alert Banner**:
- Polls `GET /v1/donor/requests/active` or subscribes to donor's Socket.IO room
- If an active pending alert exists: show pulsing red banner; tap routes to `/donor/request/:responseId`
- If no active alert: banner is hidden

### Step 3.13 — Frontend: FCM Token Registration in PWA

Implement the push notification permission and FCM token registration flow from TRD Section 16:

```typescript
async function requestPushPermission() {
  // 1. Request Notification.requestPermission()
  // 2. If granted: navigator.serviceWorker.ready → pushManager.subscribe()
  // 3. Send subscription to PATCH /donor/fcm-token
}
```

This is called during donor registration (Step 1.7 already has a placeholder for it) — now connect it to the real backend route.

**Phase 3 is complete when:** The full end-to-end emergency flow works: hospital creates a request → eligible donors receive FCM notifications → donor accepts → hospital live tracker updates in real time → 10-minute retry fires if donor does not respond → hospital can mark no-show.

---

## 7. Phase 4 — Post-Donation Automation

This phase implements what happens when a hospital clicks "Mark Donation Complete" — the atomic chain of database writes, trust score recalculation, and certificate generation.

### Step 4.1 — Backend: Trust Score Calculator

Create `backend/src/services/trust-score/calculator.ts`:

Implement `computeTrustScore(donor: { total_donations, total_responses, total_accepted })` exactly as specified in TRD Section 12:

```
trust_score = (0.30 × donations_component)
            + (0.35 × response_rate_component)
            + (0.35 × reliability_rate_component)
```

With edge-case defaults: `total_responses = 0` → response rate = 100; `total_accepted = 0` → reliability = 100.

Write **100% test coverage** — include all edge cases: new donor (all zeros), donor with only no-shows, donor with perfect record, values that would exceed 100 or go below 0.

### Step 4.2 — Backend: Post-Donation Service

Create `backend/src/services/post-donation/post-donation.service.ts`:

Implement `runPostDonationHook(responseId)` — the full 10-step sequence from TRD Section 13. Steps 1–6 run inside a **single database transaction**. Steps 7–10 run outside the transaction (non-blocking):

1. `UPDATE donation_responses SET status='donated', donated_at=now()`
2. `UPDATE donors SET last_donated_at=now(), total_donations++`
3. `INSERT donation_history` (immutable; `UNIQUE(donor_id, request_id)` makes it idempotent)
4. Recompute trust score via `computeTrustScore()` → `UPDATE donors SET trust_score=newScore`
5. `UPDATE blood_requests SET units_fulfilled++`
6. If `units_fulfilled >= units_required`: `UPDATE blood_requests SET status='completed', completed_at=now()`
7. `badgeService.checkAndAward(donorId)` — outside transaction, can retry independently
8. `certificateService.generate()` — async, non-blocking, failures are logged but do not affect the response
9. FCM thank-you notification to donor: "Thank you! Next eligible: [date]"
10. `INSERT audit_logs`: `donation.completed`

Enforce idempotency: if `donation_history` insert fails with `UNIQUE` violation, return `409 Conflict` immediately without re-running any other step.

Write integration tests: verify all 6 transactional writes happen atomically; verify trust score is correctly updated; verify `409` on duplicate call.

### Step 4.3 — Backend: Badge Service

Create `backend/src/services/trust-score/badge.service.ts`:

Implement `checkAndAward(donorId)`:
- Fetches the donor's current `total_donations`, `trust_score`, and existing badges
- Evaluates each badge trigger condition from BackendSchema Section 4.8
- For streak badges: queries `donation_responses` for consecutive `donated` statuses without a `no_show` in between
- For each qualifying badge not yet awarded: `INSERT donor_badges` — the `UNIQUE(donor_id, badge_type)` constraint makes this idempotent; ignore duplicate key errors
- Write unit tests for every badge type

### Step 4.4 — Backend: Certificate Generation Service

Create `backend/src/services/certificate/certificate.service.ts`:

Implement `generate(donorId, historyId)` using `pdf-lib` exactly as specified in TRD Section 14:
- Fetches donor and history data
- Creates A4 PDF with: RedAid header, donor name, donation date, hospital name, blood group, unique certificate ID (`BL-{historyId.slice(0,8).toUpperCase()}`)
- Uploads PDF bytes to Supabase Storage: `certificates/{donorId}/{historyId}.pdf`
- Generates a signed URL with 7-day TTL
- `UPDATE donation_history SET certificate_url=..., certificate_key=...`

Implement `regenerateUrl(historyId)` — fetches `certificate_key` from `donation_history`, calls `createSignedUrl` again, returns fresh URL. This is used by `GET /v1/donor/history/:id/certificate`.

Write tests: verify PDF is generated, uploaded, and URL is stored; verify `regenerateUrl` works independently of `generate`.

### Step 4.5 — Backend: Complete Donation Route

Wire everything together in `hospital.routes.ts`:

**`PATCH /v1/hospital/requests/:id/donors/:responseId/complete`**
- `requireAuth` + `requireRole('hospital')` + verify the `responseId` belongs to this hospital's request
- Call `runPostDonationHook(responseId)`
- Return `200` with the updated donation history entry

### Step 4.6 — Backend: Certificate URL Route

**`GET /v1/donor/history/:id/certificate`**
- `requireAuth` + `requireRole('donor')`
- Fetch `donation_history` row — verify it belongs to this donor
- If `certificate_key` exists but `certificate_url` is expired: call `regenerateUrl(historyId)`, return fresh URL
- If `certificate_key` is null: return `404` — certificate not yet generated

### Step 4.7 — Frontend: Mark Donation Complete (Hospital)

In the Live Request Tracker (built in Phase 3), wire the "Mark Donation Complete" button to `PATCH /complete`:
- Show confirmation dialog: "Confirm that [Donor Name] has donated blood?"
- On confirm: call the endpoint, show success feedback, update units fulfilled counter
- After success: show "Rate this Donor" prompt (donor feedback screen — built in Phase 6)

### Step 4.8 — Frontend: Post-Donation Donor Screen

Update `/donor/request/:responseId/detail` to handle the completion event:
- Subscribe to real-time updates on this `donation_responses` row
- When `status` changes to `donated`: show full-screen success state — "Thank you for donating! Your certificate is ready."
- CTA: "View Certificate" → `/donor/history/:id/certificate`

**Phase 4 is complete when:** Marking a donation complete atomically updates all 6 tables in the transaction, trust score is correctly recalculated, a badge is awarded if applicable, a certificate PDF is generated and stored, and the donor receives a thank-you push notification.

---

## 8. Phase 5 — Donor Engagement Layer

This phase builds the donor-facing features that sustain long-term engagement: donation history, certificates, badges, gamification, and availability controls. These have no cross-dependencies with Phases 6 or 7.

### Step 5.1 — Backend: Donation History Routes

**`GET /v1/donor/history`** — paginated list of `donation_history` joined with `blood_requests` and `hospitals`; ordered by `donated_at DESC`

**`GET /v1/donor/history/:id`** — single entry with full detail: hospital name, blood group, units, request priority, trust score at time of donation (if stored in audit log metadata)

### Step 5.2 — Backend: Badge & Profile Routes

**`GET /v1/donor/badges`** — returns `donor_badges` rows for this donor, plus the donor's current `total_donations` and `trust_score` for progress display

**`PATCH /v1/donor/profile`** — allows updating `full_name` and `city` (not blood group or date of birth)

**`PATCH /v1/donor/availability`** — validates and updates `availability` and `snooze_until`; inserts `audit_logs`: `donor.availability_changed`

**`PATCH /v1/donor/fcm-token`** — updates `donors.fcm_token`

### Step 5.3 — Frontend: Donation History Screen

Build `/donor/history`:
- Reverse-chronological timeline of all donation history entries
- Each entry card: date, hospital name, blood group pill, status badge (colour-coded as per AppFlow Section 4.7), "View Certificate" button on completed entries
- Paginate with "Load more" at the bottom
- Empty state: "No donations yet. Your history will appear here."
- Tapping an entry navigates to `/donor/history/:id`

### Step 5.4 — Frontend: Certificate Viewer

Build `/donor/history/:id/certificate`:
- Fetches from `GET /v1/donor/history/:id/certificate`
- Shows a rendered preview (embed PDF in iframe or show a styled HTML summary as fallback)
- "Download" button: triggers download from the signed URL
- "Share" button: native mobile share sheet with the PDF URL

### Step 5.5 — Frontend: Badges & Gamification Screen

Build `/donor/badges`:
- **Earned Badges** section: grid of awarded badges with names and award dates; tapping opens a full-screen modal with badge description
- **Points Balance** section: current total and a log of how points were earned (tie to donation history events)
- **Locked Badges** section: greyed-out grid showing progress — e.g., "2 / 5 donations to unlock Lifesaver"
- Progress bars for streaks and donation counts

### Step 5.6 — Frontend: Availability Settings Screen

Build `/donor/availability`:
- Three segmented options: Active / Snoozed / Unavailable
- When "Snoozed" is selected: show duration picker (1h / 4h / 8h / 24h / Custom datetime)
- "Resume Active" button appears when currently snoozed
- Descriptive text for each state as per AppFlow Section 4.6
- Submits to `PATCH /v1/donor/availability`
- Warning: "You won't receive emergency alerts while snoozed"

### Step 5.7 — Frontend: Complete Donor Dashboard

Replace the shell components with fully built ones:

- **Availability Toggle**: quick-toggle from dashboard (not full settings — just Active/Snoozed toggle)
- **Eligibility Status**: already built in Phase 2 — verify it's correct
- **Trust Score Card**: score display with breakdown (Donations / Response Rate / Reliability Rate) — read-only
- **Quick Stats**: Total Donations, Current Streak, Points Balance
- **Latest Badge**: most recently awarded badge card with date
- **Active Alert Banner**: already built in Phase 3 — verify it's correct

### Step 5.8 — Frontend: Donor Profile Screen

Build `/donor/profile`:
- Read-only view of: name, blood group, date of birth, city, total donation stats
- Edit mode for: name, city (but not blood group or date of birth)
- "Request Account Deletion" link (triggers DPDPA anonymisation endpoint — implement the backend endpoint `DELETE /v1/donor/account` that runs the anonymisation SQL from BackendSchema Section 11)

**Phase 5 is complete when:** A donor can view their complete donation history, download their certificates, see all earned and locked badges with progress, update their availability with snooze duration, and their full dashboard is populated with live data.

---

## 9. Phase 6 — Hospital Operations Tools

This phase builds hospital-specific operational features: blood inventory management and cross-hospital surplus coordination. These are self-contained and have no dependencies on Phase 5 or Phase 7.

### Step 6.1 — Backend: Blood Inventory Routes

**`GET /v1/hospital/inventory`** — returns all 8 `blood_inventory` rows for this hospital

**`PATCH /v1/hospital/inventory/:bloodGroup`** — validates and updates `units_available`; updates `updated_at`; inserts `audit_logs` entry

### Step 6.2 — Backend: Cross-Hospital Surplus Routes

**`POST /v1/hospital/surplus`** — validates body (blood group, units, expiry duration); inserts `hospital_surplus`; Supabase Realtime will broadcast the insert to nearby hospital subscribers

**`GET /v1/hospital/surplus`** — returns all active, unclaimed surplus listings from hospitals within 25km (PostGIS radius query on `hospitals.location`)

**`DELETE /v1/hospital/surplus/:id`** — hospital removes their own surplus listing

**`PATCH /v1/hospital/surplus/:id/claim`** — atomically sets `is_claimed = true`, `claimed_by`, `claimed_at` using a transaction with a `SELECT FOR UPDATE` to prevent double-claiming

### Step 6.3 — Backend: Donor Feedback Route

**`POST /v1/hospital/requests/:id/donors/:responseId/rating`** — validates `hospital_rating` (1–5) and optional `hospital_feedback` (max 300 chars); updates `donation_responses`; inserts `audit_logs`

### Step 6.4 — Frontend: Blood Inventory Manager

Build `/hospital/inventory`:
- Grid of 8 blood group cells showing current units, low-stock indicator (red when `units_available <= low_stock_threshold`)
- Last updated timestamp per cell
- Tapping a cell opens an inline edit input — submit calls `PATCH /hospital/inventory/:bloodGroup`
- Subscribe to `blood_inventory` table changes via `useRealtimeSubscription` — inventory updates from any source reflect immediately

### Step 6.5 — Frontend: Inventory Snapshot on Hospital Dashboard

Replace the placeholder inventory snapshot panel on `/hospital/dashboard` (added in Phase 2) with the live data from `GET /v1/hospital/inventory`. Show low-stock amber banners.

### Step 6.6 — Frontend: Cross-Hospital Surplus Screen

Build `/hospital/surplus`:
- **Publish Surplus** panel: blood group dropdown, units input, expiry duration select, "Publish" button
- **Incoming Surplus** panel: list of surplus listings from nearby hospitals — hospital name, blood group, units, distance, time remaining before expiry, "Claim" button
- Subscribe to `hospital_surplus` table inserts via `useRealtimeSubscription` — new surplus listings appear without refresh
- Claim flow: confirm dialog → `PATCH /claim` → show success state

### Step 6.7 — Frontend: Donor Feedback Screen

Build `/hospital/requests/:id/feedback/:responseId`:
- Star rating widget (1–5, tappable stars)
- Optional comment textarea
- "Submit" and "Skip" buttons
- Triggered automatically as a prompt after "Mark Donation Complete" in the Live Tracker (Phase 4.7 already has this prompt — now connect it to the real screen)

**Phase 6 is complete when:** Hospital staff can view and update real-time blood inventory, publish and claim surplus between hospitals, and submit post-donation donor feedback.

---

## 10. Phase 7 — Admin Panel

This phase builds the full admin control surface: user management, fraud detection, system analytics, broadcast notifications, and audit logs. This phase has no dependencies on Phases 5 or 6.

### Step 7.1 — Backend: Admin Donor Management Routes

All admin routes require `requireAuth` + `requireRole('admin')`. All reads use the service role key to bypass RLS.

**`GET /v1/admin/donors`** — paginated, searchable by name/phone/blood group/city; filterable by status

**`GET /v1/admin/donors/:id`** — full donor profile, complete `donation_history`, all `donation_responses`, health declaration, badge list

**`PATCH /v1/admin/donors/:id/verify`** — sets `is_verified = true`; inserts `audit_logs`

**`PATCH /v1/admin/donors/:id/suspend`** — sets `is_active = false` (NOTE: use `availability = 'unavailable'` and `is_verified = false` as the V1 suspension mechanism); inserts `audit_logs`: `donor.suspended`

**`PATCH /v1/admin/donors/:id/blacklist`** — sets `is_blacklisted = true`; inserts `audit_logs`: `donor.blacklisted`

**`PATCH /v1/admin/donors/:id/unsuspend`** / **`unblacklist`** — reversal routes with mandatory `reason` in request body

### Step 7.2 — Backend: Admin Hospital Management Routes

**`GET /v1/admin/hospitals`** — paginated, searchable, filterable by verification status

**`GET /v1/admin/hospitals/:id`** — full profile + all request history + donor ratings given

**`PATCH /v1/admin/hospitals/:id/verify`** — sets `is_verified = true`; sends FCM/email notification to hospital; inserts `audit_logs`: `hospital.verified`

**`PATCH /v1/admin/hospitals/:id/suspend`** / **`blacklist`** / **`unsuspend`** / **`unblacklist`** — same pattern as donors

### Step 7.3 — Backend: Fraud Detection — Nightly Cron

Implement the nightly fraud detection cron using `node-cron` as defined in TRD Section 17:

```typescript
// Runs daily at 02:00 IST (20:30 UTC)
cron.schedule('30 20 * * *', async () => {
  // Query: donors with no_show_rate > 30% AND total_accepted >= 5
  // For each flagged donor: INSERT audit_logs { action: 'fraud.no_show_flagged', ... }
});
```

### Step 7.4 — Backend: Admin Fraud Monitor Route

**`GET /v1/admin/fraud/no-shows`** — returns donors flagged by the cron (reads from `audit_logs` where `action = 'fraud.no_show_flagged'`, joined with `donors`)

### Step 7.5 — Backend: Admin Analytics Routes

**`GET /v1/admin/analytics/overview`** — runs the KPI aggregation queries: total requests, total donations, avg response time by priority, fulfillment rate, acceptance rate, within a date range

**`GET /v1/admin/analytics/demand`** — runs the demand zone query from TRD Section 17: city × blood group × request count × fulfillment for the last 30 days

### Step 7.6 — Backend: Admin Broadcast & Audit Routes

**`POST /v1/admin/broadcast`** — fetches all FCM tokens for the target audience (all donors, all hospitals, specific city, specific blood group); calls `firebase.messaging().sendEachForMulticast()`; inserts `audit_logs`: `admin.broadcast_sent`

**`GET /v1/admin/audit-logs`** — paginated audit log, filterable by actor, action type, and date range; uses service role to bypass RLS

### Step 7.7 — Frontend: Admin Dashboard

Build `/admin/dashboard`:
- Platform KPIs: Active Requests, Donors Active, Verified Hospitals, Donations Today — from `GET /v1/admin/analytics/overview`
- Pending Verifications counter with "Review Now" link — from `GET /v1/admin/hospitals?filter=pending`
- Fraud Flags in last 24h with "Review" link — from `GET /v1/admin/fraud/no-shows`
- Recent Activity Feed: latest audit log entries
- System Health row: notification delivery rate, avg critical response time, crash rate

### Step 7.8 — Frontend: Donor Management

Build `/admin/donors` and `/admin/donors/:id`:
- List: searchable/filterable table with pagination
- Detail: full profile view with trust score breakdown, donation history table, all `donation_responses` (accepted, declined, no-show counts), health declaration (read-only), badge list
- Action buttons: Verify, Suspend, Unsuspend, Blacklist, Unblacklist — each with confirmation dialog + reason input

### Step 7.9 — Frontend: Hospital Management

Build `/admin/hospitals` and `/admin/hospitals/:id`:
- List: searchable/filterable table; "Pending Verification" filter prominent
- Detail: hospital profile, all requests with outcomes, donor ratings summary
- Action buttons: Verify, Suspend, Unsuspend, Blacklist, Unblacklist
- Verification flow: "Verify [Hospital Name] and grant platform access?" → confirm → hospital notified

### Step 7.10 — Frontend: Fraud Monitor

Build `/admin/fraud`:
- **No-Show Flags**: table of flagged donors with no-show rate and total acceptances — actions: Review Profile, Issue Warning, Blacklist
- **Suspicious Activity Feed**: aggregated audit log entries for unusual patterns
- **Blacklist Queue**: all currently blacklisted donors and hospitals with reason, date, and blacklisting admin

### Step 7.11 — Frontend: Analytics Dashboard

Build `/admin/analytics`:
- Date range selector (7 / 30 / 90 days / custom)
- Section 1 — Platform Overview: KPI cards with trend indicators
- Section 2 — Demand Zones: table of city × blood group × request count
- Section 3 — Blood Group Demand: bar chart (use Recharts) of requests per blood group with fulfillment rate overlay
- Section 4 — Peak Time Mapping: hour-of-day heatmap (custom SVG or Recharts) of Critical request frequency
- Section 5 — Donor Activity: registrations over time line chart, Active/Snoozed/Unavailable split

### Step 7.12 — Frontend: Notifications Manager

Build `/admin/notifications`:
- Target audience selector: All Donors / All Hospitals / All Users / By City / By Blood Group
- Title input (max 60 chars with counter) and message textarea (max 200 chars)
- Live device preview mockup showing how the notification will appear
- Broadcast history table with delivery count

### Step 7.13 — Frontend: Audit Logs

Build `/admin/audit`:
- Filterable table: by actor role, action type, date range
- Each row: timestamp, actor, role, action, entity type, entity ID, IP address, metadata summary
- "Export CSV" button (client-side generation from the paginated result set)

**Phase 7 is complete when:** Admins can verify hospitals, manage donor and hospital statuses, review fraud flags from the nightly cron, view platform analytics, send broadcast notifications, and download the full audit log.

---

## 11. Phase 8 — Security, Polish & Pre-Launch

This phase hardens the system, completes the PWA configuration, performs QA, and prepares for the first real deployment.

### Step 8.1 — Security Hardening

Apply all security measures from TRD Section 18:

- Confirm `helmet` is configured with all headers: `HSTS`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`
- Apply all three rate limiters: general API (`100 req / 15min`), OTP sender (`5 req / hr`), notification creation (`10 req / min per hospital`)
- Audit every API route: confirm `requireAuth` and `requireRole` are applied; no route is accidentally public
- Audit every API response: confirm no PII is leaked — donor phone numbers must never appear in hospital-facing responses; donor full name visible to hospital only after accept
- Run a manual SQL audit: confirm RLS is enabled on all 9 tables and all policies are in place
- Verify `httpOnly; Secure; SameSite=Strict` cookie is set correctly for the refresh token
- Confirm no `any` TypeScript types remain without justification comments

### Step 8.2 — Input Validation Audit

Audit every API route's Zod schema:
- Every `POST` and `PATCH` route has a schema
- Schemas reject unexpected fields (use `.strict()` on Zod objects)
- Error responses from Zod validation are structured correctly: `{ error: { code: 'VALIDATION_ERROR', details: ... } }`

### Step 8.3 — Full PWA Configuration

Complete the PWA manifest and service worker configuration from TRD Section 16:

- Finalise `public/manifest.json` with all icons (192px and 512px maskable)
- Configure `vite-plugin-pwa` workbox caching strategies:
  - `StaleWhileRevalidate` for donor profile
  - `NetworkFirst` for active requests
  - `CacheFirst` for static assets
- Implement `offline.html` fallback page shown when the app is fully offline
- Test "Add to Home Screen" on Android Chrome — verify it installs as a standalone app
- Verify push notifications are received when the app is backgrounded

### Step 8.4 — Error Handling & Monitoring

- Implement the global Express error handler from TRD Section 20: catches `ZodError`, `AppError`, and unknown errors; never leaks stack traces to the client
- Implement structured logging with `pino`: all requests logged with `requestId`, method, URL, status, duration, and actor ID
- Initialise Sentry in both the Express backend and React frontend
  - Backend: `Sentry.init()` with `tracesSampleRate: 0.1`
  - Frontend: `Sentry.init()` with web vitals capture and session replay at 10% sample rate, PII scrubbing enabled
- Verify: trigger an intentional 500 error and confirm it appears in Sentry without exposing internals

### Step 8.5 — Test Coverage Audit

Run the full test suite and verify coverage thresholds from TRD Section 21:

- Eligibility engine: **100% line coverage** — non-negotiable
- Trust score calculator: **100% line coverage** — non-negotiable
- Business logic services overall: **≥ 80% line coverage**
- Every API route: happy path + at least one error path tested
- Post-donation hook: all 6 transactional steps verified; idempotency verified
- BullMQ notification worker: job fires and no-ops correctly

Fill any gaps found. Do not proceed to deployment until all coverage thresholds are met.

### Step 8.6 — Cross-Browser & Device QA

Test on the following combinations:
- Android Chrome (primary target — FCM push works here)
- iOS Safari (push notification support limited — verify graceful degradation)
- Desktop Chrome (admin panel primary target)
- Slow network simulation (Chrome DevTools 3G preset) — verify skeleton screens appear, no UI freezes

Verify the offline behaviour table from TRD Section 16: donor dashboard shows cached profile with stale banner; blood request creation shows error if submitted offline.

### Step 8.7 — Performance Benchmarks

Run `EXPLAIN ANALYZE` on all critical queries:
- PostGIS eligibility + matching query: must be **< 100ms**
- Trust score update (single donor): **< 50ms**
- Hospital live request tracker query: **< 200ms**
- Admin analytics overview query: **< 500ms**

If any query exceeds its target: add or refine indexes before deploying.

Run Lighthouse CI against the frontend build:
- First Contentful Paint: **< 2s on simulated 4G**
- Lighthouse PWA score: **≥ 90**

### Step 8.8 — Deployment Setup

**Backend → Render:**
- Create a new Web Service on Render pointing to `backend/` with `pnpm install && pnpm build && pnpm start`
- Set all production environment variables from TRD Section 23
- Enable auto-deploy on push to `main`
- Verify: `GET https://api.redaid.in/health` returns `200`

**Frontend → Vercel:**
- Create a new project on Vercel pointing to `frontend/` with `pnpm build` and output directory `dist`
- Set all production environment variables
- Enable auto-deploy on push to `main`
- Set up the custom domain: `app.redaid.in`
- Verify: app loads, auth flow works end-to-end in production

**Database:**
- Run all migrations against the production Supabase project: `supabase db push --linked`
- Confirm all indexes are present
- Create the admin account manually in the production Supabase dashboard

### Step 8.9 — Smoke Testing in Production

After deployment, run a full end-to-end smoke test in production with real phones:
1. Register a donor account — verify OTP, profile, dashboard
2. Register a hospital account — verify pending screen
3. Verify the hospital via admin panel — confirm hospital receives notification
4. Hospital creates a Critical blood request — verify donor receives FCM push notification
5. Donor accepts — verify hospital live tracker updates in real time
6. Hospital marks donation complete — verify trust score updated, certificate generated, thank-you push sent
7. Admin logs in — verify dashboard KPIs reflect the test data

**Phase 8 is complete when:** All smoke tests pass in production, Sentry is receiving events, Lighthouse PWA score is ≥ 90, all coverage thresholds are met, and no critical or high-severity bugs are open.

---

## 12. Dependency Map

The table below shows which phases must be complete before another can begin.

| Phase | Depends On | Can Run in Parallel With |
|---|---|---|
| Phase 0 — Scaffolding | Nothing | — |
| Phase 1 — Auth & Registration | Phase 0 | — |
| Phase 2 — Core Request Engine | Phase 1 | — |
| Phase 3 — Real-Time Pipeline | Phase 2 | — |
| Phase 4 — Post-Donation Automation | Phase 3 | — |
| Phase 5 — Donor Engagement | Phase 4 | Phases 6, 7 |
| Phase 6 — Hospital Operations | Phase 4 | Phases 5, 7 |
| Phase 7 — Admin Panel | Phase 4 | Phases 5, 6 |
| Phase 8 — Security & Pre-Launch | Phases 5, 6, 7 (all complete) | — |

The critical path is: **0 → 1 → 2 → 3 → 4 → 8**. Phases 5, 6, and 7 sit in parallel and all must be done before Phase 8.

---

## 13. Definition of Done — Per Phase

A phase is **Done** only when every item in its checklist is met.

### Phase 0
- [ ] Repo exists with `frontend/` and `backend/` folder structure
- [ ] CI pipeline passes on a clean push (typecheck, lint, test, build)
- [ ] All 9 database tables exist in Supabase with all FKs, indexes, and RLS enabled
- [ ] `GET /health` returns `200` in development
- [ ] BullMQ queue initialises without error on server boot
- [ ] Firebase Admin SDK initialises without error

### Phase 1
- [ ] Donor can register with valid data; rejected with correct error if under 18 or over 65
- [ ] OTP rate limiting works: 6th send attempt is rejected
- [ ] Donor JWT has `role: 'donor'` and `entity_id`
- [ ] Hospital can register; sees `/hospital/pending` immediately
- [ ] Hospital cannot access `/hospital/dashboard` before verification
- [ ] Admin can log in and reach `/admin/dashboard`
- [ ] All auth middleware unit tests pass with 100% path coverage

### Phase 2
- [ ] Blood group compatibility matrix covers all 64 pairings — unit tested
- [ ] Eligibility engine passes all boundary condition tests with 100% coverage
- [ ] PostGIS matching query returns correct donors ordered by trust score
- [ ] Radius auto-expansion works: query with no donors at 15km expands correctly
- [ ] Hospital can create a request and `donation_responses` rows are inserted
- [ ] Donor eligibility status shows correctly on donor dashboard

### Phase 3
- [ ] FCM notification is received on a real Android device when a request is created
- [ ] BullMQ job fires after 10 minutes when donor does not respond
- [ ] BullMQ job is cancelled when donor accepts within 10 minutes
- [ ] Donor accept/decline updates are reflected on the hospital live tracker in real time (< 1 second)
- [ ] Hospital live tracker updates without page refresh via Supabase Realtime
- [ ] `no_response` donors are correctly moved to next eligible donor in queue
- [ ] Notification fatigue cap (3 Critical / 24hr) is enforced

### Phase 4
- [ ] Trust score formula produces correct values for all test cases with 100% coverage
- [ ] All 6 transactional DB writes in `runPostDonationHook` are atomic — if step 4 fails, steps 1–3 are rolled back
- [ ] Duplicate completion call returns `409 Conflict` without re-running any steps
- [ ] `donation_history` row is immutable — UPDATE attempt is rejected by RLS
- [ ] Certificate PDF is generated, uploaded to Storage, and URL is stored within 3 seconds
- [ ] Donor receives thank-you FCM notification with next eligible date
- [ ] Badge is awarded idempotently (no duplicate if hook is called twice)

### Phase 5
- [ ] Donation history shows all entries for the donor in reverse-chronological order
- [ ] Certificate download link works for completed donations; URL auto-renews if expired
- [ ] All 8 badges display correctly — earned with date, locked with progress
- [ ] Snooze sets `availability = 'snoozed'` and `snooze_until = now() + duration`; donor disappears from matching queries
- [ ] Donor profile edit (name, city) saves correctly; blood group and DOB cannot be changed

### Phase 6
- [ ] All 8 blood group inventory cells show correct stock levels
- [ ] Inventory update propagates to dashboard snapshot in real time
- [ ] Low-stock amber banner appears when `units_available <= low_stock_threshold`
- [ ] Surplus listing appears on nearby hospitals' screens within 2 seconds of publishing
- [ ] Claim is atomic: two simultaneous claims for the same surplus result in one success and one conflict

### Phase 7
- [ ] Admin can verify a hospital — hospital receives notification and gains dashboard access
- [ ] Admin can blacklist a donor — donor sees ban screen on next login
- [ ] Nightly cron correctly flags donors with `no_show_rate > 30%` and `total_accepted >= 5`
- [ ] Analytics overview correctly aggregates request and donation counts
- [ ] Audit log exports to CSV with all required fields
- [ ] Broadcast notification is received by a real device

### Phase 8
- [ ] Lighthouse PWA score ≥ 90 on `app.redaid.in`
- [ ] All 9 smoke test steps pass on the production environment
- [ ] Sentry receives events from both backend and frontend
- [ ] `GET https://api.redaid.in/health` returns `200` with < 100ms response
- [ ] Eligibility engine: 100% line coverage
- [ ] Trust score calculator: 100% line coverage
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] No critical or high-severity bugs open

---

*End of Document — Implementation Plan v1.0*
*This plan governs the build sequence for RedAid V1. Any feature, module, or route not listed here is out of scope for V1. Changes to build order require sign-off from the engineering lead and must be reflected here before implementation begins.*
