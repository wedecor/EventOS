# Event OS — P2-07 Inventory Operations Enhancements Report


| Field              | Value                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Feature**        | Inventory reservations, extended movement FSM, verification, damage reports, workspace composition         |
| **Authority**      | Business Bible, Domain Model, existing InventoryItem/InventoryMovement, Workspace, OpenAPI, Prisma         |
| **Scope**          | Reservations, availability, movement status expansion, verification, damage, workspace UI, ops dashboard   |
| **Business Bible** | Unchanged                                                                                                  |
| **Date**           | 2026-07-19                                                                                                 |


---

## 1. Executive Summary

P2-07 extends the existing **Inventory** module with booking-scoped operations without redesigning InventoryItem, InventoryMovement, or Event Workspace.

Preserved aggregates: **InventoryItem**, **InventoryMovement**, plus new **InventoryReservation**. Movement FSM keeps the Phase 1 path valid and adds packing/dispatch/return-verify statuses. Availability is computed as `quantityAtJpNagar − active reservations − unlinked active movements`; over-allocation returns `INSUFFICIENT_INVENTORY` (HTTP 409). Workspace remains a thin composition surface with additive progress and activity.

**Verdict: APPROVED WITH MINOR NOTES**

---



## 2. Architecture Compliance


| Rule                                        | Status                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Preserve InventoryItem / InventoryMovement  | ✅ Extended, not replaced                                                  |
| Preserve Workspace composition              | ✅ Thin GET; progress/activity + sibling APIs                              |
| Booking ownership                           | ✅ Reservations and movements remain booking-scoped                        |
| Additive APIs / DB only                     | ✅ New statuses, tables, routes, optional movement columns                 |
| No barcode / QR                             | ✅                                                                         |
| No image storage                            | ✅ Damage reports store photo metadata only                                |
| Business Bible unchanged                    | ✅                                                                         |
| DDD boundaries                              | ✅ Inventory module owns ops lifecycle                                     |


---



## 3. Backend Changes


| Area                                      | Change                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `InventoryReservationApplicationService`  | Create, get, list-by-booking, modify, release, cancel; optional `vendorProcurementId`                               |
| `InventoryAvailabilityService`            | Available qty formula; used on reserve/modify and movement create                                                   |
| `InventoryMovementApplicationService`     | Extended FSM; optional `reservationId` on create; packing/dispatch/return fields on transition                      |
| Verification / damage services            | Record and list by movement                                                                                         |
| Repositories                              | Reservation, verification, damage report; movement unlinked-active queries                                          |
| Controllers                               | `/inventory-reservations`, `/inventory-verification`, `/inventory-damage`; `GET /inventory/movements`               |
| Booking controller                        | `GET /bookings/:id/inventory-reservations`                                                                          |
| Workspace progress                        | Additive `outstandingActions`; reserved/packed/loaded/returned/damaged counters                                     |
| Workspace activity                        | Events for reserved / packing / packed / loaded / returned / damage (and related timestamps)                        |


---



## 4. Database Changes

Migration `20260719090000_p2_07_inventory_operations`:


| Change           | Detail                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Enum             | Additive movement statuses: `packing_started`, `verified`, `ready_for_dispatch`, `dispatched`, `return_verified`, `cancelled` |
| Enum             | `inventory_reservation_status` (`reserved`, `released`, `cancelled`)                           |
| Enum             | Verification result; damage type / severity                                                    |
| Tables           | `inventory_reservations`, `inventory_verifications`, `inventory_damage_reports`                |
| Movement columns | Optional reservation link, packing/verify/dispatch/return metadata                             |
| FK               | Optional reservation → procurement (`vendor_procurement_id`)                                   |


---



## 5. API Changes

Phase 1 item/movement routes retained. Additive:


| Method   | Path                                              | Permission                       |
| -------- | ------------------------------------------------- | -------------------------------- |
| POST     | `/inventory-reservations`                         | `inventory:write`                |
| GET      | `/inventory-reservations/:id`                     | `inventory:read`                 |
| PATCH    | `/inventory-reservations/:id`                     | `inventory:write`                |
| POST     | `/inventory-reservations/:id/release`             | `inventory:write`                |
| POST     | `/inventory-reservations/:id/cancel`              | `inventory:write`                |
| GET      | `/bookings/:id/inventory-reservations`            | `inventory:read`                 |
| GET      | `/inventory/movements`                            | `inventory:read`                 |
| POST/GET | `/inventory-verification/...`                     | `inventory:move:confirm` / read  |
| POST/GET | `/inventory-damage/...`                           | `inventory:damage-notes:write` / read |

Transition `toStatus` accepts Phase 1 values plus P2-07 statuses. `INSUFFICIENT_INVENTORY` → **409**.

OpenAPI regenerated.

---



## 6. Frontend Changes


| Area                         | Change                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `/app/inventory/operations/` | Operations dashboard (movements / reservations overview)                            |
| Movement detail              | Extended statuses, verification, damage reporting                                   |
| Workspace                    | Inventory card: progress counters, outstanding actions, link to ops                 |
| Schemas/API/hooks            | Reservation, verification, damage parsers and mutations                             |


---



## 7. Inventory Operations Lifecycle



### Reservation

```
reserved → released | cancelled
```

- Optional `vendorProcurementId` only when procurement workflow is `completed` or `materials_delivered`
- Availability checked on create and quantity modify



### Movement status flow

Phase 1 (still valid):

```
planned → picked → packed → loaded → at_venue → returned → cleaned_ready
```

P2-07 additive branches (reachable alongside Phase 1 shortcuts):

```
picked → packing_started → packed
packed → verified → ready_for_dispatch → loaded
loaded → dispatched → at_venue
returned → return_verified → cleaned_ready
  ↘ cancelled (from non-terminal packing/dispatch states)
```



### Availability

```
availableQuantity = quantityAtJpNagar
  − Σ active reservations
  − Σ unlinked active movements
```



### Verification & damage

- Verification: expected vs actual quantity; result `pass` / `fail` / `partial`
- Damage report: type, severity, quantity; photo **metadata only** (no binary storage)
- Legacy movement damage-notes endpoint remains

---



## 8. Workspace Integration

Workspace continues to **compose** Inventory APIs — Inventory is not embedded in `WorkspaceDto`.

| Concern | Integration |
| --- | --- |
| Procurement | Optional `vendorProcurementId` on reservation (completed / materials_delivered only); no duplicate purchasing |
| Activity Feed | Aggregated lifecycle events: reserved, packing started, packed, verified, loaded, dispatched, returned, return verified, damage reported |
| Progress | Buckets reserved / packed / loaded / returned / damaged + additive `outstandingActions` |
| Event Workspace UI | Inventory summary card with counters, outstanding actions, deep links to movements and `/app/inventory/operations/` |

---



## 9. Documentation Updates


| Document                                  | Update                                                        |
| ----------------------------------------- | ------------------------------------------------------------- |
| `docs/07-domain-model.md`                 | Reservation + verification/damage; availability; FSM          |
| `docs/05-system-architecture.md`          | Booking-scoped ops; thin workspace; new API routes            |
| `docs/10-implementation-specification.md` | Inventory module P2-07 services/repos/controllers/migration   |
| `docs/09-api-design.md`                   | Additive endpoints + permission route map                     |
| OpenAPI                                   | Regenerated                                                   |
| Business Bible                            | **Unchanged**                                                 |


---



## 10. Testing


| Layer           | Result                                                                |
| --------------- | --------------------------------------------------------------------- |
| Unit            | Reservation overbook → `INSUFFICIENT_INVENTORY`; packing FSM; workspace activity/progress |
| API             | **673** tests passed; lint + build green                              |
| Frontend        | **118** tests passed; typecheck + lint + build green                  |
| OpenAPI         | Regenerated (`openapi:export` + web `openapi:generate`)               |
| Validation      | Stock hold formula; reservation release/cancel; ops dashboard route   |


---



## 11. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. Phase 1 linear movement path remains valid; operators may skip optional P2-07 statuses (e.g. packed → loaded without verified).
2. Photo binary upload and barcode/QR remain out of scope; damage stores metadata only.
3. Availability treats reservation-linked movements as covered by the reservation — refine analytics later if dual-counting edge cases appear in reporting.

### Recommended next milestone

**P2-08 — Finance Documents & Attachments**
