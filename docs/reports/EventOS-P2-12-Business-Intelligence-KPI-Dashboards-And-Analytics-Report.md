# Event OS — P2-12 Business Intelligence KPI Dashboards & Analytics Report


| Field              | Value                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Feature**        | Business Intelligence KPI Dashboards & Analytics — read-only aggregation under `/api/v1/analytics/*`               |
| **Authority**      | Business Bible, Domain Model, OpenAPI, Prisma, RBAC                                                                |
| **Scope**          | Founder/sales/finance/staff/vendors/inventory/customers/operations KPIs, historical trends, CSV/SpreadsheetML export |
| **Business Bible** | Unchanged                                                                                                          |
| **Date**           | 2026-07-29                                                                                                         |


---

## 1. Executive Summary

P2-12 introduces **Business Intelligence KPI Dashboards & Analytics** as a **read-only aggregation / composition layer** in a dedicated Analytics module — not a new write-owning bounded context. `AnalyticsApplicationService` projects founder dashboard, sales, finance, staff, vendors, inventory, customers, operations, historical trend buckets, and export payloads at request time from Lead, Quotation, Event, Customer, Payment, VendorExpense, Invoice, FinancialDocument, Staff, VendorProcurement, Inventory, CommunicationRecord, and Reminder — the modules that already own that state keep sole write responsibility.

There are **no** new Prisma tables, **no** analytics repository, **no** analytics domain events, and **no** migration (only additive `findAll` on Quotation and Customer repositories). HTTP resource is **`analytics`** (`/analytics/...`). Permission is **`analytics:read`**. Phase-1 **`/dashboards/*`** remains **frozen**; P2-12 is the additive BI surface. **No AI / predictive / forecasting.**

**Verdict: APPROVED WITH MINOR NOTES**

---

## 2. Architecture Compliance

| Rule                                                        | Status                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Analytics is read-only aggregation, no write ownership       | ✅ `AnalyticsApplicationService` exposes only `get*` / `exportDataset`; no mutations |
| No new Prisma tables / migration                             | ✅ No schema change; additive `findAll` on Quotation + Customer only             |
| Preserve Lead / Quotation / Booking / Customer / Finance / Staff / Vendor / Inventory / Communication ownership | ✅ Analytics reads via existing repositories only; no new writes |
| HTTP resource is `analytics` (additive; Phase-1 `/dashboards/*` frozen) | ✅ `AnalyticsController` `@Controller('analytics')`; dashboards untouched |
| Permission `analytics:read`                                  | ✅ All ten GET routes use `@Permissions('analytics:read')`                       |
| No AI / predictive / forecasting                             | ✅ Trends = historical buckets only; health = P2-11 rule ladder                  |
| Business Bible unchanged                                     | ✅ `docs/business/` untouched                                                    |
| DDD boundaries                                               | ✅ Analytics owns no aggregate; every write path stays in its home module        |

---

## 3. Backend Changes

| Area                             | Change                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Module                             | `apps/api/src/modules/analytics/` — `AnalyticsModule` wired via `ApplicationServicesModule` / `AppModule` |
| Service                            | `AnalyticsApplicationService` — `getDashboard`, `getSales`, `getFinance`, `getStaff`, `getVendors`, `getInventory`, `getCustomers`, `getOperations`, `getTrends`, `exportDataset` |
| DTOs                               | `analytics.dto.ts` — dashboard, sales, finance, staff, vendors, inventory, customers, operations, trends, export |
| Controller                         | `AnalyticsController` — 10 `GET` routes under `analytics`, all `@Permissions('analytics:read')` |
| Query validation                   | Period Zod: optional `from` / `to`; trends add optional `granularity`; export requires `dataset`, optional `format` (`csv`\|`xlsx`) |
| Additive repo methods              | `findAll(tenantId)` on `QuotationRepository` and `CustomerRepository` |
| RBAC                               | `analytics:read` granted to `owner`, `admin`, `sales_manager`, `operations_manager`, `coordinator`, `finance`, `viewer` |
| Repositories / migrations          | **No new persistence** — zero migration footprint                                                            |
| Phase-1 dashboards                 | **Untouched** — `/dashboards/*` remains frozen                                                               |

---

## 4. Database Changes

**None.**

- No Prisma model, no migration, no new table, enum, or column.
- Analytics reads exclusively through repositories already owned by other modules.
- Only additive repository methods: `QuotationRepository.findAll`, `CustomerRepository.findAll`.
- `apps/api/prisma/schema.prisma` is unmodified by this feature.

---

## 5. API Changes

Additive, read-only routes (Phase-1 `/dashboards/*` unchanged):

| Method | Path | Permission | Notes |
| ------ | ---- | ---------- | ----- |
| GET | `/analytics/dashboard` | `analytics:read` | Founder BI rollup; optional `from` / `to` |
| GET | `/analytics/sales` | `analytics:read` | Conversion, quote acceptance, revenue breakdowns |
| GET | `/analytics/finance` | `analytics:read` | Revenue / expenses / profit / receivables |
| GET | `/analytics/staff` | `analytics:read` | Utilisation and workload |
| GET | `/analytics/vendors` | `analytics:read` | Procurement completion and spend |
| GET | `/analytics/inventory` | `analytics:read` | Reservations, movements, dispatch trends |
| GET | `/analytics/customers` | `analytics:read` | Retention + health distribution |
| GET | `/analytics/operations` | `analytics:read` | Ops counters |
| GET | `/analytics/trends` | `analytics:read` | Historical buckets; optional `granularity` |
| GET | `/analytics/export` | `analytics:read` | Required `dataset`; optional `format` |

OpenAPI regenerated with controller export.

---

## 6. Frontend Changes

| Area              | Change                                                                              |
| ----------------- | -------------------------------------------------------------------------------------- |
| Feature module     | `apps/web/src/features/analytics/` — schemas, API client, TanStack Query hooks, section components |
| Route              | `/app/analytics` — hub with tabs: Founder, Sales, Finance, Operations, Trends, Export |
| RBAC               | Gated by `analytics:read` (`RequirePermission`) |
| Phase-1 surfaces   | `/app/dashboard` and Phase-1 reports remain on frozen `/dashboards/*` — not replaced |

---

## 7. KPI Aggregation Rules

| Metric / surface | Rule |
| ---------------- | ---- |
| Revenue / expenses / profit | **Confirmed** payments and **confirmed** vendor expenses — same basis as `ProfitabilityApplicationService` |
| Lead conversion | Converted stages = `approved` \| `completed` |
| Customer health distribution | Mirrors **P2-11** priority ladder: `follow_up_required` → `active` → `returning` → `dormant` → else `active` |
| Active bookings | Status in `approved` / `in_preparation` / `in_execution` |
| Trends | Historical period buckets only (`daily` / `weekly` / `monthly` / `yearly`) — **no forecasting** |
| Inventory reservations | Tenant-wide rollup walks bookings and loads reservations via `findByBookingId` |

---

## 8. Export Rules

`GET /analytics/export`:

| Format | Payload |
| ------ | ------- |
| `csv` (default) | UTF-8 CSV text in `content`; `contentType: text/csv; charset=utf-8`; `.csv` filename |
| `xlsx` | Excel-compatible **SpreadsheetML** XML, base64-encoded in `content`; `contentType: application/vnd.ms-excel`; `.xls` filename — **not** Office Open XML binary / no xlsx library |

Datasets: `dashboard`, `sales`, `finance`, `staff`, `vendors`, `inventory`, `customers`, `operations`, `trends`.

---

## 9. Trends & Non-Goals

### Trends

- `GET /analytics/trends` builds labelled historical buckets within the requested (or default 30-day) window.
- Points include revenue, expenses, leads, bookings, and customers per bucket.
- Bucket count capped for safety; no extrapolation beyond observed data.

### Explicit non-goals

- No AI / predictive scoring / forecasting
- No custom dashboard builder / ad-hoc widgets
- No replacement or mutation of Phase-1 `/dashboards/*`
- No new write APIs or domain events

---

## 10. Documentation Updates

| Document | Update |
| -------- | ------ |
| `docs/07-domain-model.md` | Analytics read models documented under dedicated **Analytics (Read Model — P2-12)** section; BI bounded-context row and EP1-KPI/MKT traceability updated; version 1.6 |
| `docs/09-api-design.md` | Analytics module with ten GET routes; `analytics:read` in catalog, matrix, endpoint map, and role grant lists; Phase-1 Dashboard marked frozen; version 1.10 |
| `docs/05-system-architecture.md` | Phase 1 inventory + P2-12 note; event-flow exclusion; API route examples; frontend analytics feature; marketing/BI capability audit PASS |
| `docs/10-implementation-specification.md` | Analytics module re-specified; persistence exclusion + dependency diagram read edges; Phase-1 BI/Dashboard frozen note; version 1.7 |
| OpenAPI | Regenerated |
| Business Bible (`docs/business/`) | **Unchanged** |

---

## 11. Testing

| Layer      | Result                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Unit       | `analytics.application.service.spec.ts` — **4** tests (dashboard, sales, export CSV, trends) |
| API        | **701** tests passed; lint + build passed                               |
| Frontend   | **120** tests passed; typecheck + lint + build passed                   |
| OpenAPI    | Regenerated (`openapi:export` + web `openapi:generate`)                 |
| Validation | Read-only BI; Phase-1 `/dashboards/*` frozen; no AI/forecasting; CSV + SpreadsheetML export; confirmed payment/expense P&L basis |

---

## 12. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. Phase-1 `/dashboards/*` remains frozen; `/analytics/*` is the additive BI surface.
2. Excel export is SpreadsheetML (`.xls`), not Office Open XML binary.
3. Tenant-wide inventory reservation rollup walks bookings (`findByBookingId` per event).
4. Recommended next: **P2-13 — Production Hardening**.

### Recommended next milestone

**P2-13 — Production Hardening**
