# Cursor Prompt — P3-01 Gig Workforce: Worker Pool, Event Shifts & Job Broadcast

## Context (read first)

You are working in the EventOS monorepo (`apps/api` = NestJS + Prisma + PostgreSQL + Redis/BullMQ, `apps/web` = Next.js). Before writing code, follow the repo's own implementation rules:

- `eventos-feature-implementation/SKILL.md` and its `references/` (authority order, layer patterns, testing patterns, checklist, report template)
- `docs/07-domain-model.md`, `docs/08-data-model.md`, `docs/09-api-design.md`, `docs/18-api-standards.md`, `docs/14-security-principles.md`, `docs/20-definition-of-done.md`
- `docs/reports/EventOS-P2-05-Staff-Scheduling-And-Availability-Report.md` (the scheduling layer you are extending)

**Business goal:** We Decor cannot carry a large salaried team. Most event labour should come from a vetted pool of piece-rate (per-event) workers. When an event is booked, the owner creates "shifts" (e.g. 6 helpers + 2 florists), and the system broadcasts the job to matching gig workers, who accept first come first served. **Our own permanent team is the backup**: if gig workers don't fill a shift in time, the permanent team is notified automatically.

This must work like a **closed, vetted pool**, not an open marketplace. Only workers the owner has added can receive jobs.

## What already exists (reuse it, do NOT duplicate)

- `StaffMember` aggregate (`staff_members`), with `role`, `phone`, `employmentType` (`permanent | temporary`), `status`
- `StaffAvailability`, `StaffLeave`
- `StaffAssignment` (`proposed → confirmed → released | cancelled`), linked to `Event` via `bookingId`, with `role`, `isOnSiteLead`, `reportingAt`
- `SchedulingApplicationService`: conflict detection at confirm (`SCHEDULING_CONFLICT` → 409) and rule-based recommendations (availability + workload + employment type)
- `staff:read` / `staff:write` permissions, tenant scoping, AuditLog, BullMQ, `NotificationPreference` (has a `whatsapp` flag)

**Hard rule:** an accepted job must end up as a normal `StaffAssignment` that goes through the existing confirm path and conflict detection. The new feature sits *in front of* assignments; it doesn't replace them.

## Scope — Phase 1 (build this)

### 1. Data model (additive Prisma migration only)

**a) Extend `StaffEmploymentType`** with `gig`. Meaning:
- `gig` = per-event piece-rate worker (primary pool)
- `temporary` = existing meaning, treated like gig for broadcasts
- `permanent` = own team (backup wave)

**b) Add to `StaffMember`:**
- `skills String[]`: validated against the `skills.catalog` workforce policy setting (see section 8)
- `defaultRate Int?`: per-shift rate in paise
- `homeArea String?`: free-text locality (e.g. "Whitefield"), used for display/sort only
- `jobAlertsEnabled Boolean @default(true)`

**c) New model `EventShift`** (one row per role requirement on an event):
- `id, tenantId, bookingId (Event)`
- `skill` (one of the skill constants), `headcount Int`, `bufferCount Int @default(0)` (extra people to over-book for no-shows)
- `reportingAt DateTime`, `endsAt DateTime`, `venueLabel String?` (copied from event, editable)
- `ratePerPerson Int` (paise), `notes String?`
- `status`: enum `EventShiftStatus { draft, open, filled, closed, cancelled }`
- `backupEscalateAt DateTime?`: when to trigger the permanent-team wave (default: `reportingAt - 24h`, configurable)
- `backupEscalatedAt DateTime?`
- `createdAt, updatedAt, version`; indexes on `[tenantId, bookingId]`, `[tenantId, status]`

**d) New model `ShiftOffer`** (one row per worker notified):
- `id, tenantId, shiftId, staffMemberId`
- `wave`: enum `ShiftOfferWave { primary, backup }`
- `status`: enum `ShiftOfferStatus { sent, accepted, declined, expired, withdrawn, waitlisted }`
- `tokenHash String @unique` (store only the SHA-256 hash, never the raw token)
- `expiresAt DateTime` (default = shift `reportingAt`)
- `sentAt, respondedAt?, staffAssignmentId? (FK to StaffAssignment when accepted)`
- unique `[shiftId, staffMemberId]`
- indexes on `[tenantId, shiftId, status]`

### 2. Backend (NestJS, follow the existing layer pattern in `modules/staff`)

**EventShiftApplicationService**
- CRUD for shifts on an event (`staff:write`). Only `draft` shifts are fully editable. On `open` shifts, only `headcount`, `bufferCount`, `notes` and `backupEscalateAt` can change.
- `openShift(shiftId)`: sets status `open` and runs the **primary wave**:
  - Candidates: active StaffMembers in the tenant with `employmentType in (gig, temporary)`, `skills` containing the shift skill, `jobAlertsEnabled = true`, not on approved leave, and **no scheduling conflict** for the shift window (reuse `SchedulingApplicationService` conflict logic; don't reimplement it)
  - Rank with the existing recommendation score
  - Create a `ShiftOffer` (wave `primary`) per candidate with a fresh random token (32 bytes, base64url) and notify each one (see notifications)
- `escalateToBackup(shiftId)`: same flow, but candidates are `employmentType = permanent` and the wave is `backup`. Called by a BullMQ delayed job at `backupEscalateAt` if the shift is still not `filled`, and also callable manually ("Notify my team now" button). Idempotent: skip workers who already have an offer.
- `cancelShift`: offers become `withdrawn`, linked assignments are cancelled through the existing service, and accepted workers get a cancellation notice.

**ShiftOfferApplicationService (public, token-based)**
- `getOfferByToken(rawToken)`: returns safe public fields only: event date, reporting time, end time, venue label, skill, rate, notes, tenant display name, and an offer state (`available | already_filled | expired | accepted | declined`). **Never** return customer name, phone, address details beyond the venue label, pricing of the event, or other workers.
- `acceptOffer(rawToken)`: in **one DB transaction** with row locking (`SELECT ... FOR UPDATE` on the shift via `$queryRaw`, or optimistic `version` check with retry):
  1. Validate the token, that it hasn't expired, that the offer is `sent`, and that the shift is `open`
  2. Count accepted offers. If `accepted >= headcount + bufferCount`, mark the offer `waitlisted` and return `already_filled` (waitlisted workers get first priority if someone drops)
  3. Otherwise create the `StaffAssignment` (role = skill, `reportingAt` from shift) and **confirm it through the existing `StaffAssignmentApplicationService.confirmAssignment`**, so conflict detection runs. If it throws `SCHEDULING_CONFLICT`, roll back and return a clear "you have another job at this time" state
  4. Mark the offer `accepted`. If `accepted == headcount + bufferCount`, set the shift `filled` and mark the remaining `sent` offers `withdrawn`, with an optional "job filled" notice
- `declineOffer(rawToken)`
- If an accepted worker is later released or cancelled from the assignment side, reopen the shift (`filled → open`) and auto-offer to the first `waitlisted` worker, then to the next unsent candidate
- Write an AuditLog entry for open, escalate, accept, decline, cancel

**Public endpoints** (no JWT, under `/public/shift-offers/:token`, GET + POST `accept` + POST `decline`):
- Rate limit by IP and token (use the existing throttling approach or add `@nestjs/throttler`)
- Constant-time hash lookup, generic 404 for unknown tokens
- Tenant resolved from the offer row. Never trust any tenant input from the client
- Excluded from auth guards explicitly and documented in the security notes

**Authenticated endpoints** (`staff:read` / `staff:write`):
- `GET/POST /events/:bookingId/shifts`, `PATCH/DELETE /shifts/:id`
- `POST /shifts/:id/open`, `POST /shifts/:id/escalate-backup`, `POST /shifts/:id/cancel`
- `GET /shifts/:id/offers`: list with worker name, phone, wave, status and timestamps
- Update the OpenAPI export and regenerate `apps/web/src/types/api.generated.ts`

### 3. Notifications (provider abstraction)

Create a `WorkerJobNotifier` port in the staff domain with `notifyOffer`, `notifyFilled`, `notifyCancelled`. Implementations:
- `WebPushNotifier` (**primary in Phase 1**; see section 6): push to workers who installed the worker app
- `ManualShareNotifier` (**fallback**, used for workers with no push subscription): sends nothing itself. It returns a ready message plus a `https://wa.me/<phone>?text=<encoded>` link per worker so the owner can tap-send from the UI. Message format:
  `*We Decor — New job*\n{date}, {reportingTime}–{endTime}\n{skill} @ {venueLabel}\n₹{rate}\nAccept: {publicUrl}/j/{token}`
- `WhatsAppCloudNotifier`: behind a feature flag and integration settings, using approved template messages. Implement the interface and config, but keep it disabled by default. Never log tokens or full phone numbers.
- `LogNotifier` for dev/test

Store the raw token only in memory long enough to build the link. If the owner needs to re-share, a "regenerate link" action rotates the token.

### 4. Frontend (Next.js, follow `docs/17-ui-design-system.md` and the existing feature-folder pattern)

**a) Staff form/detail:** add employment type `gig`, multi-select skills, default rate, home area and a job alerts toggle. On the staff list, add filters for employment type and skill.

**b) Event workspace → new "Shifts" panel** (next to the existing Staff Assignment UI):
- Add shift: skill, headcount, buffer, reporting/end time (prefilled from the event), rate, notes
- Per shift: status chip, a fill bar (`accepted / headcount (+buffer)`), and buttons for **Open & notify**, **Notify my team now** and **Cancel**
- Offers list: worker, wave (Gig / Team), status, and a **WhatsApp** button (opens the wa.me link) for `sent` offers
- A clear warning when the shift is unfilled and less than 24h away

**c) Public job page `/j/[token]`:** outside `/app`, no login, mobile-first and very simple (workers use cheap Android phones):
- Big date/time, role, venue, pay; large **Accept** and **Decline** buttons
- States: accepted ✅ "Report at {time}", already filled, expired, conflict
- Make sure the static export config (`out/`) still works. If the public page needs dynamic rendering, handle it the way the project already handles dynamic routes, and document it

### 5. Tests (per `docs/15-testing-strategy.md`)

- Unit: candidate selection (skill, leave, conflict, employment type per wave), ranking reuse, and offer state machine transitions
- **Concurrency test:** 10 parallel accepts on a shift with headcount 3 + buffer 1 must produce exactly 4 accepted and 6 waitlisted, with no overfill
- Escalation job: fires only when the shift is not filled, is idempotent, and skips already-offered workers
- Release of an accepted worker → shift reopens → first waitlisted worker gets offered
- Public endpoint security: unknown token → 404, expired token, no PII leaks in the response, and rate limiting
- E2E (Playwright): create gig workers → create event shift → open → open public link → accept → assignment visible in the workspace

## 6. Gig Worker role & worker app (in scope)

The owner starts with a small, hand-picked group of workers and will have each of them install the app. The **in-app flow is the primary channel**. The token link from section 2 stays as a fallback for anyone without the app.

### 6a. Role & permissions (`apps/api/src/modules/auth/domain/rbac.ts`)
- Add the role `gig_worker` to `PHASE1_ROLES` (update the doc comment: ten roles), plus `docs/05`, `docs/09` (role × permission matrix) and `docs/14`.
- New permissions: `worker:jobs:read`, `worker:jobs:respond`, `worker:assignments:read`, `worker:profile:read`.
- `gig_worker` holds **only** these. It must get **no** access to leads, customers, quotations, finance, inventory, vendors, analytics, other staff or other workers.
- Every `worker:*` endpoint resolves the caller's `StaffMember` through `User.linkedStaffMember` (the existing `userId` link) and filters strictly to that staff member. Never accept a `staffMemberId` from the client. A user with role `gig_worker` and no linked StaffMember gets 403.
- Permanent team members may also be given `gig_worker` login if they don't already have a back-office role. If they have one, add the worker permissions to `coordinator` as well, so a coordinator can use the worker view for their own jobs.

### 6b. Phone + PIN login (no email, no SMS cost)
- Additive migration on `User`: `phone String?`, unique `[tenantId, phone]`, normalised to E.164 (`+91...`). Make `email` nullable, keeping the `[tenantId, email]` unique for non-null values. Check every place that assumes email is present (seed, auth service, DTOs, UI) and fix it.
- New endpoint `POST /auth/worker-login { phone, pin }`. It reuses the existing session/JWT issuance, password hashing (store the PIN hash in `passwordHash`), lockout and audit logic. The PIN is 6 digits. Lock the account for 15 minutes after 5 failed attempts. Return a generic error message (don't reveal whether the phone exists).
- Owner/admin action on the StaffMember detail page: **"Create app login"**. It creates a `gig_worker` User linked to the StaffMember, using the StaffMember's phone and an owner-set or generated PIN shown once. Also add **"Reset PIN"** and **"Disable login"**. Permission: `staff:write`.
- Skip the HIBP breached-password check for 6-digit PINs, but block trivial PINs (`000000`, `123456`, repeated or sequential digits).
- Long-lived session for workers (e.g. 30 days, sliding), using the existing session model, since they shouldn't log in before every job.

### 6c. Worker app (in `apps/web`, separate shell at `/worker`)
- Routes: `/worker/login`, `/worker` (Jobs), `/worker/jobs/[offerId]`, `/worker/my-jobs`, `/worker/profile`. These are mobile-only layouts with large tap targets, minimal text and support for Indian English. No back-office navigation.
- After login, `gig_worker` users always land on `/worker`. If they hit `/app/*`, redirect them to `/worker` (client-side guard, since the app is `output: 'export'`; the API is the real enforcement).
- **Jobs tab:** open offers for this worker (status `sent`), showing date, time, role, venue label and pay, with big Accept/Decline buttons. These call `POST /worker/offers/:id/accept|decline`, which must share the **same transactional accept logic** as the token flow (one service method, two entry points).
- **My Jobs tab:** upcoming confirmed assignments (date, reporting time, venue label, on-site lead name and phone), plus a past jobs list.
- **Profile tab:** name, phone, skills (read-only), a job alerts on/off toggle (writes `jobAlertsEnabled`), "Enable notifications" and logout.
- API endpoints: `GET /worker/offers`, `GET /worker/offers/:id`, `POST /worker/offers/:id/accept`, `POST /worker/offers/:id/decline`, `GET /worker/assignments?scope=upcoming|past`, `GET /worker/me`, `PATCH /worker/me/preferences`.

### 6d. Installable PWA + Web Push
- Add a web app manifest (name "We Decor Jobs", `start_url: /worker`, `display: standalone`, theme colour from the existing design tokens, icons 192/512) and a service worker. Make sure both work with the static export build.
- On `/worker`, show an **"Install app"** prompt (`beforeinstallprompt` on Android Chrome). Fall back to a short "Add to Home screen" instruction screen.
- Web Push with VAPID keys from env (add them to `env.schema.ts`). New model `PushSubscription { id, tenantId, userId, endpoint @unique, p256dh, auth, userAgent, createdAt, lastUsedAt }`. Endpoints: `POST /worker/push-subscriptions` and `DELETE /worker/push-subscriptions/:id`.
- `WebPushNotifier` sends a push for: new job offer ("New job: Florist, Sat 14 Dec, ₹1,500"), job filled/withdrawn, cancellation, and a reminder 3 hours before reporting time (BullMQ delayed job). Tapping a notification opens the relevant `/worker/...` screen.
- If a worker has no active subscription, or the push fails with 404/410 (delete the subscription), fall back to `ManualShareNotifier`. The owner then sees a WhatsApp button for that worker in the Shifts panel.

### 6e. Tests (add to section 5)
- RBAC: `gig_worker` gets 403 on every non-worker endpoint (generate the list from the controllers and test them all)
- Worker A cannot see or accept worker B's offer (404, not 403)
- PIN login: success, wrong PIN, lockout after 5 attempts, trivial PIN rejected, disabled login
- In-app accept and token accept race each other on the same shift without overfilling it
- Push: subscription create/delete, 410 cleanup, and fallback to manual share
- E2E: owner creates gig worker → creates app login → worker logs in on a mobile viewport → offer appears → accept → shows in My Jobs and in the event workspace

## 7. Security hardening (in scope, mandatory before release)

Existing baseline to keep and reuse: `helmet`, the HTTP-only refresh cookie (ADR-008), `LoginThrottleService`, AuditLog, tenant boundary (`docs/ai/PHASE1_TENANT_SECURITY_BOUNDARY.md`) and the HIBP check for passwords. Close these gaps:

### 7a. API
- **Global rate limiting** with `@nestjs/throttler` backed by Redis (multi-instance safe). Defaults: 120 req/min per user for authenticated calls and 30 req/min per IP for public calls. Tighter limits: `worker-login` 5/min per IP+phone, `/public/shift-offers/*` 10/min per IP, accept/decline 3/min per offer.
- **CORS:** fail startup in production if `CORS_ORIGIN` is `*` or empty (enforce in `env.schema.ts`). Use an explicit allowlist and `credentials: true` only for listed origins.
- **Helmet:** strict CSP for API responses, HSTS (1 year, includeSubDomains), `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, and `frame-ancestors 'none'`.
- **Access tokens:** short-lived (≤15 min). Worker sessions are long-lived only through refresh-token rotation with reuse detection (if a used refresh token is replayed, revoke the whole session family). Revoke all sessions immediately on "Disable login" and "Reset PIN".
- **Strict input validation:** every new endpoint uses Zod schemas with `.strict()` (no unknown keys), length limits, and enums for skill and status. Validate pagination limits (max 100).
- **IDOR protection:** every query on the new models includes `tenantId` and, for `worker:*` endpoints, the resolved `staffMemberId`. Add a repository-level helper that requires these arguments so they can't be forgotten. Return 404 (not 403) for resources outside the caller's scope.
- **Mass assignment:** DTO → domain mapping is explicit. Workers can never set `status`, `rate`, `skills`, `employmentType` or `role`.
- **Data minimisation in responses:** worker-facing DTOs are a separate type from admin DTOs (no shared "full" serializer). Workers never receive customer data, event pricing, other workers' data or internal notes.
- **Logging:** never log PINs, tokens, push keys, full phone numbers (mask to `+91******1234`) or auth headers. Add a redaction config to the existing logger and to Sentry (`instrument.ts`: `beforeSend` scrubbing).
- **Audit:** log worker login success/failure, PIN reset, login disabled, offer accepted/declined and push subscription changes, each with IP and user agent.
- **Secrets:** VAPID keys, JWT secrets and WhatsApp tokens come only from env, validated in `env.schema.ts`, and never committed. Add `.env*` checks to `.gitignore`.

### 7b. Web / worker app
- `next.config.ts`: `productionBrowserSourceMaps: false`, and no secrets in `NEXT_PUBLIC_*` (the VAPID public key only).
- Static export can't set headers, so set them at the hosting/CDN layer (document this in `docs/16-deployment-strategy.md` and add the config file for the current host): CSP (`default-src 'self'`, `connect-src` = API origin only, `frame-ancestors 'none'`, no `unsafe-eval`), HSTS, `Referrer-Policy`, `Permissions-Policy` (allow only notifications; deny camera, mic and geolocation for now).
- Keep the access token in memory only (no `localStorage`/`sessionStorage`). The refresh token stays in the HTTP-only `Secure` `SameSite=Strict` cookie.
- Service worker: cache only static assets and **never** cache API responses containing worker or job data. On logout, clear caches and unsubscribe push.
- Push payloads carry only a short title and an offer ID. The app fetches details after authentication, so no job details sit in notification storage.
- Auto-logout and a session check when the app is reopened after the refresh token expires. Show a "Logged out — contact We Decor" screen when the login is disabled.

### 7c. CI (`.github/workflows/pull-request.yml` and `main-branch.yml`)
- Add `pnpm audit --audit-level=high` (fail on high/critical), **gitleaks** secret scanning and **CodeQL** (JavaScript/TypeScript).
- Add a test that enumerates all controller routes and asserts each one has either `@Permissions(...)` or an explicit `@Public()` marker, so no endpoint is accidentally left open.

### 7d. Security tests (add to section 5)
- Rate limit tests for login, public offer and accept endpoints
- Refresh-token reuse → whole session family revoked
- Disable login → existing access/refresh tokens rejected on the next call
- Unknown body keys rejected, and over-long strings rejected
- A log-capture test confirming PINs and tokens never appear in logs
- Route-guard coverage test (7c)

### 7e. Report
Add a **Security Review** section to the P3-01 report: threat list (account takeover, IDOR, scraping, token leakage, over-fill race, push spoofing), the mitigation for each, and any residual risks.

## 8. Workforce Policy — configurable rules framework (in scope; foundation for all later phases)

**Principle:** no workforce business rule is hardcoded. Every number, threshold, timing, toggle and list (no-show limits, referral counts, buffers, escalation timing, rates, tiers, penalties) is a **policy setting** that the owner can change from Settings without a deploy. Code reads policy through one service and never through literals or env vars.

This is **not** a generic rules engine or DSL. It is a typed, validated, versioned settings registry. Keep it simple.

### 8a. Policy registry (code)
- Create `apps/api/src/modules/staff/domain/workforce-policy/` containing a **single registry** of policy definitions. Each definition has:
  - `key` (e.g. `broadcast.backupEscalateHoursBefore`)
  - `group` (UI section), `label`, `help` (one line, plain English for the owner)
  - `type`: `int | decimal | money_paise | boolean | duration_minutes | enum | string_list | tier_table`
  - `default`, `min`/`max` (or allowed values), and `unit` for display
  - `phase` (`P3-01`, `P3-02`, …). Settings for unbuilt phases are **declared but hidden** in the UI until their feature flag is on
- Derive a Zod schema from the registry and use it for API validation, the generated TS types for the web, and the UI form rendering. There's one source of truth.
- Adding a new rule later = add one registry entry and read it through the service. No migration needed.

### 8b. Storage (additive migration)
- `WorkforcePolicyVersion { id, tenantId, version Int, values Json, effectiveFrom DateTime, createdByUserId, changeNote String?, createdAt }`, unique `[tenantId, version]`
- Saving creates a **new version** (immutable history) and never overwrites. Values missing from the JSON fall back to registry defaults.
- `effectiveFrom` defaults to now, and can be set to a future date (e.g. "new rates from 1 Jan").
- AuditLog entry on every change, with a diff of changed keys.

### 8c. Policy service
- `WorkforcePolicyService.get(tenantId, at?: Date)` returns a fully typed, resolved policy object (defaults merged, validated), cached in Redis per tenant and version, with cache invalidation on save.
- **Snapshot rule:** when a shift is opened, store the policy version used (`EventShift.policyVersionId`). Offers, escalation, buffers and pay for that shift use the snapshot, so changing settings mid-week never changes the terms of jobs already sent. Later phases follow the same rule (e.g. payout uses the policy version on the event date).
- Overrides: tenant policy is the base layer. A shift can override `bufferCount`, `backupEscalateAt` and `ratePerPerson` explicitly (already in the shift model). Per-skill values (rates, buffers) live in a `tier_table`/map keyed by skill. No other override layers in Phase 1.

### 8d. Phase 1 settings (implement and wire these now)
| Key | Type | Default |
|---|---|---|
| `broadcast.primaryEmploymentTypes` | enum list | `[gig, temporary]` |
| `broadcast.backupEnabled` | boolean | `true` |
| `broadcast.backupEscalateHoursBefore` | int (hours) | `24` |
| `broadcast.maxCandidatesPerWave` | int | `50` |
| `broadcast.offerExpiryMinutesBeforeReporting` | duration | `0` |
| `shift.defaultBufferPercent` | int (%) | `15` (rounded up, min 0) |
| `shift.ratesBySkill` | map skill → paise | helper 80000, florist 150000, … (owner edits) |
| `shift.unfilledWarningHoursBefore` | int | `24` |
| `waitlist.enabled` | boolean | `true` |
| `waitlist.maxSize` | int | `10` |
| `assignment.allowWorkerCancelHoursBefore` | int | `12` (worker can't self-cancel inside this window) |
| `reminders.hoursBeforeReporting` | int list | `[24, 3]` |
| `worker.pinLockoutAttempts` | int | `5` |
| `worker.pinLockoutMinutes` | int | `15` |
| `worker.sessionDays` | int | `30` |
| `skills.catalog` | string list | `helper, florist, rigger, electrician, lighting, fabric_draping, carpenter, driver, supervisor` (replace the hardcoded list from section 1b) |

Security-sensitive keys (`worker.*`) must have hard `min`/`max` bounds in the registry (e.g. lockout attempts 3–10) so a bad setting can't weaken security.

### 8e. Declared now, hidden until their phase (registry entries only, no logic)
- **Reliability & discipline (P3-04):** `noShow.strikesToPause` (3), `noShow.strikeWindowDays` (90), `noShow.pauseDays` (14), `late.graceMinutes` (15), `late.countsAsHalfStrikeAfterMinutes` (30), `lateCancel.countsAsStrike` (true)
- **Ratings & tiers (P3-04):** `rating.scale` (5), `tiers` tier_table (name, minEvents, minAvgRating, maxNoShowRate, rateBonusPercent, earlyAccessMinutes), e.g. Bronze/Silver/Gold
- **Referrals (P3-05):** `referral.enabled`, `referral.bonusPaise`, `referral.qualifyingEvents` (3), `referral.maxActivePerWorker` (5), `referral.requireOwnerApproval` (true)
- **Trial (P3-05):** `trial.eventsRequired` (2), `trial.requirePairingWithTier` (Gold)
- **Check-in (P3-02):** `checkin.radiusMeters` (300), `checkin.requireSelfie` (true), `checkin.windowMinutesBefore` (60)
- **Pay (P3-03):** `pay.overtimeAfterHours` (10), `pay.overtimeMultiplier` (1.5), `pay.nightAllowancePaise`, `pay.nightStartsAt` ("23:00"), `pay.lateDeductionPaise`, `pay.payoutSlaHours` (24)

### 8f. UI — Settings → Workforce
- New page under the existing settings area, auto-rendered from the registry: grouped sections, the right input per type, help text, units, and "default: X" hints with a **Reset to default** action per field.
- Save asks for an optional change note and effective date. A **History** tab lists versions (who, when, what changed) with a "restore this version" button, which creates a new version.
- Permission: new `workforce_policy:write` (owner, admin) and `workforce_policy:read` (plus operations_manager). Workers never see policy.

### 8g. Tests
- A registry/Zod round-trip test, and bounds enforcement (out-of-range values rejected with clear messages)
- Missing keys resolve to defaults, and unknown keys are rejected
- Shift policy snapshot: change the policy after opening a shift, and the shift keeps the old values
- Future `effectiveFrom` isn't applied until that date
- A lint/test guard that fails if anything in `modules/staff` reads workforce numbers from literals instead of the policy service (at minimum, grep-based for the Phase 1 keys)

## Out of scope (later phases, do NOT build now)

- GPS/photo check-in at venue (P3-02)
- Payout ledger and UPI payment tracking (P3-03)
- Worker ratings and reliability-based priority (P3-04)
- A native (Play Store) app, and self sign-up by workers. Workers are created by the owner only

## Deliverables

1. Prisma migration, plus seed updates (a few gig workers with skills, and one permanent backup)
2. Backend modules, services, controllers, BullMQ escalation job, notifier port and adapters
3. Frontend: staff form updates, the workspace Shifts panel and the public `/j/[token]` page
4. Tests as listed, all green, with lint and typecheck passing
5. Report at `docs/reports/EventOS-P3-01-Gig-Workforce-Shift-Broadcast-Report.md`, using the repo's report template, including the security notes for public endpoints
