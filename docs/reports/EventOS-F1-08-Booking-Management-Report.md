# Event OS — F1-08 Booking Management Report

| Field | Value |
|-------|-------|
| **Feature** | Booking (event hub) hub / detail + lifecycle & execution actions |
| **Requested by** | User (F1-08) — scope **option 1 — Narrow F1-08** after API vs docs review |
| **EP1 Requirements** | EP1-AUT-006 (unified event record); EP1-OPS-004 / EP1-BR-002 / EP1-BR-003 actions as shipped |
| **Scope** | Hub, view-by-id, status→prep, cancel, complete, assign owner, advance stage |
| **Explicitly out of scope** | List; create; general field update; workspace UI (F1-09); nested payments/expenses/procurements/etc. |

---

## 1. Executive Summary

Implemented narrowed Phase 1 **Booking Management** against frozen `/api/v1/bookings` endpoints only:

- **Hub** (`/app/bookings/`) — explains missing list/create; open-by-id; link to dashboard
- **Details** (`/app/bookings/view/?id=`) — full `BookingDto` summary + links to customer / quotation / lead
- **Actions:** start preparation (`PATCH …/status` → `in_preparation`), cancel, complete, assign execution owner, advance stage

Bookings are **not created in this module** — they appear when quotation approve converts with confirmed advance (EP1-BR-001).

---

## 2. API vs Documentation Review

| Item | Docs / EP1 | Frozen OpenAPI | Frontend decision |
|------|------------|----------------|-------------------|
| List | `GET /bookings` (`docs/09`) | **Missing** | Hub + open-by-id |
| Create | Lead→Booking / Approved handoff | **No POST**; via quote approve | Documented; no create form |
| Field update | Hub implies edits | No general PATCH | Deferred |
| Status | PATCH status enum | Controller only allows **`in_preparation`** (approved → prep) | “Start preparation” only |
| Cancel / Complete | Documented | Shipped + required `If-Match` | Implemented |
| Execution owner / stages | EP1-BR-003, EP1-OPS-004 | Shipped; responses are **WorkspaceDto** | Implemented; refetch booking for version |
| Workspace | EP1-OPS-001 | `GET/POST …/workspace` | **Deferred to F1-09** |
| Nested finance/ops | Under booking in `09` | Shipped | Deferred to later F1s |

No invented list, create, or `in_execution` status transition (not supported by controller).

---

## 3. Files Changed

### Created

- `src/features/bookings/api/bookings.api.ts`
- `src/features/bookings/api/bookings.api.spec.ts`
- `src/features/bookings/schemas/booking.schemas.ts`
- `src/features/bookings/schemas/booking.schemas.spec.ts`
- `src/features/bookings/hooks/use-booking-queries.ts`
- `src/features/bookings/lib/format.ts`
- `src/features/bookings/components/bookings-hub-page.tsx`
- `src/features/bookings/components/booking-detail-page.tsx`
- `src/features/bookings/index.ts`
- `src/app/app/bookings/view/page.tsx`
- `EventOS-F1-08-Booking-Management-Report.md`

### Modified

- `src/app/app/bookings/page.tsx` — hub instead of placeholder

---

## 4. Implementation

### Hub

EmptyState + UUID open form + dashboard link.

### Detail

Displays booking number, status, prep/workspace status, milestone, owner, event fields, cancellation/completion timestamps, version. Linked IDs deep-link to existing customer/quotation/lead view routes.

### Actions

| Action | Permission | When shown |
|--------|------------|------------|
| Start preparation | `bookings:status:update` | `approved` |
| Complete | `bookings:complete` | `in_execution` |
| Cancel | `bookings:cancel` | not cancelled/completed |
| Assign owner | `bookings:execution:advance` | not cancelled/completed |
| Advance stage | `bookings:execution:advance` | `in_preparation` or `in_execution` |

All mutating calls send required `If-Match: "<version>"`.

---

## 5. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** (unused-import warning fixed) |
| `pnpm test` | **64 passed** |
| `pnpm build` | **PASS** |

---

## 6. Build Status

Production static export includes `/app/bookings/` and `/app/bookings/view/`.

---

## 7. Test Status

Unit tests cover schema parse/map and API client wiring (get, status, cancel, complete, owner, stage + `If-Match`). Manual E2E against a live API was not run in this session.

---

## 8. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen bookings API | **Yes** |
| No invent list/create/`in_execution` PATCH | **Yes** |
| Permissions match RBAC | **Yes** |
| Workspace / nested modules deferred | **Yes** |
| F1-01–F1-03 architecture preserved | **Yes** |

**Verdict: APPROVE (narrowed scope)** — production-ready for hub/detail + supported lifecycle/execution actions.

---

## 9. Known Backend Limitations

1. **No `GET /bookings` list** — discovery via UUID, dashboard upcoming events, or quotation approve `eventId`.
2. **No `POST /bookings`** — creation only via approved quotation + advance.
3. **`PATCH …/status` only supports `in_preparation`** — OpenAPI enum is wider than the controller; other values return `INVALID_STATE`.
4. **No shipped transition into `in_execution`** via this status endpoint — Complete is only valid when already `in_execution`.
5. Owner/stage endpoints return **WorkspaceDto without `version`** — UI refetches booking after those mutations.
6. Workspace activate/read deferred (F1-09).
7. Nested payments/invoices/expenses/procurements/inventory/profitability deferred.
8. Detail uses **`?id=`** (static export).

---

## 10. Suggestions / Next Steps

1. Backend: expose list and/or a supported path to `in_execution` if product needs Complete from UI end-to-end.
2. **F1-09 — Event Workspace** (activate + workspace view)
3. Later: finance/vendor/inventory panels under booking id
4. F1-10 Vendor → F1-11 Staff → F1-12 Inventory
