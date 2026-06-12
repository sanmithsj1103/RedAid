# RedAid Backend — Execution Context

## Last Updated
Phase 2 completed at 2026-06-10T23:45:00+05:30

---

## Phase 0 — COMPLETED ✅

### What was done
1. **Root setup**: Created `pnpm-workspace.yaml`, root `package.json`, `.gitignore`
2. **Backend scaffold**: Created `package.json` (20 runtime + 12 dev deps), `tsconfig.json` (strict TS, NodeNext), `.env.example`, `.env`, `.eslintrc.json`, `vitest.config.ts`
3. **Config layer** (7 files): `env.ts` (Zod validation), `supabase.ts` (dual clients), `redis.ts` (IORedis), `firebase.ts` (Admin SDK), `socket.ts` (Socket.IO rooms), `logger.ts` (pino), `sentry.ts` (placeholder)
4. **Types** (5 files): `blood.ts` (enum + compatibility matrix), `request.ts` (status enums + constants), `donor.ts` (profile + eligibility interfaces), `hospital.ts` (profile + inventory interfaces), `index.ts` (barrel)
5. **Middleware** (3 files): `auth.ts` (implemented), `error-handler.ts` (implemented), `rate-limiter.ts` (3 limiters implemented)
6. **Routes** (4 files): `auth.routes.ts`, `donor.routes.ts`, `hospital.routes.ts`, `admin.routes.ts`
7. **Services**: eligibility, matching, notification (fcm + orchestrator), trust-score (calculator + badges), certificate, post-donation, surplus, fraud, analytics, broadcast, audit
8. **Workers**: `notification.worker.ts`
9. **DB queries**: `donor.queries.ts`, `hospital.queries.ts`
10. **Utils**: `app-error.ts` (full AppError class with factory methods)
11. **Entry point**: `src/index.ts` — Express app with helmet, CORS, rate limiting, route mounting, health check, 404 handler, error handler
12. **SQL migrations** (14 files): Extensions, 9 tables, RLS policies, indexes, triggers, realtime publication
13. **Seed data**: 2 donors, 2 hospitals, blood inventory
14. **CI/CD**: `.github/workflows/ci.yml`
15. **npm install**: 512 packages installed successfully

---

## Phase 1 — COMPLETED ✅

### What was done
1. **Auth Middleware**: Full implementation of `requireAuth`, `requireRole`, and lightweight `requireAuthLight` with account verification status checks (suspension, blacklisting).
2. **OTP & Registration Routes**: Finished `auth.routes.ts` containing `/otp/send`, `/otp/verify`, `/donor/register`, `/hospital/register` (which inserts 8 default inventory records), `/refresh` cookie rotation, and `/logout`.
3. **Donor & Hospital profiles**: Created routes for donor profile CRUD, location updating, availability toggle, and FCM token registry.
4. **Audit Logger**: Implementation of `logAuditEvent` using service role to write immutably to `audit_logs` table.
5. **Testing**: Verified compile/typecheck success and added a health check unit test confirming route execution.

---

## Phase 2 — COMPLETED ✅

### What was done
1. **Compatibility Engine**: Integrated the compatibility matrix in `blood.ts` supporting `getCompatibleDonorGroups` to return compatible donor groups for a given recipient group.
2. **Eligibility Engine**: Implemented `eligibility.service.ts` checking all 5 core rules (age 18-65, 90-day lock, availability status, blacklist status, group compatibility) with 100% test coverage (11 unit tests).
3. **Location Matching Engine**: Implemented `matcher.service.ts` with `findEligibleDonors` calling PostGIS SQL via RPC and `findDonorsWithExpansion` supporting auto-expanding search radius (15 -> 25 -> 40 -> 60 km) with Socket.IO notifications to hospitals, covered by 4 unit tests.
4. **Blood Request Creation**: Wired matching and notification response generation directly into `POST /v1/hospital/requests` to matching results, inserting `donation_responses` rows and incrementing `total_responses` counts on donors.
5. **Testing**: Added route unit testing for request creation and validation in `hospital.routes.test.ts` (2 tests) and conditional Express startup for testing to prevent `EADDRINUSE` port issues.

---

## Phase 3 — COMPLETED ✅

### What was done
1. **FCM push notification service**: Fully implemented `sendPushNotification()` in `fcm.service.ts` with high-priority configurations for Android/Webpush and database token self-cleanup on invalid/stale registration.
2. **Notification fatigue cap**: Integrated fatigue check preventing more than 3 Critical requests in 24 hours in `notification.service.ts`.
3. **BullMQ notification worker**: Completed the `retry-check` job processor in `notification.worker.ts` to update statuses to `no_response` and dynamically dispatch to the next eligible donor on timeout.
4. **Donor response routes**: Finished routes for accepting/declining requests and updating transit status (`en_route` / `arrived`) in `donor.routes.ts`.
5. **Real-time integration**: Wired Socket.IO room subscriptions for hospitals, donors, and requests, and connected socket/worker initialization inside Express entry point `index.ts`.
6. **Testing**: Fixed Vitest hoisting issues, added/updated mocks, and achieved 35/35 passing tests for routers and services.

---

## Phase 4 — COMPLETED ✅

### What was done
1. **Trust Score Calculator**: Implemented `computeTrustScore` with weights for donations (30%), response rate (35%), and reliability (35%), with 100% test coverage.
2. **Badge Awarding Service**: Implemented `checkAndAward` evaluating 8 badges (first_drop, streak_3/5/10, lifesaver, hero, critical_responder, trusted_donor) idempotently.
3. **Certificate Generation Service**: Implemented `generate` to create A4 PDF certificates using `pdf-lib` and upload them to Supabase Storage, along with signed URL regeneration.
4. **Post-Donation Hook Orchestrator**: Developed the 10-step automation workflow updating database tables atomically via the `complete_donation_transaction` PostgreSQL RPC function, recomputing trust scores, awarding badges, generating certificates, sending FCM notifications, and auditing.
5. **API Integration**: Linked the hook into `/requests/:id/donors/:responseId/complete` in `hospital.routes.ts` and refactored `/history/:id/certificate` in `donor.routes.ts`.

## Phase 5 — COMPLETED ✅

### What was done
1. **Donor Query Module**: Implemented reusable parameterised database queries in `donor.queries.ts` for fetching profile data, updating settings, fetching donation history, and checking badges.
2. **Donor Engagement Routes**: Implemented all endpoints in `donor.routes.ts` for history pagination, detail lookup, profile updates, availability toggles, FCM token updates, and DPDPA-compliant account erasure.
3. **Unit Tests**: Achieved 100% test coverage for all routes and edge cases inside `donor.routes.test.ts` (22 unit tests passing).

---

## Phase 6 — COMPLETED ✅

### What was done
1. **Hospital Query Module**: Implemented structured database queries in `hospital.queries.ts` to manage inventory, retrieve nearby surplus listings (PostGIS-based), and claims.
2. **Surplus Claim Service**: Developed a race-condition-protected atomic claim workflow in `hospital.queries.ts` and exposed it via `surplus.service.ts` using optimistic update checking.
3. **Hospital Operations Routes**: Created endpoints for inventory updates, cross-hospital surplus queries/claims, and rating/feedback submissions on completed donations.
4. **Unit Tests**: Wrote comprehensive unit tests for all operations in `hospital.routes.test.ts` (15 unit tests passing).

---

## Phase 7 — COMPLETED ✅

### What was done
1. **Donor Suspension Flag Migration**: Created database migration SQL adding the `is_suspended` column to the `donors` table and updated the PostGIS eligibility matching function `find_eligible_donors` to exclude suspended accounts.
2. **Auth & Eligibility Updates**: Integrated `is_suspended` checks into the Express auth middleware (checking the status in `checkAccountStatus`) and the core `eligibility.service.ts` engine.
3. **Fraud Detection Nightly Cron**: Built the `checkAndFlagNoShowFraud` service running nightly at 02:00 IST / 20:30 UTC using `node-cron`. The service automatically suspends donors with a no-show rate greater than 30% after 5+ accepted requests and logs a `fraud.no_show_flagged` system audit event.
4. **Platform Analytics & Multicast FCM Broadcasts**: Implemented KPI metrics aggregation, geo-demand zone analytics, and target segment FCM multicast dispatches.
5. **Admin Route Protection & CRUD Operations**: Fully implemented and secured all routes under `/v1/admin` in `admin.routes.ts`.
6. **Unit & Integration Testing**: Wrote extensive test coverage for all admin routes and services in `admin.routes.test.ts`, `fraud.service.test.ts`, `analytics.service.test.ts`, and `broadcast.service.test.ts` (adding 23 passing tests for a suite total of **98 tests**).

---

## Current Phase: Phase 8 — Security, Polish & Pre-Launch
Status: STARTING
