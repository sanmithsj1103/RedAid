# Product Requirements Document
## RedAid — Real-Time Emergency Blood Coordination Platform

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | June 2026 |
| **Status** | Approved for Development |
| **Document Owner** | Product Team |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Product Vision](#2-product-vision)
3. [Target Users](#3-target-users)
4. [Core Features](#4-core-features)
5. [Screen Inventory](#5-screen-inventory)
6. [Key User Flows](#6-key-user-flows)
7. [Success Metrics](#7-success-metrics)
8. [Out of Scope](#8-out-of-scope)
9. [Development Phases](#9-development-phases)
10. [Privacy & Safety](#10-privacy--safety)
11. [Definition of Done](#11-definition-of-done)
12. [Design System](#12-design-system)

---

## 1. Project Overview

This document defines the full product requirements for a real-time emergency blood coordination platform. It serves as the single source of truth for design, engineering, and product decisions throughout the development lifecycle.

| Attribute | Detail |
|---|---|
| **Product Type** | Mobile-first progressive web application (PWA). Native iOS / Android apps planned for future release. |
| **Primary Market** | India (urban and semi-urban hospitals and blood banks) |
| **Document Version** | 1.1 — Approved |
| **Last Updated** | May 17, 2026 |
| **Document Owner** | Product Team |
| **Review Cycle** | Bi-weekly during active development |

### Problem Statement

There is no unified, real-time platform that maintains a verified database of blood donors and enables hospitals or organizations to instantly reach eligible donors. Existing solutions are fragmented, slow, and lack intelligent donor-matching, leaving hospitals helpless during critical emergencies.

### The Solution

A platform that connects hospitals directly to nearby eligible donors using intelligent filtering, multi-channel notifications, and real-time status tracking — automating the entire donation lifecycle from request creation to post-donation record update.

---

## 2. Product Vision

> *"No patient should wait for blood because the right donor couldn't be found in time."*

### Mission

To build the most reliable, fast, and intelligent blood coordination infrastructure in India — reducing blood shortage response time from hours to minutes.

### Strategic Goals

- Reduce average donor response time to under 15 minutes for critical requests
- Build a trusted, verified donor network with an 80%+ active donor retention rate
- Enable hospitals to manage real-time blood inventory and donor outreach from one dashboard
- Gamify donation to drive consistent, repeat donor behavior
- Provide admin-level analytics to map demand zones and anticipate shortage patterns

---

## 3. Target Users

| User Role | Who They Are | Core Need |
|---|---|---|
| **Donor** | Individuals aged 18–65 registered as blood donors | Receive alerts, respond quickly, track donation history |
| **Hospital Staff** | Doctors, nurses, blood bank admins managing requests | Create requests, track donors in real time, manage inventory |
| **Admin** | Platform operations team | Monitor system, manage users, detect fraud, view analytics |

### User Personas

#### Arjun, 28 — Regular Donor
A software engineer who donates blood every 3–4 months. He wants minimal friction — quick alerts, easy accept/decline, and a record of his contributions. Motivated by badges and certificates.

#### Dr. Meera, 42 — Hospital Blood Bank Admin
Manages blood requests for a 300-bed hospital. During emergencies she needs to find donors fast, track who is coming, and update inventory — all from one screen without making 20 phone calls.

#### Rahul, 35 — Platform Admin
Monitors platform health, flags fraudulent hospitals or no-show donor patterns, and generates weekly demand-zone reports for blood bank partnerships.

---

## 4. Core Features

### 4.1 — Real-Time Emergency Response

Hospitals create a blood request specifying blood group, units required, and priority level. The system immediately filters eligible donors and dispatches notifications. Donors can accept or decline directly from the notification with no additional steps.

### 4.2 — Smart Eligibility Checking

All criteria below must pass before a donor is notified:

- Blood group compatibility match
- Age between 18 and 65 years
- Last donation date more than 90 days ago (auto-enforced lock)
- Donor's self-set availability status is Active

### 4.3 — Location-Based Matching

- Default search radius: 15 km from the requesting hospital
- Auto-expands radius if insufficient donors found within initial zone
- Distance to hospital shown to donor before they confirm acceptance

### 4.4 — Emergency Priority System

| Priority | Definition |
|---|---|
| **Critical** | Life-threatening situation — immediate donor dispatch, all channels activated simultaneously |
| **Urgent** | Blood required within hours — standard multi-channel notification flow |
| **Scheduled** | Planned surgeries or non-emergency needs — standard notification with longer response window |

### 4.5 — Push Notifications

- In-app push notification via Firebase Cloud Messaging (primary and only channel for V1)
- If no response after 10 minutes, system auto-notifies the next eligible donor
- SMS and WhatsApp fallback channels planned for future release

### 4.6 — Live Status Dashboard (Hospital)

Hospitals track each request in real time through a live dashboard. Status stages:

1. Notifications Dispatched
2. Donors Accepted
3. Donors En Route / Arrived
4. Donation Completed

### 4.7 — Donor Trust & Reliability Score

Each donor has a computed trust score that influences their priority in future matching. Score is based on:

- Total successful donations
- Request response rate (accepted vs. declined)
- Reliability rate (accepted vs. actually donated)

Higher-scoring donors are prioritized in matching queues.

### 4.8 — Donor Features

- Full donation history timeline
- Downloadable digital certificate per completed donation
- Gamification — badges, streaks, and points for consistent donation behavior
- Donor rewards and medical benefits program
- Availability toggle — Active / Snoozed / Unavailable

### 4.9 — Hospital Features

- Blood inventory tracker by blood group with current stock levels
- Multi-unit requests (e.g., 3 units of O+)
- Post-donation donor rating and feedback
- Cross-hospital coordination — surplus blood flagged to nearby hospitals

### 4.10 — Post-Donation Automation

Once a hospital marks a donation as complete, the system automatically:

- Updates the donor's last-donated date
- Enforces a 90-day eligibility lock
- Recalculates the donor's trust score
- Generates and sends a digital donation certificate
- Sends a thank-you notification including the next eligible donation date

### 4.11 — Admin Panel

- Full user management for donors and hospitals
- Fraud detection — flags no-show patterns and suspicious activity
- Blacklist management for repeat offenders
- System analytics — donation trends, demand zones, and peak-time mapping

---

## 5. Screen Inventory

### Donor App

| Screen | Description |
|---|---|
| **Onboarding & Registration** | Sign up, blood group, age, location, health declaration |
| **Home / Dashboard** | Availability toggle, active alerts, trust score, next eligible date |
| **Incoming Request Alert** | Blood group, hospital name, distance, urgency — Accept / Decline CTA |
| **Request Detail** | Full request info, map view, hospital contact, navigation link |
| **Donation History** | Timeline of all past donations with status and certificates |
| **Certificate Viewer** | Downloadable digital certificate for each donation |
| **Badges & Gamification** | Earned badges, streak counter, points balance, rewards |
| **Availability Settings** | Set Active / Snoozed (with duration) / Unavailable |
| **Profile & Health Info** | Personal details, blood group, donation stats, edit options |
| **Notifications Log** | History of all received alerts and responses |

### Hospital App

| Screen | Description |
|---|---|
| **Login / Auth** | Hospital credentials, department selection |
| **Dashboard** | Overview of active requests, inventory summary, recent activity |
| **Create Blood Request** | Blood group, units, priority, notes — submit form |
| **Live Request Tracker** | Real-time status: notified → accepted → arrived → donated |
| **Blood Inventory Manager** | Current stock by blood group, low-stock alerts, update stock |
| **Request History** | All past requests with outcome data and donor feedback |
| **Donor Feedback** | Rate and comment on a donor post-donation |
| **Cross-Hospital Coordination** | Surplus flagging and incoming surplus from nearby hospitals |
| **Hospital Profile** | Hospital details, contact info, department management |

### Admin Panel

| Screen | Description |
|---|---|
| **Admin Dashboard** | Platform KPIs, active requests, system health indicators |
| **User Management — Donors** | List, search, verify, suspend, blacklist donors |
| **User Management — Hospitals** | List, search, verify, suspend hospitals |
| **Fraud & Abuse Monitor** | No-show flagging, suspicious activity feed, blacklist queue |
| **Analytics & Reports** | Donation trends, demand zones, peak times, blood group demand |
| **Notifications Manager** | Broadcast alerts, system maintenance notices |
| **Audit Logs** | Full activity log for compliance and debugging |

---

## 6. Key User Flows

### 6.1 — Emergency Blood Request Flow

| Step | Action |
|---|---|
| 1 | Hospital logs in and creates a blood request (blood group, units, priority) |
| 2 | System filters eligible donors: blood group + age + 90-day lock + availability status |
| 3 | Location-based radius match applied (15 km default, auto-expands if needed) |
| 4 | Multi-channel notification dispatched to matched donors |
| 5 | Donor accepts or declines from notification |
| 6 | If no response in 10 minutes, next eligible donor is notified automatically |
| 7 | Hospital tracks live: Accepted → En Route → Arrived → Donated |
| 8 | Hospital marks donation complete |
| 9 | System auto-updates last-donated date and enforces 90-day lock |
| 10 | Trust score recalculated, certificate generated, thank-you sent to donor |

### 6.2 — Donor Registration Flow

- Donor downloads app and initiates sign-up
- Enters personal info: name, age, blood group, location
- Completes health declaration form
- Verifies identity via OTP (phone number)
- Sets initial availability status
- Profile goes live — eligible for matching immediately if health criteria pass

### 6.3 — Post-Donation Loop

- Hospital marks donation as Completed in the app
- System timestamps the donation and locks donor eligibility for 90 days
- Trust score recalculated based on latest donation
- Digital certificate generated and sent to donor
- Thank-you notification sent with next eligible donation date
- Donation logged to donor's history timeline

### 6.4 — No-Show / Non-Response Flow

- Donor accepts a request but does not arrive within expected time window
- Hospital marks donor as No-Show
- System logs the event and adjusts donor's reliability score
- Repeated no-shows trigger admin fraud flag review
- Admin may issue warning or blacklist donor after threshold is crossed

---

## 7. Success Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| **Avg. Donor Response Time (Critical)** | < 15 minutes | Time from notification sent to donor acceptance |
| **Donor Acceptance Rate** | > 60% | Accepted / Total notifications sent |
| **Request Fulfillment Rate** | > 85% | Fulfilled requests / Total requests created |
| **Donor 90-Day Retention** | > 80% | Donors active after 90 days of registration |
| **Post-Donation Loop Automation** | 100% | Auto-updates after hospital marks complete |
| **No-Show Rate** | < 10% | No-shows / Total accepted requests |
| **App Crash Rate** | < 0.5% | Crash reports via monitoring tools |
| **Notification Delivery Rate** | > 98% | Delivered / Total dispatched notifications |

---

## 8. Out of Scope

The following are explicitly excluded from Version 1.0 and will be considered for future releases:

- Platelet or plasma donation workflows (whole blood only in V1)
- Integration with government blood bank databases or national health portals
- In-app payments or donor financial compensation
- AI-based demand forecasting or predictive shortage modeling
- Multi-language support beyond English and Hindi
- Wearable device integrations (e.g., fitness trackers for health eligibility)
- Public-facing donor discovery for individuals (hospital-initiated only)
- Desktop admin panel native application (web browser only)
- Native iOS / Android mobile applications (V1 is web-only PWA; native apps in V2)
- Automated blood transport logistics or fleet coordination

---

## 9. Development Phases

### Phase 1 — Foundation (Weeks 1–4)

- User authentication — Donor and Hospital roles with OTP verification
- Donor registration with health declaration and blood group tagging
- Hospital onboarding and profile setup
- Basic blood request creation form
- In-app push notification dispatch

### Phase 2 — Core Engine (Weeks 5–8)

- Smart eligibility engine — blood group + age + 90-day lock + availability
- Location-based donor matching with radius auto-expansion
- Push notification dispatch and 10-minute re-notification logic
- 10-minute re-notification logic for non-responsive donors
- Live request status dashboard for hospitals

### Phase 3 — Engagement & Trust (Weeks 9–12)

- Donor Trust and Reliability Score computation and display
- Post-donation automation loop
- Digital certificate generation
- Gamification — badges, streaks, and points system
- Donation history timeline for donors

### Phase 4 — Hospital & Admin Tools (Weeks 13–16)

- Blood inventory tracker with low-stock alerts
- Cross-hospital surplus coordination
- Admin panel — user management, fraud detection, blacklist
- System analytics dashboard — demand zones, trends, peak times
- Audit logging for compliance

### Phase 5 — Polish & Launch (Weeks 17–20)

- Full QA, performance testing, and security audit
- Accessibility review and UI polish
- Load testing for notification pipeline
- Beta launch with 3–5 partner hospitals and controlled donor pool
- Feedback loop integration and hotfix cycle

---

## 10. Privacy & Safety

### Data Privacy

- All personally identifiable information (PII) stored encrypted at rest and in transit (AES-256 / TLS 1.3)
- Donor health data shared with hospitals only on a need-to-know basis per active request
- Users may request full data deletion at any time (Right to Erasure)
- No donor PII exposed to other donors — only aggregate proximity data used
- All data handling compliant with India's Digital Personal Data Protection Act (DPDPA) 2023

### Platform Safety

- Hospitals must complete a verification process before going live on the platform
- Donors verified via OTP — phone number tied uniquely to one account
- Abuse reporting available for both donors and hospitals
- Automated no-show flagging with escalation to admin review
- Blacklist mechanism for repeat offenders on both donor and hospital sides

### Notification Safety

- Donor can set Snooze or Unavailable at any time — no notifications sent during these states
- Push notification opt-out available in settings (SMS/WhatsApp channels planned for future release)
- Critical request frequency capped to prevent notification fatigue

---

## 11. Definition of Done

A feature is considered **Done** when all of the following criteria are met:

### Engineering

- Feature code merged to main branch via reviewed pull request
- Unit tests written with minimum 80% coverage for business logic
- Integration tests passing for all API endpoints
- No critical or high-severity bugs open
- Performance benchmarks met (API response < 500ms, notification dispatch < 2s)

### Product

- Acceptance criteria from the feature ticket fully verified
- Edge cases and error states handled and tested
- Feature reviewed and signed off by the product owner

### Design

- UI matches approved Figma designs within acceptable variance
- Responsive behavior verified across mobile breakpoints
- Accessibility checklist completed — contrast ratios, touch targets, screen reader labels

### Security & Compliance

- No sensitive data exposed in logs or API responses
- Authentication and authorization verified for all new endpoints
- Data encryption confirmed for any new PII fields

---

## 12. Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| **Primary Red** | `#C0392B` | CTAs, alerts, priority indicators, brand accent |
| **Deep Dark** | `#1A1A2E` | Primary text, headings, navbar backgrounds |
| **Neutral Gray** | `#6B7280` | Secondary text, labels, metadata |
| **Light Gray** | `#F3F4F6` | Page backgrounds, card fills, input backgrounds |
| **Border Gray** | `#E5E7EB` | Dividers, table borders, input borders |
| **White** | `#FFFFFF` | Card surfaces, modal backgrounds, text on dark fills |
| **Success Green** | `#16A34A` | Confirmed donations, eligibility pass indicators |
| **Warning Amber** | `#D97706` | Snooze states, moderate urgency indicators |
| **Critical Red** | `#DC2626` | Emergency priority banners, critical alerts |

### Typography

| Style | Specification |
|---|---|
| **Display / Hero** | Plus Jakarta Sans Bold, 36–48pt, color: Deep Dark |
| **Heading 1** | Plus Jakarta Sans Bold, 28–32pt, color: Deep Dark |
| **Heading 2** | Plus Jakarta Sans SemiBold, 22–24pt, color: Primary Red |
| **Heading 3** | Plus Jakarta Sans SemiBold, 18–20pt, color: Deep Dark |
| **Body — Default** | Inter Regular, 14–16pt, color: #374151 |
| **Body — Secondary** | Inter Regular, 12–13pt, color: Neutral Gray |
| **Label / Caption** | Inter Medium, 11–12pt, color: Neutral Gray |
| **CTA / Button** | Plus Jakarta Sans Bold, 14–16pt, color: White on Red background |

### Component Guidelines

- **Buttons:** Primary (Red fill, White text), Secondary (White fill, Red border), Destructive (Dark fill, White text)
- **Cards:** White background, 8px border radius, subtle drop shadow, 16px internal padding
- **Input Fields:** Light gray background, 1px border-gray border, 4px radius, 44px minimum height for touch
- **Badges:** Pill-shaped, color-coded by blood group, 6px horizontal padding
- **Alerts / Banners:** Full-width, left-colored border indicating severity (Red / Amber / Green)
- **Status Indicators:** Dot + label pattern — Green (active), Amber (snoozed), Gray (unavailable), Red (critical)

### Spacing & Grid

- Base unit: 4px — all spacing in multiples of 4
- Mobile content max-width: 390px, 16px horizontal padding
- Tablet content max-width: 768px, 24px horizontal padding
- Touch targets: Minimum 44×44px for all interactive elements
- Section spacing: 32px between major sections, 16px between related components

### Iconography

- Icon library: Lucide Icons (MIT license, consistent stroke weight)
- Standard size: 20×20px in-line, 24×24px standalone actions
- Color: Inherits from parent text color — never standalone colored icons

### Motion & Feedback

- Transition duration: 150ms (micro), 300ms (modal/drawer), 500ms (page)
- Easing: ease-in-out for all UI transitions
- Haptic feedback on mobile for Accept / Decline donation actions
- Loading states: Skeleton screens preferred over spinners for content-heavy screens

---

*End of Document — Version 1.0*
*This is a living document. Updates subject to product team review.*
