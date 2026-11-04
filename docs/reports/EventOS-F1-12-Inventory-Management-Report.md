# Event OS — F1-12 Inventory Management Report

| Field | Value |
|-------|-------|
| **Feature** | Inventory item master + booking-scoped inventory movements |
| **Requested by** | User (F1-12) — scope **Option 2** after API vs docs review |
| **EP1 Requirements** | EP1-INV-001–002 (master/stock); EP1-INV-003/005/006 (movements / returns / damage notes as shipped) |
| **Scope** | Item list/create/view/edit; booking movement list/create/detail; linear transition; add damage note |
| **Explicitly out of scope** | Packing lists (EP1-INV-004); photos (EP1-INV-007); global movement list; availability calculator; inventing GET `/items/:id` |

---

## 1. Executive Summary

Implemented Phase 1 **Inventory** against frozen OpenAPI:

- **Item master** (`/app/inventory/`) — list (+ status/taxonomy/category filters), create, view, edit + `If-Match`
- **Booking movements** — open by booking id from inventory hub or booking detail; plan movement; detail with linear `toStatus` transitions + damage notes

Item detail/edit resolve via **list + find** because Phase 1 has no `GET /inventory/items/:id`.

---

## 2. API vs Documentation Review

| Conflict | Docs / Bible | Frozen API | How handled |
|----------|--------------|------------|-------------|
| Item GET-by-id | Often implied | **Missing** (also absent from `docs/09`) | List + find; documented limitation |
| Transition field | `toState` (includes `planned`) | **`toStatus`**; targets `picked`→`cleaned_ready` | Follow OpenAPI |
| Photos | EP1-INV-007 | Not shipped | Deferred |
| Packing lists | EP1-INV-004 | No inventory packing CRUD | Deferred |
| Global movement list | Implied | **Missing** | Booking-scoped only |
| Availability | Future vision | No endpoint | Display `quantityAtJpNagar` only |
| Category taxonomy | Illustrative lists in `08` | Free-text `category` + enum taxonomy | Text + OpenAPI enums |
| Damage note history | Accountability | POST only | Add + toast; no list |

---

## 3. Files Changed

### Created

- `src/features/inventory/api/inventory.api.ts`
- `src/features/inventory/api/inventory.api.spec.ts`
- `src/features/inventory/schemas/inventory.schemas.ts`
- `src/features/inventory/schemas/inventory.schemas.spec.ts`
- `src/features/inventory/hooks/use-inventory-queries.ts`
- `src/features/inventory/lib/format.ts`
- `src/features/inventory/components/inventory-item-form.tsx`
- `src/features/inventory/components/inventory-items-list-page.tsx`
- `src/features/inventory/components/create-inventory-item-page.tsx`
- `src/features/inventory/components/inventory-item-detail-page.tsx`
- `src/features/inventory/components/edit-inventory-item-page.tsx`
- `src/features/inventory/components/booking-movements-page.tsx`
- `src/features/inventory/components/create-movement-page.tsx`
- `src/features/inventory/components/movement-detail-page.tsx`
- `src/features/inventory/index.ts`
- `src/app/app/inventory/new/page.tsx`
- `src/app/app/inventory/view/page.tsx`
- `src/app/app/inventory/edit/page.tsx`
- `src/app/app/inventory/movements/page.tsx`
- `src/app/app/inventory/movements/new/page.tsx`
- `src/app/app/inventory/movements/view/page.tsx`
- `EventOS-F1-12-Inventory-Management-Report.md`

### Modified

- `src/app/app/inventory/page.tsx` — list instead of placeholder
- `src/shared/lib/breadcrumbs.ts` — `movements` title
- `src/features/bookings/components/booking-detail-page.tsx` — link to booking movements

---

## 4. Implementation

### Module

Feature-first `src/features/inventory/` with Zod parse of OpenAPI `data`, TanStack Query, shared page kit + DataTable.

### API integration

| Client method | Endpoint |
|---------------|----------|
| `listItems` / `getItemById` (via list) | `GET /inventory/items` |
| `createItem` | `POST /inventory/items` |
| `updateItem` | `PATCH /inventory/items/:id` + `If-Match` |
| `listMovementsForBooking` | `GET /bookings/:id/inventory-movements` |
| `getMovementById` | `GET /inventory/movements/:id` |
| `createMovement` | `POST /inventory/movements` |
| `transitionMovement` | `POST …/transition` + `If-Match` |
| `addDamageNote` | `POST …/damage-notes` |

### Permissions

| Surface | Permission |
|---------|------------|
| List / view items & movements | `inventory:read` |
| Create / edit items | `inventory:write` |
| Plan movement | `inventory:move:write` |
| Transition | `inventory:move:confirm` |
| Damage note | `inventory:damage-notes:write` |

### Shared reuse

PageLayout/Header/Section, ContentCard, DataTable, Empty/Loading/Error, forms, ConfirmDialog, toasts, breadcrumbs, RequirePermission/Can. Static export uses `?id=` / `?bookingId=`.

---

## 5. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test` | **94 passed** |
| `pnpm build` | **PASS** (inventory + movements routes exported) |

---

## 6. Build Status

**PASS** — Next.js 15 static export includes `/app/inventory/*` and `/app/inventory/movements/*`.

---

## 7. Test Status

**PASS** — schema + API client unit tests for items, list-find detail, movements, transition `If-Match`, damage notes.

---

## 8. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen inventory API | **Yes** |
| No invent packing/photos/availability/global list | **Yes** |
| Permissions match RBAC | **Yes** |
| F1-01–F1-11 architecture preserved | **Yes** |

**Verdict: APPROVE (Option 2 scope)** — production-ready for item master + booking-scoped movements.

---

## 9. Known Backend Limitations

1. **No `GET /inventory/items/:id`** — detail/edit use full list + find.
2. **No global movement list** — booking id required.
3. **No damage-note history GET** — add only.
4. **No photos / packing list CRUD** on inventory resource.
5. **Category is free text**; taxonomy is the only closed enum for classification.
6. **No server pagination** on item/movement lists.
7. Detail routes use **`?id=` / `?bookingId=`** (static export).

---

## 10. Suggestions / Next Steps

1. **F1-13 — Finance**
2. Later: packing-list suggestion UI when checklist acceptance is wired; photos when Attachment lands
3. F1-14 Reports → F1-15 Settings
