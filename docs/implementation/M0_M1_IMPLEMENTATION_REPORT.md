# M0 + M1 — Implementation Report

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Branch** | `snapshot/2026-11-04-wip` |
| **Baseline commit** | `91feb7b` |
| **Plan** | [M0_M1_IMPLEMENTATION_PLAN.md](./M0_M1_IMPLEMENTATION_PLAN.md) |

---

## Executive summary

Critical operational workflow gaps are closed on the snapshot branch: quotation line-item management, pre-booking advance payments, booking `in_execution` transition, follow-up list/complete UI, and paginated discovery lists for customers/quotations/bookings. OpenAPI was regenerated and web types synced. Unit regressions are green. Playwright covers the 12-step workflow and skips cleanly without seed credentials. No merge with `origin/main`, no AI work, no schema migrations, no Business Bible edits.

---

## Phase outcomes

### Phase 0 — Git & test stabilization

| Item | Result |
|------|--------|
| Branch strategy | Continued on `snapshot/2026-11-04-wip`. Divergence vs `origin/main`: **2 ahead on main / 1 ahead on snapshot**. No merge/reset performed. |
| Quotation clock fixtures | `validUntil` / event dates made relative to `Date.now()` in `quotation.application.service.spec.ts` |
| BullMQ | Dependency present (`bullmq` in `apps/api/package.json`); **zero** `src/` imports. Quarantined for M3 queues — not removed. |
| API unit | **705 passed / 0 failed** (was 696/5) |
| Web unit | **121 passed / 0 failed** (was 120) |

### Phase 1 — Quotation line items

- `GET /api/v1/quotations/:id/line-items` (`quotations:read`)
- OpenAPI export + `apps/web` type regen
- Web: list/add/update/delete via `quotations.api.ts` + `quotation-line-items-panel.tsx`
- Totals remain server-owned (`calculateQuotationTotals` on mutations)
- Send/Approve remain server-gated

### Phase 2 — Advance payment before booking

- `PaymentRepository.findByLeadId` / `findByQuotationId`
- `GET /api/v1/leads/:id/payments`, `GET /api/v1/quotations/:id/payments`
- `PaymentsPanel` multi-anchor (booking \| lead \| quotation)
- Confirmed-advance indicator on lead/quotation
- Single write path `POST /payments` preserved (idempotency / void unchanged)

### Phase 3 — Event execution lifecycle

- `in_preparation → in_execution` via existing `PATCH /bookings/:id/status` + `startExecution` service method
- Permission: `bookings:status:update`
- Domain event / version checks preserved
- Admin UI: **Start execution** → enables **Complete** only when `in_execution`
- Invalid transition coverage in booking service specs

### Phase 4 — Follow-up management

- `GET /api/v1/leads/:id/follow-ups` (`leads:read`)
- Lead detail: list, schedule, mark **Done** via existing `PATCH /follow-ups/:id`

### Phase 5 — Operational discovery

Shared pagination helper: `apps/api/src/shared/presentation/pagination.ts`

| Resource | Endpoint | Permission |
|----------|----------|------------|
| Customers | `GET /api/v1/clients` | `clients:read` |
| Quotations | `GET /api/v1/quotations` | `quotations:read` |
| Bookings | `GET /api/v1/bookings` | `bookings:read` |

Web hubs replaced UUID-only empty states with searchable paginated tables; open-by-id retained as escape hatch.

### Phase 6 — Playwright E2E

| Item | Detail |
|------|--------|
| Location | `apps/web/e2e/core-workflow.spec.ts` + helpers |
| Config | `apps/web/playwright.config.ts` |
| Script | `pnpm test:e2e` (apps/web) |
| Auth | `E2E_ADMIN_PASSWORD` or `SEED_ADMIN_PASSWORD`; email default `admin@wedecor.events` |
| CI behavior | **1 skipped** when password unset (verified) |
| Live run | Requires API + web + seeded admin; not executed end-to-end in this session (local API unhealthy / no seed password in env) |

Covers: customer → lead → follow-up → quotation → line items → send → advance payment → approve/booking → start preparation → start execution → complete → final payment/profitability, with API entity assertions.

---

## Changed files (high level)

### API

- Quotation: controller/service/repo + line-item GET; list page; clock-safe specs
- Payment: lead/quotation find + list services; controller routes via lead/quotation modules
- Booking: `startExecution`, list page, controller GET list + status path; specs
- Customer: `findPage` + GET list
- Lead: follow-up list endpoint/service
- Shared: `pagination.ts`
- OpenAPI: `apps/api/openapi/openapi.v1.json`
- Spec mock updates for new `findPage` on repositories used by dashboards/finance/etc.

### Web

- Quotations: API/schemas/hooks, line-items panel, detail, hub list
- Finance: multi-anchor payments panel + query hooks
- Leads: follow-up list/API/hooks/detail
- Bookings: list API/schemas, hub, start-execution UI
- Customers: list API/schemas, hub
- Types: `api.generated.ts`
- E2E: Playwright dep + config + core workflow spec

### Docs

- `docs/implementation/M0_M1_IMPLEMENTATION_PLAN.md` (earlier)
- This report

### Database

- **No Prisma migrations**
- **No destructive operations**
- Relies on existing indexes / tenant-scoped queries

---

## API contract additions (additive)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/quotations/:id/line-items` | Line item read |
| GET | `/quotations` | Paginated list |
| GET | `/clients` | Paginated list |
| GET | `/bookings` | Paginated list |
| GET | `/leads/:id/follow-ups` | Follow-up list |
| GET | `/leads/:id/payments` | Pre-booking payments |
| GET | `/quotations/:id/payments` | Pre-booking payments |
| PATCH | `/bookings/:id/status` | Now supports `in_execution` transition from `in_preparation` |

Frozen-contract discipline: export → `pnpm openapi:generate` → typed clients.

---

## UI changes

- Quotation detail: line-item CRUD + payments panel
- Lead detail: follow-ups + payments
- Booking detail: Start preparation / Start execution / Complete gated by status machine
- Hubs: Customers, Quotations, Bookings searchable lists

---

## Test results

| Suite | Result |
|-------|--------|
| API Jest | **705 passed** |
| Web Vitest | **121 passed** |
| Web `tsc --noEmit` | **clean** |
| Playwright | **1 skipped** (no `SEED_ADMIN_PASSWORD` / `E2E_ADMIN_PASSWORD`) |

---

## Remaining defects / follow-ups

1. **Git reconcile** with `origin/main` still pending founder-approved merge/rebase (not done here).
2. **Playwright happy path** not live-verified in this environment; run with seeded password when API+web+DB are healthy.
3. **Complete booking (EP1-BR-002)** still blocks on draft invoices — preserved by design; E2E may fail at step 11 if drafts exist for the booking.
4. **BullMQ** unused dependency remains until M3 queue work.
5. **Redis noise** on local API start (`ioredis` ECONNREFUSED) is pre-existing / infra — unrelated to M0/M1 code paths.
6. Quotation create UI still requires pasting customer/lead UUIDs (list hubs mitigate discovery; deeper pickers out of scope).
7. OpenAPI description text may still mention Phase-1 “list not shipped” in prose elsewhere — paths themselves are exported.

---

## Acceptance criteria checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | API unit tests green (incl. approve suite) | **Met** (705) |
| 2 | Web unit tests green | **Met** (121) |
| 3 | Admin manages quotation line items; Send/Approve via UI | **Met** |
| 4 | Advance on lead/quotation; approve creates booking when gate passes | **Met** |
| 5 | `in_execution` then Complete (EP1-BR-002 intact) | **Met** |
| 6 | Lead follow-ups list + complete in UI | **Met** |
| 7 | Paginated searchable customers/quotations/bookings | **Met** |
| 8 | Playwright 12-step workflow | **Scaffolded**; skips without credentials; live run pending env |
| 9 | No AI / multi-tenant / Bible changes | **Met** |
| 10 | OpenAPI regenerated + web types synced | **Met** |
| 11 | Report documents remaining defects | **Met** (this doc) |

---

## How to run local E2E

```bash
# Terminal A — API (seeded)
export SEED_ADMIN_PASSWORD='…'
cd apps/api && pnpm prisma db seed && pnpm start:dev

# Terminal B — Web
cd apps/web && pnpm dev

# Terminal C — E2E
cd apps/web
export E2E_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD"
pnpm test:e2e
```

---

*End of M0/M1 implementation report.*
