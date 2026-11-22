# EventOS — Complete Product & Engineering Status Audit

| Field | Value |
|-------|-------|
| **Audit date** | 2026-11-12 |
| **Git ref** | `snapshot/2026-11-04-wip` @ `91feb7b` |
| **Remote note** | Diverged from `origin/main` (`a6034b7`): snapshot has Phase 2 mega-commit; main has Sprint 1 UAT merges not in snapshot |
| **Method** | Source-verified (Prisma, Nest modules, Next routes, clients, tests). Docs treated as claims until code confirms |
| **Constraint** | Read-only except creation of `docs/audit/*` |

---

## 1. Executive verdict

EventOS is a **substantial single-tenant We Decor operations platform** (NestJS API + Next.js Admin Portal + Prisma/Postgres + Redis), with real RBAC, CRM/ops/finance backends, and a broad Admin UI.

It is **not** yet:

- an **AI-powered** product (no LLM SDKs, prompts, or tool calling in code);
- a **commercially sellable multi-tenant SaaS** (ADR-016 single-tenant; no signup/billing);
- **production go-live complete** (no cloud deploy executed; founder live UAT / `v1.0.0` tag pending);
- a **decoration catalogue / package** product (that domain is absent).

**Honest readiness:** strong **internal ops MVP / RC** for We Decor; **weak** as marketed “AI-powered event business SaaS.”

**Overall readiness score: 5.6 / 10** (methodology in §9).

---

## 2. Repository discovery (verified)

### Layout

| Path | Present? | Notes |
|------|----------|-------|
| `apps/api` | Yes | NestJS 11 modular monolith |
| `apps/web` | Yes | Next.js 15 App Router, static export |
| `docs/` | Yes | Specs, business bible, reports, SaaS roadmap |
| `infrastructure/` | Yes | Docker, staging/prod scripts, DR/monitoring examples |
| `packages/` | **No** | Documented in `docs/10-folder-structure.md` but **not on disk** |
| Root workspace | **No** | Each app has its own `package.json` / lockfile |

### Frontend

- **Stack:** Next.js `15.5.20`, React `19.1`, TanStack Query/Table, Zustand, Zod, Axios, shadcn/ui patterns.
- **Mode:** `output: 'export'` (`apps/web/next.config.ts`) — static hosting.
- **Dev:** `http://localhost:3001` → API `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3000`).
- **Entry:** `apps/web/src/app/` (~**55** `page.tsx` routes). Auth via `AuthBootstrap` + client `ProtectedRoute` (no Next `middleware.ts`).
- **API client:** `apps/web/src/shared/api/client.ts` (`withCredentials: true`).

### Backend

- **Stack:** NestJS 11, Prisma 7, Passport JWT, Pino, Helmet, cookie-parser, Sentry (`@sentry/nestjs`).
- **Entry:** `apps/api/src/main.ts` — global prefix `api/v1`, CORS credentials, `/docs` non-prod.
- **Modules (under `apps/api/src/modules/`):** admin, analytics, auth, booking, calendar, checklist, communication, customer, dashboard, finance, inventory, lead, payment, quotation, staff, task, tenant, vendor (+ application-services / repositories modules).
- **OpenAPI:** exported to `apps/api/openapi/openapi.v1.json`; web generates `apps/web/src/types/api.generated.ts`.

### Database

- **ORM:** Prisma (`apps/api/prisma/schema.prisma`) — **54** models, **20** migrations.
- **Runtime deps:** PostgreSQL + Redis (ioredis used for health + login throttle).
- **Seed:** tenant We Decor + `admin@wedecor.events`; password only if `SEED_ADMIN_PASSWORD` set.

### AuthZ

- Access JWT (15m) + opaque refresh in HTTP-only cookie; HS256 pinned (`jwt.strategy.ts`).
- **9 roles**, **73 permissions** (`apps/api/src/modules/auth/domain/rbac.ts`).
- Global `JwtAuthGuard` + `PermissionsGuard`.

### External integrations (code vs docs)

| Integration | In application code? |
|-------------|----------------------|
| Sentry | **Yes** (API) |
| Redis / HIBP password check | **Yes** |
| Stripe / Razorpay / Twilio / SES / S3 SDK / OpenAI / Anthropic | **No** |
| WhatsApp | Channel **enum/metadata only** — no sender SDK |
| BullMQ | Listed in `package.json` — **no imports under `src/`** |
| Payment “gateway” | Internal `Payment` record/void only |

### AI / LLM

- **No** `openai` / `anthropic` / `@ai-sdk` dependencies in apps.
- `Suggestion` model + accept/dismiss API exist; **no creators / no web client / no LLM**.
- Staff “recommendations” are **rule/heuristic** scoring (`scheduling.application.service.ts`).
- Analytics are **deterministic SQL aggregates**, not AI insights.

### Deploy / CI

- Docker Compose: Postgres 16, Redis 7, API on host **4000** (`infrastructure/docker/docker-compose.yml`).
- **API Dockerfile only** — **no** `apps/web/Dockerfile`.
- GitHub Actions: PR + main (lint/test/build; main also e2e/migrate/docker build for API).
- Production checklist exists; operator boxes unchecked (R5 track incomplete for live go-live).

### Testing frameworks

| Layer | Tool | Observed this audit |
|-------|------|---------------------|
| API unit | Jest | **696 passed / 5 failed / 701 total** (88 suites; 1 suite failed) |
| API e2e | Jest (`test/*.e2e-spec.ts`) | **14** files present — **not executed** in this pass (DB-dependent; not run to avoid side effects beyond unit) |
| Web | Vitest | **120 / 120 passed** (29 files) |
| Playwright / Cypress | Absent | — |
| AI eval harness | Absent | — |

**Critical test finding:** five `QuotationApplicationService` approve tests fail because fixtures hardcode `validUntil: 2026-08-31`, and audit “today” is **2026-11-12**, so approve hits expiry `INVALID_STATE`. This is a **time-bomb in fixtures**, not necessarily broken approve logic — but the suite is **red now**.

---

## 3. What is already working (verified)

- Auth login/refresh/logout/password change; RBAC permission matrix; login throttle (auth endpoints).
- Lead list/create/stage/assign; follow-up **create**.
- Customer get/create/update by id; contacts/timeline/issues/reviews APIs; Customer 360 read models.
- Quotation header CRUD lifecycle: create/update/send/approve/reject/revise (API + most UI mutations).
- Booking lifecycle activate (`approved` → `in_preparation`), cancel; workspace progress/notes/checklists/staff assignments/procurements; profitability GET.
- Vendor master + procurement workflow (quotes, POs, transitions) + booking-scoped expenses.
- Inventory items/movements/reservations/damage/verification (API + web features).
- Staff members, availability, leave, scheduling calendar, assignment confirm/release.
- Ops calendar aggregation (read-only); communication **records**/templates/reminders/preferences (no send).
- Dashboards + analytics/reports surfaces; financial document **metadata**.
- Local Docker Postgres/Redis; health + readiness endpoints.

---

## 4. What is partially working

- Customer / quotation / booking / finance **discovery hubs** (open-by-UUID; many list APIs missing).
- Quotation **line items**: write APIs exist; **no GET**; **web client omits line-item calls** → Send can fail without API tooling.
- Advance payment **before** booking: API supports lead/quotation payments; UI records payments **only on booking** → conversion chicken-and-egg.
- Follow-ups: create UI; update API unused in web; no list API.
- Event requirements notes: stored/displayed; weak edit story.
- Vendor “services” as free text, not catalogue; vendor payments as human `VendorExpense`, not AP automation.
- Reminders/notifications: persisted preferences/records; **no outbound delivery**; header notifications “coming soon”.
- Settings Team / Integrations: **placeholder pages**.
- Execution status `in_execution`: modeled and required for Complete; **no API transition sets it** (activate only → `in_preparation`) → Complete unreachable via product UI/API path.

---

## 5. UI-only / mock / stub

| Item | Classification |
|------|----------------|
| Settings Team / Integrations | UI placeholder (`ModulePlaceholderPage`) |
| Header Notifications / Profile | Disabled / “soon” |
| Suggestion accept/dismiss | Backend stub without creators or UI |
| “AI” product narrative | **Marketing/docs only** relative to this repo |

No widespread hardcoded demo business datasets found in feature pages; hubs use empty states + open-by-id forms.

---

## 6. Completely missing (high signal)

- Decoration catalogue, packages, themes, galleries, custom décor request domain.
- PDF generation (quotation/invoice/packing).
- Object storage upload pipeline (S3/R2) — infra env examples only.
- Email / SMS / WhatsApp **send** providers.
- Payment gateway (Razorpay/Stripe).
- LLM features listed in product brief (qualification, NL quote, planning assistant, décor/vendor recs, message gen, budget optimization).
- Multi-tenant signup, plans, metering, super-admin SaaS console.
- Web Dockerfile / completed production deploy + founder sign-off (`v1.0.0`).

---

## 7. Critical bugs & broken E2E links

1. **Booking Complete unreachable:** `completeBooking` requires `status === 'in_execution'`; status PATCH only activates to `in_preparation` (`booking.controller.ts` + `booking.application.service.ts`). UI documents this (`booking-detail-page.tsx`).
2. **Quotation Send vs line items:** send requires line items; web has no line-item client (`quotations.api.ts` / detail page comments).
3. **Approve → Event vs advance UI:** event creation gated on confirmed advance; payment UI is booking-scoped → happy-path conversion broken in Admin Portal.
4. **Unit suite red:** 5 quotation approve tests fail due to expired fixture dates (2026-08-31 vs Nov 2026).
5. **Git divergence:** Phase 2 snapshot not integrated with `origin/main` UAT commits — release tagging risk.

---

## 8. Security snapshot (verified)

| Area | Status |
|------|--------|
| JWT HS256 pin | Present |
| Refresh HTTP-only cookie; Secure/SameSite by env | Present |
| Password policy + HIBP | Present |
| Login throttle | Present (auth) |
| Global API rate limit | **Absent** (High residual — P2-13) |
| Tenant scoping on repositories | Present pattern (`tenantId` in queries) |
| Zod validation pipes | Present on controllers |
| Helmet + CORS lockdown | Present |
| `dangerouslySetInnerHTML` in web | **None found** |
| File upload attack surface | **N/A** (no upload API) |
| Payment gateway / AI prompt injection | **N/A** (no gateway / no LLM) |
| Secrets in git | `.env.production` gitignored; use secret manager for prod |

Live penetration testing was **not** performed.

---

## 9. Readiness scores (/10)

| Category | Score | Rationale |
|----------|------:|-----------|
| Product completeness (ops CRM for We Decor) | **7** | Core lead→ops→finance present; décor domain & lists thin |
| Frontend completeness | **6** | Broad routes; hubs/placeholders/line-items/advance UX gaps |
| Backend completeness | **7.5** | Rich modules; some workflow holes (`in_execution`, lists) |
| Database maturity | **8** | 54 models, 20 migrations, coherent domain |
| AI maturity | **1** | No LLM; suggestion stub incomplete |
| Integration completeness | **2** | Sentry/Redis/HIBP only; no send/storage/PDF/pay |
| Testing maturity | **6** | Strong unit coverage; suite currently red; no FE e2e |
| Security | **7** | Solid authZ baseline; missing global throttle / prod hardening ops |
| Deployment readiness | **4** | Scripts/checklist exist; live deploy + web image missing |
| Commercial SaaS readiness | **2** | Single-tenant RC; no billing/onboarding/multi-tenant |

### Overall methodology

Weighted average emphasizing **honest commercial + AI claims** vs engineering depth:

- Product 15%, Frontend 10%, Backend 15%, DB 10%, AI 15%, Integrations 10%, Testing 10%, Security 5%, Deploy 5%, Commercial 5%.

\[
\begin{align*}
&0.15\cdot7 + 0.10\cdot6 + 0.15\cdot7.5 + 0.10\cdot8 + 0.15\cdot1 \\
&+ 0.10\cdot2 + 0.10\cdot6 + 0.05\cdot7 + 0.05\cdot4 + 0.05\cdot2 \\
&= \mathbf{5.6}
\end{align*}
\]

**Interpretation:** engineering platform maturity ≈ mid-high for a **single-tenant ops RC**; product/market claim fit (AI + SaaS) pulls the overall score down.

---

## 10. Companion documents

1. `EVENTOS_FEATURE_MATRIX.md` — capability-by-capability status  
2. `EVENTOS_ARCHITECTURE_REVIEW.md` — architecture strengths/weaknesses  
3. `EVENTOS_GAP_ANALYSIS.md` — gaps, bugs, broken workflows  
4. `EVENTOS_IMPLEMENTATION_ROADMAP.md` — prioritized milestones + effort  

---

## 11. Assumptions vs facts

| Statement | Class |
|-----------|-------|
| Module X exists with controllers/services/Prisma models cited | **Fact** |
| UI calls `/api/v1/...` via feature API clients | **Fact** |
| No OpenAI package in lockfile / no imports | **Fact** |
| Production cloud is not deployed | **Fact** (checklist unchecked; no evidence of live prod) |
| Founder UAT not signed off | **Fact** (R5-01 report: blocked) |
| Multi-tenant SaaS needed for commercial sale | **Product assumption** (roadmap asserts; not audited as market research) |
| Calendar/Analytics N+1 will hurt at scale | **Reasoned risk** from P2-13 + code shape; not load-tested here |

---

*End of project status audit.*
