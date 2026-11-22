# M0 + M1 — Core Workflow Completion Plan

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Baseline** | `snapshot/2026-11-04-wip` @ `91feb7b` |
| **Goal** | Close critical operational workflow gaps before AI |
| **Out of scope** | AI, multi-tenant migration, Kafka, Business Bible edits, destructive DB ops |

---

## 0. Git reconciliation strategy (no auto-merge)

### Current divergence

| Branch | Tip | Notes |
|--------|-----|-------|
| `snapshot/2026-11-04-wip` (HEAD) | `91feb7b` | Full Phase 2 + portal snapshot |
| `origin/main` | `a6034b7` | +2 commits: Sprint 1 UAT web/auth merge |

`origin/main...HEAD` = **2 ahead on main / 1 ahead on snapshot** (diverged histories).

### Safe strategy (manual, founder-approved later)

1. **Do not** `reset --hard` or force-push.
2. Continue **all M0/M1 work on `snapshot/2026-11-04-wip`** (or a child branch `m0-m1/core-workflows` cut from it).
3. After M0/M1 is green, reconcile via:
   - `git fetch origin`
   - Create merge PR: `snapshot` ← `origin/main` **or** rebase snapshot onto main in a dedicated PR
   - Resolve conflicts preferring snapshot for apps/* except where main UAT-only auth/web fixes are unique
4. Tag release only after reconcile + staging smoke.

**This milestone will not merge branches.**

---

## Phase 0 — Stabilization

| Task | Approach | Files |
|------|----------|-------|
| Fix 5 red quotation approve tests | Make `baseQuotation.validUntil` relative (`Date.now() + 30d`) so approve path is clock-safe; keep explicit past date for expiry test | `quotation.application.service.spec.ts` |
| BullMQ | Confirmed: dep in `package.json`, **zero** `src/` imports. **Quarantine**: leave dep (roadmap M3 will use queues); document as unused; do **not** remove without separate dep PR unless CI weight becomes an issue | `package.json` comment / report only |
| Regression | `apps/api pnpm test`, `apps/web pnpm test` | — |

**Acceptance:** API unit suite green; web 120+ green; no behavior change.

---

## Phase 1 — Quotation line items

### Backend

- Wire existing `QuotationLineItemApplicationService.listLineItems` to  
  `GET /api/v1/quotations/:id/line-items`  
  Permission: `quotations:read`
- No schema migration (model exists)
- OpenAPI export → regenerate web types

### Frontend

- `quotations.api.ts`: list / add / update / delete line items
- Quotation detail: line-item table + draft-only add/edit/delete forms
- Totals remain server-owned (mutations already recalculate via `calculateQuotationTotals`)
- Re-enable Send after ≥1 line item + total > 0 (server still authoritative)

### Tests

- API: listLineItems controller/service specs
- Web: API client + schema specs
- Manual/ path: send → approve still server-validated

---

## Phase 2 — Advance payment before booking

### Backend (minimal additive)

- `PaymentRepository.findByLeadId` / `findByQuotationId` (+ Prisma impl)
- `PaymentApplicationService` list methods
- Routes:
  - `GET /leads/:id/payments` (`payments:read`)
  - `GET /quotations/:id/payments` (`payments:read`)
- Keep `POST /payments` as single write path (already accepts leadId/quotationId)
- Duplicate prevention: preserve existing create validation; no new destructive rules; document idempotency as “client should not double-submit” + existing void path

### Frontend

- Generalize `PaymentsPanel` to accept `{ bookingId? | leadId? | quotationId? }` (exactly one primary anchor)
- Mount on lead detail + quotation detail
- Show confirmed-advance indicator (call existing advance semantics via list of confirmed payments or small read helper)
- Quotation approve UX: surface when `eventId` is null due to missing advance

### Tests

- Repository/service list by lead/quotation
- Web panel unit tests for anchor modes

---

## Phase 3 — `in_preparation` → `in_execution`

### Backend

- Add `BookingApplicationService.startExecution(tenantId, bookingId, { version })`:
  - Allowed only from `in_preparation`
  - Sets `status: 'in_execution'`
  - Publishes `BookingStatusChangedEvent` (same pattern as activate)
- Wire via `PATCH :id/status` when `body.status === 'in_execution'` **or** dedicated `POST :id/start-execution`  
  **Decision:** extend existing `PATCH :id/status` (schema already allows `in_execution`) to avoid new permission — reuse `bookings:status:update`
- Complete remains `POST :id/complete` requiring `in_execution` + EP1-BR-002
- Audit: domain event only (matches activate); no Business Bible change

### Frontend

- Booking detail / workspace: “Start execution” when `in_preparation`
- Enable Complete when `in_execution`

### Tests

- Valid transition, invalid from `approved`/`completed`, concurrency version mismatch

---

## Phase 4 — Follow-ups

### Backend

- `FollowUpRepository.findByLeadId(tenantId, leadId)`
- `GET /leads/:id/follow-ups` permission: reuse `leads:read` (list) ; writes stay `leads:followups:write`
- Existing `PATCH /follow-ups/:id` unchanged

### Frontend

- Lead detail: list follow-ups; mark done/cancelled; edit dueAt/notes via PATCH

### Tests

- List + update service/controller specs; web hooks

---

## Phase 5 — Operational discovery lists

### Shared pagination contract (new, additive)

```ts
// query
{ page?: number (default 1), pageSize?: number (default 20, max 100),
  q?: string, sort?: string, order?: 'asc'|'desc', ...domainFilters }

// response
{ data: T[], meta: { page, pageSize, total, totalPages } }
```

Introduce small helpers under `apps/api/src/shared/presentation/pagination.ts` (Zod + meta builder).  
Web: shared types + DataTable pagination where lists exist.

### Endpoints

| Resource | Method | Permission | Filters (v1) |
|----------|--------|------------|--------------|
| Customers | `GET /clients` | `clients:read` | `q` (name/phone/email), sort `createdAt`/`name` |
| Quotations | `GET /quotations` | `quotations:read` | `q`, `status`, `customerId`, `leadId`, sort `createdAt`/`quotationNumber` |
| Bookings | `GET /bookings` | `bookings:read` | `q` (venue/eventType), `status`, sort `eventStartDate`/`createdAt` |

Tenant scoping on every query. Additive repositories (`findPage` methods) — keep existing `findAll` for dashboards.

### Frontend

- Replace UUID hubs with list pages (keep open-by-id as secondary escape hatch if useful)
- Wire search + status filters + pagination controls

### DB

- Prefer existing indexes; add migration **only if** query plans require (e.g. `(tenantId, createdAt)`). Avoid destructive changes. If Prisma already has tenant indexes, skip migration.

---

## Phase 6 — Playwright E2E

| Item | Choice |
|------|--------|
| Location | `apps/web/e2e/` + `playwright.config.ts` |
| Dep | `@playwright/test` in `apps/web` |
| Auth | Seed admin via `SEED_ADMIN_PASSWORD` (document in report) |
| Scope | Happy path: lead → follow-up → quote → lines → send → advance payment → approve → activate → start execution → complete → payment/profitability |
| CI | Script `pnpm test:e2e` local-first; optional CI later (not blocking if env heavy) |

E2E may be marked `skip` in CI until staging credentials exist; must pass locally when API+web+DB up.

---

## Implementation order & regression gates

After each phase:

```bash
cd apps/api && pnpm test && pnpm openapi:export   # when API contract changed
cd apps/web && pnpm openapi:generate && pnpm test && pnpm typecheck
```

Phases 1→5 are sequential for contract regeneration; Phase 6 last.

---

## Acceptance criteria (milestone)

1. API unit tests green (incl. previously failing approve suite).
2. Web unit tests green.
3. Admin can manage quotation line items; Send/Approve work via UI.
4. Admin can record advance on lead/quotation; approve creates booking when gate passes.
5. Admin can transition booking to `in_execution` then Complete (subject to EP1-BR-002).
6. Lead follow-ups list + complete in UI.
7. Customers / quotations / bookings have paginated searchable lists (not UUID-only).
8. Playwright covers the 12-step workflow (local).
9. No AI / multi-tenant / Business Bible changes.
10. OpenAPI regenerated and web types synced.
11. Report documents remaining defects.

---

## Risk register

| Risk | Mitigation |
|------|------------|
| List pagination novel vs existing full-array APIs | Additive endpoints; dashboards keep `findAll` |
| Git diverge blocks release | Documented; no merge in this milestone |
| E2E flaky without seed password | Document required env; fail clearly |
| Complete still blocked by draft invoices | Preserve EP1-BR-002; E2E issues invoice or avoids draft |

---

*Plan frozen for M0/M1 execution. Deviations recorded in the implementation report.*
