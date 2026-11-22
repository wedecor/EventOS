# Event OS — P2-06 Vendor Procurement Workflow Report


| Field              | Value                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Feature**        | End-to-end vendor procurement lifecycle                                                           |
| **Authority**      | Business Bible, Domain Model, existing VendorProcurement, Workspace, OpenAPI, Prisma              |
| **Scope**          | Header workflow, quotes, POs, delivery, cost, timeline, vendor performance counters, workspace UI |
| **Business Bible** | Unchanged                                                                                         |
| **Date**           | 2026-07-19                                                                                        |


---

## 1. Executive Summary

P2-06 extends the existing **VendorProcurement** aggregate into a complete operational workflow without redesigning Vendor or Event Workspace.

A new header `workflowStatus` drives:

`draft → quotation_requested → quotation_received → approved → purchase_ordered → vendor_confirmed → materials_delivered → completed` (plus `cancelled`).

Phase 1 line FSM and legacy header `status` remain for backward compatibility (synced from workflow). Additive entities cover **ProcurementQuote**, **PurchaseOrder**, **ProcurementTimelineEvent**, delivery tracking, and cost summary. Workspace stays a thin composition surface.

**Verdict: APPROVED WITH MINOR NOTES**

---



## 2. Architecture Compliance


| Rule                                        | Status                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Preserve Vendor / VendorProcurement / lines | ✅ Extended, not replaced                                                  |
| Preserve Workspace composition              | ✅ No WorkspaceDto embedding; booking + `/vendor-procurements` composition |
| Booking ownership                           | ✅ All procurements remain booking-scoped                                  |
| Additive APIs / DB only                     | ✅ New fields, enums, tables, routes                                       |
| No PDF generation                           | ✅ Attachment **metadata** only on quotes                                  |
| No inventory redesign                       | ✅                                                                         |
| Business Bible unchanged                    | ✅                                                                         |
| DDD boundaries                              | ✅ Vendor module owns workflow                                             |


---



## 3. Backend Changes


| Area                                  | Change                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `VendorProcurementApplicationService` | Create (enriched), list/detail, workflow transition, delivery update, quotes, POs, hydrate with cost/timeline/actions |
| Line FSM                              | Additive `cancelled` transition                                                                                       |
| Repositories                          | Quote, PO, timeline; procurement update/findAll; vendor performance increment                                         |
| Controllers                           | `/vendor-procurements`, `/procurement-quotes/:id/approve`                                                             |
| Workspace activity                    | Procurement timeline events (excluding duplicate request_created)                                                     |
| Workspace progress                    | Open procurements use terminal **workflow** statuses                                                                  |


---



## 4. Database Changes

Migration `20260719080000_p2_06_vendor_procurement_workflow`:


| Change         | Detail                                                                           |
| -------------- | -------------------------------------------------------------------------------- |
| Enum           | `cancelled` on `procurement_line_status`                                         |
| Enum           | `vendor_procurement_workflow_status`                                             |
| Enum           | delivery / quote / PO / timeline event types                                     |
| Header columns | workflowStatus, serviceCategory, requiredDate, cost fields, deliveryStatus/notes |
| Tables         | `procurement_quotes`, `purchase_orders`, `procurement_timeline_events`           |
| Vendor columns | procurementCount, onTimeDeliveryCount, completedProcurementCount                 |
| Backfill       | Map legacy status → workflow; seed `request_created` timeline                    |


---



## 5. API Changes

Backward-compatible booking routes retained. Additive:


| Method   | Path                                       | Permission               |
| -------- | ------------------------------------------ | ------------------------ |
| GET      | `/vendor-procurements`                     | `procurements:read`      |
| GET      | `/vendor-procurements/:id`                 | `procurements:read`      |
| POST     | `/vendor-procurements/:id/transition`      | `procurement:transition` |
| POST     | `/vendor-procurements/:id/delivery`        | `procurements:write`     |
| GET/POST | `/vendor-procurements/:id/quotes`          | read / write             |
| GET/POST | `/vendor-procurements/:id/purchase-orders` | read / write             |
| POST     | `/procurement-quotes/:id/approve`          | `procurements:write`     |


Create procurement body accepts optional `serviceCategory`, `requiredDate`, `estimatedCost`.

OpenAPI regenerated.

---



## 6. Frontend Changes


| Area                              | Change                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `/app/vendors/procurements/`      | List dashboard                                                                     |
| `/app/vendors/procurements/view/` | Detail: status, cost, quotes, PO, delivery, timeline                               |
| Navigation                        | Operations → Procurements                                                          |
| Workspace                         | Procurement card shows workflow, delivery, cost, outstanding actions + detail link |
| Schemas/API/hooks                 | Extended procurement parsers and mutations                                         |


---



## 7. Procurement Lifecycle



### Status flow (header)

```
draft
  → quotation_requested
  → quotation_received
  → approved
  → purchase_ordered
  → vendor_confirmed
  → materials_delivered
  → completed
  ↘ cancelled (from non-terminal)
```

Legacy `status` sync: draft→planned; quote stages→requested; PO/vendor_confirmed→confirmed; materials_delivered→delivered; completed/cancelled mapped 1:1.

### Quote management

- Multiple submitted quotes per procurement
- Approve one → siblings rejected; header → `approved`; `approvedCost` set
- Recording a quote advances draft/quotation_requested → `quotation_received`



### Purchase orders

- Created after approval (or when already purchase_ordered)
- Auto `PO-YYYY-####`; optional issue flag
- Advances header to `purchase_ordered` (legacy `confirmed`)
- PDF deferred



### Delivery tracking

- `pending | partial | delivered | cancelled`
- Marking delivered from `vendor_confirmed` can advance workflow to `materials_delivered`



### Cost tracking

Exposed on DTO `costSummary`:

- Estimated (header or Σ line budgeted)
- Approved (approved quote / header)
- Actual (header or Σ line actual)
- Variance = actual − (approved ?? estimated)



### Vendor performance

Counters on Vendor: procurementCount, onTimeDeliveryCount, completedProcurementCount (operational storage only).

---



## 8. Documentation Updates


| Document                                  | Update                                       |
| ----------------------------------------- | -------------------------------------------- |
| `docs/07-domain-model.md`                 | Header workflow + quote/PO/timeline entities |
| `docs/05-system-architecture.md`          | New API routes                               |
| `docs/10-implementation-specification.md` | Repositories/controllers                     |
| `docs/09-api-design.md`                   | Additive endpoint notes (module section)     |
| OpenAPI                                   | Regenerated                                  |
| Business Bible                            | **Unchanged**                                |


---



## 9. Testing


| Layer           | Result                                                          |
| --------------- | --------------------------------------------------------------- |
| Unit            | Workflow transitions, quote approve, PO guards, create timeline |
| Existing suites | API **668** tests passed                                        |
| Frontend        | Typecheck / lint / test / build (run in validation)             |
| Validation      | Lifecycle, delivery, cost summary covered in service tests      |


---



## 10. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. Line-level FSM remains Phase 1; full operational truth is header `workflowStatus`.
2. On-time delivery increment is heuristic (completed after delivery with requiredDate present) — refine in later analytics (P2-12).
3. PDF / binary attachments deferred; quote stores metadata only.



### Recommended next milestone

**P2-07 — Inventory Operations Enhancements**