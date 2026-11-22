# EventOS — Gig Workforce Fit Audit

| Field | Value |
|-------|-------|
| **Audit date** | 2026-11-23 |
| **Branch** | `release/m0-m1-core-workflows` (8 ahead / 2 behind `origin/main`, **55 uncommitted files**) |
| **Requirement under review** | Uber-style job dispatch to a vetted pool of piece-rate event workers, with the permanent team as backup; worker app with its own role; configurable policies; security hardening |
| **Requirement source** | `docs/cursor-prompts/P3-01-gig-workforce-shift-broadcast.md` (sections 1–8) |
| **Method** | Source-verified against Prisma schema, Nest modules, auth/RBAC, web routing, CI, infrastructure, and the approved Business Bible (`docs/business/06-staff-management.md`) |

---

## 1. Verdict

EventOS is a **good foundation** for the gig model. About **40%** of what P3-01 needs already exists and is well built: staff master, assignments, leave and availability, conflict checks, RBAC, sessions with refresh-token rotation and reuse detection, tenant scoping, audit log and file storage.

The remaining 60% is new work. On top of that, there are **4 blockers** to clear before Cursor starts, and **9 corrections** the P3-01 prompt needs because some of its assumptions don't match the code.

**Fit score: 6.5 / 10.** The architecture fits well, but the delivery prerequisites (deployment, git state) and one business-policy conflict are open.

---

## 2. Blockers (resolve before P3-01 starts)

| # | Blocker | Evidence | Why it blocks | Recommendation |
|---|---------|----------|---------------|----------------|
| B1 | **The app is not deployed anywhere** | `EVENTOS_PROJECT_STATUS.md` §1: "no cloud deploy executed"; only `infrastructure/staging/production` scripts and checklists exist | PWA install and Web Push **require HTTPS on a real domain**. Workers cannot install the app from `localhost` | Deploy staging first (API + web on HTTPS, e.g. `jobs.wedecorevents.com`) before building the worker app |
| B2 | **Git state is unsafe** | 55 modified files uncommitted on `release/m0-m1-core-workflows`; branch has diverged from `origin/main` (8 ahead / 2 behind) | A large Cursor change on top of uncommitted work makes review and rollback impossible | Commit or stash the WIP, reconcile with `main`, and cut `feature/p3-01-gig-workforce` from a clean `main` |
| B3 | **Business Bible conflicts with first-come-first-served** | `06-staff-management.md` §10: *"Temporary decorator selection: **Not first-come-first-served**. Zakir contacts **preferred decorators first**"* | P3-01 as written changes approved policy. The repo's own rules forbid silent Business Bible changes | Change the dispatch model to **preferred-first waves** (see §5, correction C1) and record the policy change in the Business Bible v1.1, approved by Ilyas + Zakir |
| B4 | **BullMQ is installed but not wired** | `bullmq` is in `package.json`; `EVENTOS_PROJECT_STATUS.md` confirms "no imports under `src/`". No queue module or worker process | Backup escalation, reminders and preferred-wave timers all depend on delayed jobs | P3-01 must include queue infrastructure: a BullMQ module, a worker entrypoint, and Docker/compose and deploy changes |

---

## 3. What already exists and fits (reuse)

| Capability | Where | Fit for gig model |
|------------|-------|-------------------|
| `StaffMember` aggregate (name, role, phone, employmentType, status, optional `userId` link to `User`) | `schema.prisma` L935 | ✅ Directly reusable; add `gig` type, skills, rate, area and alerts flag |
| `StaffAssignment` lifecycle `proposed → confirmed → released/cancelled`, `isOnSiteLead`, `reportingAt` | L1067, `staff-assignment.application.service.ts` | ✅ An accepted offer becomes an assignment, as designed |
| Conflict check (inactive, overlapping booking, approved leave, unavailable) | `scheduling.application.service.ts` | ⚠️ Logic is reusable, but it is **day-level only** and N+1 (see G4) |
| Rule-based recommendations | same file, `recommendForBooking` | ⚠️ Hardcoded weights; gives **permanent staff +10**, the opposite of gig-first (see C5) |
| `StaffAvailability` (date and weekday blocks), `StaffLeave` | L980, L1026 | ✅ Feeds candidate filtering |
| RBAC: 9 roles, 73 permissions, global `JwtAuthGuard` + `PermissionsGuard`, `@Public()` decorator | `auth/domain/rbac.ts`, `presentation/guards`, `decorators` | ✅ Add the `gig_worker` role and `worker:*` permissions cleanly |
| Access JWT 15 min, HS256 pinned; opaque refresh in an HTTP-only cookie (`Secure`, `SameSite=strict` on deployed tiers) | `token.service.ts`, `auth.controller.ts` L209 | ✅ Already meets the security bar |
| **Refresh rotation + reuse detection** (revoke all user sessions on replay) | `auth.application.service.ts` L95–135 | ✅ Already built; P3-01 §7 must not rebuild it |
| **Strict CORS in staging/production** (wildcard fails bootstrap) | `env.schema.ts` L10, L114 | ✅ Already built; P3-01 §7a only needs to verify it |
| Login throttle: 5 fails / 15 min, escalating lockout, Redis | `login-throttle.service.ts` | ⚠️ Keyed by **email**; needs a phone key for worker login |
| Helmet, compression, cookie-parser, Pino, Sentry | `main.ts`, `instrument.ts` | ✅ Needs CSP/HSTS tuning and log redaction rules |
| AuditLog | `shared/audit` | ✅ Reuse for offer, login and policy events |
| `StoredDocument` with a pluggable storage provider (local / S3-compatible, secret encrypted) | L2208, `IntegrationSettings` | ✅ Reuse later for check-in selfies and before/after photos |
| `CommunicationRecord` + `Reminder` already link to `staffMemberId` | L2038, L2136 | ✅ Log worker notifications here for history |
| `NotificationPreference` (whatsapp / email / sms flags per user) | L2171 | ✅ Extend with `push` |
| `IntegrationSettings` (email/storage providers) | L2244 | ✅ The place to add WhatsApp Cloud and VAPID config |
| Web static export with a query-param route pattern (`/app/staff/view?id=`) + `useSearchParams` | `apps/web/src/app/app/staff/view/page.tsx` | ✅ Proven pattern for the worker app (see C3) |
| OpenAPI export → generated web types + a CI drift check | `openapi/`, `pull-request.yml` | ✅ New endpoints stay contract-checked |
| Tests: 119 API spec files, 32 web test files, Playwright e2e | — | ✅ Good base for the P3-01 test plan |

---

## 4. Gaps (new work required)

| # | Gap | Evidence | Needed for |
|---|-----|----------|-----------|
| G1 | No **phone login**; `User.email` is required and unique per tenant | `User` model L89 | Phone + PIN worker login |
| G2 | No **shift / offer / waitlist** models | schema | Core dispatch |
| G3 | **Events have dates, not times**; venue is only `venueName` (no address or geo) | `Event` L580: `eventStartDate @db.Date`, `venueName` | Shift times (P3-01 already adds `reportingAt`/`endsAt` on the shift). **Check-in (P3-02) will need venue address + lat/lng on `Event`** |
| G4 | Conflict detection is **day-granular** and does **one query per existing assignment** (N+1) | `detectConflictsForStaffOnBooking` | Two shifts on the same day (morning setup, night teardown) would be flagged as a conflict, or missed. Broadcasting to 50 candidates means ~50×N queries |
| G5 | No **global API rate limiting** (`@nestjs/throttler` absent) | `package.json` | Public offer links, worker API, scraping protection |
| G6 | No **push notifications**, PWA manifest or service worker; no WhatsApp sender | `apps/web/public` holds only Next default SVGs | Worker alerts |
| G7 | No **queue / scheduler** in use (see B4) | — | Escalation, reminders, waves |
| G8 | No **configurable policy store**; existing thresholds are code constants (`MAX_FAILED_ATTEMPTS`, recommendation weights) | `login-throttle.service.ts`, `scheduling.application.service.ts` | P3-01 §8 Workforce Policy |
| G9 | No **worker payout** model; `VendorExpense` is vendor-only (requires `vendorId`) | L1754 | P3-03 payouts (temps are paid a daily wage at end of event, in cash or UPI — Business Bible SM-11) |
| G10 | No **CI security scanning** (no audit, gitleaks or CodeQL) | `.github/workflows/*.yml` | P3-01 §7c |
| G11 | Web route protection is **client-side only** (`ProtectedRoute`, no middleware, because of static export) | `app/app/layout.tsx` | Acceptable only because the API enforces; worker-shell redirects follow the same pattern |
| G12 | `docs/10-folder-structure.md` documents a `packages/` folder that **doesn't exist** | status audit §2 | Cursor may create it; tell it not to |

---

## 5. Corrections needed in the P3-01 prompt

| # | Prompt says | Reality | Correction |
|---|-------------|---------|------------|
| C1 | Primary wave = all matching gig workers, **first come first served** | Business Bible: preferred decorators first | Replace with **waves**: **Wave 1 Preferred** (workers starred by the owner, or Gold tier later) gets an exclusive head start (`broadcast.preferredHeadStartMinutes`, default 60). **Wave 2 Pool** (other gig/temp workers) is first come first served. **Wave 3 Backup** is the permanent team. Add policy `broadcast.requireOwnerApproval` (default **true** for now): an accept becomes a *request* that Zakir or Ilyas confirms with one tap. Turn it off later for pure auto-dispatch. Add `StaffMember.isPreferred Boolean` |
| C2 | "Uses BullMQ" as if it exists | Not wired | Add a queue module, a separate worker process (`main.worker.ts`), a Redis connection reused from `database/redis.constants.ts`, and compose + deploy updates |
| C3 | Routes `/j/[token]`, `/worker/jobs/[offerId]` | `output: 'export'` can't serve unknown dynamic segments | Use the repo's query-param pattern: `/j?t=<token>`, `/worker/job?id=<offerId>`. Keep the token out of logs and analytics, and set `Referrer-Policy: no-referrer` |
| C4 | Conflict detection reused as-is | Day-level + N+1 | Add **time-window overlap** using shift `reportingAt`/`endsAt` (falling back to day-level for assignments without a shift). Add a **batch** method `detectConflictsForCandidates(staffIds[], window)` running 3 queries total, used by broadcast |
| C5 | Ranking reuses the existing score | Permanent gets +10 | Move weights into Workforce Policy (`ranking.*`) and make the employment-type bonus wave-aware |
| C6 | §7a "refresh rotation with reuse detection" as new work | Already built (P2-13) | Change to "verify and extend to worker sessions; add revoke-all on Disable login / Reset PIN" |
| C7 | §7a "fail startup if CORS is `*`" | Already enforced for staging/production | Change to "verify; add a test" |
| C8 | Login throttle reused | Keyed by email | Generalise the throttle key to `identifier` (email or phone) and read limits from policy within the hard bounds |
| C9 | Trial default `trial.eventsRequired = 2` | Business Bible: suitability is judged in **~5 events** | Default **5** |

Additional prompt notes:
- Skills: the Business Bible says specialisations are *"Not Yet Interviewed — must not be assumed"*. Keep `skills.catalog` configurable, and seed only `decorator, helper, supervisor, driver`. The owner adds others (florist, rigger, etc.).
- Business Bible removal rule ("stop contacting") maps to `StaffMember.status = inactive` + Disable login. Serious reasons (disrespecting customers, dishonesty) become a policy-free manual action with a required reason, which is audited.

---

## 6. Requirement coverage map

| Requirement | Status | Notes |
|-------------|--------|-------|
| Worker pool with skills, rates, alerts | 🟡 Partial | StaffMember exists; new fields needed |
| Shifts per event (role × headcount × buffer) | 🔴 New | |
| Job broadcast in waves + backup team | 🔴 New | Depends on queue (B4) and policy (C1) |
| First-come lock, no overfill, waitlist | 🔴 New | Transactional design in prompt is correct |
| Accept → confirmed assignment with conflict check | 🟢 Fits | Reuse confirm path; upgrade conflict granularity (C4) |
| `gig_worker` role, own-data-only access | 🟡 Partial | RBAC model fits; role, permissions and scoping helper are new |
| Phone + PIN login, long sessions, revoke on disable | 🟡 Partial | Sessions and rotation exist; phone identity is new (G1) |
| Installable worker app + push | 🔴 New | Needs deployment (B1) |
| WhatsApp manual share fallback | 🔴 New (small) | wa.me links, no API needed |
| Configurable Workforce Policy (versioned, snapshot per shift) | 🔴 New | |
| Security hardening | 🟡 Partial | Strong baseline; throttler, CSP/headers, redaction and CI scans are new |
| Check-in / payouts / ratings / referrals (later phases) | 🔴 Future | Needs G3 (venue geo) and G9 (payout model) |

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Workers don't install or use the app | Medium | High | WhatsApp share fallback from day 1; onboard each worker in person; keep the app to 3 tabs |
| iPhone workers get no push (iOS only supports Web Push for installed PWAs, 16.4+) | Low (most workers use Android) | Medium | Fallback to WhatsApp per worker automatically |
| Auto-dispatch lowers quality | Medium | High | `requireOwnerApproval = true` and preferred-first wave at launch |
| P3-01 scope too large for one Cursor run | High | Medium | Split into 3 PRs (see §8) |
| Uncommitted WIP lost or mixed into the feature | High | High | B2 first |

---

## 8. Recommended plan

1. **Week 0 — prerequisites:** clean git (B2) → deploy staging on HTTPS (B1) → Business Bible v1.1 policy update (B3).
2. **PR 1 — Foundations:** queue infrastructure (C2), Workforce Policy framework (§8 of prompt), `gig` type + skills + preferred flag, time-window batch conflict detection (C4), throttler + security headers + CI scans.
3. **PR 2 — Dispatch:** EventShift, ShiftOffer, waves (C1), owner approval, waitlist, Shifts panel in the workspace, WhatsApp share, public `/j?t=` page.
4. **PR 3 — Worker app:** phone + PIN login, `gig_worker` role, `/worker` shell, PWA install, Web Push, reminders.
5. **Then P3-02** check-in (add venue address + geo to Event) → **P3-03** payouts → **P3-04** ratings/tiers.

Apply corrections C1–C9 to `docs/cursor-prompts/P3-01-gig-workforce-shift-broadcast.md` and split it into the three PR prompts before handing it to Cursor.

---

## 9. Fit with the website and the Enquiries app (added 2026-11-23)

### What's live today (verified)

| System | Stack | Status | Role today |
|--------|-------|--------|-----------|
| **wedecorevents.com** (`Desktop/wedecorwebsite`) | Next.js on Vercel | Live | Marketing + contact form → `POST /api/contact` (Turnstile, rate limit, Zod) → Resend email + **webhook to Firebase `websiteLead`** (`X-Lead-Secret`). Reads event types from the app (`websiteFormOptions`) |
| **We Decor Enquiries** (`AppDevelopment/wedecorEnquries`) | Flutter + Firebase (Auth, Firestore, FCM, Functions `asia-south1`) | **Live (latest APK 2.0.57), used daily**; APK sideloaded from Firebase Hosting `/android`, plus Flutter web | **System of record for leads → quotations → Approved bookings.** Roles `admin`/`staff`, strict Firestore rules + rules tests, FCM push, Google Maps venue (placeId/lat/lng), follow-ups, reminders, re-engagement, money history, gitleaks/semgrep in CI |
| **EventOS** (`AppDevelopment/EventOS`) | NestJS + Postgres + Next.js | **Not deployed** | Ops back office (workspace, staff, inventory, vendors, finance) — **also has its own Lead/Quotation/Booking modules that duplicate the Enquiries app** |

**There is no integration between EventOS and either system today** (no Firebase/website references in `apps/api/src`).

### Findings

1. **Two sources of truth for leads and bookings.** Enquiries owns them in production, and EventOS duplicates them. Building gig dispatch on EventOS bookings means those bookings must come from Enquiries, or they will be re-typed by hand.
2. **The Enquiries app already solves three EventOS gaps:** native Android push (FCM), app distribution (APK page), and **venue geo** (needed for check-in, G3).
3. **Workers must not be added to the Enquiries app.** It holds customer phones, money and history, and its Firestore rules are role-based on `admin`/`staff`. A third role there widens the blast radius of every rule.
4. **The PWA + Web Push plan (P3-01 §6d) is weaker than native here:** the team already installs APKs, there's no iOS build to worry about, and FCM is proven in the current setup.

### Decision (recommended)

```
Website ──lead──▶ Enquiries app (Firebase)  ── leads, quotes, approval (unchanged)
                        │
                        │  Cloud Function on status → Approved (signed webhook, idempotent)
                        ▼
                    EventOS API (Postgres)   ── event ops + GIG DISPATCH brain
                        │  FCM via firebase-admin
                        ▼
              "We Decor Jobs" (new small Flutter Android app, APK) ── gig workers only
```

- **Enquiries stays the front door.** No change for the sales flow.
- **New one-way sync, Enquiries → EventOS:** when an enquiry moves to **Approved**, a Cloud Function POSTs it to `POST /api/v1/integrations/enquiries/approved` (HMAC-signed, same pattern as `websiteLead`). It is idempotent on the enquiry ID and upserts Customer + Event (with venue name, address, lat/lng, dates). Later status changes (date change, cancellation) sync the same way.
- **EventOS Lead/Quotation UI is hidden for We Decor** (feature flag) until a deliberate migration decision. Don't run two sales pipelines.
- **Worker app = separate Flutter app "We Decor Jobs"**, reusing the Enquiries app's theme, FCM setup and APK release pipeline. It talks **only to the EventOS API** (phone + PIN login from P3-01 §6b), with **no Firebase Auth and no Firestore access**. EventOS sends push with `firebase-admin` (FCM) using the same Firebase project, so there's one push setup.
- **Effect on the P3-01 prompt:** §6c/§6d (Next.js `/worker` PWA + Web Push) are replaced by the Flutter Jobs app + FCM device tokens (`DeviceToken` model instead of `PushSubscription`). The public `/j?t=` link stays on EventOS web as the WhatsApp fallback. Add a new prompt for the Enquiries → EventOS sync (Cloud Function + EventOS endpoint).
- **Blocker B1 shrinks:** only the EventOS **API** must be deployed on HTTPS for the Jobs app. The EventOS web back office can follow.

### Housekeeping noticed
- `serviceAccountKey.json` and `.env` sit in the Enquiries repo folder. They are correctly git-ignored and not tracked, but move the key out of the project folder anyway (a `.json` key on disk is easy to leak via zip or share).
- Enquiries repo has 32 uncommitted changes. Commit them before the sync work.
