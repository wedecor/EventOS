# Event OS — F1-09 Event Workspace Report

| Field | Value |
|-------|-------|
| **Feature** | Event workspace view + activate (booking-scoped) |
| **Requested by** | User (F1-09) — scope **option 1 — Narrow F1-09** after API vs docs review |
| **EP1 Requirements** | EP1-OPS-001 (workspace at Approved); human activate per ADR-017 / EP1-AUT-002 intent |
| **Scope** | Events hub, workspace page by booking id, activate, booking deep-link |
| **Explicitly out of scope** | Tasks/checklists; suggestion accept; staff/vendor/inventory/finance panels; timeline |

---

## 1. Executive Summary

Implemented narrowed Phase 1 **Event Workspace** against frozen booking-scoped endpoints only:

- **Events hub** (`/app/events/`) — open workspace by booking UUID
- **Workspace** (`/app/events/workspace/?id=`) — `GET /bookings/:id/workspace` operational summary
- **Activate** — `POST /bookings/:id/activate-workspace` with required `If-Match` from `GET /bookings/:id` version
- **Navigation** — Booking Detail → Workspace; Events nav → hub

No invented hub aggregates: workspace GET returns status fields only.

---

## 2. API vs Documentation Review

| Conflict | Docs / Bible | Frozen API | How handled |
|----------|--------------|------------|-------------|
| Rich ops hub (materials, staff, logistics, checklists, timeline) | `05`, `07` Event Workspace | Thin `WorkspaceDto` only | Deferred; documented |
| Linked view of tasks/procurement/inventory/finance | `docs/09` workspace purpose | Not on GET workspace | Deferred to later F1s |
| Operational checklist | EP1-OPS-003 | Task APIs separate | Deferred (option 1) |
| Suggestion accept `workspace.create` | ADR-017 alternate path | Suggestions exist | Deferred (option 1); direct activate only |
| Activate If-Match version | Required header | Workspace DTO has no version | Load booking for version |
| Event-centric routes | “Event Workspace” module | Paths under `/bookings/:id/…` | UI under `/app/events/…` with booking id |

---

## 3. Files Changed

### Created

- `src/features/workspace/api/workspace.api.ts`
- `src/features/workspace/api/workspace.api.spec.ts`
- `src/features/workspace/schemas/workspace.schemas.ts`
- `src/features/workspace/schemas/workspace.schemas.spec.ts`
- `src/features/workspace/hooks/use-workspace-queries.ts`
- `src/features/workspace/lib/format.ts`
- `src/features/workspace/components/events-hub-page.tsx`
- `src/features/workspace/components/event-workspace-page.tsx`
- `src/features/workspace/index.ts`
- `src/app/app/events/workspace/page.tsx`
- `EventOS-F1-09-Event-Workspace-Report.md`

### Modified

- `src/app/app/events/page.tsx` — events hub
- `src/features/bookings/components/booking-detail-page.tsx` — Workspace CTA
- `src/shared/lib/breadcrumbs.ts` — `workspace` title

---

## 4. Implementation

### Workspace view

Displays `workspaceStatus`, `preparationStatus`, `operationalMilestone`, `executionOwnerId`, plus booking status/version for context.

### Activation

Confirm dialog → activate when workspace is `inactive` and booking is `approved` or `in_preparation` (mirrors backend validation). Permission: `workspace:activate`.

### Operational summary

Server fields only; explicit copy that nested modules are not embedded.

### Permissions

- Hub: `workspace:read` **or** `bookings:read`
- Workspace page: `workspace:read`
- Activate button: `workspace:activate`

### Shared reuse

PageLayout/Header/Section, ContentCard, Empty/Loading/Error, ConfirmDialog, toasts, breadcrumbs, RequirePermission/Can; booking query for version.

---

## 5. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test` | **68 passed** |
| `pnpm build` | **PASS** |

Manual E2E against a live API was not run in this session; unit tests cover schema parse and API client (get + activate `If-Match`).

---

## 6. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen workspace API | **Yes** |
| No invent rich hub / nested modules | **Yes** |
| Booking-scoped routes respected | **Yes** |
| Permissions match RBAC | **Yes** |
| F1-01–F1-08 architecture preserved | **Yes** |

**Verdict: APPROVE (narrowed scope)** — production-ready for view + activate; full ops hub blocked on backend/module milestones.

---

## 7. Known Backend Limitations

1. **Workspace GET is thin** — no tasks, staff, vendors, inventory, finance, or timeline embeds.
2. **No version on WorkspaceDto** — activate must use booking `If-Match`.
3. **No event list API** — discovery via booking UUID / dashboard / quote approve `eventId`.
4. **Suggestion accept path** not wired in F1-09 (direct activate only).
5. **Tasks/checklists** available via separate Task APIs — deferred.
6. Workspace uses **`?id=`** booking UUID (static export).

---

## 8. Suggestions / Next Steps

1. **F1-10 — Vendor Management**
2. Later: task list on workspace (`GET /tasks?bookingId=`), suggestion accept for `workspace.create`
3. F1-11 Staff → F1-12 Inventory → F1-13 Finance → F1-14 Reports → F1-15 Settings
