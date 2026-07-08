# We Decor Events — Inventory Workflow

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Ilyas (Co-Founder, We Decor Events) |
| **Primary Reviewer** | Zakir (Co-Founder, We Decor Events) |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Version** | 0.1 |
| **Created Date** | 2026-07-07 |
| **Last Updated** | 2026-07-07 |
| **Next Review Date** | Not Defined |
| **Document Purpose** | Define how We Decor Events stores, tracks, prepares, transports, reuses, and maintains decoration inventory (props, backdrops, artificial flowers, fabrics, lights, tools, consumables)—separating founder policy (Ilyas) from tactical execution (Zakir). This will inform Event OS Inventory, Warehouse, Operations, and Procurement integrations. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-07 | Ilyas + Zakir (Interview in progress) | Initial structure created. All operational facts pending interview capture; unknowns flagged **Not Yet Interviewed (Zakir)** / **Not Defined** / **Not Currently Measured**. |

---

## Purpose of This Document

This document describes **how We Decor manages inventory today** (Current State) and what We Decor **wants to become** (Future Vision), specifically:

- What inventory exists (taxonomy) and what is procured per event vs reused
- Storage locations and “warehouse” reality today
- Inventory preparation and loading workflow per event
- Reuse, cleaning, repair, and replacement
- Lost/damaged item handling and accountability
- Stock availability checks and shortage recovery
- Inventory data that Event OS must capture (master data + movements + event linkage)

It is derived from direct founder interviews (Ilyas) and tactical execution interviews (Zakir). **Founder business policy** is distinguished from **tactical execution (Zakir)**. Metrics not tracked are marked **Not Currently Measured**—never estimated. Undefined decisions are marked **Not Defined**.

**Intended audience:** Founders, product managers, engineers, AI agents, investors, and business leaders building Event OS Inventory/Warehouse/Operations/Procurement workflows.

**Source:** Founder interview (Ilyas) + Tactical interview (Zakir), July 2026–July 2027  
**Status:** Version 0.1 — Draft (Document 08 of 20)

**Prerequisites:**
- [02-business-model.md](./02-business-model.md)
- [05-event-execution.md](./05-event-execution.md)
- [06-staff-management.md](./06-staff-management.md)
- [07-vendor-management.md](./07-vendor-management.md)

---

## Document Scope: Policy vs Execution

| Layer | Source | Status in This Document |
|-------|--------|-------------------------|
| **Founder business policy** | Ilyas interview | Documented where captured; gaps flagged **Not Defined** |
| **Tactical execution** | Zakir day-to-day practice | Documented where captured; gaps flagged **Not Yet Interviewed (Zakir)** |
| **Future vision** | Founder + Zakir preferences | Labelled **Future Vision** |

---

## 1. Executive Summary

### Current State

**Not Yet Interviewed (Zakir).**

### Founder Policy

**Not Defined.**

### Future Vision

**Not Defined.**

---

## 2. Scope

### In Scope

- Inventory categories and what is reused vs per-event purchased/consumed
- Storage locations and access control
- Event-based inventory preparation, packing, loading, transport, return
- Cleaning, maintenance, repairs, replacements
- Damage/loss tracking and accountability
- Minimum stock principles (if any) and shortage handling
- Inventory constraints impacting event acceptance/capacity
- Event OS Inventory/Warehouse module requirements

### Out of Scope

- Vendor selection and payment terms (see [07-vendor-management.md](./07-vendor-management.md))
- Event day execution timeline (see [05-event-execution.md](./05-event-execution.md))
- Finance/accounting reconciliation (see `09-finance-workflow.md` — planned)

---

## 3. Inventory Taxonomy

### Current State

Current inventory categories that We Decor manages and reuses include:

- Artificial flowers
- Backdrop frames and stands
- Fabrics and drapes
- Decoration props
- Lighting equipment
- Tools and installation equipment
- Reusable stage and decoration materials
- Furniture and other reusable decoration assets
- Consumable decoration materials (items that are used and need replacement)

### Current State — Reusable vs Consumable vs Per-event Purchased

#### Reusable (come back after event)

- Artificial flowers
- Backdrop frames and stands
- Fabrics and drapes
- Decoration props
- Lighting equipment
- Tools and installation equipment
- Reusable stage and decoration materials
- Furniture and other reusable decoration assets

#### Consumable (used up and must be replaced)

- Consumable decoration materials

#### Per-event purchased (bought for that specific event)

- Fresh flowers
- Certain decoration materials based on event requirement
- Customised items required for specific customer designs

### Future Vision

Standard taxonomy in Event OS (illustrative, not yet confirmed):

- Reusable structures (frames, stands)
- Reusable décor (artificial flowers, props)
- Fabrics/drapes
- Lights/electrical
- Tools and hardware (ladders, extension cords, drill, tapes)
- Consumables (tape, zip ties, glue, balloons)
- Per-event purchases (fresh flowers)

*Final taxonomy must be derived from actual inventory list; do not assume.*

---

## 4. Storage Model (Warehouse Reality)

### Current State

We Decor has a storage location in **JP Nagar** for inventory management.

#### Stored categories (JP Nagar)

- Reusable stage and decoration materials
- Artificial flowers
- Backdrop frames and stands
- Fabrics and drapes
- Decoration props
- Lighting equipment
- Tools and installation equipment
- Furniture and other reusable decoration assets

#### Not Defined

- Detailed mapping of which exact items are stored where (within JP Nagar storage, and any other micro-locations)

#### Access & Responsibility (Current State)

- **Zakir** has access/keys to the storage location.
- **Zakir** is responsible for opening/closing the storage area.
- **Zakir** manages day-to-day organization and availability of stored materials.
- Other staff may access the storage when required for event preparation, but overall responsibility remains with Zakir.

#### Inventory tracking (Current State)

- Inventory is managed mostly through **memory and experience**.
- There is **no structured inventory tracking system** (no spreadsheet/app).
- Sometimes photos or WhatsApp messages may be used for reference, but there is no centralized inventory list or tracking process today.

### Future Vision

Centralized and/or multi-warehouse storage with location-based assignment (future). Details: **Not Defined**.

---

## 5. Pre-Event Inventory Preparation

### Current State

Packing lists are mainly created based on **experience and memory**.

The team may refer to:

- Previous event references
- WhatsApp messages
- Photos

There is **no formal checklist** or structured packing list system today.

### Tactical Execution (Zakir) — Checklist/Verification

For a typical event:

- **Picking items from storage:** Zakir + event team/staff pick required items based on event requirements
- **Packing:** event team/staff handle packing of materials
- **Checking/validation:** Zakir ensures required items are available and nothing important is missed
- **Final “ready to go” confirmation:** Zakir gives final confirmation before materials leave for the event

### Future Vision

Event OS generates event-linked packing lists and checklists, with human approval (aligned with Doc 05 guardrails).

---

## 6. Loading, Transport, and Return Workflow

### Current State

After an event, the team returns reusable items back to the JP Nagar storage location.

#### Unloading/returning

- Event team/staff unload and return materials after the event.

#### Checking returned items

- Items are checked based on experience to ensure important materials are returned and to notice damages/missing items.
- There is **no formal system** to compare what went out vs what came back.

#### Timing

- Returns are usually done after the event depending on event completion time and operational convenience.
- Exact timing (same night vs next day) depends on the situation.

### Future Vision

Track inventory movements per event: picked → loaded → delivered → returned → cleaned/ready.

---

## 7. Reuse, Cleaning, Repair, Replacement

### Current State

When an item is damaged, actions depend on type and severity.

#### Minor damages

- Repaired when required and reused.

#### Major damages / not repairable

- Replaced or new items are purchased.

#### Decision & execution

- **Decision:** Zakir decides whether to repair/reuse/replace.
- **Execution:** Zakir and the team handle repairs or replacement arrangements as required.

#### Cleaning (Current State)

- **Responsibility:** event team/staff clean reusable items when required; Zakir oversees readiness for future use.
- **Timing:** generally after the event or when materials are brought back to storage; exact timing depends on schedule and convenience.
- **Requirements:** fabrics and items needing maintenance are cleaned before reuse; some items are condition-based and not cleaned every time.

No formal cleaning checklist or maintenance schedule exists today.

### Not Currently Measured

- Damage frequency by category
- Replacement cost per month

### Future Vision

Maintenance records and lifecycle tracking per item/category.

---

## 8. Loss, Damage, and Accountability

### Current State

Loss/missing items are handled case-by-case.

Typical handling:

- Team checks and tries to identify where the item was lost/missed
- If important for future events, item is replaced/purchased again
- Minor losses handled informally

There is no formal accountability policy or structured loss tracking system today.

### Not Defined

- Formal accountability policy (who is responsible for loss/damage)
- Whether deductions/penalties exist

---

## 9. Stock Visibility & Shortage Handling

### Current State

When an item is missing, recovery action depends on situation and urgency.

Typical recovery actions:

- Quick purchase from a nearby vendor if required immediately
- Arrange the item from another source/vendor
- Send someone back to storage if the item is available there
- Adjust/substitute the design if required

Priority: ensure event execution is not impacted.

### Future Vision

- Stock availability check per event plan
- Substitute suggestions (human-approved)
- Vendor fallback integration (see [07](./07-vendor-management.md))

---

## 10. Inventory Constraints & Capacity Impact

### Current State

Inventory is not a major constraint currently.

Requirements are typically managed through:

- Available inventory
- Additional purchases
- External rentals when required

If a specific reusable item is not available, alternatives are arranged based on event requirement.

No specific inventory category consistently causes constraints currently.

---

## 10A. Purchasing New Reusable Inventory (Current State)

New reusable inventory is purchased based on business requirements and operational needs.

Common triggers:

- Repeated requirement for the same item across multiple events
- Shortage of available reusable inventory for planned designs
- Replacement of damaged or unusable items
- New design requirements or trends that improve service offerings

No formal calculation or threshold exists today for deciding when to purchase new inventory.

---

## 11. Event OS Inventory Module Requirements

### Phase 1 (Must Have)

| Capability | Status |
|-----------|--------|
| Inventory categories and items master | Future Vision |
| Storage locations (even if informal) | Future Vision |
| Event-linked packing list | Future Vision |
| Basic movement tracking (picked/loaded/returned) | Future Vision |
| Damage/loss notes | Future Vision |
| Photo attachments on inventory items and movements | Future Vision |
| Inventory acquisition records (event-linked or general) | Future Vision |

### Movement Workflow (Phase 1 Requirement)

Essential inventory movement states for reusable inventory tied to an event:

**Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned/Ready**

Phase 1 should capture timestamps for each important movement state:

- Picked time
- Packed time
- Loaded time
- At Venue time
- Returned time
- Cleaned/Ready time

Purpose: understand movement, identify delays, and enable operational tracking in future phases.

### Movement Tracking Ownership & Permissions (Phase 1 Requirement)

- **Zakir** is the primary owner who can create, manage, and oversee inventory movement tracking.
- **Permanent decorators/staff** are allowed to update movement states/timestamps during event execution when directly handling items.
- Final responsibility for inventory accuracy remains with **Zakir**.

State meanings:

- **Planned:** items identified as required for the event
- **Picked:** items taken from storage
- **Packed:** items prepared/organized for transport
- **Loaded:** items loaded for transportation
- **At Venue:** items reached the event location
- **Returned:** items brought back after the event
- **Cleaned/Ready:** items cleaned, checked, and available for future use

### Inventory Master — Minimum Fields (Phase 1 Requirement)

Minimum fields per inventory item/category:

- Item name
- Category
- Item type (Reusable / Consumable / Per-event purchase)
- Storage location
- Quantity available
- Current condition/status
- Last used event
- Maintenance/repair notes
- Purchase date (if available)
- Replacement cost/value
- Usage history

The system should support tracking:

- **Individual items** (where required), and
- **Category-level quantities** for bulk materials.

### Packing List Granularity (Phase 1 Requirement)

Phase 1 should support both:

- **Category-level tracking** for bulk materials and consumables (e.g., tapes, fabrics, consumable decoration materials)
- **Item-level tracking** for important reusable assets where individual control matters (e.g., backdrop frames, special props, equipment, furniture, other valuable items)

Purpose: balance operational simplicity with control of important assets.

### Guardrails

- Inventory recommendations and checklists should not auto-trigger purchases or notifications without human approval.

### Photos/Attachments (Phase 1 Requirement)

Phase 1 should support attaching photos to inventory items and movements for:

- Item photo (identification)
- Damaged item photo (repair/replacement tracking)
- Packed/load photo evidence (event preparation proof)
- Evidence for missing/damaged inventory issues

Purpose: improve visibility and reduce dependency on memory.

### Inventory Acquisition Linkage (Phase 1 Requirement)

Phase 1 should support both:

- **Event-linked inventory purchases** (items purchased specifically for an upcoming event requirement)
- **General inventory acquisition** (items purchased to increase capacity, replace old stock, or improve offerings)

System should capture purchase reason and event linkage where applicable.

---

## 12. Current State (Consolidated Snapshot)

**Not Yet Interviewed (Zakir).**

---

## 13. Future Vision (Consolidated Snapshot)

**Not Defined.**

---

## 14. Business Rules Registry (IW-01 onwards)

*Registry for Event OS Inventory Workflow. Master registry planned for `14-business-rules.md`.*

| Rule ID | Rule | Type | Status |
|---------|------|------|--------|
| **IW-01** | Do not invent inventory facts; unknowns must be labelled **Not Currently Measured / Not Yet Interviewed (Zakir) / Not Defined**. | Documentation Standard | Confirmed |

---

## 15. KPIs

| KPI | Definition | Status |
|-----|------------|--------|
| Damage rate | Damaged items per event/category | **Not Currently Measured** |
| Loss rate | Lost items per event/category | **Not Currently Measured** |
| Reuse utilization | % events using reused items vs new | **Not Currently Measured** |
| Packing accuracy | Missing items incidents | **Not Currently Measured** |

---

## 16. Risks

| Risk | Severity | Why It Matters | Current Mitigation |
|------|----------|----------------|--------------------|
| Distributed storage | Not Defined | Time loss, missing items, damage risk | **Not Yet Interviewed (Zakir)** |
| Missing items on event day | Not Defined | Quality/time impact | **Not Yet Interviewed (Zakir)** |
| Damage and rework | Not Defined | Cost + quality impact | **Not Yet Interviewed (Zakir)** |

---

## 17. Open Questions (Interview Backlog)

### Tactical Execution — Zakir

- Exact storage locations today and what is stored where
- How packing lists are created (memory vs notes)
- Who prepares what (Zakir vs permanent decorators)
- How items are checked before leaving
- How returns are checked after event
- Where damaged items go; repair workflow
- Whether any items are “always short” in peak season

### Founder Policy — Ilyas

- Warehouse roadmap and multi-warehouse policy (timing, criteria) — **Not Defined**
- Inventory investment strategy (stocking vs just-in-time) — **Not Defined**

---

## 18. Document Status

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Interview status** | Founder policy: **Not Defined**; Tactical execution: **Not Yet Interviewed (Zakir)** |
| **Next step** | Continue interview and populate Current State + policies |

