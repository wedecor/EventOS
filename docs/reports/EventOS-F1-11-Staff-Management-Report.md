# Event OS — F1-11 Staff Management Report

| Field | Value |
|-------|-------|
| **Feature** | Staff master list / create / detail / edit |
| **Requested by** | User (F1-11) — scope **Narrow F1-11 Staff Master** after API vs docs review |
| **EP1 Requirements** | EP1-STF-001 (staff master); related EP1-STF-* deferred |
| **Scope** | List (+ optional `status` filter), create, view-by-id, edit + `If-Match` |
| **Explicitly out of scope** | Skills / availability; staff-centric assignment history; booking-scoped `/staff-assignments`; EP1-STF-003 movement permissions UI; suggestion-only assignment path |

---

## 1. Executive Summary

Implemented narrowed Phase 1 **Staff Master** against frozen `/api/v1/staff` endpoints:

- **List** (`/app/staff/`) — `GET /staff` with optional `status` filter (`active` \| `inactive` \| `on_leave`)
- **Create** (`/app/staff/new/`) — OpenAPI create body (nested phone/email)
- **Details** (`/app/staff/view/?id=`) — profile view
- **Edit** (`/app/staff/edit/?id=`) — PATCH + required `If-Match`

Phone on create/update is `{ countryCode, number }`; GET returns a flattened string. Free-text `role` and optional `department` match OpenAPI (no invented taxonomies).

---

## 2. API vs Documentation Review

| Conflict | Docs / Bible | Frozen API | How handled |
|----------|--------------|------------|-------------|
| Staff list | Documented master | **Shipped** `GET /staff` | Implemented with optional `status` |
| Status model | Various samples | `active` \| `inactive` \| `on_leave` | Follow OpenAPI enum |
| Phone shape | Often flat string | Nested on write; flat string on read | Form splits; mappers nest for write |
| Skills / availability | docs/09 / EP1-STF | Not on staff resource in OpenAPI | Deferred |
| Assignments | Staff-centric history / movement | Booking-scoped `/staff-assignments` | Deferred (Option 2) |
| EP1-STF-003 movement permissions | Documented UI | No matching staff-master ops | Deferred |
| Suggestion-only assign | docs/09 | Not in frozen staff API | Deferred |

---

## 3. Files Changed

### Created

- `src/features/staff/api/staff.api.ts`
- `src/features/staff/api/staff.api.spec.ts`
- `src/features/staff/schemas/staff.schemas.ts`
- `src/features/staff/schemas/staff.schemas.spec.ts`
- `src/features/staff/hooks/use-staff-queries.ts`
- `src/features/staff/lib/format.ts`
- `src/features/staff/components/staff-form.tsx`
- `src/features/staff/components/staff-list-page.tsx`
- `src/features/staff/components/create-staff-page.tsx`
- `src/features/staff/components/staff-detail-page.tsx`
- `src/features/staff/components/edit-staff-page.tsx`
- `src/features/staff/index.ts`
- `src/app/app/staff/new/page.tsx`
- `src/app/app/staff/view/page.tsx`
- `src/app/app/staff/edit/page.tsx`
- `EventOS-F1-11-Staff-Management-Report.md`

### Modified

- `src/app/app/staff/page.tsx` — list instead of placeholder

---

## 4. Implementation

### Module

Feature-first `src/features/staff/` with Zod parse of untyped OpenAPI `data`, TanStack Query, shared page kit + DataTable.

### API integration

`staffApi.list|getById|create|update` via shared Axios client; update sends `If-Match: "<version>"`.

### Permissions

| Surface | Permission |
|---------|------------|
| List / view | `staff:read` |
| Create / edit | `staff:write` |

### Shared reuse

PageLayout/Header/Section, ContentCard, DataTable, Empty/Loading/Error, forms, ConfirmDialog (dirty leave), toasts, breadcrumbs, RequirePermission/Can. Static-export routes use `?id=` (no dynamic `[id]` segments).

---

## 5. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test` | **85 passed** |
| `pnpm build` | **PASS** (staff routes exported) |

---

## 6. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen staff API | **Yes** |
| No invent skills/availability/assignments UI | **Yes** |
| Permissions match RBAC (`staff:read` / `staff:write`) | **Yes** |
| F1-01–F1-10 architecture preserved | **Yes** |

**Verdict: APPROVE (narrowed scope)** — production-ready for staff master CRUD.

---

## 7. Known Backend Limitations

1. **No skills / availability** fields or endpoints on staff master.
2. **No staff-centric assignment history** — assignments are booking-scoped (`/staff-assignments`).
3. **Role / department are free text** — no server taxonomy enum.
4. **No server pagination** on staff list (full filtered set as returned).
5. Detail/edit use **`?id=`** (static export).

---

## 8. Suggestions / Next Steps

1. **F1-12 — Inventory**
2. Later (optional): booking-scoped staff assignment UI when building deeper booking/workspace flows
3. F1-13 Finance → F1-14 Reports → F1-15 Settings
