# Application Flow Document
## RedAid — Real-Time Emergency Blood Coordination Platform

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | June 2026 |
| **Status** | Approved for Development |
| **Document Owner** | Product Team |
| **References** | RedAid PRD v1.0, RedAid TRD v1.0 |

---

## Table of Contents

1. [User Roles Overview](#1-user-roles-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Application Entry Points](#3-application-entry-points)
4. [Donor Portal — Full Flow](#4-donor-portal--full-flow)
5. [Hospital Portal — Full Flow](#5-hospital-portal--full-flow)
6. [Admin Panel — Full Flow](#6-admin-panel--full-flow)
7. [Cross-Portal Flows](#7-cross-portal-flows)
8. [Permission Matrix](#8-permission-matrix)
9. [Navigation Map](#9-navigation-map)
10. [Error & Edge Case States](#10-error--edge-case-states)

---

## 1. User Roles Overview

RedAid has three distinct user roles. Each role has a completely separate set of screens, permissions, and navigation. No user can access another role's portal — access is enforced at both the JWT claim level and the API route level.

### Role Definitions

| Role | Who They Are | How They Access RedAid | Primary Goal |
|---|---|---|---|
| **Donor** | Individual blood donors aged 18–65 | Self-registration via PWA | Receive requests, accept/decline, track donation history |
| **Hospital** | Hospital staff — blood bank admins, doctors, nurses | Registered and verified by Admin | Create blood requests, track donors in real time, manage inventory |
| **Admin** | RedAid platform operations team | Manually provisioned by engineering | Monitor platform, manage users, detect fraud, view analytics |

### What Each Role Can See

| Capability | Donor | Hospital | Admin |
|---|---|---|---|
| Own profile | ✅ | ✅ | — |
| Donation history | ✅ (own) | ✅ (for their requests) | ✅ (all) |
| Trust score | ✅ (own, read-only) | ✅ (donors on their requests) | ✅ (all donors) |
| Blood request — create | ❌ | ✅ | ❌ |
| Blood request — view | ✅ (active only, if matched) | ✅ (own requests) | ✅ (all) |
| Blood inventory | ❌ | ✅ (own hospital) | ✅ (all hospitals) |
| Cross-hospital surplus | ❌ | ✅ | ✅ |
| Donor management | ❌ | ❌ | ✅ |
| Hospital management | ❌ | ❌ | ✅ |
| System analytics | ❌ | ❌ | ✅ |
| Fraud & audit logs | ❌ | ❌ | ✅ |
| System-wide broadcasts | ❌ | ❌ | ✅ |
| Push notification settings | ✅ | ❌ | ✅ (send) |
| Other donors' PII | ❌ | ✅ (first name + last initial only, post-accept) | ✅ (full) |

---

## 2. Authentication & Authorization

### 2.1 How Authentication Works

RedAid uses phone-number OTP authentication for all users. There are no passwords. Every session is tied to a verified phone number.

**OTP Authentication Flow:**

```
User enters phone number
        │
        ▼
System sends 6-digit OTP via SMS (Supabase Auth + Twilio)
        │
        ▼
User enters OTP within 5 minutes
        │
        ▼
Supabase Auth verifies OTP
        │
        ├── New user (no account found)
        │         │
        │         ▼
        │   Role selection screen → Registration flow
        │
        └── Existing user (account found)
                  │
                  ▼
            JWT issued { role, entity_id }
                  │
                  ▼
            Routed to their portal (Donor / Hospital / Admin)
```

**Token Lifecycle:**
- Access token: Lives in memory (Zustand store). Expires every 1 hour. Never stored in `localStorage`.
- Refresh token: Lives in an `httpOnly; Secure; SameSite=Strict` cookie. Silently refreshes the access token in the background without requiring the user to log in again.
- On browser close: Access token is cleared. On next visit, the refresh token cookie automatically restores the session with no OTP re-entry required, until the refresh token expires (30 days of inactivity).

### 2.2 Role Assignment

Roles are set during registration and stored as a JWT custom claim. They cannot be changed by the user. Only an Admin can change a user's status (suspend, blacklist) — never their role.

| Role | Set By | Stored As |
|---|---|---|
| `donor` | Self-registration | JWT claim + `donors` table |
| `hospital` | Admin verification | JWT claim + `hospitals` table |
| `admin` | Engineering team (manual) | JWT claim only (no self-registration) |

### 2.3 Authorization Enforcement

Authorization is enforced at two layers simultaneously:

**Layer 1 — API Middleware (Express)**

Every protected route checks the JWT role claim before any business logic runs:

```
Incoming request
      │
      ▼
requireAuth middleware → verifies JWT signature
      │
      ├── Invalid token → 401 Unauthorized
      │
      ▼
requireRole('donor' | 'hospital' | 'admin') middleware
      │
      ├── Wrong role → 403 Forbidden
      │
      ▼
Route handler executes
```

**Layer 2 — Database (Row-Level Security)**

Even if an API call were to reach the database with a valid but wrong-role token, PostgreSQL RLS policies prevent cross-user data access at the database level. Donors can only query their own rows. Hospitals can only query their own requests. Admins use the service role key that bypasses RLS — used only server-side, never exposed to clients.

### 2.4 Session States

| State | What Happens | User Experience |
|---|---|---|
| **Authenticated** | Valid access token in memory | Full portal access |
| **Token Expired** | Access token expired; refresh token present | Silent refresh — user sees nothing |
| **Logged Out** | Both tokens cleared | Redirected to `/login` |
| **Suspended** | Account suspended by admin | Shown suspension notice screen; no portal access |
| **Blacklisted** | Account blacklisted by admin | Shown permanent ban screen; no portal access |
| **Hospital Unverified** | Hospital registered but not yet verified by admin | Shown "Pending Verification" holding screen |

### 2.5 What Happens on Login — Routing Logic

After a successful OTP verification, the frontend reads the role from the JWT and routes accordingly:

```
JWT decoded
      │
      ├── role: 'donor'    → /donor/dashboard
      ├── role: 'hospital' → /hospital/dashboard  (if verified)
      │                   → /hospital/pending      (if unverified)
      └── role: 'admin'   → /admin/dashboard
```

---

## 3. Application Entry Points

The RedAid PWA is a single application that serves all three portals. The URL structure separates them cleanly:

| Portal | Base Path | Accessible To |
|---|---|---|
| Shared Auth | `/login`, `/register` | All unauthenticated users |
| Donor Portal | `/donor/*` | Role: `donor` only |
| Hospital Portal | `/hospital/*` | Role: `hospital` only |
| Admin Panel | `/admin/*` | Role: `admin` only |

Any attempt to access `/donor/*` with a `hospital` JWT, or `/admin/*` with a `donor` JWT, results in an immediate redirect to that user's correct home route. This is enforced client-side by a route guard component and simultaneously on the API by middleware.

---

## 4. Donor Portal — Full Flow

### 4.1 Donor Registration Journey

A new donor who opens the PWA for the first time goes through this one-time journey before accessing their dashboard.

```
Step 1 — Land on /login
         │
         ▼
Step 2 — Enter phone number
         │
         ▼
Step 3 — Enter OTP (sent via SMS)
         │
         ├── OTP incorrect → Error: "Incorrect code. X attempts remaining."
         ├── OTP expired   → Option to resend (allowed after 30 seconds)
         │
         ▼
Step 4 — Phone verified; no account found → /register/donor
         │
         ▼
Step 5 — Personal Information Form
         Fields: Full name, date of birth, blood group (dropdown), city
         Validation: Age must be 18–65 at time of registration
         │
         ▼
Step 6 — Location Permission
         Request browser geolocation permission
         │
         ├── Granted → Location auto-filled and stored as PostGIS point
         └── Denied  → Manual city/area entry; geolocation degraded to city-level matching
         │
         ▼
Step 7 — Health Declaration Form
         Checkbox questions about current health status, recent illness,
         recent surgeries, medications that affect eligibility.
         Consent checkbox: "I confirm this information is accurate."
         Consent timestamp stored in health_declaration JSONB.
         │
         ▼
Step 8 — Push Notification Permission
         Contextual prompt — shown here, not on app open.
         "Allow RedAid to send you emergency blood requests."
         │
         ├── Allowed → FCM token stored; donor is fully active
         └── Denied  → Donor registered but will not receive push notifications.
                       Warning shown: "You won't receive emergency alerts without notifications."
         │
         ▼
Step 9 — Registration Complete
         Account created. Donor profile is live and immediately eligible for matching.
         Redirected to /donor/dashboard.
```

### 4.2 Donor Screen Inventory & Access Rules

| Screen | Path | Accessible When | What the Donor Sees |
|---|---|---|---|
| Dashboard | `/donor/dashboard` | Always (logged in) | Availability toggle, eligibility status, active alert if any, trust score, next donation date, recent badge |
| Incoming Request Alert | `/donor/request/:responseId` | Only when system dispatches a request to this donor | Blood group needed, hospital name, distance, priority level, Accept / Decline buttons |
| Request Detail | `/donor/request/:responseId/detail` | After accepting a request | Full hospital address, map link, contact info, status update buttons (En Route → Arrived) |
| Donation History | `/donor/history` | Always | Timeline of all past donations, each with date, hospital, blood group, status |
| Certificate Viewer | `/donor/history/:id/certificate` | Only for completed donations | Downloadable PDF certificate for that specific donation |
| Badges & Gamification | `/donor/badges` | Always | Earned badges, current streak, points balance, locked future badges |
| Availability Settings | `/donor/availability` | Always | Toggle: Active / Snoozed (with duration picker) / Unavailable |
| Profile & Health Info | `/donor/profile` | Always | Name, blood group, donation stats; edit name and location only |
| Notification Log | `/donor/notifications` | Always | History of all past alerts and whether they were accepted, declined, or expired |

### 4.3 Donor Dashboard — Detailed Breakdown

The dashboard is the donor's home. Everything important is surfaced here.

**Components on the Dashboard:**

```
┌──────────────────────────────────────────────┐
│  AVAILABILITY TOGGLE                          │
│  [ Active ] [ Snoozed ] [ Unavailable ]       │
│  If Snoozed: duration picker (1h, 4h, 8h,    │
│  24h, custom) — hides all alerts during       │
│  snooze window.                               │
├──────────────────────────────────────────────┤
│  ACTIVE ALERT BANNER (conditional)            │
│  Shown only if there is an active incoming    │
│  request waiting for response.                │
│  Red pulsing banner → taps to Request Alert   │
├──────────────────────────────────────────────┤
│  ELIGIBILITY STATUS                           │
│  ✅ Eligible to donate                        │
│    OR                                         │
│  🔒 Next eligible date: [Date]                │
│     (X days remaining)                        │
├──────────────────────────────────────────────┤
│  TRUST SCORE                                  │
│  Score: 87/100                                │
│  Breakdown: Donations / Response rate /       │
│  Reliability rate (read-only, no edit)        │
├──────────────────────────────────────────────┤
│  QUICK STATS                                  │
│  Total donations | Lives impacted             │
│  Current streak  | Points balance             │
├──────────────────────────────────────────────┤
│  LATEST BADGE (if any earned recently)        │
│  Badge image + name + date awarded            │
└──────────────────────────────────────────────┘
```

### 4.4 Incoming Request Alert — Detailed Flow

This is the most time-critical screen in the entire application. The donor receives a push notification. Tapping it opens the app directly to this screen.

```
Push notification arrives on device
        │
        ▼
Donor taps notification → App opens to /donor/request/:responseId
        │
        ▼
┌───────────────────────────────────────┐
│  INCOMING REQUEST ALERT               │
│                                       │
│  🆘 CRITICAL  (or URGENT / SCHEDULED) │
│                                       │
│  Blood Group Needed: O+               │
│  Hospital: Manipal Hospital Whitefield│
│  Distance: 4.2 km away               │
│  Units Needed: 2                      │
│                                       │
│  [  ACCEPT  ]    [  DECLINE  ]        │
└───────────────────────────────────────┘
        │
        ├── ACCEPT tapped
        │       │
        │       ▼
        │   API: PATCH /donor/requests/:responseId/respond { action: 'accept' }
        │       │
        │       ▼
        │   Response status updated to 'accepted'
        │   Hospital notified via Socket.IO
        │   BullMQ 10-min retry job cancelled
        │       │
        │       ▼
        │   Navigate to → Request Detail screen
        │
        └── DECLINE tapped
                │
                ▼
            Confirm dialog: "Are you sure you want to decline this request?"
                │
                ├── Confirmed → API: PATCH /respond { action: 'decline' }
                │              Status: 'declined'
                │              Next eligible donor notified automatically
                │              Navigate back to /donor/dashboard
                │
                └── Cancelled → Return to alert screen
```

**Timer Behaviour:** The incoming alert screen shows a countdown timer. If the donor does not respond within 10 minutes, the system automatically marks the response as `no_response`, notifies the next eligible donor, and this screen shows "This request has been assigned to another donor."

**If Donor Opens App Without Tapping Notification:** The dashboard shows a red pulsing Active Alert banner. Tapping it routes to the same alert screen.

### 4.5 Request Detail Screen (Post-Accept)

After accepting a request, the donor sees full details and must update their status as they travel to the hospital.

```
/donor/request/:responseId/detail

Shows:
- Hospital name and full address
- Google Maps deep-link for navigation
- Blood group and units needed
- Priority level
- Hospital phone number (revealed only after acceptance)

Status Update Flow:
        │
        ▼
[ Mark: I am on my way ]
        │
        ▼
Status updated to 'en_route'
Hospital live tracker notified: "Donor is on the way"
        │
        ▼
[ Mark: I have arrived ]
        │
        ▼
Status updated to 'arrived'
Hospital live tracker notified: "Donor has arrived"
        │
        ▼
(Hospital marks donation complete — donor has no action here)
        │
        ▼
Post-donation automation runs (see Section 7.1)
        │
        ▼
Donor sees: "Thank you for donating! Your certificate is ready."
Navigate to → /donor/history/:id/certificate
```

### 4.6 Availability Settings Flow

```
/donor/availability

Three states available:

ACTIVE
  Donor will receive all matching notifications.
  Default state on registration.

SNOOZED
  No notifications during snooze window.
  Duration options: 1 hour / 4 hours / 8 hours / 24 hours / Custom date-time.
  Snooze auto-expires — donor returns to Active automatically.
  Can be cancelled early by returning to this screen and tapping "Resume Active".

UNAVAILABLE
  Manually set indefinite unavailability.
  No notifications until donor manually switches back to Active.
  Used for travel, illness, or long-term unavailability.
  Donor's profile is excluded from all matching queries.

Note: Changing availability does not affect requests already accepted.
If a donor snoozes while en route to a hospital, they are still expected to fulfil
that commitment — snooze only affects future incoming notifications.
```

### 4.7 Donation History & Certificates

```
/donor/history

Shows a reverse-chronological timeline:
  Each entry: Date | Hospital | Blood Group | Status badge | View Certificate (if completed)

Statuses shown:
  ✅ Donated         — Completed successfully
  ❌ No-Show         — Accepted but did not arrive (shown to donor, affects trust score)
  ↩  Declined        — Donor declined the request
  ⏱  No Response     — Timer expired before donor responded
  🚫 Cancelled       — Request was cancelled by hospital before donation

Tapping any entry → /donor/history/:id
  Shows full detail: hospital, date, units, request priority, trust score impact

Tapping "View Certificate" on a completed donation:
  → /donor/history/:id/certificate
  Shows a rendered preview of the certificate
  Download button: triggers PDF download from Supabase Storage signed URL
  Share button: native mobile share sheet
```

### 4.8 Badges & Gamification Screen

```
/donor/badges

Three sections:

EARNED BADGES
  Grid of unlocked badges with name and date awarded.
  Tapping a badge: full-screen modal with badge description and how it was earned.

  Badge catalogue:
    🩸 First Drop         — First completed donation
    🔥 Streak × 3        — 3 donations without a no-show
    🔥 Streak × 5        — 5 consecutive donations without a no-show
    🔥 Streak × 10       — 10 consecutive donations without a no-show
    💚 Lifesaver          — 5 total completed donations
    🦸 Hero               — 10 total completed donations
    🚨 Critical Responder — 3 Critical priority donations completed
    ⭐ Trusted Donor      — Trust score ≥ 90

POINTS BALANCE
  Current points total
  Points log: which action earned how many points
  (Certificate downloads, donations, streaks all award points)

LOCKED BADGES
  Greyed-out badges the donor hasn't earned yet
  Shows progress: "2 / 5 donations to unlock Lifesaver"
```

---

## 5. Hospital Portal — Full Flow

### 5.1 Hospital Registration & Verification Journey

Hospital registration is a two-step process. Hospitals can register themselves but cannot use the platform until an Admin verifies them.

```
Step 1 — Land on /login
         │
         ▼
Step 2 — Enter phone number → OTP → Phone verified; no account
         │
         ▼
Step 3 — Select role: "I represent a Hospital / Blood Bank"
         Redirects to /register/hospital
         │
         ▼
Step 4 — Hospital Information Form
         Fields: Hospital name, registration number (govt-issued),
                 department, address, city, contact phone, contact email
         │
         ▼
Step 5 — Account Created — Unverified State
         Hospital sees /hospital/pending screen:

         ┌─────────────────────────────────────────┐
         │  ⏳ Verification Pending                 │
         │                                          │
         │  Your hospital registration is under     │
         │  review by the RedAid team. You will     │
         │  receive a notification once verified.   │
         │                                          │
         │  Typically completed within 24 hours.    │
         └─────────────────────────────────────────┘

         Admin is alerted of the new hospital registration.
         │
         ▼
Step 6 — Admin verifies hospital (see Admin flow, Section 6.3)
         │
         ▼
Step 7 — Hospital receives push/email notification: "Your hospital is now verified."
         Next login → /hospital/dashboard (full access granted)
```

### 5.2 Hospital Screen Inventory & Access Rules

| Screen | Path | Accessible When | What Hospital Staff Sees |
|---|---|---|---|
| Pending Verification | `/hospital/pending` | Registered but unverified | Holding screen with status message |
| Dashboard | `/hospital/dashboard` | Verified only | Active requests summary, inventory snapshot, recent activity feed |
| Create Blood Request | `/hospital/requests/new` | Verified only | Form: blood group, units, priority, notes |
| Live Request Tracker | `/hospital/requests/:id/live` | Active request exists | Real-time donor status pipeline |
| Request History | `/hospital/requests` | Verified only | All past requests with outcomes |
| Blood Inventory | `/hospital/inventory` | Verified only | Stock levels by blood group, update form |
| Cross-Hospital Surplus | `/hospital/surplus` | Verified only | Publish surplus, view incoming surplus from nearby hospitals |
| Donor Feedback | `/hospital/requests/:id/feedback/:responseId` | After donation marked complete | Star rating + comments form |
| Hospital Profile | `/hospital/profile` | Verified only | Hospital details, edit contact info |

### 5.3 Hospital Dashboard — Detailed Breakdown

```
/hospital/dashboard

┌─────────────────────────────────────────────────┐
│  ACTIVE REQUESTS (live count)                    │
│  Card per active request:                        │
│    Blood group | Priority badge | Units needed   │
│    Donors notified: 7 | Accepted: 2              │
│    [View Live Tracker]                           │
├─────────────────────────────────────────────────┤
│  INVENTORY SNAPSHOT                              │
│  Quick view of all 8 blood groups               │
│  Red indicator on any group below threshold     │
│  [Manage Inventory]                              │
├─────────────────────────────────────────────────┤
│  RECENT ACTIVITY FEED                           │
│  Latest events: "Donor Arjun K. accepted O+"   │
│  "B+ inventory updated to 4 units"              │
│  "Request #123 completed"                        │
├─────────────────────────────────────────────────┤
│  [+ CREATE NEW REQUEST]  ← Primary CTA          │
└─────────────────────────────────────────────────┘
```

### 5.4 Create Blood Request Flow

```
/hospital/requests/new

Form Fields:
  Blood Group (required)  → Dropdown: A+, A-, B+, B-, AB+, AB-, O+, O-
  Units Required          → Number input: 1–20
  Priority (required)     → Critical / Urgent / Scheduled
                            Each option shows its definition inline.
  Notes (optional)        → Freetext, max 500 chars (patient context)

Submit → API: POST /hospital/requests
         │
         ├── Validation fails (e.g., blood group missing) → inline field errors
         │
         └── Validation passes
                   │
                   ▼
             Request created in DB with status: 'pending'
                   │
                   ▼
             Eligibility engine runs:
             - Finds compatible blood groups
             - Filters by age, 90-day lock, availability, radius
                   │
                   ├── Donors found → FCM notifications dispatched (status: 'dispatched')
                   │                  BullMQ retry jobs created
                   │                  Hospital redirected to Live Request Tracker
                   │
                   └── No donors found in 60km radius
                               │
                               ▼
                         Hospital sees:
                         "No eligible donors found in your area.
                          We will keep checking and notify you
                          when a match is found."
                         Request remains open and retries on new donor registrations.
```

**Priority Behaviour at Dispatch:**

| Priority | Dispatch Behaviour | Response Window |
|---|---|---|
| Critical | All eligible donors within radius notified simultaneously | 10 minutes per batch |
| Urgent | Top 5 donors by trust score notified first | 10 minutes, then next 5 |
| Scheduled | Top 3 donors by trust score notified | 10 minutes, then next 3 |

### 5.5 Live Request Tracker — Detailed Flow

This is the hospital's real-time command centre for an active request. It updates automatically via Supabase Realtime — no page refresh needed.

```
/hospital/requests/:id/live

┌──────────────────────────────────────────────────────┐
│  REQUEST SUMMARY                                      │
│  O+ Blood | 2 Units | 🔴 CRITICAL                    │
│  Created: 10:32 AM   |  Status: DISPATCHED            │
├──────────────────────────────────────────────────────┤
│  DONOR PIPELINE (live, auto-updates)                  │
│                                                       │
│  Donors Notified: 7                                   │
│                                                       │
│  [Arjun K.]    ✅ Accepted → 🚗 En Route              │
│    Actions: [Mark Arrived] [Mark No-Show]             │
│                                                       │
│  [Priya M.]   ✅ Accepted → ⏳ Waiting                │
│    Actions: [Mark Arrived] [Mark No-Show]             │
│                                                       │
│  [Ravi S.]    ⏱ No Response (timer: 3:42 remaining)  │
│                                                       │
│  [Sunita T.]  ↩ Declined                             │
│                                                       │
│  [3 more donors in queue]                            │
├──────────────────────────────────────────────────────┤
│  UNITS FULFILLED: 0 / 2                              │
│                                                       │
│  [Cancel Request]  (with confirmation dialog)         │
└──────────────────────────────────────────────────────┘
```

**Hospital Actions on Each Donor Row:**

```
[ Mark Arrived ]
      │
      ▼
Donor status → 'arrived'
Donor app notified via push: "Hospital has confirmed your arrival."

[ Mark Donation Complete ]  (appears after 'arrived')
      │
      ▼
Confirmation dialog: "Confirm that [Donor Name] has donated blood?"
      │
      ├── Confirmed → POST /hospital/requests/:id/donors/:responseId/complete
      │              Post-donation automation runs (see Section 7.1)
      │              Units fulfilled counter increments
      │              If all units fulfilled → request status → 'completed'
      │
      └── Cancelled → No change

[ Mark No-Show ]
      │
      ▼
Confirmation dialog: "Mark [Donor Name] as a no-show?"
      │
      ├── Confirmed → PATCH /hospital/requests/:id/donors/:responseId/no-show
      │              Donor trust score penalised
      │              Admin fraud system logs the event
      │              Hospital notified: "Next donor in queue has been notified."
      │
      └── Cancelled → No change
```

### 5.6 Blood Inventory Manager

```
/hospital/inventory

Shows a grid of all 8 blood groups:
  A+   A-   B+   B-
  AB+  AB-  O+   O-

Each cell shows:
  - Current units available
  - Low-stock warning (red) if at or below threshold (default: 2 units)
  - Last updated timestamp

Tapping a blood group cell → inline edit:
  New unit count (number input, min 0)
  [Save] → API: PATCH /hospital/inventory/:bloodGroup
  Updates the DB; Supabase Realtime pushes the new value to any subscribed dashboards.

Low Stock Alert:
  When any blood group drops below threshold, the hospital's dashboard shows
  a persistent amber banner: "⚠️ B- stock is critically low (1 unit remaining)."
```

### 5.7 Cross-Hospital Surplus Coordination

```
/hospital/surplus

TWO PANELS:

PANEL 1 — PUBLISH SURPLUS
  "Do you have blood units to share with nearby hospitals?"
  Form:
    Blood Group (dropdown)
    Units Available (number)
    Offer Expires In (4h / 8h / 24h / 48h)
  [Publish Surplus]
  → API: POST /hospital/surplus
  Nearby hospitals (within 25km) see this in their surplus panel.

PANEL 2 — INCOMING SURPLUS
  List of surplus offers from nearby hospitals:
    Hospital name | Blood group | Units | Expires in X hours | Distance
    [Claim Units] → marks surplus as claimed, notifies offering hospital.

  Real-time: new surplus listings appear instantly via Supabase Realtime
  without page refresh.
```

### 5.8 Donor Feedback Flow

After a donation is marked complete, the hospital is prompted to rate the donor.

```
Request marked complete
      │
      ▼
Prompt appears on Live Tracker: "Would you like to rate the donor?"
      │
      ▼
/hospital/requests/:id/feedback/:responseId

  Star Rating: 1–5 stars (required)
  Comment: Freetext, optional, max 300 chars

  [Submit Feedback]
  → API: POST /hospital/requests/:id/donors/:responseId/rating

  This rating is stored on donation_responses.hospital_rating.
  It informs internal quality monitoring but is NOT shown to the donor publicly.
  Admins can see ratings in their review dashboard.

  [Skip] → No rating submitted; no penalty.
```

---

## 6. Admin Panel — Full Flow

### 6.1 Admin Access

Admins have no self-registration path. Admin accounts are created directly in the Supabase database by the engineering team during platform setup. The JWT `role: 'admin'` claim is set at this time.

Admins log in via the same `/login` screen (OTP flow), and are routed to `/admin/dashboard` upon successful authentication.

### 6.2 Admin Screen Inventory & Access Rules

| Screen | Path | Purpose |
|---|---|---|
| Dashboard | `/admin/dashboard` | Platform KPIs, system health, live activity |
| Donor Management | `/admin/donors` | Full donor list with search, filter, actions |
| Donor Detail | `/admin/donors/:id` | Full profile, history, trust score, actions |
| Hospital Management | `/admin/hospitals` | Full hospital list with search, filter, actions |
| Hospital Detail | `/admin/hospitals/:id` | Full profile, request history, actions |
| Fraud Monitor | `/admin/fraud` | No-show flags, suspicious activity, blacklist queue |
| Analytics | `/admin/analytics` | Donation trends, demand zones, blood group demand, peak times |
| Notifications Manager | `/admin/notifications` | Compose and send system-wide broadcast |
| Audit Logs | `/admin/audit` | Immutable activity log, filterable by actor, action, date |

### 6.3 Admin Dashboard — Detailed Breakdown

```
/admin/dashboard

┌───────────────────────────────────────────────────────┐
│  PLATFORM KPIs (live)                                  │
│  Active Requests: 12  | Donors Active: 4,821           │
│  Verified Hospitals: 37 | Donations Today: 8           │
├───────────────────────────────────────────────────────┤
│  PENDING VERIFICATIONS                                 │
│  🏥 3 hospitals awaiting verification                  │
│  [Review Now] → /admin/hospitals?filter=pending        │
├───────────────────────────────────────────────────────┤
│  FRAUD FLAGS (last 24h)                               │
│  ⚠️ 2 donors flagged for high no-show rate            │
│  [Review] → /admin/fraud                              │
├───────────────────────────────────────────────────────┤
│  RECENT ACTIVITY FEED                                 │
│  Timestamped log of platform events:                  │
│  "Hospital ABC created a Critical O+ request"         │
│  "Donor Raj S. completed donation at Hospital XYZ"    │
│  "Donor Mira P. blacklisted by admin Rahul"           │
├───────────────────────────────────────────────────────┤
│  SYSTEM HEALTH                                        │
│  Notification delivery rate: 99.2%                   │
│  Avg response time (Critical): 11.4 min              │
│  Crash rate (7 days): 0.12%                          │
└───────────────────────────────────────────────────────┘
```

### 6.4 Donor Management Flow

```
/admin/donors

Full donor list with:
  Search: by name, phone, blood group, city
  Filters: Active / Snoozed / Unavailable / Suspended / Blacklisted
  Sort: by trust score, total donations, registration date

Each row: Name | Blood Group | City | Trust Score | Status | Last Donated | Actions

Tapping a donor → /admin/donors/:id

DONOR DETAIL VIEW:
  Full profile: name, phone (full PII visible to admin), blood group, location
  Donation history: all entries
  Trust score breakdown (component-by-component)
  All donation responses (accepted, declined, no-show, etc.)
  Health declaration (read-only)
  Badge history

ADMIN ACTIONS on Donor:
  ┌─────────────────────────────────────────┐
  │  [ Verify ]     Set is_verified = true  │
  │  [ Suspend ]    Temporary account lock  │
  │  [ Unsuspend ]  Restore access          │
  │  [ Blacklist ]  Permanent ban           │
  │  [ Un-blacklist ] Reinstate donor       │
  └─────────────────────────────────────────┘

  All actions require a confirmation dialog with a reason field.
  All actions are written to audit_logs immediately.
  Suspended donors: see a suspension notice on login; cannot access dashboard.
  Blacklisted donors: see a permanent ban notice on login; cannot access dashboard.
```

### 6.5 Hospital Management Flow

```
/admin/hospitals

Full hospital list with:
  Search: by name, registration number, city
  Filters: Pending Verification / Verified / Suspended / Blacklisted
  Sort: by registration date, total requests, city

Each row: Hospital Name | City | Verified | Total Requests | Status | Actions

Tapping a hospital → /admin/hospitals/:id

HOSPITAL DETAIL VIEW:
  Full profile: name, registration number, address, contact, department
  All blood requests (paginated, with outcomes)
  Donor ratings given by this hospital
  Total donations fulfilled via this hospital

ADMIN ACTIONS on Hospital:
  ┌─────────────────────────────────────────────────────────┐
  │  [ Verify ]      Grants full platform access            │
  │  [ Suspend ]     Temporary lock — cannot create requests│
  │  [ Unsuspend ]   Restore access                        │
  │  [ Blacklist ]   Permanent ban                         │
  │  [ Un-blacklist ] Reinstate hospital                   │
  └─────────────────────────────────────────────────────────┘

  Verification Flow (detailed):
    Admin reviews registration number, hospital name, city.
    Admin clicks [ Verify ].
    Confirmation dialog: "Verify [Hospital Name] and grant platform access?"
    On confirm:
      → hospitals.is_verified = true
      → Hospital receives push/email notification
      → Hospital's pending screen is replaced by full dashboard on next visit
      → Audit log entry created
```

### 6.6 Fraud Monitor Flow

```
/admin/fraud

THREE SECTIONS:

SECTION 1 — NO-SHOW FLAGS
  Donors automatically flagged by the nightly fraud detection cron:
    Flag criteria: no-show rate > 30% AND minimum 5 acceptances
  
  Table: Donor name | Total accepted | No-shows | No-show rate | First flagged
  Actions per row:
    [ Review Profile ] → /admin/donors/:id
    [ Issue Warning ]  → Sends in-app warning notification to donor
    [ Blacklist ]      → Immediate blacklist with confirmation

SECTION 2 — SUSPICIOUS ACTIVITY FEED
  System-generated flags for unusual patterns:
    - Donor accepted requests at multiple hospitals simultaneously
    - Hospital created 10+ requests in 1 hour
    - Unusual spike in cancelled requests from one hospital

SECTION 3 — BLACKLIST QUEUE
  Donors and hospitals currently blacklisted.
  Table with blacklist reason, date blacklisted, blacklisted by admin.
  Action: [ Un-blacklist ] with mandatory reason input.
```

### 6.7 Analytics Dashboard

```
/admin/analytics

SECTION 1 — PLATFORM OVERVIEW
  Date range selector: Last 7 days / 30 days / 90 days / Custom
  Metrics:
    Total requests created | Total donations completed
    Avg donor response time (by priority)
    Request fulfillment rate
    Donor acceptance rate

SECTION 2 — DEMAND ZONES
  Table and (future: map view): City × Blood Group × Request count
  Highlights: which blood groups are chronically short in which cities.

SECTION 3 — BLOOD GROUP DEMAND
  Bar chart: total requests per blood group in selected period.
  Overlay: fulfillment rate per blood group.

SECTION 4 — PEAK TIME MAPPING
  Hour-of-day heatmap: when do Critical requests most commonly occur?
  Day-of-week breakdown.
  Used to inform donor availability nudge campaigns.

SECTION 5 — DONOR ACTIVITY
  New registrations over time
  Donor retention at 30 / 60 / 90 days post-registration
  Active vs snoozed vs unavailable donor split (current snapshot)
```

### 6.8 Notifications Manager

```
/admin/notifications

COMPOSE BROADCAST
  Target audience: All Donors / All Hospitals / All Users / Specific City / Specific Blood Group
  Title (max 60 chars)
  Message (max 200 chars)
  Preview: shows how the notification will appear on device

  [Send Broadcast]
  → API: POST /admin/broadcast
  → FCM multicast to all target device tokens
  → Logged to audit_logs

BROADCAST HISTORY
  List of all past broadcasts:
    Date | Sender | Target | Title | Delivery count | Open rate
```

### 6.9 Audit Logs

```
/admin/audit

Immutable, append-only log of all significant actions on the platform.

Filters:
  By actor (admin name, hospital, system)
  By action type (donation.completed, donor.blacklisted, request.created, etc.)
  By date range

Each row:
  Timestamp | Actor | Role | Action | Entity Type | Entity ID | IP Address | Details

Records cannot be edited or deleted — enforced by RLS (INSERT only on audit_logs table).
Exported as CSV available for compliance audits.
```

---

## 7. Cross-Portal Flows

These flows involve interactions between multiple portals simultaneously. Understanding these is critical for engineering the real-time pipeline correctly.

### 7.1 Emergency Blood Request — Full End-to-End Flow

This is the core flow of the entire platform. It touches all three portals.

```
HOSPITAL PORTAL                    SYSTEM                        DONOR PORTAL
───────────────                    ──────                        ────────────

Hospital creates request
POST /hospital/requests
         │
         ▼
                         Eligibility engine runs
                         PostGIS radius query
                         Donors ranked by trust score
                         │
                         ▼
                         FCM notifications dispatched
                         BullMQ jobs created (10-min timers)
                                                                  Push notification arrives
                                                                  Donor taps → Alert screen
                                                                         │
                                                                  [ACCEPT] tapped
                                                                         │
                                                                  PATCH /respond {accept}
                                                                         │
Live Tracker auto-updates: ◄──────────────────────────────────── Socket.IO: 'donor accepted'
"Arjun K. — Accepted"               BullMQ job cancelled
         │
         │                                                        Donor sees Request Detail
         │                                                        Donor taps "I am on my way"
         │
Live Tracker updates: ◄────────────────────────────────────────── PATCH /status {en_route}
"Arjun K. — En Route"
         │
         │                                                        Donor taps "I have arrived"
         │
Live Tracker updates: ◄────────────────────────────────────────── PATCH /status {arrived}
"Arjun K. — Arrived"
         │
Hospital taps
"Mark Donation Complete"
         │
         ▼
POST /complete
         │
         ▼
                         POST-DONATION AUTOMATION (atomic):
                         1. donation_responses → 'donated'
                         2. donors.last_donated_at = now()
                         3. 90-day eligibility lock applied
                         4. donation_history record created
                         5. Trust score recalculated
                         6. blood_requests.units_fulfilled++
                         7. If all units fulfilled → request 'completed'
                         8. Badges checked and awarded
                         9. Certificate generated (async)
                         10. Thank-you push notification sent
                                                                  Donor receives:
                                                                  "Thank you for donating!
                                                                   Next eligible: Sep 5, 2026"
                                                                  Certificate available in History.

Live Tracker shows:
"Request Completed ✅"
[Rate this Donor]
```

### 7.2 No-Response / 10-Minute Retry Flow

```
SYSTEM                                HOSPITAL                          DONOR
──────                                ────────                          ─────

Notification dispatched to Donor A
BullMQ job queued (10 min delay)
                                                                  Donor A receives notification
                                                                  Does NOT respond within 10 min

BullMQ job fires:
  Check donation_responses for Donor A
  Status still 'notified' → 'no_response'
  Find next eligible donor (Donor B)
  Dispatch FCM to Donor B
  New BullMQ job created for Donor B

                         Socket.IO emits to hospital room:
                         'notification:retry' event
                         "Donor A did not respond.
                          Notifying next eligible donor."

Live tracker updates: ◄───────────────────────────────
"Ravi S. — No Response.
 Notifying next donor..."
                                                                  Donor B receives notification
                                                                  [ACCEPT / DECLINE]
```

### 7.3 Hospital Verification Flow (Admin ↔ Hospital)

```
HOSPITAL PORTAL                    ADMIN PANEL
───────────────                    ──────────

Hospital completes registration
Hospital sees /hospital/pending
                                   Admin dashboard shows:
                                   "1 new hospital pending verification"
                                   Admin navigates to /admin/hospitals?filter=pending
                                   Admin reviews hospital details
                                   Admin clicks [Verify]
                                   Confirmation dialog → Confirmed
                                   hospitals.is_verified = true
                                   Audit log entry created

Hospital receives notification:
"Your hospital has been verified.
 You now have full access to RedAid."

Next login → /hospital/dashboard ✅
```

### 7.4 No-Show & Fraud Escalation Flow

```
HOSPITAL PORTAL                    SYSTEM                         ADMIN PANEL
───────────────                    ──────                         ──────────

Hospital marks Donor as No-Show
PATCH /no-show
         │
         ▼
                         donation_responses.status = 'no_show'
                         donors.total_responses unchanged (counted at notify)
                         Trust score recalculated (lower reliability rate)
                         Audit log: 'donation.no_show'
                         │
                         ▼
                         Nightly cron checks all donors:
                         no_show_rate > 30% AND total_accepted >= 5
                                                                  Admin fraud dashboard:
                                                                  New flag appears for donor
                                                                  Admin reviews → [Blacklist]
                                                                  Donor account blacklisted
                                                                  Donor sees ban screen on login
```

---

## 8. Permission Matrix

A comprehensive table of every action in the application and who can perform it.

| Action | Donor (own) | Donor (others) | Hospital (own) | Hospital (others) | Admin |
|---|---|---|---|---|---|
| **Auth** | | | | | |
| Register | ✅ | — | ✅ | — | — |
| Login (OTP) | ✅ | — | ✅ | — | ✅ |
| Logout | ✅ | — | ✅ | — | ✅ |
| **Donor Profile** | | | | | |
| View own profile | ✅ | — | — | — | — |
| Edit own profile | ✅ (name, location) | — | — | — | — |
| View any donor's profile | ❌ | ❌ | ❌ | ❌ | ✅ |
| View donor's trust score | ✅ (own) | ❌ | ✅ (if on their request) | ❌ | ✅ |
| **Availability** | | | | | |
| Set Active / Snoozed / Unavailable | ✅ | — | — | — | — |
| **Eligibility** | | | | | |
| Check own eligibility | ✅ | — | — | — | — |
| **Blood Requests** | | | | | |
| Create blood request | ❌ | — | ✅ | — | ❌ |
| View own request details | ✅ (if matched) | — | ✅ | — | ✅ |
| Cancel request | ❌ | — | ✅ | — | ✅ |
| Accept request | ✅ | — | — | — | — |
| Decline request | ✅ | — | — | — | — |
| Mark En Route | ✅ | — | — | — | — |
| Mark Arrived | ✅ | — | — | — | — |
| Mark Donation Complete | ❌ | — | ✅ | — | ✅ |
| Mark No-Show | ❌ | — | ✅ | — | ✅ |
| Rate donor | ❌ | — | ✅ | — | — |
| **Donation History** | | | | | |
| View own history | ✅ | — | — | — | — |
| View hospital's request history | — | — | ✅ | — | ✅ |
| View all platform history | ❌ | — | ❌ | — | ✅ |
| Download certificate | ✅ (own) | — | — | — | ✅ |
| **Inventory** | | | | | |
| View hospital inventory | ❌ | — | ✅ (own) | ❌ | ✅ |
| Update inventory | ❌ | — | ✅ (own) | — | ✅ |
| **Surplus** | | | | | |
| Publish surplus | ❌ | — | ✅ | — | — |
| View/claim surplus | ❌ | — | ✅ | — | ✅ |
| **Gamification** | | | | | |
| View own badges | ✅ | — | — | — | — |
| View all badges | ❌ | — | ❌ | — | ✅ |
| **Admin Actions** | | | | | |
| Verify hospital | ❌ | — | ❌ | — | ✅ |
| Suspend donor | ❌ | — | ❌ | — | ✅ |
| Blacklist donor | ❌ | — | ❌ | — | ✅ |
| Suspend hospital | ❌ | — | ❌ | — | ✅ |
| Blacklist hospital | ❌ | — | ❌ | — | ✅ |
| View fraud monitor | ❌ | — | ❌ | — | ✅ |
| View analytics | ❌ | — | ❌ | — | ✅ |
| Send broadcast notification | ❌ | — | ❌ | — | ✅ |
| View audit logs | ❌ | — | ❌ | — | ✅ |

---

## 9. Navigation Map

A structural map of every screen and how they connect. Indentation indicates child routes.

### Shared / Auth

```
/                          → Redirect based on auth state
/login                     → OTP entry screen
/register/donor            → Donor registration form (new users only)
/register/hospital         → Hospital registration form (new users only)
```

### Donor Portal (`/donor/*`)

```
/donor/dashboard           ← HOME
  │
  ├── /donor/request/:responseId          (incoming alert — tap from notification or dashboard banner)
  │     └── /donor/request/:responseId/detail  (post-accept details)
  │
  ├── /donor/history                      (donation timeline)
  │     └── /donor/history/:id            (single donation detail)
  │           └── /donor/history/:id/certificate  (certificate viewer + download)
  │
  ├── /donor/badges                       (gamification screen)
  │
  ├── /donor/availability                 (availability toggle)
  │
  ├── /donor/notifications                (notification log)
  │
  └── /donor/profile                      (profile + edit)
```

### Hospital Portal (`/hospital/*`)

```
/hospital/pending          ← Landing for unverified hospitals
/hospital/dashboard        ← HOME (verified only)
  │
  ├── /hospital/requests/new              (create blood request form)
  │
  ├── /hospital/requests                  (request history list)
  │     └── /hospital/requests/:id/live   (live tracker for active request)
  │           └── /hospital/requests/:id/feedback/:responseId  (donor rating)
  │
  ├── /hospital/inventory                 (blood inventory manager)
  │
  ├── /hospital/surplus                   (cross-hospital surplus)
  │
  └── /hospital/profile                   (hospital profile + edit)
```

### Admin Panel (`/admin/*`)

```
/admin/dashboard           ← HOME
  │
  ├── /admin/donors                       (donor list)
  │     └── /admin/donors/:id             (donor detail + actions)
  │
  ├── /admin/hospitals                    (hospital list)
  │     └── /admin/hospitals/:id          (hospital detail + actions)
  │
  ├── /admin/fraud                        (fraud monitor)
  │
  ├── /admin/analytics                    (analytics dashboard)
  │
  ├── /admin/notifications                (broadcast composer)
  │
  └── /admin/audit                        (audit log viewer)
```

---

## 10. Error & Edge Case States

### Authentication Errors

| Scenario | What the User Sees | System Behaviour |
|---|---|---|
| Wrong OTP entered | "Incorrect code. 2 attempts remaining." | Counter decremented. After 5 failures: 30-min lockout. |
| OTP expired (> 5 min) | "Code expired. Request a new one." | Resend button becomes active after 30 seconds. |
| Phone number already registered | User is logged in to existing account, not shown as error | Normal login flow. |
| Account suspended | Suspension notice screen: "Your account has been suspended. Contact support." | No portal access. Support email shown. |
| Account blacklisted | Permanent ban screen: "Your account has been permanently banned." | No portal access. No further login possible. |

### Donor-Specific Edge Cases

| Scenario | What the Donor Sees | System Behaviour |
|---|---|---|
| Opens request alert after timer expired | "This request has been assigned to another donor. Thank you for your willingness." | No action taken. Donor returned to dashboard. |
| Tries to accept a second request while already active | Second request alert not shown at all | System does not notify donors with an accepted active request. |
| Pushes "En Route" but internet drops | Queued locally; retried on reconnect | PWA offline queue, status synced when online. |
| Last donation was less than 90 days ago | Eligibility screen: "🔒 Next eligible date: [Date]" | Donor excluded from all matching queries automatically. |
| Notification permission denied | Dashboard warning: "Enable notifications to receive emergency alerts." | Deep-link to browser notification settings. |
| Donor under 18 or over 65 at registration | Registration blocked: "You must be between 18 and 65 to register as a donor." | Age validation at registration step. |

### Hospital-Specific Edge Cases

| Scenario | What the Hospital Sees | System Behaviour |
|---|---|---|
| No eligible donors found | "No eligible donors found within 60km. We'll notify you when a match is found." | Request stays open. System retries on new donor registrations. |
| All notified donors decline or don't respond | Live tracker shows "All donors in queue exhausted. Expanding search." | Radius auto-expands in steps (15 → 25 → 40 → 60 km). |
| Hospital tries to create a request while unverified | Cannot access /hospital/requests/new; route guard redirects to pending screen | Server also returns 403 if API is called directly. |
| Hospital cancels a request with accepted donors | Confirmation: "Donors who accepted will be notified of cancellation." | FCM sent to accepted donors: "Request cancelled by hospital." response statuses → 'cancelled'. |
| Duplicate request for same blood group | Allowed — no restriction. Multiple concurrent requests per hospital are valid. | Each request is independent. |

### System-Level Edge Cases

| Scenario | Behaviour |
|---|---|
| FCM token invalid / expired | FCM delivery fails silently. Donor's token flagged as stale. Next donor in queue is tried. |
| BullMQ job lost (server restart) | Redis-persisted jobs survive restarts. Jobs resume automatically on server start. |
| Supabase Realtime disconnects | Client auto-reconnects with exponential backoff. Stale data banner shown if offline > 10 seconds. |
| API response > 5 seconds | Client shows a timeout error with a retry button. Request is not double-submitted. |
| Concurrent duplicate POST /complete | Idempotency enforced at DB level: `donation_history` records are unique per `(donor_id, request_id)`. Second call returns 409 Conflict. |

---

*End of Document — AppFlow v1.0*
*This document defines the authoritative navigation and permission structure for RedAid V1. Any new screen, user action, or role change must be reflected here before implementation begins.*
