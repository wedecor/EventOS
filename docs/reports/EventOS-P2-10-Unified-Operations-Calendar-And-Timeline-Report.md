# Event OS — P2-10 Unified Operations Calendar & Timeline Report


| Field              | Value                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Feature**        | Unified Operations Calendar & Timeline — read-only aggregation over Event, Staff, Vendor, Inventory, Communication, Finance |
| **Authority**      | Business Bible, Domain Model, Workspace composition, OpenAPI, Prisma                                               |
| **Scope**          | Planning dashboard, calendar, agenda, timeline, and conflict-overlay read models; thin workspace deep-link          |
| **Business Bible** | Unchanged                                                                                                          |
| **Date**           | 2026-07-19                                                                                                         |


---

## 1. Executive Summary

P2-10 introduces a **Unified Operations Calendar & Timeline** as a **read-only aggregation / composition layer**, not a new write-owning module. `CalendarApplicationService` projects `CalendarEntryDto` records at request time from `Event`, `StaffAssignment`/`StaffLeave`/`StaffAvailability`, `VendorProcurement`, `InventoryMovement`/`InventoryReservation`, `Reminder`, `CommunicationRecord`, and `FinancialDocument` — the modules that already own that state keep sole write responsibility.

There is **no** `CalendarEntry` table, **no** `CalendarEntryRepository`, **no** `CalendarEntryCreated` domain event, and **no** Prisma migration. Conflict detection (`GET /calendar/conflicts`) is display-only and reuses existing module logic (`SchedulingApplicationService.detectConflictsForStaffOnBooking`, `InventoryAvailabilityService`) rather than introducing new validation rules. `WorkspaceDto` remains unchanged and thin; the Event Workspace only deep-links into `/app/calendar/` via a summary card.

**Verdict: APPROVED WITH MINOR NOTES**

---

## 2. Architecture Compliance

| Rule                                                        | Status                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Calendar is read-only aggregation, no write ownership        | ✅ `CalendarApplicationService` exposes only `get*` methods; no mutations        |
| No persisted `CalendarEntry` table                            | ✅ No Prisma model, no migration                                                 |
| No duplicate scheduling data                                  | ✅ Entries computed from source repositories on every request; nothing cached    |
| Preserve Event / Staff / Vendor / Inventory / Communication / Finance ownership | ✅ Calendar reads via existing repositories/services only; no new writes    |
| `WorkspaceDto` unchanged (thin)                                | ✅ No fields added; workspace deep-links to `/app/calendar/` only                |
| Conflict view reuses existing module logic                    | ✅ `SchedulingApplicationService.detectConflictsForStaffOnBooking`, `InventoryAvailabilityService` — no new rules |
| RBAC additive only                                             | ✅ New `calendar:read` permission; no existing permission modified              |
| Business Bible unchanged                                       | ✅ `docs/business/` untouched                                                    |
| DDD boundaries                                                 | ✅ Calendar module owns no aggregate; every write path stays in its home module |

---

## 3. Backend Changes

| Area                             | Change                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Module                            | `apps/api/src/modules/calendar/` — controller + application service + DTOs + schemas; no domain/infrastructure layers |
| `CalendarApplicationService`       | `getPlanningDashboard`, `getEvents`, `getAgenda`, `getTimeline`, `getConflicts`                              |
| Aggregation sources                | `EventRepository`; `StaffMemberRepository`, `StaffAssignmentRepository`, `StaffLeaveRepository`, `StaffAvailabilityRepository`; `VendorProcurementRepository`; `InventoryMovementRepository`, `InventoryReservationRepository`; `ReminderRepository`; `CommunicationRecordRepository`; `FinancialDocumentRepository` |
| Reused domain logic                | `SchedulingApplicationService.detectConflictsForStaffOnBooking` (staff conflicts); `InventoryAvailabilityService` (inventory shortages) — both called read-only, no state mutated |
| Controller                         | `CalendarController` — 5 `GET` routes, all `@Permissions('calendar:read')`                                    |
| Query validation                   | Zod schemas in `presentation/schemas/calendar.schemas.ts`; `from`/`to` via `z.string().date()`; `sources` is a comma-separated `CalendarEntrySource` list parsed server-side |
| RBAC                                | New permission `calendar:read` granted to `owner`, `admin`, `sales_manager`, `operations_manager`, `coordinator`, `viewer` |
| Repositories / migrations           | **None added** — module has zero persistence footprint                                                       |
| Workspace / booking controllers     | **Untouched** — no new booking-scoped calendar route; workspace only deep-links via `bookingId` query filter |

---

## 4. Database Changes

**None.**

- No Prisma model, no migration, no new table, enum, or column.
- Calendar reads exclusively through repositories already owned by the Booking, Staff, Vendor, Inventory, Communication, and Finance modules.
- `apps/api/prisma/schema.prisma` is unmodified by this feature.

---

## 5. API Changes

Additive, read-only routes (all existing module endpoints unchanged):

| Method | Path | Permission | Notes |
| ------ | ---- | ---------- | ----- |
| GET | `/calendar` | `calendar:read` | Planning dashboard — today/upcoming events, today's staff, pending procurements, inventory dispatches, pending reminders, overdue items |
| GET | `/calendar/events` | `calendar:read` | Unified calendar entries for day/week/month views |
| GET | `/calendar/agenda` | `calendar:read` | Agenda-style listing (same aggregation as `/calendar/events`) |
| GET | `/calendar/timeline` | `calendar:read` | Chronological timeline; additionally surfaces `communication` and `finance_document` sources |
| GET | `/calendar/conflicts` | `calendar:read` | Display-only staff/inventory/procurement/reminder conflict overlay |

Query filters (`/calendar/events`, `/calendar/agenda`, `/calendar/timeline`): `from`, `to` (required, `z.string().date()`), `bookingId`, `staffMemberId`, `vendorId`, `customerId`, `inventoryItemId`, `eventType`, `status`, `sources` (comma-separated). `/calendar/conflicts` accepts `from`, `to`, `bookingId` only.

Role matrix: **owner**, **admin**, **sales_manager**, **operations_manager**, **coordinator**, **viewer** all receive `calendar:read` — read-only for every role; no write permission exists for this module. OpenAPI regenerated with module export.

---

## 6. Frontend Changes

| Area              | Change                                                                              |
| ----------------- | -------------------------------------------------------------------------------------- |
| Feature module     | `apps/web/src/features/calendar/` — schemas, API client, hooks, filter panel, summary card, dashboard/calendar/agenda/timeline/conflicts UI |
| Route              | `/app/calendar/` (`apps/web/src/app/app/calendar/page.tsx`)                            |
| Navigation         | New "Operations Calendar" entry under **Operations** (`calendar:read`); breadcrumb label registered |
| Dashboard          | Quick-actions / operations views reference the calendar route where applicable          |
| RBAC               | `calendar:read` synced into `apps/web/src/shared/auth/rbac.ts`                          |
| Event Workspace    | `CalendarSummaryCard` — entry/overdue/warning counts for the booking's -14/+30 day window, plus a deep link to `/app/calendar/?bookingId=…`; **no new fields on `WorkspaceDto`** |

---

## 7. Calendar Aggregation Rules

Each `CalendarEntryDto` is a **projection**, not a stored record. Source → entry mapping:

| Source | Anchor date(s) | Notes |
| ------ | --------------- | ----- |
| `event` | `Event.eventStartDate`–`eventEndDate` | Title includes booking number, event type, venue; `severity: 'warn'` if the window has passed and status isn't `completed` |
| `staff_assignment` | Confirmed assignment's booking event window | Filtered to active staff unless `staffMemberId` is supplied |
| `staff_leave` | `StaffLeave.startDate`–`endDate` (approved only) | |
| `staff_availability` | Per-date or recurring weekday availability, expanded across the requested range | |
| `procurement` | `VendorProcurement.requiredDate` | `severity: 'overdue'` if required date has passed and the workflow is still open (`PROCUREMENT_OPEN` states) |
| `inventory_movement` | Dispatch/return/ready-for-dispatch timestamps (timeline mode) or booking event window (calendar mode) | |
| `inventory_reservation` | Booking event window | Reserved-quantity display only |
| `reminder` | `Reminder.dueAt` | Excludes `cancelled`; `severity: 'overdue'` if `pending` and past due |
| `communication` | `CommunicationRecord.occurredAt` | Timeline mode only |
| `finance_document` | `FinancialDocument.uploadedAt` | Timeline mode only |

Filtering (`bookingId`, `staffMemberId`, `vendorId`, `customerId`, `inventoryItemId`, `eventType`, `status`, `sources`) is applied uniformly via `matchesFilters()` after each entry is built; `sources` narrows which source types are aggregated at all (skips repository calls for excluded sources where practical).

---

## 8. Timeline Aggregation Rules

`GET /calendar/timeline` calls the same `aggregateOperationalEntries()` routine as `/calendar/events` and `/calendar/agenda`, with `mode: 'timeline'`:

- Uses precise event timestamps where available (e.g. inventory movement `dispatchedAt`/`returnedAt`/`readyForDispatchAt`) rather than collapsing to the booking's event window
- Adds two sources not shown on the calendar/agenda views: `communication` (`CommunicationRecord.occurredAt`, excluding soft-deleted) and `finance_document` (`FinancialDocument.uploadedAt`, excluding soft-deleted)
- Entries are sorted chronologically by `startAt`, then by `id` as a tiebreaker (`sortEntries()`)
- The planning dashboard (`GET /calendar`) reuses the same aggregation in `'calendar'` mode across three fixed windows (today, next 7 days, -14/+30 day horizon) to compute today/upcoming/staff/procurement/inventory/reminder/overdue buckets and their counts

---

## 9. Workspace Integration

| Concern | Integration |
| ------- | ------------ |
| `WorkspaceDto` | **Not** expanded — thin status DTO preserved |
| Event Workspace UI | `CalendarSummaryCard` fetches `GET /calendar/events?bookingId=…` scoped to a -14/+30 day window and renders entry/overdue/warning counts plus a source breakdown |
| Deep link | "Open in Operations Calendar" link to `/app/calendar/?bookingId=…`, plus a header action button linking to the same filtered calendar view |
| Aggregates | Event / Staff / Vendor / Inventory / Communication / Finance aggregates all preserved — workspace composition pattern from P2-09 is followed, not altered |

---

## 10. Documentation Updates

| Document | Update |
| -------- | ------ |
| `docs/07-domain-model.md` | Calendar re-scoped from a `CalendarEntry` Aggregate Root to a **read model / projection** (`CalendarEntryDto`); bounded-context table, aggregate-ownership diagram, ER diagram, and EP1 traceability table updated to remove the persisted `CalendarEntry`; `EventWorkspaceActivated` handler outcome corrected (no `calendar.milestone` suggestion is produced); version history row added |
| `docs/09-api-design.md` | New **Module: Calendar (P2-10)** section with endpoints, query filters, and role grants; `calendar:read` added to the permission catalog, role × permission matrix, endpoint↔permission map, and all four affected per-role grant lists (`sales_manager` 23→24, `operations_manager` 44→45, `coordinator` 32→33, `viewer` 21→22); version history row added |
| `docs/05-system-architecture.md` | Module diagram and Phase 1 module inventory annotated to mark Calendar as read-only aggregation; domain-event flow diagram corrected to remove the (never-shipped) Calendar suggestion handler, with an explicit note that Calendar has no event handlers or write path |
| `docs/10-implementation-specification.md` | Calendar Module section rewritten around `CalendarApplicationService` (no repository, no domain events, no migration); aggregate-root persistence list no longer includes `CalendarEntry`; module dependency diagram corrected to show Calendar reading from Booking/Staff/Vendor/Inventory/Finance rather than being written to by Booking; version history row added |
| OpenAPI | Regenerated |
| Business Bible (`docs/business/`) | **Unchanged** |

**Known residual drift (not in scope for this pass):** `docs/06-module-design.md` still describes a pre-P2-10 Calendar module with `ICalendarService.createEntry()/.update()/.cancel()` and `CalendarEntryCreated`/`CalendarEntryUpdated`/`CalendarConflictDetected` events. This file was not in the requested update list; recommend a follow-up doc pass to align it with the read-only design confirmed here.

---

## 11. Testing

| Layer      | Result                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Unit       | `calendar.application.service.spec.ts` — 6 tests (aggregation/sort, bookingId filter, invalid range rejection, timeline communications, procurement-delay conflicts, planning dashboard counts) |
| API        | **691** tests passed; lint + build passed                               |
| Frontend   | **118** tests passed; typecheck + lint + build passed                   |
| OpenAPI    | Regenerated (`openapi:export` + web `openapi:generate`)                 |
| Validation | No persisted calendar table; no new write permission; `WorkspaceDto` unchanged; conflict view display-only |

---

## 12. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. No provider/scheduler changes — Calendar introduces no notification, reminder-delivery, or background-job behavior.
2. Conflict view (`GET /calendar/conflicts`) is display-only; it reuses existing Staff and Inventory module logic and introduces no new validation rules.
3. Staff conflict detection runs `detectConflictsForStaffOnBooking` per assignment within the requested range; this is O(events × assignments) per request and can be costly for large tenants — flagged as a follow-up optimization (e.g. batched conflict queries or caching) rather than a blocker for Phase 1 scale.
4. `docs/06-module-design.md` retains pre-P2-10 (write-oriented) Calendar module language and was outside the scope of this documentation pass; recommend aligning it in a follow-up.

### Recommended next milestone

**P2-11 — Customer 360**
