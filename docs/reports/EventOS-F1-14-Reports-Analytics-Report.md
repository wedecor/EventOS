# Event OS — F1-14 Reports & Analytics Report

| Field | Value |
|-------|-------|
| **Feature** | Read-only Reports Dashboard (Option 1) |
| **Requested by** | User (F1-14) — Option 1 approved after API vs docs review |
| **EP1 Requirements** | EP1-KPI-001–006 (range UX), EP1-SAL/STF/INV/FIN visibility via existing dashboard read models |
| **Scope** | `/app/reports/` using unused `/dashboards/*` endpoints + optional founder `from`/`to` + monthly-revenue chart |
| **Explicitly out of scope** | CSV/Excel/PDF export, report builder, saved reports, drill-down analytics, KPI targets, marketing attribution, client-side aggregations, new APIs |

---

## 1. Executive Summary

Implemented a **read-only Reports** module that complements F1-04 Dashboard by consuming the five dashboard endpoints F1-04 left unused, plus optional founder date range and a presentation-only monthly revenue chart.

- Permission: **`dashboards:read`** only (nav + page)
- No invented metrics, exports, or `reports:*` permissions
- Charts plot **only** `revenue` / `vendorExpenses` / `grossMargin` amounts returned by `monthly-revenue`

`pnpm validate` (typecheck, lint, test, build) **passed**.

---

## 2. Files Changed

### Created

- `src/features/reports/components/reports-page.tsx`
- `src/features/reports/components/sales-summary-section.tsx`
- `src/features/reports/components/staff-summary-section.tsx`
- `src/features/reports/components/inventory-summary-section.tsx`
- `src/features/reports/components/finance-summary-section.tsx`
- `src/features/reports/components/monthly-revenue-section.tsx`
- `src/features/reports/components/founder-range-section.tsx`
- `src/features/reports/components/count-breakdown-table.tsx`
- `src/features/reports/lib/record-rows.ts`
- `src/features/reports/lib/record-rows.spec.ts`
- `src/features/reports/index.ts`
- `EventOS-F1-14-Reports-Analytics-Report.md`

### Modified

- `src/app/app/reports/page.tsx` — placeholder → `ReportsPage`
- `src/features/dashboard/schemas/dashboard.schemas.ts` — F1-14 Zod schemas
- `src/features/dashboard/schemas/dashboard.schemas.spec.ts` — schema coverage
- `src/features/dashboard/api/dashboard.api.ts` — five report clients + founder query params
- `src/features/dashboard/api/dashboard.api.spec.ts` — API coverage
- `src/features/dashboard/hooks/use-dashboard-queries.ts` — report hooks + founder params
- `src/features/dashboard/index.ts` — exports for reuse
- `src/shared/config/navigation.ts` — Reports gated by `dashboards:read`
- `src/shared/lib/breadcrumbs.spec.ts` — sales cannot see Reports; viewer can

---

## 3. Implementation

### Reports module

Feature-first `src/features/reports/` with page sections reusing Dashboard `DashboardWidget` / `KpiCard`, shared page kit, DataTable, Recharts re-exports.

### Dashboard endpoint usage

| Client | Endpoint | Filters |
|--------|----------|---------|
| `getSalesSummary` | `GET /dashboards/sales-summary` | optional `days` (1–365) |
| `getStaffSummary` | `GET /dashboards/staff-summary` | — |
| `getInventorySummary` | `GET /dashboards/inventory-summary` | — |
| `getFinanceSummary` | `GET /dashboards/finance-summary` | — |
| `getMonthlyRevenue` | `GET /dashboards/monthly-revenue` | optional `months` (1–24) |
| `getFounderKpis` | `GET /dashboards/founder` | optional `from` / `to` |

### Charts

`monthly-revenue` → LineChart of returned `amount` fields only (revenue, vendor expenses, gross margin). No cross-endpoint math.

### Deep-links

Module hubs (no booking ids on these five payloads): Leads, Staff, Inventory, Finance hub, Dashboard landing.

### Shared reuse

AppShell via existing app layout; PageLayout/Header/Section; ContentCard via DashboardWidget; Loading/Empty/Error; TanStack Query keys under `dashboards/*`.

---

## 4. Reporting Coverage Verification

| Dashboard Endpoint | Used in F1-04 | Used in F1-14 | Notes |
|--------------------|---------------|---------------|-------|
| `/dashboards/founder` | Yes (default week) | Optional date range | Complements landing; not a duplicate home |
| `/dashboards/lead-pipeline` | Yes | No | F1-04 only |
| `/dashboards/booking-summary` | Yes (partial) | No | F1-04 only |
| `/dashboards/event-execution-summary` | Yes | No | F1-04 only |
| `/dashboards/upcoming-events` | Yes | No | F1-04 only |
| `/dashboards/pending-payments` | Yes | No | F1-04 only |
| `/dashboards/vendor-summary` | Yes (partial) | No | F1-04 only |
| `/dashboards/operational-overview` | Yes | No | F1-04 only |
| `/dashboards/sales-summary` | **No** | **Yes** | Primary Reports surface |
| `/dashboards/staff-summary` | **No** | **Yes** | Primary Reports surface |
| `/dashboards/inventory-summary` | **No** | **Yes** | Primary Reports surface |
| `/dashboards/finance-summary` | **No** | **Yes** | Primary Reports surface |
| `/dashboards/monthly-revenue` | **No** | **Yes** | Chart + table |

Reports is a **deeper catalog** of unused read models; Dashboard remains the hybrid landing page.

---

## 5. Validation

| Gate | Result |
|------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm test` | Pass (108 tests) |
| `pnpm build` | Pass (static export; `/app/reports` included) |

---

## 6. Build Status

**PASS** — Next.js 15 static export succeeded; `/app/reports` route generated.

---

## 7. Test Status

**PASS** — 26 files / 108 tests, including new report schema/API/row helper coverage and nav permission updates.

---

## 8. Engineering Review Verdict

**APPROVED** — Reports remains fully aligned with frozen OpenAPI:

- Only existing dashboard GETs
- Permission `dashboards:read` only
- No invented analytics, exports, or calculations
- Chart is presentation of returned monthly series amounts

---

## 9. Known Backend Limitations

Not bugs — intentionally deferred:

| Limitation | Status |
|------------|--------|
| Dedicated `/reports` or `/analytics` APIs | Absent |
| CSV / Excel / PDF export | Absent |
| KPI target tracking (EP1-KPI-007) | No API fields |
| Formal weekly-review workflow entity | UX date range only |
| Drill-down report builders / saved reports | Absent |
| Booking ids on the five F1-14 primary payloads | Absent (hub links only) |
| Marketing attribution / ad spend | Not Phase 1 |

---

## 10. Suggestions / Next Steps

1. **F1-15 — Settings**
2. **F1-16 — Frontend Production Readiness Review**
3. **F1-17 — Frontend v1.0 Release Candidate**
4. Founder Acceptance Testing
5. Event OS v1.0 Production Release

---

*Report owner: Founding Engineering*  
*Generated: 2026-07-13 (F1-14)*
