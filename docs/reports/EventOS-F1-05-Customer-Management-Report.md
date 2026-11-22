# Event OS — F1-05 Customer Management Report

| Field | Value |
|-------|-------|
| **Feature** | Customer (clients) create / detail / edit |
| **Requested by** | User (F1-05) — scope **option 2** after list-API conflict |
| **EP1 Requirements** | EP1-CUS-001 (profile create/read/update) |
| **Scope** | Hub, create, view-by-id, edit-by-id; `clients:read` / `clients:write` |
| **Explicitly out of scope** | Customer list/search/sort/filter; contacts; timeline; issues; reviews; Leads+ |

---

## 1. Executive Summary

Implemented narrowed Phase 1 **Customer Management** against frozen `/api/v1/clients` endpoints:

- **Hub** (`/app/customers/`) — explains that `GET /clients` list is not shipped; CTA to create
- **Create** (`/app/customers/new/`) — RHF + Zod → `POST /clients` → redirect to view
- **Details** (`/app/customers/view/?id=`) — `GET /clients/:id` fields only
- **Edit** (`/app/customers/edit/?id=`) — prefilled form, `PATCH` + `If-Match`, cache update, unsaved-change warning

Permissions use backend keys **`clients:read`** / **`clients:write`** (not inventing `customers:*`).

Query-param IDs keep static export compatible (no dynamic `[id]` segments).

---

## 2. Files Changed

### Created

- `src/features/customers/api/customers.api.ts`
- `src/features/customers/api/customers.api.spec.ts`
- `src/features/customers/schemas/customer.schemas.ts`
- `src/features/customers/schemas/customer.schemas.spec.ts`
- `src/features/customers/hooks/use-customer-queries.ts`
- `src/features/customers/components/customer-form.tsx`
- `src/features/customers/components/customers-hub-page.tsx`
- `src/features/customers/components/create-customer-page.tsx`
- `src/features/customers/components/customer-detail-page.tsx`
- `src/features/customers/components/edit-customer-page.tsx`
- `src/features/customers/index.ts`
- `src/app/app/customers/new/page.tsx`
- `src/app/app/customers/view/page.tsx`
- `src/app/app/customers/edit/page.tsx`
- `EventOS-F1-05-Customer-Management-Report.md`

### Modified

- `src/app/app/customers/page.tsx` — hub instead of placeholder
- `src/shared/lib/breadcrumbs.ts` — `new` / `view` / `edit` titles

---

## 3. Implementation

### Customer “list”

Not implemented (deferred API). Hub EmptyState documents the limitation.

### Details

Displays DTO fields: displayName, status, type, version, email, phone, notes, timestamps.

### Create / Edit

- OpenAPI request types for POST/PATCH bodies
- Form fields persisted by service: **name, email, phone, notes** only
- Client refine: ≥1 phone or email (mirrors `CustomerApplicationService`)
- Edit sends `If-Match: "<version>"`
- TanStack Query cache set/invalidate on success
- `beforeunload` + confirm dialog when leaving dirty edit

### Permissions

- Hub/view: `clients:read`
- Create/edit: `clients:write`
- Edit button on detail wrapped in `<Can permission="clients:write">`

### Shared reuse

PageLayout/Header/Section, ContentCard, Empty/Loading/Error, forms, toasts, ConfirmDialog, breadcrumbs, RequirePermission/Can.

---

## 4. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test` | **37 passed** |
| `pnpm build` | **PASS** |

Manual: create → view → edit flows against a live API were not run in this session; unit tests cover schema + API client wiring.

---

## 5. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen clients API | **Yes** (no list calls) |
| Permissions match RBAC | **Yes** (`clients:*`) |
| No invented list/search | **Yes** |
| F1-01–F1-03 architecture preserved | **Yes** |

**Verdict: APPROVE (narrowed scope)** — production-ready for create/detail/edit; list blocked until backend ships `GET /clients`.

---

## 6. Known Limitations

1. **No customer list / search / pagination** — `GET /api/v1/clients` not shipped (`docs/09`).
2. OpenAPI optional **`company` / `address`** accepted by Zod on API but **not persisted** by application service — omitted from UI.
3. Detail/edit use **`?id=`** (static export); deep links from future modules should use this shape.
4. Contacts / timeline / issues / reviews **not** in F1-05 (option 2).
5. Response OpenAPI `data` still untyped — Zod runtime parse used.

---

## 7. Suggestions / Next Steps

1. Backend/docs: ship `GET /api/v1/clients` (paginated) when ready, then add list UI
2. **F1-06 — Lead Management**
3. Optional: contacts + timeline on customer detail when prioritized
