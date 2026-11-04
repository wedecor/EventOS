# Event OS — P2-04 StaffMember Implementation Report

| Field | Value |
|-------|-------|
| **Feature** | StaffMember as operational workforce aggregate |
| **Authority** | P2-03 Architecture Review (INTRODUCE STAFFMEMBER) |
| **Scope** | FK alignment, StaffMember fields, workspace picker — **no scheduling** |
| **Business Bible** | Unchanged |
| **Date** | 2026-07-19 |

---

## 1. Executive Summary

P2-04 completes the approved P2-03 architecture: **User remains authentication**; **StaffMember is the operational workforce identity**; **StaffAssignment references StaffMember**.

An **expand-contract** migration preserves history:

1. Add StaffMember fields (`userId`, `employmentType`, `joinedAt`)
2. Copy prior User FK values to `legacy_user_id`
3. Backfill StaffMember rows for assigned Users
4. Repoint `staff_member_id` → `staff_members`
5. Keep `legacy_user_id` for Phase 3 drop (not removed in this milestone)

Workspace now uses a **StaffMember picker** (name · operational role · employment type). Assignment lifecycle is unchanged.

**Verdict: APPROVED WITH MINOR NOTES**

---

## 2. Architecture Compliance

| P2-03 decision | P2-04 implementation |
|----------------|----------------------|
| User = auth only | JWT / sessions / User repository unchanged |
| StaffMember = ops identity | Assignment FK → StaffMember; optional `userId` link |
| Expand-contract | `legacyUserId` retained; no destructive drop |
| No scheduling | Availability / leave / calendar not implemented |
| Preserve `staff:read` / `staff:write` | Unchanged |
| No Business Bible edits | Confirmed |

```
User (auth, optional)
   ↕ userId
StaffMember (workforce)
   ↓
StaffAssignment → Event
```

---

## 3. Backend Changes

| Area | Change |
|------|--------|
| `StaffMember` | `userId?`, `employmentType` (`permanent`\|`temporary`), `joinedAt?`; DTO adds `operationalRole` (alias of `role`) + `active` |
| `StaffMemberRepository` | `findByUserId`, `resolveForAssignment` (id → userId bridge → auto-create from User) |
| `StaffAssignment` | FK to StaffMember; `legacyUserId?`; DTO includes nested `staffMember` summary |
| `StaffAssignmentApplicationService` | Resolves StaffMember; rejects non-`active` for create/confirm |
| Zod / controllers | Additive create/update fields; `joinedAt` as ISO datetime string |
| RBAC | Unchanged |

Legacy bridge: posting a **User UUID** that is already linked (or can be linked) still works via `resolveForAssignment` during transition.

---

## 4. Database Changes

Migration `20260719060000_p2_04_staff_member_alignment`:

| Step | Action |
|------|--------|
| Expand | Enum `staff_employment_type`; columns on `staff_members`; `legacy_user_id` on `staff_assignments` |
| Preserve | `UPDATE … SET legacy_user_id = staff_member_id` |
| Drop User FK | Drop `staff_assignments_staff_member_id_fkey` (to users) |
| Backfill | Insert StaffMember for Users referenced by assignments (linked via `user_id`) |
| Repoint | `staff_member_id` → StaffMember ids |
| Contract (partial) | New FK to `staff_members`; FK `legacy_user_id` → `users` |
| Phase 3 (later) | Drop `legacy_user_id` after production soak |

Validation on empty/low-volume local DB: `orphanFk = 0` (all assignment FKs resolve to StaffMember). Assignment history columns and versions untouched.

---

## 5. API Changes

Additive / semantic clarification only (paths unchanged):

| Endpoint | Notes |
|----------|-------|
| `POST/PATCH /staff` | Optional `userId`, `employmentType`, `joinedAt` |
| `GET /staff*` | Response includes `employmentType`, `userId`, `joinedAt`, `operationalRole`, `active` |
| `POST /staff-assignments` | `staffMemberId` = StaffMember id (User id accepted via bridge) |
| `GET /staff-assignments*` | Nested `staffMember` summary; `legacyUserId` exposed |

OpenAPI regenerated (`openapi.v1.json`); web `api.generated.ts` regenerated.

---

## 6. Frontend Changes

| Surface | Change |
|---------|--------|
| Staff list / form / detail | Employment type; operational role label; linked user / joined display |
| Workspace Staff assignment | Replaced User UUID input with active StaffMember select; shows name, role, employment type, status |
| Assignment DTO parsing | Nested `staffMember` + `legacyUserId` |

Design system reused (`select`, `ContentCard`, `Can`).

---

## 7. Migration Validation

| Check | Result |
|-------|--------|
| Existing assignment rows preserved | Yes (no delete; values rewritten to StaffMember ids) |
| History timestamps / status / version | Preserved |
| Backfill for assigned Users | SQL insert + repoint; asserts no orphan FKs |
| Legacy compatibility | `legacyUserId` populated; resolve bridge for User ids |
| Local migrate deploy | PASS |

---

## 8. Documentation Updates

| Document | Update |
|----------|--------|
| `docs/07-domain-model.md` | StaffMember P2-04 fields + assignment FK invariant |
| `docs/09-api-design.md` | Staff module purpose / StaffMember assignment semantics |
| `docs/10-implementation-specification.md` | FK alignment note |
| OpenAPI | Regenerated |
| Business Bible | **Not modified** |

---

## 9. Testing

| Suite | Result |
|-------|--------|
| API unit (staff + assignment + full suite) | **657 passed** |
| API lint / build | PASS |
| Web typecheck / lint / test | **118 passed** |
| Web build | PASS |
| Migration deploy | PASS |

Coverage highlights: inactive staff blocked on assign; create resolves StaffMember; nested staff summary on list/get.

---

## 10. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. **Phase 3 pending** — `legacyUserId` remains until a dedicated cleanup milestone after soak.
2. **Bridge auto-create** — assigning a bare User UUID with no StaffMember creates a temporary StaffMember (phone may fallback to email). Prefer selecting from `/staff` master.
3. **Scheduling** — explicitly deferred to **P2-05**.

### Recommended next milestone

**P2-05 — Staff Scheduling & Availability** (availability calendar, leave, conflict detection, scheduling APIs/UI) on top of StaffMember.
