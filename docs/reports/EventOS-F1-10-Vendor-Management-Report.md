# Event OS — F1-10 Vendor Management Report

| Field | Value |
|-------|-------|
| **Feature** | Vendor master list / create / detail / edit + add issue note |
| **Requested by** | User (F1-10) — scope **Narrow F1-10 Vendor Master** after API vs docs review |
| **EP1 Requirements** | EP1-VEN-001 (vendor master); EP1-VEN-006 add-note only |
| **Scope** | List (+ status/category filters), create, view-by-id, edit + `If-Match`, add issue note |
| **Explicitly out of scope** | Procurement workflow; vendor payments/variance; issue-note history list; event assignment summary |

---

## 1. Executive Summary

Implemented narrowed Phase 1 **Vendor Master** against frozen `/api/v1/vendors` endpoints:

- **List** (`/app/vendors/`) — `GET /vendors` with optional `status` / `category` filters
- **Create** (`/app/vendors/new/`) — OpenAPI create body
- **Details** (`/app/vendors/view/?id=`) — profile + add issue note (no history)
- **Edit** (`/app/vendors/edit/?id=`) — PATCH + required `If-Match`; `statusReason` when moving to paused/blocked

Status uses OpenAPI enum (`preferred` \| `active` \| `backup` \| `paused` \| `blocked`). Preferred is a status value, not a separate flag.

---

## 2. API vs Documentation Review

| Conflict | Docs / Bible | Frozen API | How handled |
|----------|--------------|------------|-------------|
| Status model | `docs/09` sample `active`/`inactive` | `preferred/active/backup/paused/blocked` | Follow OpenAPI |
| Preferred indicator | Preferred list / flag | Status = `preferred` | Status select |
| Category taxonomy | Closed categories in `07` | Free-text `category` | Text field; no invented enum |
| Issue note history | EP1-VEN-006 | POST only | Add note + toast; no list |
| Procurement / payments / variance | EP1-VEN-002–005 | Separate booking/finance APIs | Deferred |
| List | Documented | **Shipped** | Implemented with API filters |

---

## 3. Files Changed

### Created

- `src/features/vendors/api/vendors.api.ts`
- `src/features/vendors/api/vendors.api.spec.ts`
- `src/features/vendors/schemas/vendor.schemas.ts`
- `src/features/vendors/schemas/vendor.schemas.spec.ts`
- `src/features/vendors/hooks/use-vendor-queries.ts`
- `src/features/vendors/lib/format.ts`
- `src/features/vendors/components/vendor-form.tsx`
- `src/features/vendors/components/vendors-list-page.tsx`
- `src/features/vendors/components/create-vendor-page.tsx`
- `src/features/vendors/components/vendor-detail-page.tsx`
- `src/features/vendors/components/edit-vendor-page.tsx`
- `src/features/vendors/index.ts`
- `src/app/app/vendors/new/page.tsx`
- `src/app/app/vendors/view/page.tsx`
- `src/app/app/vendors/edit/page.tsx`
- `EventOS-F1-10-Vendor-Management-Report.md`

### Modified

- `src/app/app/vendors/page.tsx` — list instead of placeholder

---

## 4. Implementation

### Module

Feature-first `src/features/vendors/` with Zod parse of untyped OpenAPI `data`, TanStack Query, shared page kit + DataTable.

### API integration

`vendorsApi.list|getById|create|update|addIssueNote` via shared Axios client; update sends `If-Match: "<version>"`.

### Permissions

| Surface | Permission |
|---------|------------|
| List / view | `vendors:read` |
| Create / edit / add note | `vendors:write` |

### Shared reuse

PageLayout/Header/Section, ContentCard, DataTable, Empty/Loading/Error, forms, ConfirmDialog, toasts, breadcrumbs, RequirePermission/Can.

---

## 5. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test` | **76 passed** |
| `pnpm build` | **PASS** |

---

## 6. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen vendors API | **Yes** |
| No invent procurement/payments/history | **Yes** |
| Permissions match RBAC | **Yes** |
| F1-01–F1-09 architecture preserved | **Yes** |

**Verdict: APPROVE (narrowed scope)** — production-ready for vendor master CRUD + add issue note.

---

## 7. Known Backend Limitations

1. **No GET issue-note list** — cannot show history after add.
2. **Category is free text** — no server taxonomy enum.
3. **Procurement / expenses / variance** not on vendor resource — deferred.
4. **No server pagination** on vendor list (full filtered set as returned).
5. Detail/edit use **`?id=`** (static export).

---

## 8. Suggestions / Next Steps

1. **F1-11 — Staff Management**
2. Later: booking-scoped procurement UI (EP1-VEN-002/003)
3. F1-12 Inventory → F1-13 Finance → F1-14 Reports → F1-15 Settings
