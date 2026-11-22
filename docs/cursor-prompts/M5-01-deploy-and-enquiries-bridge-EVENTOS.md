# Cursor Prompt — M5-01 (EventOS repo): Deploy EventOS + Enquiries Bridge (server side)

## Context (read first)

You are working in the **EventOS** monorepo (`apps/api` = NestJS 11 + Prisma 7 + PostgreSQL + Redis). Follow the repo's rules before writing code:
- `eventos-feature-implementation/SKILL.md` + `references/` (authority order, layer patterns, testing, checklist, report template)
- `docs/12-architecture-decisions.md`, **especially ADR-019** (EventOS is the single backend; phone-first Flutter app; step-by-step migration from Firebase)
- `docs/14-security-principles.md`, `docs/16-deployment-strategy.md`, `docs/18-api-standards.md`, `docs/20-definition-of-done.md`
- `docs/audit/EVENTOS_GIG_WORKFORCE_FIT_AUDIT.md` (sections 2, 4, 9)
- `infrastructure/production/README.md`, `infrastructure/staging/README.md`, `apps/api/Dockerfile`

**Business situation:** We Decor runs daily on the **We Decor Enquiries** app (Flutter + Firebase project `wedecorenquries`, region `asia-south1`). It is the system of record for leads, quotes and **Approved** bookings. EventOS is not deployed yet. This task is **ADR-019 phase 0 + phase 1 (server side)**:
1. Deploy the EventOS API to staging and production.
2. Let the Enquiries app users log into EventOS with their **existing Firebase login** (temporary bridge).
3. Receive **Approved bookings** from Firebase (one-way, temporary feed) and turn them into EventOS Customers + Events + Event Functions.

A matching prompt for the Enquiries repo (`M5-01-...-ENQUIRIES.md`) builds the Cloud Function that sends the feed, plus the Flutter API client. **Agree on the contract in section 4 exactly.**

**Hard rules:**
- **Do not** change the sales flow in the Enquiries app or write anything back to Firebase.
- **Additive migrations only.** No data loss.
- Nothing We Decor-specific in code. Tenant comes from config or the database (ADR-019 point 7).
- **Do not** build gig dispatch, worker login, or new web screens in this task (the Next.js web app is frozen by ADR-019).

---

## 1. Deployment (phase 0)

### 1a. Target, decided: Google Cloud, same project as Firebase
Use GCP project **`wedecorenquries`**, region **`asia-south1`** (Mumbai, same as the Firebase functions). Same project means the API's service account can verify Firebase tokens and later send FCM **without any key file**.

| Piece | Service |
|------|---------|
| API | **Cloud Run** service `eventos-api` (container from `apps/api/Dockerfile`), min instances 1 (prod) / 0 (staging), port 4000, concurrency 40 |
| Database | **Cloud SQL for PostgreSQL 16**: one instance, two databases `eventos_staging` and `eventos_prod`, private IP, automated daily backups + PITR (7 days), connected via the Cloud SQL connector / unix socket |
| Redis | **Memorystore for Redis** (Basic, 1 GB), connected through a Serverless VPC Access connector |
| Migrations | **Cloud Run Job** `eventos-migrate` running `prisma migrate deploy`, run before each deploy, never at app start |
| Secrets | **Secret Manager** (`JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, `ENQUIRIES_FEED_SECRET`, `SENTRY_DSN`), mounted as env vars. No secrets in the image or repo |
| Container registry | Artifact Registry `asia-south1-docker.pkg.dev/wedecorenquries/eventos` |
| DNS/TLS | Cloudflare DNS (per `docs/16`): `api.wedecorevents.com` → prod, `api-staging.wedecorevents.com` → staging, using Cloud Run domain mapping (or Cloudflare proxy with Full-Strict TLS) |
| Service account | `eventos-api@wedecorenquries.iam.gserviceaccount.com` with least privilege: Cloud SQL Client, Secret Accessor (only its secrets), Firebase Authentication Viewer (`roles/firebaseauth.viewer`). No Owner/Editor |

### 1b. Deliverables
- `infrastructure/gcp/` containing:
  - `README.md`: one-time setup commands (gcloud), in order, copy-pasteable, with placeholders for nothing secret
  - `deploy.sh <staging|prod>`: build → push → run migrate job → deploy Cloud Run revision → smoke test `/health/ready` → print URL. Fail fast on any step
  - `cloudrun.staging.yaml` / `cloudrun.prod.yaml` (service definitions, env, secrets refs, VPC connector, min instances)
  - `rollback.sh <staging|prod>`: route 100% traffic to the previous revision
- **GitHub Actions** `deploy.yml`: on push to `main` → deploy **staging** automatically. On a git tag `v*` → deploy **prod** after manual approval (GitHub Environment protection). Auth via **Workload Identity Federation**. No JSON keys in GitHub
- Update `apps/api/src/config/env.schema.ts` for every new env var (validated, with production-strict rules, like the existing CORS/JWT rules)
- Update `docs/16-deployment-strategy.md` with the chosen topology and the DR notes (backups, PITR, restore drill steps) in `infrastructure/disaster-recovery/`
- Seed for production: tenant "We Decor Events" + owner user only, via a one-off Cloud Run Job. **No demo data** in prod

### 1c. Production hardening (verify or add)
- `NODE_ENV=production` → existing strict CORS (explicit origins only), `/docs` disabled
- Add **`@nestjs/throttler` with Redis storage** globally (120 req/min per user, 30 req/min per IP unauthenticated). The integration endpoint gets its own limit (section 3)
- Trust proxy set correctly for Cloud Run (so the client IP is real for rate limits and audit)
- Structured JSON logs (Pino) to Cloud Logging. Redact `authorization`, `cookie`, `x-eventos-signature`, `idToken`, phone numbers (mask all but the last 4)
- Health: `/health` (liveness) and `/health/ready` (DB + Redis)

---

## 2. Firebase login bridge (temporary; delete when ADR-019 phase 3 ends)

**Goal:** a user signed into the Enquiries app (Firebase Auth) gets EventOS tokens without a second password.

### 2a. Endpoint
`POST /api/v1/auth/firebase/exchange`, marked `@Public()`, body `{ idToken: string }` (Zod `.strict()`, max 4096 chars).
1. Verify with `firebase-admin` `auth().verifyIdToken(idToken, /* checkRevoked */ true)`, project `wedecorenquries` (Application Default Credentials on Cloud Run; `GOOGLE_APPLICATION_CREDENTIALS` only for local dev, git-ignored).
2. Reject if: invalid/expired/revoked, `aud` ≠ project, user disabled, or token older than 5 minutes (`auth_time` is fine, but check `iat`).
3. Look up `ExternalIdentity { provider: 'firebase', subject: uid }`.
   - Found → load the linked `User`. If `User` is disabled → 403.
   - **Not found → 403 `IDENTITY_NOT_LINKED`. No auto-provisioning.** The owner links identities explicitly (2c). This avoids anyone with a Firebase account getting EventOS access.
4. Issue **the existing EventOS session**: same access JWT (15 min) + refresh token, through the existing token/session services. For mobile clients, return the refresh token **in the response body** (flag `client: 'mobile'` in the request) as well as the cookie, because the Flutter app stores it in secure storage. Reuse the existing refresh-rotation + reuse-detection logic unchanged.
5. Audit log: `auth.firebase_exchange` success/failure with uid (not the token), IP and user agent.
6. Throttle: 10/min per IP, plus the existing login throttle keyed by `firebase:<uid>`.

### 2b. Data model (additive)
`ExternalIdentity { id, tenantId, userId, provider String /* 'firebase' */, subject String /* uid */, email String?, linkedAt, linkedByUserId, lastUsedAt?, createdAt }`, unique `[provider, subject]`, index `[tenantId, userId]`.

### 2c. Linking
- `POST /api/v1/admin/external-identities` (`users:write` or the existing admin permission): `{ userId, provider: 'firebase', subject, email? }` → create the link. `DELETE` → unlink.
- CLI script `apps/api/scripts/link-firebase-users.ts`: reads a CSV (`uid,email,eventosRole,name`), creates EventOS Users if missing (role from CSV, no password) and the links. Dry-run by default, `--apply` to write. Print a summary. The owner runs this once for the current team.
- Role mapping guidance (documented, not hardcoded): Enquiries `admin` → EventOS `owner`/`admin`; Enquiries `staff` → `sales` or `coordinator` (owner decides per person in the CSV).

### 2d. Tests
Valid token → session issued; revoked/expired/wrong-audience/disabled → 401; unlinked uid → 403; disabled EventOS user → 403; refresh rotation works for mobile body tokens; audit entries are written; the throttle triggers.

---

## 3. Enquiries → EventOS booking feed (temporary)

### 3a. Endpoint
`POST /api/v1/integrations/enquiries/sync`, `@Public()` (no JWT), protected by an **HMAC signature**:
- Headers: `X-EventOS-Timestamp` (unix seconds), `X-EventOS-Signature: v1=<hex HMAC-SHA256(secret, timestamp + "." + rawBody)>`, `X-EventOS-Delivery-Id` (UUID).
- Verify against the **raw body** (configure the raw-body parser for this route only), with a constant-time compare, and reject if the timestamp skew is > 300 s. Secret from `ENQUIRIES_FEED_SECRET` (Secret Manager). Support **two active secrets** (`..._SECRET`, `..._SECRET_NEXT`) for rotation.
- **Replay protection:** store the delivery ID in Redis for 24 h; a duplicate returns 200 `{ duplicate: true }` without processing.
- Tenant: resolved from config `ENQUIRIES_FEED_TENANT_ID`, never from the body.
- Throttle: 120/min.
- Response: `200 { ok: true, eventId }` | `200 { ok: true, ignored: 'stale' | 'not_approved_never_synced' }` | `400` validation | `401` signature | `409` never (handle conflicts internally) | `5xx` → the sender retries.

### 3b. Payload contract (v1; Zod `.strict()` except `raw`)
```json
{
  "schemaVersion": 1,
  "source": "wedecor-enquiries",
  "enquiryId": "firestore-doc-id",
  "sourceUpdatedAt": "2026-11-23T10:15:00.000Z",
  "status": "approved | completed | cancelled | <other>",
  "customer": { "name": "string", "phone": "+91XXXXXXXXXX | null", "email": "string | null" },
  "event": {
    "eventType": "wedding", "eventTypeLabel": "Wedding",
    "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD",
    "guestCount": 300, "notes": "string | null",
    "assigneeName": "string | null"
  },
  "functions": [
    {
      "functionId": "string", "eventType": "haldi", "eventTypeLabel": "Haldi",
      "date": "YYYY-MM-DD", "time": "18:30 | null",
      "location": "string | null", "locationArea": "string | null",
      "locationAddress": "string | null", "locationPlaceId": "string | null",
      "lat": 12.97, "lng": 77.59,
      "notes": "string | null"
    }
  ],
  "money": { "totalCost": 250000, "advancePaid": 50000, "currency": "INR" }
}
```
- `money` is optional (sent only if the function can read the admin-only financial summary). Store it, but only expose it to finance/owner permissions.
- Dates are IST calendar dates. Store them as `@db.Date` with no timezone shifting, and times as `HH:mm` strings + `Asia/Kolkata`.

### 3c. Processing rules (one DB transaction per delivery)
1. Upsert `ExternalRecordLink { tenantId, source: 'wedecor-enquiries', externalId: enquiryId, entityType: 'event', entityId, lastSourceUpdatedAt, lastPayload Json, lastDeliveryId, syncedAt }`, unique `[tenantId, source, externalId]`.
2. **Ordering:** if `sourceUpdatedAt` ≤ `lastSourceUpdatedAt` → ignore as `stale` (200).
3. If there's no existing link and status is not `approved`/`completed` → ignore (`not_approved_never_synced`). Only approved bookings enter EventOS.
4. **Customer:** match by normalised phone (E.164) within the tenant, else by an exact email, else create one. Add `Customer.phoneNormalized String?` with unique `[tenantId, phoneNormalized]`. **Drop the `@@unique([tenantId, displayName])` constraint** (two customers can share a name). This is an additive-safe change, so check the existing code that relies on it and replace it with a non-unique index. Never overwrite a customer's name or email if EventOS has edited it after creation (track `Customer.externalManaged Boolean`, true only while created by the feed and never edited in EventOS).
5. **Event:** create or update. `Event.quotationId` is currently **required + unique**. Make it **nullable** (keep it unique when present), and add `Event.source String @default("eventos")` (`'wedecor-enquiries'` for synced events) and `Event.externalRef String?`. Map `startDate`/`endDate` to `eventStartDate`/`eventEndDate`, the main function's `location` to `venueName`, and `guestCount` and `notes` to `requirementsNotes` (prefixed `[From Enquiries]`). Status mapping: `approved` → `approved`, `completed` → `completed`, `cancelled` → cancel through the **existing booking cancel service** (so tasks and assignments follow existing rules), with reason `Cancelled in Enquiries app`. Other statuses on an already-synced event → keep the EventOS status, log a warning, and store it in the link.
6. **Event functions (new model, additive):** `EventFunction { id, tenantId, bookingId, externalFunctionId?, eventType, eventTypeLabel?, date @db.Date, time String?, venueName?, venueArea?, venueAddress?, placeId?, lat Decimal(9,6)?, lng Decimal(9,6)?, notes?, sortOrder, createdAt, updatedAt, version }`, with indexes `[tenantId, bookingId]` and `[tenantId, date]`. Replace the full set on each sync (match by `externalFunctionId`; delete missing ones **only if** nothing references them, otherwise mark `cancelled` with a status column). This is what gig shifts will attach to later (P3-01).
7. **Synced fields are read-only in EventOS** while `source = 'wedecor-enquiries'`: the API rejects edits to customer basics, event dates, functions and venue on synced events with `409 SOURCE_OWNED` ("Edit this in the Enquiries app"). Ops fields (workspace, tasks, staff, inventory, notes) stay fully editable.
8. Domain events: emit `booking.synced.created` / `booking.synced.updated` / `booking.synced.cancelled` (existing event emitter) for later use. No handlers are needed now beyond the audit log.
9. AuditLog entry for every processed delivery (enquiryId, action, changed fields).

### 3d. Admin visibility
- `GET /api/v1/integrations/enquiries/status` (owner/admin): last delivery time, counts for the last 24 h (processed / stale / ignored / failed), the last 20 errors.
- `POST /api/v1/integrations/enquiries/backfill-check` (owner/admin): accepts a list of `{ enquiryId, sourceUpdatedAt }` from the backfill script and returns which are missing or stale (used for reconciliation).

### 3e. Tests
Signature valid/invalid/expired/rotated secret; duplicate delivery ID; out-of-order updates (older ignored); create → update → cancel lifecycle; two customers with the same name; customer matched by phone; functions added/changed/removed; a function in use (stubbed) gets marked cancelled, not deleted; edits to source-owned fields return 409; money hidden from non-finance roles; a 50-delivery burst stays idempotent.

---

## 4. Contract summary (must match the Enquiries prompt exactly)
- Feed URL: `https://api.wedecorevents.com/api/v1/integrations/enquiries/sync` (staging: `api-staging.…`)
- Headers: `X-EventOS-Timestamp`, `X-EventOS-Signature: v1=<hex>`, `X-EventOS-Delivery-Id`, `Content-Type: application/json`
- HMAC input: `${timestamp}.${rawBody}`, SHA-256, hex, secret shared via Secret Manager (`ENQUIRIES_FEED_SECRET` in both projects; same GCP project, so one secret can serve both)
- Payload: section 3b, `schemaVersion: 1`
- Login exchange: `POST /api/v1/auth/firebase/exchange` `{ idToken, client: 'mobile' }` → `{ accessToken, expiresIn, refreshToken, user: { id, name, role, permissions } }`
- Refresh: the existing `POST /api/v1/auth/refresh` with `{ refreshToken }` in the body
- Write this contract to `docs/integrations/enquiries-bridge-contract.md` and generate the OpenAPI entries

---

## 5. Out of scope
Gig dispatch/worker login (P3-01), moving leads/quotes/follow-ups off Firebase (ADR-019 phase 3), any Next.js web changes, FCM sending.

## 6. Deliverables
1. Prisma migration (ExternalIdentity, ExternalRecordLink, EventFunction, Customer/Event changes) with a migration note
2. Auth exchange + linking API + CSV link script
3. Integration module (feed endpoint, processing, status, backfill-check)
4. `infrastructure/gcp/*`, the `deploy.yml` workflow, env schema updates and doc updates
5. Tests listed above, all green, with lint, typecheck and the OpenAPI drift check passing
6. Report `docs/reports/EventOS-M5-01-Deploy-And-Enquiries-Bridge-Report.md` (repo template), including a **Security Review** (token exchange, HMAC feed, replay, tenant resolution, least-privilege IAM) and an **Operator Runbook** (first deploy, link users, rotate the feed secret, rollback)
