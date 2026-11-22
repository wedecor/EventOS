# Event OS — F1-04 Dashboard Report

| Field | Value |
|-------|-------|
| **Feature** | Phase 1 Dashboard (hybrid founder + ops) |
| **Requested by** | User (F1-04) — option **3** after API/Bible conflict stop |
| **EP1 Requirements** | EP1-KPI-001–005, EP1-MKT-001; ops read models EP1-SAL-003, EP1-OPS-*, EP1-FIN-003, EP1-VEN-005 |
| **Scope** | Dashboard page using frozen `/api/v1/dashboards/*` only |
| **Explicitly out of scope** | Recent Activity feed, Pending Quotations metric, Customer column on upcoming events, create-module UIs, backend changes |

---

## 1. Executive Summary

Implemented the Admin Portal **Dashboard** as the post-login landing page (`/app/dashboard/`), gated by `dashboards:read`.

**Hybrid (option 3):**

1. **Founder KPIs** — `GET /dashboards/founder` (enquiries, conversion rate, events completed, gross margin + lead-source table)
2. **Operations snapshot** — metrics taken only from existing fields (`activeLeads`, upcoming/needs-attention counts, outstanding payment amount, cost-variance flagged, active events)
3. **Upcoming events** — `GET /dashboards/upcoming-events?days=30` (date, booking #, type, venue, status — **no customer**)
4. **Quick actions** — permission-gated links to module placeholders

Did **not** invent Recent Activity, Pending Quotations, or Today’s Events cards.

---

## 2. Files Changed

### Created

- `src/features/dashboard/api/dashboard.api.ts`
- `src/features/dashboard/api/dashboard.api.spec.ts`
- `src/features/dashboard/schemas/dashboard.schemas.ts`
- `src/features/dashboard/schemas/dashboard.schemas.spec.ts`
- `src/features/dashboard/hooks/use-dashboard-queries.ts`
- `src/features/dashboard/lib/format.ts`
- `src/features/dashboard/components/kpi-card.tsx`
- `src/features/dashboard/components/dashboard-widget.tsx`
- `src/features/dashboard/components/founder-kpi-section.tsx`
- `src/features/dashboard/components/ops-metrics-section.tsx`
- `src/features/dashboard/components/upcoming-events-section.tsx`
- `src/features/dashboard/components/quick-actions-section.tsx`
- `src/features/dashboard/components/dashboard-page.tsx`
- `src/features/dashboard/index.ts`
- `EventOS-F1-04-Dashboard-Report.md`

### Modified

- `src/app/app/dashboard/page.tsx` — renders `DashboardPage`

---

## 3. Dashboard Implementation

### Architecture

Feature module under `features/dashboard/` (F1-01 feature-first). Shared Axios client + TanStack Query (parallel queries, 60s staleTime). Response bodies Zod-parsed (OpenAPI `data` still loose).

### Widgets

| Widget | API | Notes |
|--------|-----|--------|
| Founder KPI cards + lead sources | `/dashboards/founder` | Bible EP1-KPI-001–005 |
| Active leads | `/dashboards/lead-pipeline` | `activeLeads` |
| Upcoming events (count) | `/dashboards/operational-overview` | fallback booking-summary |
| Events needing attention | `/dashboards/event-execution-summary` | `needsAttentionCount` |
| Outstanding payments | `/dashboards/pending-payments` | `totalDueAmount` |
| Cost variance flagged | `/dashboards/vendor-summary` | procurement cost-variance count |
| Active events | `/dashboards/event-execution-summary` | `activeEventCount` |
| Upcoming events table | `/dashboards/upcoming-events` | no customer column |
| Quick actions | n/a | `<Can>` + placeholder routes |

### Loading / empty / error

`DashboardWidget` wraps every section with shared Loading / Empty / Error states and retry.

### Permissions

Page: `RequirePermission('dashboards:read')`. Quick actions use `clients:write`, `leads:write`, `quotations:write`, `bookings:read`, `workspace:read|bookings:read`.

---

## 4. Validation

| Check | Result |
|-------|--------|
| Dashboard loads via parallel queries | Implemented |
| Permission gate on page + actions | Implemented |
| Responsive grid (sm/xl) | Implemented |
| Widget error / empty / loading | Implemented |
| No invented metrics | Confirmed |

---

## 5. Build Status

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm build` | **PASS** |

---

## 6. Test Status

| Metric | Value |
|--------|-------|
| Vitest | **30 passed** (7 files) |
| Dashboard-specific | Zod parse + API path mocks + formatters |

---

## 7. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Matches frozen dashboard APIs | **Yes** |
| Aligns with Business Bible founder KPIs | **Yes** (plus ops read models) |
| No invented business rules / metrics | **Yes** |
| Reuses F1-01–F1-03 shell/page/auth | **Yes** |

**Verdict: APPROVE** — Dashboard ready as Phase 1 landing page.

---

## 8. Known Limitations

1. No **Recent Activity** — no feed endpoint.
2. No **Pending Quotations** / **Today’s Events** KPI cards — not in dashboard contracts.
3. Upcoming events **without Customer** — not in API response.
4. Quick “New *” actions open **placeholders** (create UIs = later milestones).
5. “New Booking” presented as **View Bookings** (`bookings:write` does not exist in Phase 1 RBAC).
6. OpenAPI success `data` still untyped — Zod runtime validation used.

---

## 9. Suggestions / Next Steps

1. **F1-05 — Customer Management**
2. Optional backend/docs: activity feed or enrich upcoming-events with customer display fields
3. Continue Lead → Quotation → Booking modules per Bible
