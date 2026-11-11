# EventOS — Architecture Review

| Field | Value |
|-------|-------|
| **Audit date** | 2026-11-12 |
| **Git ref** | `snapshot/2026-11-04-wip` @ `91feb7b` |
| **Lens** | Principal architect — what the code *is*, not what docs promise |

---

## 1. System shape (as built)

```
Browser (Admin Portal, static Next export :3001)
    │  HTTPS / CORS + cookies (refresh) + Bearer access JWT
    ▼
NestJS API (:3000 local / :4000 compose)
    │  global JwtAuthGuard + PermissionsGuard
    │  Zod validation pipes · Result→HTTP mapping
    ▼
PostgreSQL (Prisma)  +  Redis (throttle/health)
```

There is **no** shared `packages/` library layer despite docs mentioning one. Two independently versioned apps share contracts via **frozen OpenAPI** export → web type generation.

---

## 2. Architectural strengths (verified)

### 2.1 Clear modular monolith

Domain modules under `apps/api/src/modules/*` follow a consistent layering:

- `presentation` (controllers, Zod OpenAPI schemas)
- `application` (services, DTOs)
- `domain` (repository ports)
- `infrastructure/persistence` (Prisma impls)

This is real structure, not folder theater — services return `Result<>`, controllers map via helpers.

### 2.2 Auth and tenancy discipline

- Access tokens are short-lived; refresh is opaque + hashed session rows.
- HS256 algorithm pinned (alg confusion mitigation).
- RBAC is explicit (`rbac.ts`) and enforced with `@Permissions(...)`.
- Repositories consistently take `tenantId` first — Phase-1 single tenant (`PHASE1_TENANT_ID`) is an intentional constraint, not accidental global tables for business data.

### 2.3 Contract-first API surface

OpenAPI document is generated from Zod/Nest metadata and checked in CI for drift. Web consumes generated types. This reduces silent contract skew (though RBAC matrix sync CI was called out as still missing in P2-13).

### 2.4 Domain richness vs demo apps

54 Prisma models cover lead→quotation→event→staff→vendor→inventory→finance→comms→analytics. This is a **real ops domain model**, not a thin CRUD skeleton.

### 2.5 Hard business rules encoded

Examples verified in code:

- EP1-BR-001 advance gate before event create from quotation.
- EP1-BR-002 draft-invoice gate before complete.
- Quotation approve requires `sent`, non-expired, `totalAmount > 0`.
- Optimistic concurrency via version / If-Match patterns on many mutations.

---

## 3. Architectural weaknesses

### 3.1 Workflow state machine incomplete

`Event.status` includes `in_execution`, and completion **requires** it, but the only status PATCH path activates to `in_preparation`. This is a **domain FSM hole** — statuses exist in the model without a transition API. Result: “Complete booking” is dead in product terms.

**Files:**  
`booking.controller.ts` (`PATCH :id/status`), `booking.application.service.ts` (`activateBooking`, `completeBooking`), web `booking-detail-page.tsx`.

### 3.2 Read-model / list API asymmetry

Write-heavy or id-centric resources (customers, quotations, bookings) lack list endpoints the Admin Portal needs for operable hubs. UI compensates with “paste UUID” hubs — workable for founders who know IDs, **not** for commercial SaaS UX.

### 3.3 Split-brain conversion path (quotation ↔ payment ↔ booking)

Advance payment can be recorded against lead/quotation in the payment API, but the Admin finance UI is **booking-scoped**. Booking creation depends on advance. Architecture allows the happy path; **product composition** breaks it.

### 3.4 Line items write-without-read

Quotation line-item mutations exist; no GET list embed. Portal cannot manage itemized pricing. Totals/approve/send rules assume line items exist — operators must use raw API.

### 3.5 “Suggestion” / AI seam without producers

`Suggestion` aggregate + accept/dismiss APIs implement a human-approval gate pattern (good architecture for future AI), but **nothing creates suggestions**. BullMQ is a dependency with **zero** job processors. The AI seam is aspirational scaffolding.

### 3.6 Integration boundary is documentation-shaped

Storage/email/AI keys appear in infra `.env.*.example` files but are **outside** `env.schema.ts` boot validation. That is healthy (don’t pretend integrations exist) — but it means the **runtime architecture has no FileService / Mailer / PaymentGateway ports implemented**.

### 3.7 Frontend static export + client-only auth

Static export simplifies hosting but:

- No Next middleware edge auth.
- All protection is client-side `ProtectedRoute` + API 401/403.
- Acceptable for Admin SPA; weak if expecting SSR/sessionized multi-tenant portals later.

### 3.8 God-ish composition modules

`application-services.module.ts` / `repositories.module.ts` centralize wiring. Fine for Phase 1 size; will become merge conflict and circular-dependency magnets as integrations grow. P2-13 already flagged split/isolation as medium debt.

### 3.9 Calendar / analytics aggregation style

Read models fan out across repositories (acceptable at We Decor scale). Without batching, this becomes an N+1 liability — architectural risk for SaaS multi-tenant load.

### 3.10 Git / release architecture drift

Product code on `snapshot/2026-11-04-wip` diverged from `origin/main`. Architecture of delivery (what is “the” product branch) is unclear — a process risk that becomes a production risk.

---

## 4. Frontend architecture notes

**Strengths**

- Feature folders (`features/*`) with `api/`, `hooks/`, `components/`, Zod schemas aligned to OpenAPI.
- Permission-aware navigation and `Can` gates.
- Explicit empty states documenting missing APIs (honest UX).

**Weaknesses**

- Placeholder settings (Team, Integrations).
- Dual Security nav entries (IA bug).
- Incomplete clients for known backend capabilities (line items, follow-up PATCH, lead/quotation payments).
- No Playwright e2e; Vitest covers units only.

---

## 5. Data architecture notes

**Strengths**

- Explicit money fields as integers (paise/cents style amounts) on finance aggregates.
- Soft workflow entities (procurement timeline events, audit logs, stage history).
- Attachment **metadata** models ready for storage keys.

**Weaknesses**

- No décor/package bounded context — pricing lives only on quotation lines as free text.
- `FinancialDocument.storageKey` without storage service = orphan metadata design.
- `legacyUserId` leftover called out in P2-13 (expand-contract debt).

---

## 6. Security architecture (condensed)

| Control | Assessment |
|---------|------------|
| AuthN | Strong for SPA + API |
| AuthZ | Strong RBAC; verify every new controller keeps `@Permissions` |
| Tenant isolation | Good query discipline; Phase-1 hardcodes one tenant — SaaS needs resolution middleware later |
| Abuse controls | Login throttle yes; **global** rate limit no |
| Supply chain | Standard Nest/Next; Sentry optional |
| Data exfil via AI | N/A (no LLM) |

---

## 7. Unnecessary complexity vs missing simplicity

| Observation | Verdict |
|-------------|---------|
| Result monad + domain events + audit | Justified for finance/ops correctness |
| Dual dashboard (`/dashboards/*`) + `/analytics/*` | Historical freeze; slightly confusing but intentional |
| Suggestion accept without create | Premature seam — complexity without payoff |
| BullMQ unused dependency | Dead weight — remove or use |
| Open-by-id hubs | Under-built UX, not over-engineered |

---

## 8. Fit to “AI-powered event SaaS” claim

| Claim layer | Architectural reality |
|-------------|----------------------|
| Event business management | **Largely fits** (ops/finance/CRM) |
| AI-powered | **Does not fit** — no inference stack |
| SaaS | **Does not fit** — single-tenant RC + no billing |

The codebase is best described architecturally as:

> **We Decor Event Operations Platform (modular monolith) with Admin SPA, release-candidate hardening, and integration seams stubbed for a future platform phase.**

---

## 9. Recommended architectural north stars (non-implementing)

1. Finish **FSM completeness** (status transitions) before adding AI.
2. Introduce real **integration ports** (File, Mail, WhatsApp, Payments) with adapters — don’t sprinkle SDKs in controllers.
3. Add **list/query read models** for operable SaaS UX.
4. Treat Suggestion as an **async job + policy** subsystem once an LLM exists; keep human approval.
5. Reconcile git mainline before production tags.
6. Keep Business Bible / OpenAPI freeze discipline — it is a strength.

---

*End of architecture review.*
