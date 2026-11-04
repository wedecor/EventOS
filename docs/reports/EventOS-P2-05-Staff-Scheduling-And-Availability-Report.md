# Event OS — P2-05 Staff Scheduling & Availability Report

| Field | Value |
|-------|-------|
| **Feature** | Staff scheduling & availability on StaffMember |
| **Authority** | Business Bible, P2-03, P2-04, Domain Model, Prisma, Workspace |
| **Scope** | Availability, leave, conflict detection, workload, calendar, recommendations, workspace integration |
| **Business Bible** | Unchanged |
| **Date** | 2026-07-19 |

---

## 1. Executive Summary

P2-05 adds the operational scheduling layer on top of the approved **StaffMember** aggregate. Authentication (`User` / JWT / sessions) is untouched. Assignment lifecycle (`proposed → confirmed → released|cancelled`) is preserved; **confirm** now enforces scheduling conflict detection.

New entities **StaffAvailability** and **StaffLeave** are owned by StaffMember. Additive APIs under `/staff-availability`, `/staff-leave`, and `/scheduling` support calendar, workload, conflicts, and rule-based recommendations. Workspace reuses the existing Staff Assignment UI with conflict warnings, workload summary, and suggestion ranking.

**Verdict: APPROVED WITH MINOR NOTES**

---

## 2. Architecture Compliance

| Rule | Status |
|------|--------|
| StaffMember remains operational aggregate | ✅ Availability, leave, workload, recommendations keyed by StaffMember |
| User remains auth-only | ✅ No scheduling fields on User; leave reviewer stores User id only |
| No scheduling on StaffAssignment | ✅ Conflicts derived at confirm time |
| Assignment lifecycle unchanged | ✅ Same transitions; confirm adds conflict gate |
| No Business Bible changes | ✅ |
| No AI scheduling | ✅ Score = availability + workload + employment type |
| Additive DB / APIs only | ✅ |
| Preserve `staff:read` / `staff:write` | ✅ |

```
User (auth, optional link)
   ↕ userId
StaffMember
   ├── StaffAvailability
   ├── StaffLeave
   └── StaffAssignment → Event
```

---

## 3. Backend Changes

| Area | Change |
|------|--------|
| Repositories | `StaffAvailabilityRepository`, `StaffLeaveRepository`; `findConfirmedByStaffMemberId` on assignments |
| Services | `StaffAvailabilityApplicationService`, `StaffLeaveApplicationService`, `SchedulingApplicationService` |
| Confirm path | `StaffAssignmentApplicationService.confirmAssignment` calls conflict detection; fails with `SCHEDULING_CONFLICT` |
| Controllers | `StaffAvailabilityController`, `StaffLeaveController`, `SchedulingController` |
| HTTP mapping | `SCHEDULING_CONFLICT` → 409 Conflict |
| Modules | Wired in `RepositoriesModule`, `ApplicationServicesModule`, `StaffModule` |

---

## 4. Database Changes

Migration `20260719070000_p2_05_staff_scheduling`:

| Object | Notes |
|--------|-------|
| Enum `staff_availability_kind` | available, unavailable, partial_day, holiday |
| Table `staff_availability` | date **or** weekday; optional HH:mm window; reason/notes; version |
| Enum `staff_leave_type` | casual, sick, vacation, emergency, other |
| Enum `staff_leave_status` | requested, approved, rejected, cancelled |
| Table `staff_leave` | date range; reviewedByUserId → users; version |

FK cascade: deleting StaffMember removes availability/leave. Tenant restrict.

---

## 5. API Changes

Additive only (permissions reuse staff read/write):

| Resource | Endpoints |
|----------|-----------|
| `/staff-availability` | GET list, POST create, PATCH update, DELETE |
| `/staff-leave` | GET list, POST request, POST `:id/review` |
| `/scheduling` | GET calendar, workload, conflicts, recommendations |

Confirm assignment response on conflict:

```json
{
  "code": "SCHEDULING_CONFLICT",
  "message": "Cannot confirm assignment due to scheduling conflicts.",
  "details": { "conflicts": [/* … */] }
}
```

OpenAPI regenerated from Nest controllers.

---

## 6. Frontend Changes

| Area | Change |
|------|--------|
| Feature `staff-scheduling` | API client, Zod parsers, TanStack Query hooks |
| Staff detail | Workload + Availability CRUD + Leave request/approve/reject/cancel |
| `/app/staff/scheduling/` | Day / week / month calendar view |
| Navigation | Operations → Scheduling |
| Event Workspace | Recommendations list, selected-staff conflicts + workload; soft warn on propose; hard fail on confirm |

---

## 7. Scheduling Rules

### Availability

- Entry is either a specific `date` or recurring `weekday` (0=Sun…6=Sat), not both.
- Kinds: `available`, `unavailable`, `partial_day`, `holiday`.
- Optional `startTime`/`endTime` (HH:mm); both or neither.
- Blocking kinds for confirm: `unavailable`, `partial_day`, `holiday` (day-level).

### Leave

- Types: casual, sick, vacation, emergency, other.
- Status: requested → approved | rejected; requested|approved → cancelled.
- **Approved** leave overlapping event dates blocks confirmation.

### Conflict Detection

Before confirm, evaluate StaffMember against booking event dates:

1. Staff not `active` → `staff_inactive`
2. Other confirmed assignments with overlapping event dates → `overlapping_assignment`
3. Approved leave overlapping range → `approved_leave`
4. Blocking availability on any day in range → `unavailable`

Propose remains allowed (draft); workspace shows warnings.

### Recommendation Logic (rule-based)

Start score 100 for each active StaffMember:

| Factor | Adjustment |
|--------|------------|
| No conflicts | +20 |
| Each conflict | −40 |
| Permanent employment | +10 |
| 0 events this week | +15 |
| ≥3 events this week | −15 |

Sorted descending by score. No ML / AI.

---

## 8. Documentation Updates

| Document | Update |
|----------|--------|
| `docs/07-domain-model.md` | StaffAvailability / StaffLeave under StaffMember |
| `docs/09-api-design.md` | Permission matrix + P2-05 endpoint table |
| `docs/05-system-architecture.md` | Routes + frontend feature folder |
| `docs/10-implementation-specification.md` | Staff package repositories/controllers |
| OpenAPI | Regenerated |
| Business Bible | **Unchanged** |

---

## 9. Testing

| Layer | Coverage |
|-------|----------|
| Unit | `SchedulingApplicationService` (conflicts, recommendations, workload) |
| Unit | `StaffLeaveApplicationService` (create/review transitions) |
| Unit | `StaffAssignmentApplicationService` confirm conflict gate |
| Integration | Existing Nest/Prisma suites; migration additive |
| Frontend | Zod parsers + workspace/staff UI wired to APIs |
| Validation | `pnpm typecheck`, `lint`, `test`, `build` (API + web) |

---

## 10. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. Conflict detection is **day-granularity** (event dates); intra-day HH:mm windows on availability are stored but not used for precise overlap yet.
2. Soft Bible guidance about multiple permanent staff on leave is surfaced via conflict/leave data for human judgment; no separate multi-staff soft-warning API.
3. `legacyUserId` expand-contract column from P2-04 remains for Phase 3 drop (out of scope).

### Recommended next milestone

**P2-06 — Vendor Procurement Workflow**
