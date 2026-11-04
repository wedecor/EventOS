# Event OS — P2-01 Event Workspace Expansion Report

| Field | Value |
|-------|-------|
| **Feature** | Event Workspace → Operational Command Center |
| **Scope** | Compose existing booking-scoped APIs into the workspace UI; extend Task fields; add progress/activity/notes |
| **Architecture stance** | Preserve thin `WorkspaceDto`; no fat workspace aggregate |
| **Date** | 2026-07-19 |

---

## 1. Executive Summary

P2-01 expands the Event Workspace into an operational command center by **composing** existing sibling APIs and adding only the missing pieces: Task operational fields, computed progress, read-only activity feed, and internal `EventNote`.

`GET /bookings/:id/workspace` remains the thin orchestration status DTO. No duplicate entities for Staff, Vendor, Inventory, Finance, or customer Timeline. Business Bible was not modified.

**Verdict: APPROVED WITH MINOR NOTES**

---

## 2. Existing Architecture Review

| Capability | Pre-P2-01 status | P2-01 action |
|------------|------------------|--------------|
| `WorkspaceDto` / activate | Thin status + human activate (F1-09) | **Preserved unchanged** |
| Tasks + ChecklistItem | Full API; no category/priority/notes; no UI | Extend fields + workspace UI |
| StaffAssignment | Full API; no workspace UI | Compose API in UI |
| VendorProcurement | Full API; no workspace UI | Compose API in UI |
| InventoryMovement | Full API + booking list page | Summary buckets + deep-link |
| Payments / Profitability | Booking finance page | Embed existing panels |
| TimelineEntry | Customer interactions | **Not reused** for ops notes |
| Progress % | Milestone string only | Additive progress endpoint |
| Activity feed | None | Additive read-only aggregation |
| Internal notes | None | New `EventNote` only |

Composition pattern (frontend):

```
Workspace page
 ├── GET …/workspace          (thin)
 ├── GET …/workspace/progress
 ├── GET …/workspace/activity
 ├── GET/POST/DELETE …/notes
 ├── GET/POST …/tasks
 ├── staff-assignments
 ├── procurements
 ├── inventory-movements
 └── payments + profitability
```

---

## 3. Backend Changes

| Change | Detail |
|--------|--------|
| Task | `category`, `priority`, `completionNotes` through repository → DTO → Zod → service/controller |
| Progress | `WorkspaceProgressService` — task/checklist counts, pending actions, inventory buckets, overall % |
| Activity | `WorkspaceActivityService` — chronological read from booking/tasks/staff/procurements/movements/payments/notes |
| Notes | `EventNoteApplicationService` — list/create/delete; not customer-visible |
| Wiring | `BookingController`, `ApplicationServicesModule`, `RepositoriesModule` |
| RBAC | `workspace:notes:write` (owner/admin/operations_manager/coordinator) |

Reused without duplication: `StaffAssignment`, `VendorProcurement`, `InventoryMovement`, payments, profitability, `WorkspaceService`.

---

## 4. Database Changes

Migration `20260719043000_p2_01_workspace_ops`:

- Enums: `task_category`, `task_priority`
- Columns on `tasks`: `category`, `priority`, `completion_notes`
- Table `event_notes` (tenant + booking scoped; FK to `users`)

No Checklist aggregate table (deferred to P2-02). Checklist groups = `Task.category` + `ChecklistItem` rows.

---

## 5. API Changes

**Unchanged (backward compatible):**

- `GET /bookings/:id/workspace`
- `POST /bookings/:id/activate-workspace`

**Additive:**

| Method | Path | Permission |
|--------|------|------------|
| GET | `/bookings/:id/workspace/progress` | `workspace:read` |
| GET | `/bookings/:id/workspace/activity` | `workspace:read` |
| GET | `/bookings/:id/notes` | `workspace:read` |
| POST | `/bookings/:id/notes` | `workspace:notes:write` |
| DELETE | `/bookings/:id/notes/:noteId` | `workspace:notes:write` |

Task create/update/status accept optional `category`, `priority`, `completionNotes`.

OpenAPI (`apps/api/openapi/openapi.v1.json`) synchronized for new routes.

---

## 6. Frontend Changes

Rewrote [`event-workspace-page.tsx`](apps/web/src/features/workspace/components/event-workspace-page.tsx) as stacked sections (no Tabs primitive):

1. Overview  
2. Activation (preserved)  
3. Progress  
4. Tasks  
5. Checklists (by category)  
6. Staff  
7. Vendors  
8. Inventory  
9. Finance (`PaymentsPanel` + `ProfitabilityPanel`)  
10. Internal Notes  
11. Activity Feed  

New clients: `features/tasks`, `features/staff-assignments`; extended workspace + vendor procurement clients. Design system, nav, RBAC (`Can` / `RequirePermission`), and `?id=` static-export pattern preserved.

---

## 7. Documentation Updates

| Document | Update |
|----------|--------|
| `docs/09-api-design.md` | Additive endpoints; `workspace:notes:write`; Task fields |
| `docs/07-domain-model.md` | Task category/priority; EventNote |
| `docs/05-system-architecture.md` | Thin HTTP realization + P2-01 composition note |
| OpenAPI | New paths |
| Business Bible | **Not modified** |

---

## 8. Testing

| Layer | Coverage |
|-------|----------|
| Unit | Task field fixtures; `EventNoteApplicationService`; `WorkspaceProgressService`; `WorkspaceActivityService` |
| Frontend | Existing workspace API client specs; new modules follow same Zod/envelope patterns |
| Integration | Progress/activity compose existing repositories (no new write models) |

---

## 9. Validation Results

| Check | API | Web |
|-------|-----|-----|
| typecheck | PASS (`tsc --noEmit`) | PASS |
| lint | PASS | PASS |
| test | **647 passed** | **118 passed** |
| build | PASS | PASS |

Runtime (local): API http://localhost:4000 · Web http://localhost:3001 · migration applied.

---

## 10. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Notes

1. Staff assignment UI accepts **User UUID** (assignment FK still references `User`, not `StaffMember` master — known deferred alignment).
2. Activity feed is **read-only aggregation** of existing timestamps (no dedicated event store).
3. Named checklists reuse `Task.category` + `ChecklistItem`; separate Checklist aggregate remains **P2-02**.
4. Activate still uses booking `If-Match` version (`WorkspaceDto` has no version).

### Explicitly out of scope (confirmed)

Fat `GET /workspace` · Checklist aggregate · full procurement workflow UI · staff scheduling · Business Bible edits
