# Event OS — P2-03 Staff Domain Architecture Review

| Field | Value |
|-------|-------|
| **Milestone** | P2-03 Staff Domain Review & Assignment Architecture |
| **Type** | Architecture review (no scheduling implementation) |
| **Authority order** | Business Bible → Domain Model → Prisma → OpenAPI → Assignment / Workspace / Staff module |
| **Business Bible** | Unchanged |
| **Date** | 2026-07-19 |

---

## 1. Executive Summary

Event OS already has a **StaffMember** master (`/staff`) and a **StaffAssignment** lifecycle (`proposed → confirmed → released | cancelled`). Those two layers are **not wired to the same identity**.

| Surface | Identity used today |
|---------|---------------------|
| Auth / JWT / sessions | `User` |
| Lead assignee, execution owner | `User` |
| Workspace “Assign staff” | **`User` UUID** (field named `staffMemberId`) |
| Staff list / create / edit pages | **`StaffMember` UUID** |
| Domain docs / Business Bible | Operational staff = **StaffMember** (optional auth link) |

This is the deferred **R3-01 decision 1A** carried from Phase 1 — not an accidental bug, but it is now a **blocker** before Availability & Scheduling.

**Recommendation: INTRODUCE STAFFMEMBER** as the operational staff aggregate of record — complete the deferred alignment rather than invent a third model. Keep `User` strictly for authentication and portal actors. Do **not** implement scheduling in this milestone.

**Verdict: INTRODUCE STAFFMEMBER**

---

## 2. Current Architecture Review

### 2.1 User entity

`User` is the **authentication identity**: email, password hash, role string, sessions, password history. It is also reused as a generic “person who can be referenced” for:

- `Lead.assignedToId`
- `Event.executionOwnerId`
- `StaffAssignment.staffMemberId` ← **misnamed FK to User**
- Various “completed by / recorded by” actors

Users are login accounts (founders, OM, coordinator, finance, viewers). They are **not** the Business Bible’s decorator workforce.

### 2.2 Staff module

`StaffApplicationService` implements Staff Master CRUD against the `StaffMember` table:

- name, role, department, phone, email, status (`active` \| `inactive` \| `on_leave`)
- No `userId`, skills, employment type, or compensation fields yet
- Soft lifecycle via status (no hard delete)

Frontend `/app/staff` pages correctly target this API.

### 2.3 Staff Assignment

`StaffAssignmentApplicationService` supports:

| Transition | From → To |
|------------|-----------|
| Create | → `proposed` |
| Confirm | `proposed` → `confirmed` |
| Release | `confirmed` → `released` |
| Cancel | `proposed` \| `confirmed` → `cancelled` (reason required) |

Optimistic concurrency via `version` / `If-Match`. Domain events published on each transition. Suggestion type `staff.assign` delegates to the same create path.

**Gap:** create does **not** validate that `staffMemberId` refers to an active `StaffMember` — only that Prisma can FK-connect a `User`. Inactive User checks and StaffMember status invariants from the domain model are not enforced.

### 2.4 Workspace assignment UX

Workspace Staff section:

- Placeholder: **“Staff user UUID”**
- Displays raw UUID, not staff name
- Confirm / release / cancel work against assignment IDs

Operators cannot pick a person from `/app/staff` and assign them without also having a matching `User` row — which temporary decorators typically will not.

### 2.5 Authentication & authorization

| Concern | Status |
|---------|--------|
| JWT / login / refresh | Unchanged; owned by Auth (`User`) |
| Permissions | `staff:read`, `staff:write` — sufficient for master + assignment APIs |
| Workspace RBAC | Assignment mutations use `staff:write`; reads use `staff:read` |
| Permission regression risk of Option B | **Low** if assignment APIs stay additive and field semantics are clarified |

### 2.6 Coupling, duplication, limitations

| Issue | Impact |
|-------|--------|
| **Dual identity** | StaffMaster IDs ≠ Assignment IDs — product inconsistency |
| **Naming lie** | `staffMemberId` means User today — confuses OpenAPI consumers and UI |
| **No link User ↔ StaffMember** | Cannot optionally grant a decorator a portal login later without a join |
| **Temps without accounts** | Bible: trusted temp pool engaged on demand; WhatsApp/phone — not Event OS logins |
| **Availability / leave / schedule** | Cannot hang cleanly off User without polluting Auth |
| **Future payroll / HR** | Employment type, rates, performance belong on workforce profile, not login User |

---

## 3. User vs StaffMember Comparison

### Option A — Continue using User as operational staff

| Dimension | Analysis |
|-----------|----------|
| **Advantages** | Already wired for assignments; same pattern as Lead assignee / execution owner; no FK migration |
| **Disadvantages** | Forces every decorator to be a login User (or fake users); contradicts Bible (temps, phone/WhatsApp); Staff Master becomes orphaned; status `on_leave` on StaffMember unused by assignment |
| **Scalability** | Poor — Auth User grows with workforce; RBAC roles collide with operational roles |
| **Scheduling impact** | Availability/leave on User mixes identity with ops calendar |
| **Leave management** | Bible leave constraints are workforce rules, not auth account flags |
| **Employment types** | Permanent vs temporary has no natural home on User |
| **Future HR / payroll** | Would overweight the auth aggregate |
| **Complexity** | Short-term simpler; long-term higher coupling and technical debt |

**Bible alignment:** Weak. Doc 06 Phase 1 requires Staff Master + Availability & Leave + Event Assignment for **decorators**, not portal accounts.

### Option B — StaffMember as operational aggregate (recommended)

```
User (auth, optional)
   ↕  optional userId
StaffMember (workforce profile)
   ↓
StaffAssignment (event staffing)
   ↓
Availability / Leave / Scheduling (future)
   ↓
Payroll / performance (future)
```

| Dimension | Analysis |
|-----------|----------|
| **Advantages** | Matches domain model (`docs/07`, `docs/04`); matches Bible; keeps Auth separate; enables temps without login; natural parent for availability/scheduling; completes R3-01 1A |
| **Disadvantages** | Requires FK realignment + data migration; workspace UI rewrite to picker; temporary dual-read period |
| **Migration effort** | Moderate — StaffMember table already exists; assignments currently point at Users; need mapping strategy |
| **Future scalability** | High — clean attachment point for P2 scheduling and later payroll |
| **DDD alignment** | Strong — Staff bounded context owns workforce; Auth owns identity |
| **Bible alignment** | Strong — Staff Master is priority #1 in Doc 06 §17 |

---

## 4. Recommended Architecture

**Choose Option B: StaffMember is the operational staff aggregate of record.**

### Why User is not sufficient

1. Business Bible treats decorators as a **workforce**, not application users.
2. Temporary pool must be assignable **without** Event OS login.
3. Availability, leave, and scheduling must not live on the Auth `User` model.
4. Staff Master already exists — keeping assignments on User leaves a permanent dual-model defect.
5. Domain model already specifies: `StaffAssignment.staffMemberId` → **StaffMember**; optional `User` auth link.

### Why this is “INTRODUCE STAFFMEMBER” (not KEEP CURRENT)

StaffMember **exists as a table and CRUD API**, but it is **not** the assignment identity. “Keep current” would mean keep User-as-assignment forever and abandon StaffMember as the ops source of truth — incompatible with Bible and with upcoming scheduling.

### What we are *not* recommending in this milestone

- No scheduling / availability implementation
- No payroll
- No Business Bible edits
- No JWT redesign
- No collapsing User and StaffMember into one table

---

## 5. Domain Model Proposal

### 5.1 StaffMember (target shape — design only)

Minimal additive fields relative to today:

| Field | Notes |
|-------|-------|
| `id` | Existing |
| `tenantId` | Existing |
| `userId` | **New, optional** — link to `User` when decorator also has a login |
| `name` / displayName | Existing `name` (keep; alias in UI if needed) |
| `employmentType` | **New** — `permanent` \| `temporary` (Bible classification) |
| `operationalRole` | Prefer clarifying existing `role` string or constrained enum later |
| `status` / active | Existing (`active` \| `inactive` \| `on_leave`) |
| `joinedAt` | **New, optional** |
| `phone`, `email`, `department` | Existing |
| `skills` | Deferred until matching rules are specified (Bible: do not invent weights early) |
| `metadata` | Defer — avoid premature JSON bag unless needed for migration |

**Invariant:** Authentication remains on `User`. StaffMember never stores password or sessions.

### 5.2 Relationships

```
User 1──0..1 StaffMember     (optional portal link)
StaffMember 1──* StaffAssignment
StaffAssignment *──1 Event (booking)
StaffMember 1──* AvailabilityPeriod     (future P2-05+)
StaffMember 1──* LeaveRequest           (future)
```

### 5.3 Assignment model improvements (design)

Keep lifecycle: `proposed → confirmed → released | cancelled`.

Recommended additive improvements (implementation in follow-on milestone):

| Topic | Recommendation |
|-------|----------------|
| **Role vocabulary** | Constrain or suggest: `lead_decorator`, `primary_decorator`, `secondary_decorator`, `coordinator`, `helper`, `vendor_liaison` — free-text still allowed initially for Bible flexibility |
| **On-site lead** | Keep `isOnSiteLead`; enforce at most one confirmed on-site lead per booking (soft warning → hard invariant later) |
| **Active staff only** | Create/confirm must require StaffMember `status = active` |
| **History / audit** | Lifecycle timestamps already exist; ensure AuditLog covers confirm/release/cancel (align with existing audit patterns) |
| **Idempotency** | Optional unique open assignment per `(bookingId, staffMemberId)` to prevent duplicate proposed rows |
| **Display** | APIs should return staff display name with assignment DTO (join) for workspace |

Do **not** redesign the assignment state machine in this review.

### 5.4 RBAC

| Preserve | Notes |
|----------|-------|
| JWT / sessions | Unchanged |
| `staff:read` / `staff:write` | Remain the permission keys |
| Workspace Can gates | Keep `staff:write` for mutate |
| No new permission required for FK alignment | Optional later: `staff:assign` split — **not required now** |

---

## 6. Database Impact

### Design only — do not apply until P2-04 approval

| Step | Change |
|------|--------|
| 1 | Add `staff_members.user_id` nullable UUID FK → `users`, unique per tenant (optional link) |
| 2 | Add `employment_type` (and optionally `joined_at`) |
| 3 | Add new column `staff_assignments.staff_member_ref_id` → `staff_members` **or** migrate `staff_member_id` FK from `users` to `staff_members` in a controlled cutover |
| 4 | Backfill: for each existing assignment User, create/link StaffMember where missing, then repoint FK |
| 5 | Drop obsolete User FK once dual-write period ends |

**Must preserve:** Users, assignment history, audit rows, booking links, optimistic versions.

**Backward compatibility options:**

- **A (preferred):** Expand-contract — new FK column + dual-read; deprecate User FK; remove later
- **B:** Single cutover migration with mapping table if assignment volume is low (likely for We Decor Phase 1)

No Availability tables in this milestone.

---

## 7. API Impact

Additive / clarifying only — no breaking redesign of path shapes.

| API | Recommendation |
|-----|----------------|
| `GET/POST/PATCH /staff` | Add optional `userId`, `employmentType`; response remains StaffMember |
| `POST /staff-assignments` | `staffMemberId` must mean **StaffMember.id** after cutover |
| Assignment list/get | Include nested `{ id, name, employmentType, status }` for UI |
| OpenAPI | Update descriptions so `staffMemberId` documents StaffMember, not User |
| Compatibility | Temporary accept User id only if linked via `StaffMember.userId` (optional bridge during migration) |

Suggestion `staff.assign` payload continues to carry `staffMemberId` with the new semantics after cutover.

---

## 8. Frontend Impact

| Area | Impact |
|------|--------|
| **Workspace** | Replace UUID text field with StaffMember picker (active staff); show name + role |
| **Staff pages** | Remain StaffMember CRUD; optionally show “linked user” and assignment history later |
| **Scheduling / calendar** | Future UIs bind to StaffMember.id — **do not build yet** |
| **Auth screens** | Unchanged |

Until P2-04 ships, workspace remains User-UUID based (known limitation from P2-01 notes).

---

## 9. Migration Strategy

| Phase | Action |
|-------|--------|
| **P2-03 (this)** | Architecture decision only — **no code / no migration** |
| **P2-04** | StaffMember implementation: `userId` link, employment type, FK alignment, workspace picker, OpenAPI/docs sync, tests |
| **P2-05** | Staff Scheduling & Availability hanging off StaffMember |
| Data | Preserve all Users; create StaffMember rows for assigned Users lacking a master; never delete assignment history |

Rollback: retain dual columns until assignment reads proven on StaffMember FK.

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Existing assignments point at Users with no StaffMember | Backfill StaffMember from User name/email; link `userId` |
| Consumers already treating `staffMemberId` as User | Document cutover; bridge accept User→StaffMember via `userId` for one release |
| Overbuilding employment/skills enums | Keep `employmentType` minimal; leave skills/metadata for later |
| Confusing StaffMember with Auth roles | Document: operationalRole ≠ JWT RBAC role |
| Scheduling built on User before alignment | **Blocked by this review** — do P2-04 first |

---

## 11. Engineering Recommendation

### Verdict

**INTRODUCE STAFFMEMBER**

Complete StaffMember as the operational staff aggregate; realign `StaffAssignment` to StaffMember; keep `User` for authentication with an optional link. No scheduling in this milestone. No Business Bible changes. No implementation until P2-04 approval.

### Suggested next steps

1. **P2-04 — StaffMember Implementation** (FK alignment, optional `userId`, employment type, workspace picker, OpenAPI/docs, migration)
2. **P2-05 — Staff Scheduling & Availability**
3. Then continue: Vendor Procurement Workflow → Inventory Ops → Finance Documents → Communication Center → Calendar → Customer Timeline → Advanced Reports

### What “KEEP CURRENT MODEL” would mean (rejected)

Continue assigning via User UUID and treat Staff Master as cosmetic. That preserves short-term code paths but **fails** Bible Staff Master / Availability prerequisites and locks scheduling into the Auth model.

---

## Appendix A — Evidence map

| Source | Finding |
|--------|---------|
| `docs/business/06-staff-management.md` §17 | Staff Master, Availability & Leave, Event Assignment are Phase 1 must-haves for decorator workforce |
| `docs/07-domain-model.md` | StaffAssignment refs StaffMember; StaffMember has optional User auth link |
| `docs/04-business-domain.md` | StaffMember attributes include optional `userId`, skills |
| `apps/api/prisma/schema.prisma` | Explicit R3-01 decision 1A: assignment FK still → User |
| `staff.application.service.ts` | Same deferral comment |
| Workspace UI | “Staff user UUID” placeholder |
| OpenAPI | `/staff` = StaffMember; `/staff-assignments` = `staffMemberId` (runtime User) |

## Appendix B — Out of scope (confirmed)

- Scheduling UI/API
- Leave workflow rules / recommendation weights
- Payroll
- Business Bible modifications
- JWT / permission matrix redesign
