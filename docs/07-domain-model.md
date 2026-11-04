# Event OS Domain Model

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Founding Engineering |
| **Primary Reviewer** | Ilyas + Zakir (We Decor Events) |
| **Status** | Draft — founder review |
| **Version** | 1.6 |
| **Created Date** | 2026-07-08 |
| **Last Updated** | 2026-07-29 |
| **Next Review Date** | Not Defined |
| **Document Purpose** | Define the **Phase 1 business domain model** that sits between the approved business requirements ([`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md)) and database/API design. Authoritative reference for aggregates, entities, relationships, and business invariants before schema or API work begins. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 1.0 | 2026-07-08 | Founding Engineering | Initial Phase 1 domain model derived from Doc `19`, Business Bible `01`–`18`, aligned architecture docs, ADR-016, ADR-017 |
| 1.1 | 2026-07-13 | Founding Engineering | R4-01: thin Event Workspace HTTP realization; Payment/VendorExpense status `confirmed`\|`void` (no business-rule change). |
| 1.2 | 2026-07-19 | Founding Engineering | P2-08: FinancialDocument (metadata-only proofs) near Finance/Attachment; verification + soft delete + audit events. |
| 1.3 | 2026-07-19 | Founding Engineering | P2-09: CommunicationRecord, CommunicationTemplate, Reminder, CommunicationAttachment, NotificationPreference (Communication Center). |
| 1.4 | 2026-07-19 | Founding Engineering | P2-10: Calendar re-scoped from a `CalendarEntry` write Aggregate Root to a **read model / projection** (`CalendarEntryDto`) over Event, StaffAssignment, StaffLeave, StaffAvailability, VendorProcurement, InventoryMovement/Reservation, Reminder, CommunicationRecord, FinancialDocument. No persisted `calendar_entries` table; no new write ownership. |
| 1.5 | 2026-07-29 | Founding Engineering | P2-11: Customer 360° Timeline & Relationship Intelligence — **read-only aggregation** DTOs (`CustomerOverviewDto`, `CustomerTimelineItemDto`, `CustomerRelationshipDto`, `CustomerFinancialSummaryDto`, `CustomerCommunicationsSummaryDto`) over Customer, Lead/FollowUp, Quotation, Event, CommunicationRecord, Reminder, TimelineEntry, Invoice, Payment (via booking), FinancialDocument. No new tables; no write ownership; Workspace stays booking-centric. |
| 1.6 | 2026-07-29 | Founding Engineering | P2-12: Business Intelligence KPI dashboards & analytics — **read-only aggregation** DTOs under Analytics (`AnalyticsDashboardDto`, sales/finance/staff/vendors/inventory/customers/operations/trends/export) over Lead, Quotation, Event, Customer, Payment, VendorExpense, Invoice, Staff, VendorProcurement, Inventory, Communication/Reminder. No new tables; no write ownership; Phase-1 `/dashboards/*` remains frozen; additive `/analytics/*` surface. |

---

## Purpose of This Document

This document defines **what exists in the We Decor Phase 1 domain** — aggregates, entities, value objects, relationships, and invariants — without prescribing persistence, APIs, or UI.

| Layer | Document | Responsibility |
|-------|----------|----------------|
| Business requirements | [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | **What** We Decor needs (frozen scope) |
| **Domain model (this doc)** | `07-domain-model.md` | **Conceptual model** — aggregates, lifecycle, invariants |
| Module boundaries | [`06-module-design.md`](./06-module-design.md) | Engineering module ownership |
| Architecture | [`05-system-architecture.md`](./05-system-architecture.md) | System structure and policies |
| Database design | [`07-database-philosophy.md`](./07-database-philosophy.md) | Persistence strategy *(next step after this doc)* |

**This document does not define:** database tables, API endpoints, DTOs, repository interfaces, UI, or application service implementations.

---

## Scope

### In scope (Phase 1)

All domain concepts required to satisfy **59 committed EP1 IDs** and must-pass workflows **W1–W5** in Doc `19`, including:

- Unified event lifecycle (lead → quotation → approved event → operations → completion)
- Event operations workspace, execution tracking, and checklists
- Staff master, assignment recommendations, and movement permissions
- Vendor master, per-event procurement, payments, and variance flags
- Inventory master, event movement states, packing lists, returns
- Customer payments, vendor expenses, event profitability
- Communication timeline, issue notes, review request tracking
- Recommendation-only automation (suggestions — not auto-execution)
- Single-tenant We Decor org boundary

### Out of scope (deferred)

See [Future (Deferred) Domain Concepts](#future-deferred-domain-concepts). No new Phase 1 capabilities are introduced here.

### Terminology note

| Business / domain term | Engineering module term | Notes |
|------------------------|-------------------------|-------|
| **Customer** | CRM **Client** | Doc `19` uses *customer*; [`06-module-design.md`](./06-module-design.md) uses *Client* |
| **Event** | **Booking** (event hub) | Unified event record (`EP1-AUT-006`); Booking module owns the Event aggregate |
| **Domain event** (messaging) | — | Not to be confused with a We Decor **occasion** |

Ubiquitous language reference: [`13-glossary.md`](./13-glossary.md), [`04-business-domain.md`](./04-business-domain.md) *(generic platform terms; Phase 1 detail is authoritative in this document)*.

---

## References

| Document | Role |
|----------|------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | **Frozen Phase 1 business baseline** — EP1 IDs, UAT W1–W5 |
| [`docs/business/02-business-model.md`](../docs/business/02-business-model.md) | Sales pipeline, advance-before-Approved (BR-04) |
| [`docs/business/04-sales-process.md`](../docs/business/04-sales-process.md) | Sales lifecycle, quotation practices |
| [`docs/business/05-event-execution.md`](../docs/business/05-event-execution.md) | Operations lifecycle Approved → Completed |
| [`docs/business/06-staff-management.md`](../docs/business/06-staff-management.md) | Staffing model (v1.0 approved) |
| [`docs/business/07-vendor-management.md`](../docs/business/07-vendor-management.md) | Procurement workflow, variance, issue notes |
| [`docs/business/08-inventory-workflow.md`](../docs/business/08-inventory-workflow.md) | Movement states, packing, taxonomy |
| [`docs/business/09-finance-workflow.md`](../docs/business/09-finance-workflow.md) | Payments, expenses, profitability |
| [`docs/business/12-customer-support.md`](../docs/business/12-customer-support.md) | Timeline, issue notes, review requests |
| [`docs/business/14-business-rules.md`](../docs/business/14-business-rules.md) | Hard blocks, provisional rules |
| [`docs/business/17-automation-opportunities.md`](../docs/business/17-automation-opportunities.md) | No auto-execution policy |
| [`05-system-architecture.md`](./05-system-architecture.md) | Event workspace, automation policy |
| [`06-module-design.md`](./06-module-design.md) | Module ownership |
| [`12-architecture-decisions.md`](./12-architecture-decisions.md) | **ADR-016** (tenancy), **ADR-017** (suggestion-only handlers) |

---

## Domain Overview

Phase 1 centres on a **unified Event** that progresses from sales intake through operational execution to financial completion. The Event is the operational source of truth once sales reaches **Approved** (advance confirmed per [`02-business-model.md`](../docs/business/02-business-model.md) BR-04).

```
Sales phase                          Operations phase                    Close
───────────                          ────────────────                    ─────

Lead ──▶ Quotation ──▶ Event (Approved)
                           │
                           ├── Event Workspace (ops hub)
                           ├── Staff Assignments
                           ├── Vendor Procurement
                           ├── Inventory Movements
                           ├── Tasks / Checklists
                           ├── Timeline / Issues
                           └── Payments / Expenses ──▶ Completed
```

**Principles (non-negotiable, Doc `19` §2):**

- All automation **suggests**; nothing **auto-executes** (`EP1-AUT-001`)
- Human approval before customer comms, vendor actions, staff assignment, pricing, execution (`EP1-AUT-005`)
- Provisional rules **warn/recommend** only (`EP1-BR-004`)
- WhatsApp may continue externally; Event OS is **source of truth** for status, tasks, approvals, tracking

---

## Bounded Contexts

Each context owns its aggregates. Cross-context references use aggregate root IDs only.

| Bounded context | Aggregates (Phase 1) | Primary EP1 areas |
|-----------------|----------------------|-------------------|
| **CRM / Customer** | Customer, TimelineEntry, IssueNote, ReviewRequest; *Customer 360 DTOs (read models only — P2-11)* | EP1-CUS, EP1-SUP |
| **Lead / Sales** | Lead, FollowUp | EP1-SAL |
| **Quotation** | Quotation | EP1-FIN-001 |
| **Event / Operations** | **Event**, EventWorkspace | EP1-OPS, EP1-AUT-002, EP1-AUT-006, EP1-BR-003 |
| **Task** | Task, ChecklistItem | EP1-OPS-003 |
| **Checklist** | ChecklistTemplate, EventChecklist | EP1-OPS-003, EP1-AUT-003 |
| **Staff** | StaffMember, StaffAssignment | EP1-STF |
| **Vendor** | Vendor, VendorProcurement, ProcurementLine | EP1-VEN |
| **Inventory** | InventoryItem, InventoryMovement, InventoryReservation, PackingList | EP1-INV |
| **Finance** | Invoice, Payment, VendorExpense, FinancialDocument, EventProfitabilityView | EP1-FIN, EP1-BR-001–002 |
| **Communication** | CommunicationRecord, CommunicationTemplate, Reminder, CommunicationAttachment, NotificationPreference | EP1-CUS-002 (ops log), P2-09 |
| **Calendar** *(read model — no owned aggregate)* | `CalendarEntryDto` *(projection only; owns no persisted state)* | EP1-OPS-005, P2-10 |
| **Platform** | Suggestion, Attachment (metadata), MovementPermission | EP1-AUT, EP1-STF-003 |
| **BI** *(read model — no owned aggregate)* | Phase-1 `FounderKpiSnapshot` *(frozen `/dashboards/*`)*; P2-12 Analytics DTOs *(additive `/analytics/*`)* | EP1-KPI, EP1-MKT-001–002, P2-12 |

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Customer   │◀────│    Lead     │────▶│  Quotation   │
│   (CRM)     │     │   (Sales)   │     │              │
└──────┬──────┘     └─────────────┘     └──────┬───────┘
       │                                         │
       │              ┌──────────────────────────┘
       │              ▼
       │     ┌─────────────────────────────────────────────┐
       └────▶│              Event (root)                  │
             │  ┌─────────────────────────────────────┐  │
             │  │         Event Workspace              │  │
             │  │  StaffAssignment · Procurement ·     │  │
             │  │  InventoryMovement · Task · Timeline │  │
             │  └─────────────────────────────────────┘  │
             └──────────┬──────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┬─────────────┐
         ▼              ▼              ▼             ▼
    ┌─────────┐   ┌──────────┐   ┌──────────┐  ┌─────────┐
    │ Finance │   │ Calendar │   │  Vendor  │  │Inventory│
    │Payment  │   │(read     │   │ (master) │  │ (master)│
    │Expense  │   │ model)   │   └──────────┘  └─────────┘
    └─────────┘   └──────────┘
    ```

Calendar has no owned box of persisted data — it is drawn here only because it *reads across* Event, Staff, Vendor, Inventory, Communication, and Finance to render a unified view (P2-10).

**Customer 360 (P2-11)** is likewise a **customer-centric read model** assembled by `CustomerIntelligenceApplicationService` — it owns no aggregate and writes nothing. It projects lifetime timeline, relationship health, booking history, financial rollups, and communication summaries from Customer, Lead/FollowUp, Quotation, Event, Communication, Reminder, TimelineEntry, Invoice, Payment (via bookings), and FinancialDocument. Workspace remains **booking-centric**; Customer 360 remains **customer-centric**.

**Business Intelligence (P2-12)** is a **tenant-wide read model** assembled by `AnalyticsApplicationService` — it owns no aggregate and writes nothing. It projects founder/sales/finance/staff/vendor/inventory/customer/operations KPIs, historical trend buckets, and CSV/SpreadsheetML export from existing module repositories. Phase-1 founder routes under `/dashboards/*` remain **frozen**; P2-12 ships as the additive `/analytics/*` surface. **No AI / predictive / forecasting.**

---

## Relationship Diagram

```mermaid
erDiagram
    Customer ||--o{ Lead : "has"
    Customer ||--o{ Quotation : "receives"
    Lead ||--o| Quotation : "may produce"
    Lead ||--o| Event : "converts to"
    Quotation ||--o| Event : "approves into"
    Customer ||--o{ Event : "books"

    Event ||--|| EventWorkspace : "contains"
    Event ||--o{ StaffAssignment : "staffs"
    Event ||--o{ VendorProcurement : "procures"
    Event ||--o{ InventoryMovement : "moves stock"
    Event ||--o{ Task : "tracks work"
    Event ||--o{ TimelineEntry : "logs comms"
    Event ||--o{ IssueNote : "records issues"
    Event ||--o{ Payment : "receives"
    Event ||--o{ VendorExpense : "incurs"
    Event ||--o| ReviewRequest : "may request"

    StaffMember ||--o{ StaffAssignment : "assigned via"
    Vendor ||--o{ VendorProcurement : "supplies"
    VendorProcurement ||--|{ ProcurementLine : "contains"
    Quotation ||--o{ ProcurementLine : "budget link"
    InventoryItem ||--o{ InventoryMovement : "tracked in"
    InventoryItem ||--o{ InventoryReservation : "reserved for"
    InventoryReservation ||--o{ InventoryMovement : "may link"
    InventoryMovement ||--o{ InventoryVerification : "verified by"
    InventoryMovement ||--o{ InventoryDamageReport : "damage reports"
    InventoryMovement ||--o| PackingList : "may include"

    Payment ||--o{ Attachment : "proof"
    InventoryMovement ||--o{ Attachment : "photo"
    VendorExpense ||--o{ Attachment : "proof"
    ProcurementLine ||--o{ Attachment : "proof"

    Event ||--o{ FinancialDocument : "owns evidence"
    Payment ||--o{ FinancialDocument : "may link"
    VendorExpense ||--o{ FinancialDocument : "may link"
    VendorProcurement ||--o{ FinancialDocument : "may link"
    Invoice ||--o{ FinancialDocument : "may link"
    FinancialDocument ||--o{ FinancialDocumentAuditEvent : "audits"

    Event ||--o{ CommunicationRecord : "may log"
    Customer ||--o{ CommunicationRecord : "may link"
    Vendor ||--o{ CommunicationRecord : "may link"
    StaffMember ||--o{ CommunicationRecord : "may link"
    CommunicationTemplate ||--o{ CommunicationRecord : "may seed"
    CommunicationRecord ||--o{ CommunicationAttachment : "has metadata"
    CommunicationRecord ||--o{ Reminder : "may spawn"
    Event ||--o{ Reminder : "may schedule"
    Customer ||--o{ Reminder : "may schedule"
    Customer ||--o{ NotificationPreference : "prefers channels"

    Event ||--o{ Invoice : "billed via"
```

Calendar is intentionally absent from this ER diagram: `CalendarEntryDto` (P2-10) is a read-time projection assembled by `CalendarApplicationService`, not a persisted table or aggregate with its own relationships.

---

## Aggregate Ownership

Rules for cross-aggregate references:

| Rule | Description |
|------|-------------|
| **Root-only references** | Other contexts reference `eventId`, `customerId`, `leadId`, etc. — never internal entities |
| **Single write owner** | Each entity is mutated only by its owning aggregate's application service |
| **Event hub** | Operational entities (assignments, procurement, movements) reference `eventId` |
| **No shared mutable state** | Contexts do not query another context's tables directly |

---

## Value Objects

Shared kernel value objects used across aggregates:

| Value object | Purpose | Invariants |
|--------------|---------|------------|
| **Money** | Amount + currency | Same-currency arithmetic only; no floating point |
| **DateRange** | Event dates, allocation periods | `end` ≥ `start` |
| **PhoneNumber** | Customer, staff, vendor contact | Validated; normalized E.164 |
| **Email** | Contact reachability | Validated format; lowercase normalized |
| **Address** | Venue, vendor location | — |
| **Venue** | Event location | Name required; optional address/capacity |
| **AttachmentRef** | Link to stored file | Points to platform Attachment; tenant-scoped |
| **LeadSource** | Channel taxonomy | Aligned to EP1-SAL-002 (`website`, `instagram`, `whatsapp`, `referral`, `walk_in`, `phone`, `manual`, `other`) |
| **PreparationStatus** | Ops visibility (UAT Z1) | `pending`, `ready`, `needs_attention` |

---

## Aggregates

The sections below define each aggregate. Legend:

| Symbol | Meaning |
|--------|---------|
| **AR** | Aggregate root |
| **E** | Entity owned by this aggregate |
| **VO** | Value object |
| **REF** | Reference to another aggregate (by ID only) |

---

### Customer

**Bounded context:** CRM / Customer  
**Module:** CRM (`06-module-design.md`)

#### Purpose

Single customer identity across lead, quotation, and event lifecycle (`EP1-CUS-001`). Eliminates duplicate customer data between Lead Management Application and Quotation/Billing Application.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Customer | Person or organization engaging We Decor |
| **E** | Contact | Individuals associated with the customer (bride, event manager, etc.) |
| **VO** | PhoneNumber, Email, Address | Contact reachability |

#### Lifecycle

```
created → active ⇄ inactive
              └→ blocked
```

- Created on first lead capture or manual entry
- Linked when lead converts; reused across quotations and events
- Status changes are manual (no auto-block)

#### Business invariants

- Belongs to exactly one tenant ([ADR-016](./12-architecture-decisions.md#adr-016-phase-1-single-tenant-mode-we-decor))
- At least one Contact with phone or email
- Display name unique per tenant (case-insensitive)
- Customer merge requires human action (no auto-merge)

#### Related EP1 IDs

| ID | Capability |
|----|------------|
| EP1-CUS-001 | Unified customer profile |
| EP1-CUS-002 | Communication / interaction timeline (CRM TimelineEntry + P2-09 CommunicationRecord; P2-11 Customer 360 aggregates both) |
| EP1-SUP-* | Support view aliases customer capabilities |

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W5** | Customer identity carries forward without duplicate entry |
| **W1–W4** | Customer context on event record |

#### Customer 360 read models (P2-11)

Customer Intelligence is **not** a new aggregate. `CustomerIntelligenceApplicationService` assembles request-time DTOs only:

| Read model | Purpose |
|------------|---------|
| `CustomerOverviewDto` | Profile snapshot, contacts, interaction window, active bookings, health, deep links |
| `CustomerTimelineItemDto[]` | Chronological multi-source relationship timeline |
| `CustomerBookingHistoryItemDto[]` | Booking history with workspace/calendar deep links |
| `CustomerRelationshipDto` | Repeat flag, lifetime counts, preferred channel/event types, health + indicators |
| `CustomerFinancialSummaryDto` | Quoted / invoiced / paid / outstanding rollup + document list |
| `CustomerCommunicationsSummaryDto` | Channel usage, recent records, reminder counters |

**Invariants:** no Prisma tables or migrations; no write ownership; permission reuse `clients:read`; Payment rollup is booking-scoped (`Payment` has no `customerId`); FollowUp list is lead-scoped via `findByLeadIds`; health is rule-based (no AI / predictive scoring).

---

### Lead

**Bounded context:** Lead / Sales  
**Module:** Lead

#### Purpose

Sales pipeline from enquiry through booking readiness. Extends Lead Management Application patterns — **not** a greenfield CRM rebuild (`EP1-SAL-003`, W5 UAT).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Lead | Sales opportunity |
| **E** | FollowUp | Structured follow-up date/task (`EP1-SAL-005`) |
| **E** | LeadStageHistory | Audit of pipeline transitions |
| **REF** | Customer | `customerId` when identified |
| **REF** | StaffMember | `assignedTo` sales assignee |

#### Lifecycle — sales pipeline

Per [`02-business-model.md`](../docs/business/02-business-model.md) and Doc `19` (reuse LM):

```
New → In Talks → Approved → Completed
         │
         └──→ Lost / Cancelled (exit)
```

| Stage | Business meaning | Source |
|-------|------------------|--------|
| **New** | Enquiry captured | `02` pipeline |
| **In Talks** | Requirements, design, quotation, negotiation, follow-up | `02` BR-03, `04` |
| **Approved** | Advance payment (~20%) verified — booking confirmed | `02` BR-04 |
| **Completed** | Event successfully executed and closed | `02` pipeline |
| **Lost / Cancelled** | Exit statuses | `02` |

#### Business invariants

- Transition to **Approved** blocked until advance payment confirmed — **EP1-BR-001** (see [`14-business-rules.md`](../docs/business/14-business-rules.md))
- `lostReason` required when moving to Lost
- `assignedTo` references active staff of same tenant
- Lead source recorded per EP1-SAL-002 taxonomy
- Conversion to Event requires Approved stage without duplicate customer re-entry (`EP1-AUT-006`)

#### Related EP1 IDs

| ID | Capability |
|----|------------|
| EP1-SAL-001 | Lead capture (all channels) |
| EP1-SAL-002 | Lead source taxonomy |
| EP1-SAL-003 | Pipeline / status |
| EP1-SAL-004 | Lead assignment |
| EP1-SAL-005 | Structured follow-ups |
| EP1-SAL-006 | Sales notifications (with approval guardrails) |
| EP1-MKT-004 | Website intake |
| EP1-BR-001 | Advance before Approved |
| EP1-AUT-006 | Unified event record (conversion) |

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W5** | Full lead → approved event without duplicate entry |
| **W1** | Approved triggers event/workspace creation |

---

### Quotation

**Bounded context:** Quotation  
**Module:** Quotation

#### Purpose

Event-linked price proposal with line items and PDF (`EP1-FIN-001`). Reuses Quotation/Billing Application GST/PDF patterns during parallel-run transition.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Quotation | Formal price proposal |
| **E** | QuotationLineItem | Priced line; budget anchor for procurement (`07` procurement linkage) |
| **REF** | Customer | `customerId` |
| **REF** | Lead | `leadId` (optional) |
| **REF** | Event | `eventId` once linked post-approval |

#### Lifecycle

```
draft → sent → approved
          │        │
          ├→ rejected
          ├→ expired
          └→ superseded (on revision)
```

**Phase 1 note:** Structured customer approval portal is **deferred** — manual WhatsApp approval is acceptable per Doc `19` and `04`. Internal `approved` status is recorded by staff after off-channel confirmation.

#### Business invariants

- Only `draft` quotations are editable
- `sent` requires at least one line item with total > 0
- `approved` is terminal for a version; revisions create new version
- Line totals computed — not manually overridden
- Quotation number unique per tenant
- Approved quotation is prerequisite for Event creation (1:1 per approved quote)

#### Related EP1 IDs

| ID | Capability |
|----|------------|
| EP1-FIN-001 | Event-linked quotations + line items |
| EP1-AUT-006 | Part of unified event chain |
| EP1-VEN-002 | Line items anchor procurement budget |

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W5** | Quotation linked to lead/customer |
| **W3** | Line items compared to actual procurement |
| **W4** | Revenue input to profitability |

---

### Event

**Bounded context:** Event / Operations  
**Module:** Booking (event hub per `06-module-design.md`)

#### Purpose

**Unified event record** (`EP1-AUT-006`) — operational source of truth from Approved through Completed. Anchors workspace, staff, vendor, inventory, finance, and customer support data for one We Decor occasion.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | **Event** | Root of unified event lifecycle |
| **E** | EventWorkspace | Operational hub (see below) |
| **E** | ExecutionProgress | Operational tracking beyond sales pipeline (`EP1-OPS-004`) |
| **VO** | EventDetails | Type, dates, venue, guest count, requirements |
| **REF** | Customer | `customerId` |
| **REF** | Quotation | `quotationId` |
| **REF** | Lead | `leadId` (provenance) |
| **REF** | StaffMember | `executionOwnerId` (`EP1-BR-003`) |

#### Lifecycle

```
[created at Approved] → in_preparation → in_execution → completed
                              │                              │
                              └──────── cancelled ─────────────┘
```

| Phase | Description | Source |
|-------|-------------|--------|
| **Approved** | Advance confirmed; event record active; workspace activation eligible | `02` BR-04, `05` EX-02 |
| **In preparation** | Procurement, inventory, staff, checklists in progress | W1, W2, W3 |
| **In execution** | On-site / event-day operations | `05` event day |
| **Completed** | Execution and financial review done | `05` EX-09, EP1-BR-002 |
| **Cancelled** | Exceptional post-approval cancel | `02`, `05` IR-05 |

Sales pipeline **Approved** on Lead aligns with Event creation; subsequent status is **operational**, not a repeat of sales stages.

#### ExecutionProgress (owned entity)

Tracks operational progress **beyond** the sales pipeline (`EP1-OPS-004`):

| Attribute | Purpose | Source |
|-----------|---------|--------|
| `preparationStatus` | `pending` \| `ready` \| `needs_attention` | UAT Z1 (Doc `19` §10) |
| `operationalMilestone` | Configurable ops milestone on event record | [`05-system-architecture.md`](./05-system-architecture.md) Event Workspace — *illustrative values: preparation, setup, event day, teardown, closed* |
| `executionOwnerId` | Responsible operator before execution proceeds | EP1-BR-003, `14` |

*Operational milestone labels are tenant-configurable operational tracking — not sales pipeline stages. Initial We Decor values follow approved architecture; no additional stages are introduced beyond Doc `19` scope.*

#### Business invariants

- Created only from **Approved** quotation with advance confirmed — **EP1-BR-001**
- One Event per approved quotation (1:1)
- **Execution owner** assigned before execution milestones advance — **EP1-BR-003** ([`14-business-rules.md`](../docs/business/14-business-rules.md))
- Transition to **Completed** blocked until financial review satisfied — **EP1-BR-002**
- Event dates cannot move to past without authorized override
- Cancellation requires reason; triggers downstream cleanup (tasks, movements)
- Event record is authoritative over external channels (WhatsApp) for status/tasks/approvals

#### Related EP1 IDs

| ID | Capability |
|----|------------|
| EP1-AUT-006 | Unified event record |
| EP1-OPS-001 | Event workspace at Approved |
| EP1-OPS-004 | Execution stage tracking |
| EP1-OPS-005 | Event dates / calendar linkage |
| EP1-BR-002 | Financial review before Completed |
| EP1-BR-003 | Execution ownership before execution |
| EP1-AUT-002 | Workspace suggestion at Approved |

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W1** | Central hub for approved → execution |
| **W2–W4** | Anchors inventory, procurement, finance |
| **W5** | Target of lead conversion |

---

### Event Workspace

**Bounded context:** Event / Operations  
**Owned by:** Event aggregate (not a separate aggregate root)

#### Purpose

Operational hub activated at **Approved Event** (`EP1-OPS-001`). Domain intent is a cross-module ops hub. **Phase 1 HTTP realization** (`GET /api/v1/bookings/:id/workspace`) is a **thin status DTO** (workspace/preparation status + execution owner). Staff, vendors, inventory, tasks, and finance remain owned by their modules and are reached via booking-scoped APIs / Admin Portal deep-links — the workspace endpoint does **not** embed those collections.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **E** | EventWorkspace | 1:1 with Event |
| **REF** | StaffAssignment | Collection via `eventId` |
| **REF** | VendorProcurement | Collection via `eventId` |
| **REF** | InventoryMovement | Collection via `eventId` |
| **REF** | Task | Collection via `eventId` |
| **REF** | Payment, VendorExpense | Financial summary refs |
| **REF** | TimelineEntry, IssueNote | Customer support refs |

#### Lifecycle

```
inactive → active → archived
```

| Status | Meaning |
|--------|---------|
| **inactive** | Event approved; workspace not yet confirmed |
| **active** | Workspace confirmed; operational planning underway |
| **archived** | Event completed or cancelled; read-only |

**Human confirmation:** Workspace activation follows suggestion-only policy — `QuotationApproved` / Approved transition may produce a **Suggestion** (`EP1-AUT-002`); Zakir confirms activation ([ADR-017](./12-architecture-decisions.md#adr-017-phase-1-domain-event-handlers-suggestion-only)).

#### Business invariants

- At most one workspace per Event
- Workspace becomes **active** only by explicit human confirmation (not domain event auto-create)
- Modules retain ownership of child aggregates; workspace does not mutate them directly
- Financial visibility is read-only aggregation from Finance context

#### Related EP1 IDs

| ID | Capability |
|----|------------|
| EP1-OPS-001 | Event operations workspace |
| EP1-AUT-002 | Human-confirmed creation |
| EP1-FIN-005 | Profitability visible on workspace |
| EP1-FIN-003 | Payment status visible |

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W1** | Zakir's single pane for approved events (Z1) |
| **W2–W4** | Coordinates prep, procurement, payments |

---

### Staff Assignment

**Bounded context:** Staff  
**Module:** Staff (+ Event reference)

#### Purpose

Record which staff are assigned to an event. Phase 1 includes **recommendation** flow — system suggests; Zakir approves (`EP1-STF-002`, `EP1-AUT-004`).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **E** | StaffAssignment | Staff member linked to event with role/note |
| **REF** | Event | `eventId` |
| **REF** | StaffMember | `staffMemberId` |

*StaffMember is a separate aggregate (staff master). StaffAssignment is owned by Event or Staff context — referenced from Event; mutations go through Staff application service.*

#### Lifecycle

```
proposed → confirmed → released
              └→ cancelled
```

| Status | Meaning |
|--------|---------|
| **proposed** | Recommendation pending Zakir approval |
| **confirmed** | Zakir approved assignment |
| **released** | Event complete; assignment closed |
| **cancelled** | Assignment withdrawn |

#### Business invariants

- Confirmation requires human approval — no auto-assign (`EP1-AUT-001`, `17` AO-03)
- `staffMemberId` must reference active StaffMember
- Assignment changes on active events require authorized role

#### Related EP1 IDs

| ID | Capability |
|----|------------|
| EP1-STF-002 | Staff assignment recommendations |
| EP1-AUT-004 | Automation view of assignment recommendations |
| EP1-STF-001 | Staff master (referenced) |

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W1** | Staff coordination from workspace (Z3) |

---

### StaffMember

**Bounded context:** Staff  
**Module:** Staff

#### Purpose

Staff master aligned to We Decor staffing model ([`06-staff-management.md`](../docs/business/06-staff-management.md) v1.0): 2 permanent decorators + trusted temporary pool. **Operational workforce identity** (P2-03 / P2-04). Authentication remains on `User`; optional `userId` links a StaffMember to a login account without duplicating auth.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | StaffMember | Decorator / workforce profile |
| **REF** | User | Optional auth link (`userId`) |

**P2-04 fields:** `userId` (optional), `employmentType` (`permanent` \| `temporary`), `role` (operational role), `joinedAt`, `status` (`active` \| `inactive` \| `on_leave`). DTO also exposes `operationalRole` (alias of `role`) and `active` (derived from status).

#### Lifecycle

```
active ⇄ inactive
    └→ on_leave
```

#### Business invariants

- Belongs to one tenant
- Name and primary phone required
- Inactive / on_leave staff cannot receive new confirmed assignments
- `StaffAssignment.staffMemberId` references StaffMember (not User). Expand-contract retains `legacyUserId` until Phase 3 drop.

#### Scheduling (P2-05)

Owned by **StaffMember** (not User, not StaffAssignment):

| Kind | Name | Description |
|------|------|-------------|
| **E** | StaffAvailability | Date-specific or recurring weekday window; kinds: available / unavailable / partial_day / holiday |
| **E** | StaffLeave | Leave request; types casual/sick/vacation/emergency/other; status requested→approved\|rejected\|cancelled |

- Approved leave blocks confirmation of overlapping assignments
- Explicit unavailable / partial_day / holiday availability blocks confirmation
- Confirmed assignment date overlap blocks double-booking
- Workload metrics and rule-based recommendations are derived (not persisted)

#### Related EP1 IDs

EP1-STF-001, EP1-STF-002, EP1-STF-003 (movement permissions via platform)

#### Related milestones

P2-03 Staff Domain Architecture Review  
P2-04 StaffMember Implementation  
P2-05 Staff Scheduling & Availability

---

### Vendor

**Bounded context:** Vendor  
**Module:** Vendor

#### Purpose

Vendor directory with preferred/backup status and lightweight issue history (`EP1-VEN-001`, `EP1-VEN-006`).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Vendor | External supplier |
| **E** | VendorIssueNote | Vendor-level feedback note (lightweight) |
| **VO** | Contact, LeadSource category | Vendor category taxonomy per `07` |

#### Lifecycle

```
active ⇄ inactive
    └→ paused / blocked (with reason note)
```

#### Business invariants

- Vendor name required; category required
- Paused/blocked status should capture reason via VendorIssueNote
- Preferred/backup is classification, not a separate aggregate

#### Related EP1 IDs

EP1-VEN-001, EP1-VEN-006

---

### Vendor Procurement

**Bounded context:** Vendor  
**Module:** Vendor

#### Purpose

Per-event procurement tracking from requirement through completion and payment (`EP1-VEN-002`–`006`, W3).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | VendorProcurement | Procurement header per event (or per event-vendor grouping) |
| **E** | ProcurementLine | Line item: material/service, vendor, budget link, status |
| **E** | ProcurementLineIssueNote | Line-level issue note |
| **E** | ProcurementQuote | Vendor quotation (P2-06; multiple allowed; one approved) |
| **E** | PurchaseOrder | Formal PO record (PDF deferred) |
| **E** | ProcurementTimelineEvent | Append-only lifecycle timeline |
| **REF** | Event | `eventId` / `bookingId` |
| **REF** | Vendor | `vendorId` |
| **REF** | QuotationLineItem | Budget comparison (`07` procurement linkage) |
| **REF** | VendorExpense | Payment linkage |

#### Lifecycle — procurement header (P2-06)

```
draft → quotation_requested → quotation_received → approved
  → purchase_ordered → vendor_confirmed → materials_delivered → completed
  ↘ cancelled (from non-terminal states)
```

Legacy Phase 1 `status` on the header remains and is **synced** from `workflowStatus` for backward compatibility (`planned`/`requested`/`confirmed`/`delivered`/`completed`/`cancelled`).

#### Lifecycle — procurement line

Per Doc `19` and [`07-vendor-management.md`](../docs/business/07-vendor-management.md) (unchanged Phase 1 line FSM + cancelled):

```
Planned → Requested → Confirmed → Delivered → Completed
  ↘ Cancelled
```

| State | Meaning | Source |
|-------|---------|--------|
| **Planned** | Requirement identified | `07`, `19` |
| **Requested** | Order communicated to vendor | `07` |
| **Confirmed** | Vendor accepted | `07` |
| **Delivered** | Materials delivered (category-dependent) | `07` |
| **Completed** | Service/on-site work complete (category-dependent) | `07` |

*Some categories use Delivered only, Completed only, or both checkpoints on the same line per `07` category mapping.*

#### Business invariants

- Linked to Event and optionally to QuotationLineItem for budget comparison
- Confirmation and status advances require human action (`EP1-AUT-005`, `07` VM-02)
- Cost variance flagged when actual exceeds budget — **EP1-VEN-005**; reason required per `07`
- Variance review recommended before Event **Completed** (`07` cost variance flag)
- Vendor payment tracking references procurement lines (`EP1-VEN-004`)

#### Related EP1 IDs

EP1-VEN-002, EP1-VEN-003, EP1-VEN-004, EP1-VEN-005, EP1-VEN-006

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W3** | Full procurement cycle |
| **W4** | Expense input to profitability |

---

### InventoryItem

**Bounded context:** Inventory  
**Module:** Inventory

#### Purpose

Inventory master with reusable / consumable / per-event taxonomy (`EP1-INV-001`). Quantity at JP Nagar location (`EP1-INV-002`).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | InventoryItem | Tracked material or asset |
| **VO** | ItemTaxonomy | `reusable`, `consumable`, `per_event` |
| **E** | LocationQuantity | Stock at JP Nagar (Phase 1 single location) |

#### Lifecycle

```
active → retired
```

#### Business invariants

- Taxonomy classification required
- `quantityAvailable` ≥ 0 at all times
- Location quantity tracked at JP Nagar for Phase 1
- **P2-07 availability:** `availableQuantity = quantityAtJpNagar − active reservations − unlinked active movements` (movements not linked to a reservation). Over-allocation returns `INSUFFICIENT_INVENTORY` (HTTP 409).

#### Related EP1 IDs

EP1-INV-001, EP1-INV-002

---

### Inventory Reservation

**Bounded context:** Inventory  
**Module:** Inventory

#### Purpose

Booking-scoped hold on stock before or alongside movement (`P2-07`). Preserves `InventoryItem` as master; does not replace movements.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | InventoryReservation | Quantity reserved for one booking + item |
| **REF** | Event | `bookingId` |
| **REF** | InventoryItem | `inventoryItemId` |
| **REF** | VendorProcurement | Optional `vendorProcurementId` (workflow `completed` or `materials_delivered` only) |

#### Lifecycle

```
reserved → released | cancelled
```

#### Business invariants

- Only active inventory items may be reserved
- Quantity must fit current available quantity (formula above)
- Optional procurement link must share the same booking and be in a terminal delivery workflow status

---

### Inventory Movement

**Bounded context:** Inventory  
**Module:** Inventory

#### Purpose

Per-event stock movement through preparation and return (`EP1-INV-003`–`007`, W2). P2-07 extends the FSM without removing the Phase 1 path.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | InventoryMovement | Movement of one item for one event |
| **E** | PackingList | Generated checklist of items to pack (`EP1-INV-004`) |
| **E** | PackingListLine | Item + quantity on packing list |
| **E** | DamageNote | Accountability for damage/loss (`EP1-INV-006`) |
| **E** | InventoryVerification | Expected vs actual quantity check (`P2-07`) |
| **E** | InventoryDamageReport | Structured damage/loss report; photo **metadata only** (`P2-07`) |
| **REF** | Event | `eventId` / `bookingId` |
| **REF** | InventoryItem | `inventoryItemId` |
| **REF** | InventoryReservation | Optional `reservationId` |
| **REF** | Attachment | Movement photos (`EP1-INV-007`; upload deferred) |

#### Lifecycle — movement state machine

Phase 1 path (still valid) per Doc `19` and [`08-inventory-workflow.md`](../docs/business/08-inventory-workflow.md):

```
Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned/Ready
```

P2-07 additive statuses (optional branches; Phase 1 transitions remain reachable):

```
… → packing_started → … → verified → ready_for_dispatch → … → dispatched → …
… → return_verified → …
  ↘ cancelled (from non-terminal packing/dispatch states)
```

| State | Meaning |
|-------|---------|
| **Planned** | Item identified for event |
| **Picked** | Taken from storage |
| **packing_started** | Packing in progress (P2-07) |
| **Packed** | Prepared for transport |
| **verified** | Pre-dispatch quantity check (P2-07) |
| **ready_for_dispatch** | Cleared for load-out (P2-07) |
| **Loaded** | Loaded for transport |
| **dispatched** | En route / left warehouse (P2-07) |
| **At Venue** | On site |
| **Returned** | Back from venue |
| **return_verified** | Return quantities reconciled (P2-07) |
| **Cleaned/Ready** | Available for reuse |
| **cancelled** | Movement voided (P2-07) |

#### Business invariants

- State transitions are **human-initiated** (movement permissions per EP1-STF-003)
- Cannot allocate more than available quantity (`INSUFFICIENT_INVENTORY` → 409)
- Packing list generation may produce **Suggestion** for human review (`EP1-AUT-003`, ADR-017)
- Returns workflow required before item marked Cleaned/Ready
- Damage/loss requires accountability note and/or structured damage report
- No barcode/QR scanning; no image binary storage in Phase 1 / P2-07

#### Related EP1 IDs

EP1-INV-003, EP1-INV-004, EP1-INV-005, EP1-INV-006, EP1-INV-007, EP1-AUT-003

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W2** | Full inventory movement cycle (Z4) |

---

### Task

**Bounded context:** Task  
**Module:** Task

#### Purpose

Event-linked execution checklists and operational tasks (`EP1-OPS-003`). Supports SOP structure from [`13-standard-operating-procedures.md`](../docs/business/13-standard-operating-procedures.md) without formal SOP content library in Phase 1.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Task | Unit of work with assignee, due date, category, priority |
| **E** | ChecklistItem | Sub-item when task represents checklist row |
| **REF** | Event | `eventId` |
| **REF** | StaffMember | `assignedTo` |

**P2-01 fields on Task:** `category` (`general` \| `pre_event` \| `dayheets` \| `vendor` \| `inventory` \| `venue` \| `wrap_up`), `priority` (`low` \| `medium` \| `high` \| `urgent`), `completionNotes`. Task checklist items remain supported for ad-hoc work. Reusable named checklists use the **Checklist** aggregate (P2-02).

#### Lifecycle

```
pending → in_progress → completed
              └→ cancelled
```

#### Business invariants

- `completedAt` set when status → completed
- Tasks on cancelled events are cancelled
- Checklist generation from template produces **Suggestion** until confirmed (ADR-017), then generates **EventChecklist** copies (P2-02)
- Completion recorded in Event OS as source of truth (Z2)

#### Related EP1 IDs

EP1-OPS-003, EP1-AUT-003

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W1** | Execution checklists (Z2) |
| **W2** | Packing/preparation tasks |

---

### Checklist (P2-02)

**Bounded context:** Checklist  
**Module:** Checklist

#### Purpose

Reusable checklist templates and event-specific checklist execution (`EP1-OPS-003`, `EP1-AUT-003`). Templates remain reusable; generated event checklists are independent copies so future template edits do not mutate in-flight events.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | ChecklistTemplate | Reusable template (name, description, eventTypes, category, status, templateVersion, sortOrder) |
| **E** | ChecklistTemplateItem | Ordered template row (title, required, defaultAssigneeRole, estimatedDuration) |
| **AR** | EventChecklist | Event-scoped copy generated from a template (or matching active templates) |
| **E** | EventChecklistItem | Execution row (complete/undo, notes, completedAt, completedBy) |
| **REF** | Event | `bookingId` on EventChecklist |
| **REF** | ChecklistTemplate | Optional `templateId` + snapshotted `templateVersion` |

#### Lifecycle (template)

```
active ⇄ inactive → archived
```

Duplicate creates a new active version under the same `rootTemplateId` with incremented `templateVersion`. Hard delete is not supported when the template has generated event checklists; archive instead. Template item removal is blocked when the template has been used.

#### Generation

`POST /event-checklists/generate` (or suggestion accept `checklist.generate`) copies matching active templates into EventChecklist + EventChecklistItem rows. Already-generated template+booking pairs are skipped (idempotent).

#### Related EP1 IDs

EP1-OPS-003, EP1-AUT-003

#### Related milestones

P2-02 Checklist Templates & Checklist Management
P2-01 Event Workspace Expansion (Task.category interim; preserved for Tasks)

---

### Timeline

**Bounded context:** CRM / Customer  
**Module:** CRM

#### Purpose

Per-event **communication timeline** — records of significant interactions (`EP1-CUS-002`). **Not** a WhatsApp replacement; external messaging may continue.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **E** | TimelineEntry | Single recorded interaction or note |
| **REF** | Event | `eventId` |
| **REF** | Customer | `customerId` |
| **REF** | StaffMember | `recordedBy` |

*Timeline entries are owned by Customer/Event adjunct; exposed on Event Workspace.*

#### Lifecycle

```
recorded → (immutable)
```

#### Business invariants

- Append-oriented — edits are corrections with audit, not silent mutation
- Must reference an Event in Phase 1
- Does not auto-capture WhatsApp messages
- Distinct from P2-09 `CommunicationRecord` (shared operational Communication Center); TimelineEntry remains the CRM adjunct interaction log

#### Related EP1 IDs

EP1-CUS-002, EP1-SUP-001

---

### CommunicationRecord (P2-09)

**Bounded context:** Communication  
**Module:** Communication

#### Purpose

Shared **operational communication log** for booking / customer / vendor / staff touchpoints (`P2-09`, supports `EP1-CUS-002` operational tracking). Manual status lifecycle only — **no** WhatsApp, email, or SMS provider integration; **no** background scheduler; **no** AI generation.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | CommunicationRecord | Logged communication (channel, direction, status, subject/body) |
| **E** | CommunicationAttachment | Metadata-only file pointer on a record (`fileName`, `mimeType`, `fileSizeBytes`, `storageKey`) |
| **REF** | Event / Booking | Optional `bookingId` |
| **REF** | Customer | Optional `customerId` |
| **REF** | Vendor | Optional `vendorId` |
| **REF** | StaffMember | Optional `staffMemberId` |
| **REF** | CommunicationTemplate | Optional `templateId` |
| **REF** | User | Optional `createdByUserId` |

Channels: `whatsapp`, `email`, `sms`, `phone_call`, `internal_note`, `manual_meeting`.  
Directions: `incoming`, `outgoing`.  
Statuses: `draft`, `queued`, `sent`, `delivered`, `read`, `failed`, `cancelled`, `completed`.

#### Lifecycle

```
draft → queued → sent → delivered → read
  │        │       │         └→ failed
  │        │       └→ failed | cancelled
  │        └→ sent | cancelled | failed
  ├→ cancelled | completed (manual channels only)
  └→ (soft-delete via deletedAt)
```

Manual channels (`phone_call`, `internal_note`, `manual_meeting`) may be created or transitioned as `completed`. Soft delete sets `deletedAt` (no hard delete).

#### Business invariants

- Does **not** mutate Customer, StaffMember, Vendor, or Booking aggregates — optional FK links only
- No outbound provider send; status transitions are human-recorded
- Attachments are metadata-only (same pattern as FinancialDocument)
- Distinct from CRM `TimelineEntry` and Booking `EventNote`

#### Related EP1 IDs

EP1-CUS-002 (operational communication tracking)

---

### CommunicationTemplate (P2-09)

**Bounded context:** Communication  
**Module:** Communication

#### Purpose

Reusable message templates (subject/body/category/channel) that may seed a `CommunicationRecord`. No AI drafting.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | CommunicationTemplate | Named template with body and optional channel |
| **VO** | Template status | `active` \| `archived` |

#### Lifecycle

```
active → archived
```

#### Business invariants

- Tenant-scoped; archive is soft lifecycle (status), not hard delete
- Optional link from records; templates do not send messages

---

### Reminder (P2-09)

**Bounded context:** Communication  
**Module:** Communication

#### Purpose

Manual follow-up reminders linked optionally to booking / customer / vendor / staff / communication. **No background scheduler** in P2-09 — operators create, complete, or cancel explicitly.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Reminder | Due follow-up with category, title, notes |
| **REF** | Event / Booking | Optional `bookingId` |
| **REF** | Customer / Vendor / StaffMember | Optional party links |
| **REF** | CommunicationRecord | Optional `communicationRecordId` |
| **REF** | User | Optional `assignedToUserId` |

Categories: `payment_follow_up`, `event_reminder`, `vendor_follow_up`, `customer_follow_up`, `staff_follow_up`, `other`.  
Statuses: `pending` → `completed` \| `cancelled`.

#### Business invariants

- No automatic firing or notification delivery in P2-09
- Does not mutate linked aggregates

---

### NotificationPreference (P2-09)

**Bounded context:** Communication  
**Module:** Communication

#### Purpose

Future-ready channel opt-in flags (WhatsApp / email / SMS) for a customer (or user). Stored only — **no delivery** in P2-09.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | NotificationPreference | Boolean channel preferences |
| **REF** | Customer | Optional `customerId` |
| **REF** | User | Optional `userId` |

#### Business invariants

- Preference storage only; no provider integration
- Does not alter Customer aggregate fields beyond the preference record FK

---

### EventNote (P2-01)

**Bounded context:** Event / Operations  
**Module:** Booking (workspace)

#### Purpose

Internal operational notes on an event — **not** customer-visible. Distinct from `TimelineEntry` (`client_interactions`).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **E** | EventNote | Internal note body + author |
| **REF** | Event | `bookingId` |
| **REF** | User | `createdByUserId` |

#### Related

P2-01 Event Workspace Expansion

---

### Issue

**Bounded context:** CRM / Customer (+ Vendor for vendor issues)  
**Module:** CRM, Vendor

#### Purpose

Lightweight issue/complaint notes — **not** a ticketing system (`EP1-CUS-004`, `12` Phase 1 scope).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **E** | IssueNote | Customer issue per event |
| **E** | VendorIssueNote | Vendor or procurement-line issue (see Vendor aggregates) |
| **REF** | Event | `eventId` |
| **REF** | Customer | `customerId` (customer issues) |

#### Lifecycle

```
open → resolved
```

*Phase 1 API (R3-07): create-only with status default `open`. Resolve transition is domain-valid but **not** exposed via PATCH/resolve endpoints yet.*

#### Business invariants

- No SLA, routing, or escalation workflow in Phase 1
- Resolution is manual status + optional note (API deferred beyond create)
- Vendor issues may exist at vendor level and procurement line level (`07`)

#### Related EP1 IDs

EP1-CUS-004, EP1-SUP-002, EP1-VEN-006

---

### ReviewRequest

**Bounded context:** CRM / Customer  
**Module:** Lead + CRM

#### Purpose

Track Google/Instagram/website review requests ported from Lead Management Application (`EP1-CUS-003`).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **E** | ReviewRequest | Review ask sent/tracked per event |
| **REF** | Event | `eventId` |
| **REF** | Customer | `customerId` |

#### Lifecycle

```
pending → sent → (acknowledged | skipped)
```

*Phase 1 API (R3-07): create-only with status default `pending`. Send/acknowledge endpoints are **not** shipped.*

#### Business invariants

- Sending review message requires human action (reuse LM pattern)
- Not required for every completed event (`12` — timing Not Defined)

#### Related EP1 IDs

EP1-CUS-003, EP1-SUP-003

---

### Payment

**Bounded context:** Finance  
**Module:** Finance

#### Purpose

Customer advance and balance payment records with optional proof attachments (`EP1-FIN-003`).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Payment | Money received from customer |
| **REF** | Event / Booking | Domain `eventId`; HTTP booking id |
| **REF** | Invoice | `invoiceId` (when invoiced) |
| **REF** | Attachment | Optional proof (legacy UUID pointer) |
| **REF** | FinancialDocument | Optional P2-08 evidence metadata linked via `paymentId` |
| **VO** | Money, PaymentMethod | `cash`, `upi`, `bank_transfer`, `card`, `cheque`, `other` |

#### Lifecycle

```
confirmed → (void)
```

Persistence/API status enum: **`confirmed` | `void`** (older docs said `recorded` — treat as synonym for confirmed only in narrative; wire value is `confirmed`).

#### Business invariants

- Advance confirmation gates Lead/Event **Approved** — **EP1-BR-001** ([`02-business-model.md`](../docs/business/02-business-model.md) BR-04)
- Proof attachment optional but recommended; missing proof allowed with reason (`09`)
- Payment amount cannot exceed outstanding balance
- Recording is human-initiated

#### Related EP1 IDs

EP1-FIN-003, EP1-BR-001

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W4** | Customer payment → financial completion |
| **W5** | Advance enables Approved |

---

### VendorExpense

**Bounded context:** Finance  
**Module:** Finance

#### Purpose

Vendor and event expenses for profitability (`EP1-FIN-004`).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | VendorExpense | Expense line per event |
| **REF** | Event | `eventId` |
| **REF** | ProcurementLine | Optional link |
| **REF** | Vendor | `vendorId` |
| **REF** | Attachment | Bill / UPI proof (legacy UUID pointer) |
| **REF** | FinancialDocument | Optional P2-08 evidence metadata linked via `vendorExpenseId` |

#### Lifecycle

```
confirmed → (void)
```

Persistence/API status enum: **`confirmed` | `void`** (older docs said `recorded` — wire value is `confirmed`).

#### Business invariants

- Must link to Event
- Human-recorded; no auto vendor payments (`19` scope freeze)
- Contributes to event profitability view

#### Related EP1 IDs

EP1-FIN-004, EP1-FIN-005, EP1-VEN-004

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W3** | Vendor payment tracking |
| **W4** | Expense side of profitability (Z5, I5) |

---

### FinancialDocument

**Bounded context:** Finance  
**Module:** Finance

#### Purpose

Booking-owned financial evidence **metadata** for payment proofs, expense receipts, and related finance artefacts (`P2-08`, supports `EP1-FIN-003`). Does **not** store binary files or generate PDFs — `storageKey` is a metadata pointer only.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | FinancialDocument | Evidence metadata record |
| **E** | FinancialDocumentAuditEvent | Append-only lifecycle audit (`uploaded`, `updated`, `verified`, `rejected`, `deleted`) |
| **REF** | Event / Booking | **Required** `bookingId` |
| **REF** | Payment | Optional `paymentId` |
| **REF** | VendorExpense | Optional `vendorExpenseId` |
| **REF** | VendorProcurement | Optional `vendorProcurementId` |
| **REF** | Invoice | Optional `invoiceId` |
| **VO** | Document metadata | `fileName`, `mimeType`, `fileSizeBytes`, `storageKey` |

Document types: `payment_proof`, `expense_receipt`, `vendor_invoice`, `customer_invoice`, `credit_note`, `debit_note`, `other`.

#### Lifecycle

```
pending → verified | rejected
       ↘ soft-deleted (`deletedAt`)
```

Verification status starts at **`pending`**; verify/reject require `documents:verify`. Soft delete sets `deletedAt` (no hard delete).

#### Business invariants

- Booking is always required; Payment / VendorExpense / VendorProcurement / Invoice links are optional
- No binary upload pipeline and no PDF generation in P2-08
- Does not replace Payment, VendorExpense, Invoice, or profitability aggregates
- Distinct from platform `Attachment` (Phase 1 polymorphic UUID pointer); FinancialDocument is the Finance-owned evidence aggregate

#### Related EP1 IDs

EP1-FIN-003 (proofs), EP1-FIN-004 (expense evidence)

#### Workflow coverage

| Workflow | Role |
|----------|------|
| **W4** | Payment/expense evidence for financial completion |

---

### Invoice

**Bounded context:** Finance  
**Module:** Finance

#### Purpose

Event-linked billing and invoices (`EP1-FIN-002`). Extends Quotation/Billing Application patterns.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Invoice | Bill to customer |
| **E** | InvoiceLineItem | Billed lines |
| **REF** | Event | `eventId` |
| **REF** | Customer | `customerId` |

#### Lifecycle

```
draft → sent → partially_paid → paid
          └→ void
```

#### Business invariants

- Linked to Event and Customer
- Payment totals update invoice status
- Void invoices cannot receive payments

#### Related EP1 IDs

EP1-FIN-002

---

### Attachment

**Bounded context:** Platform  
**Module:** File

#### Purpose

Domain representation of uploaded files — payment proofs, inventory photos, decor media, vendor bills (`EP1-FIN-003`, `EP1-INV-007`, `EP1-MKT-003`).

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Attachment | File metadata (blob in object storage) |
| **REF** | Parent entity | Polymorphic link to Payment, Movement, Expense, Event (content library) |
| **VO** | AttachmentRef | Lightweight pointer used in other aggregates |

#### Lifecycle

```
uploaded → deleted (soft)
```

#### Business invariants

- Tenant-scoped storage path ([ADR-016](./12-architecture-decisions.md#adr-016-phase-1-single-tenant-mode-we-decor))
- Access via signed URL pattern (architecture doc)
- Deletion cascades from parent entity policy

#### Related EP1 IDs

EP1-FIN-003, EP1-INV-007, EP1-MKT-003

---

### Suggestion

**Bounded context:** Platform (policy layer)  
**Module:** Cross-cutting

#### Purpose

Persisted recommendation awaiting human accept/dismiss ([ADR-017](./12-architecture-decisions.md#adr-017-phase-1-domain-event-handlers-suggestion-only)). Implements `EP1-AUT-001`–`004` without auto-execution.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **AR** | Suggestion | Proposed action |
| **REF** | Target aggregate | `aggregateType` + `aggregateId` |

#### Lifecycle

```
pending → accepted | dismissed | expired
```

#### Business invariants

- Handlers create Suggestions — never execute business mutations directly (ADR-017)
- Accept delegates to target module application service
- Types include: `workspace.create`, `checklist.generate`, `staff.assign` (Calendar, P2-10, does not participate in the suggestion workflow — it is a stateless read model with no write path to suggest into)

#### Related EP1 IDs

EP1-AUT-001, EP1-AUT-002, EP1-AUT-003, EP1-AUT-004, EP1-AUT-005

---

### Calendar (Read Model — P2-10)

**Bounded context:** Calendar  
**Module:** Calendar

#### Purpose

Unified operations planning view — day/week/month calendar, agenda, chronological timeline, and cross-module conflict overlay (`EP1-OPS-005`). **Calendar owns no operational state.** It is a **read-only aggregation / composition layer** over facts already owned by other bounded contexts.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **Read model** | `CalendarEntryDto` | Projection — not an Aggregate Root, not persisted; assembled per request by `CalendarApplicationService` |
| **Source** | Event | `eventStartDate`/`eventEndDate` → calendar block |
| **Source** | StaffAssignment, StaffLeave, StaffAvailability | Staff lanes (owned by Staff module) |
| **Source** | VendorProcurement | Procurement required-date milestones (owned by Vendor module) |
| **Source** | InventoryMovement, InventoryReservation | Dispatch/return/ready milestones (owned by Inventory module) |
| **Source** | Reminder | Pending/overdue reminder markers (owned by Communication module) |
| **Source** | CommunicationRecord | Timeline-only communication events (owned by Communication module) |
| **Source** | FinancialDocument | Timeline-only document upload events (owned by Finance module) |

There is **no** `CalendarEntry` table, **no** `CalendarEntryRepository`, and **no** `CalendarEntryCreated` domain event. Calendar never writes to, or takes ownership of, any of the source aggregates above; each source module remains the sole writer of its own state.

#### Lifecycle

None — `CalendarEntryDto.status` mirrors the current status of the underlying source record (e.g. an `event` entry shows the `Event.status`; a `reminder` entry shows the `Reminder.status`). There is no independent calendar lifecycle to manage.

#### Conflict overlay (display-only)

`GET /calendar/conflicts` reuses existing module logic — `SchedulingApplicationService.detectConflictsForStaffOnBooking` (Staff) and `InventoryAvailabilityService` (Inventory) — to surface staff conflicts, inventory shortages, procurement delays, and pending reminders. No new validation rules are introduced; conflicts are computed for display only and do not block any write path.

#### Related EP1 IDs

EP1-OPS-005, P2-10

---

### Customer Intelligence (Read Model — P2-11)

**Bounded context:** CRM / Customer  
**Module:** Customer (`apps/api/src/modules/customer/`)

#### Purpose

Customer 360° relationship intelligence — overview, unified timeline, booking history, relationship indicators, financial summary, and communications summary (`EP1-CUS-001`, `EP1-CUS-002`). **Customer Intelligence owns no operational state.** It is a **read-only aggregation / composition layer** over facts already owned by CRM, Lead, Quotation, Booking, Communication, and Finance.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **Read model** | `CustomerOverviewDto` | Profile + contacts + interaction window + health |
| **Read model** | `CustomerTimelineItemDto` | Single chronological timeline item (projection) |
| **Read model** | `CustomerBookingHistoryItemDto` | Booking history row with deep links |
| **Read model** | `CustomerRelationshipDto` | Repeat / preferred channel & event types / health |
| **Read model** | `CustomerFinancialSummaryDto` | Quoted / invoiced / paid / outstanding |
| **Read model** | `CustomerCommunicationsSummaryDto` | Channel usage + recent + reminders |
| **Source** | Customer, Contact, TimelineEntry | CRM identity and CRM interaction log |
| **Source** | Lead, FollowUp | Sales pipeline (FollowUp via `findByLeadIds`) |
| **Source** | Quotation, Event | Commercial + operational bookings |
| **Source** | CommunicationRecord, Reminder | Operational Communication Center |
| **Source** | Invoice | Customer-scoped invoices |
| **Source** | Payment | Confirmed payments via booking IDs (`Payment` has no `customerId`) |
| **Source** | FinancialDocument | Booking-scoped document metadata |

There is **no** new Customer Intelligence table, **no** intelligence repository, and **no** intelligence domain event. HTTP resource remains **`clients`** (`/clients/:customerId/...`); UI label remains Customers. Permission: reuse **`clients:read`** (no new intelligence permission).

#### Health (rule-based)

Priority: `follow_up_required` (failed communications or overdue pending reminders) → `active` (booking status in `approved` / `in_preparation` / `in_execution`) → `returning` (≥2 bookings, or single completed-path booking when no active) → `dormant` (≥180 days since last interaction) → else `active`. **No AI / predictive scoring.**

#### Related EP1 IDs

EP1-CUS-001, EP1-CUS-002, P2-11

---

### Analytics (Read Model — P2-12)

**Bounded context:** BI  
**Module:** Analytics (`apps/api/src/modules/analytics/`)

#### Purpose

Business Intelligence KPI dashboards and analytics — founder dashboard, sales, finance, staff, vendors, inventory, customers, operations, historical trends, and export (`EP1-KPI-001`–`007`, `EP1-MKT-001`–`002`). **Analytics owns no operational state.** It is a **read-only aggregation / composition layer** over facts already owned by Lead, Quotation, Booking, Customer, Finance, Staff, Vendor, Inventory, and Communication.

#### Structure

| Kind | Name | Description |
|------|------|-------------|
| **Read model** | `AnalyticsDashboardDto` | Founder KPI rollup (revenue, profit, utilisation rates, counts) |
| **Read model** | `AnalyticsSalesDto` | Lead conversion, quote acceptance, revenue by type/month |
| **Read model** | `AnalyticsFinanceDto` | Revenue / expenses / profit / receivables / collection trend |
| **Read model** | `AnalyticsStaffDto` | Utilisation, leave summary, per-staff workload |
| **Read model** | `AnalyticsVendorsDto` | Procurement completion, delivery, spend, quote win rate |
| **Read model** | `AnalyticsInventoryDto` | Reservations, movements, damage, dispatch trends |
| **Read model** | `AnalyticsCustomersDto` | Retention, event-type mix, health distribution |
| **Read model** | `AnalyticsOperationsDto` | Today's / upcoming events, overdue tasks, pending ops |
| **Read model** | `AnalyticsTrendsDto` | Historical period buckets only (no forecasting) |
| **Read model** | `AnalyticsExportDto` | CSV text or base64 SpreadsheetML payload |
| **Source** | Lead, Quotation, Event, Customer | Sales + booking + CRM masters |
| **Source** | Payment, VendorExpense, Invoice, FinancialDocument | Finance (confirmed payments/expenses for P&L) |
| **Source** | StaffMember, StaffAssignment, StaffLeave | Staff utilisation |
| **Source** | Vendor, VendorProcurement | Procurement analytics |
| **Source** | InventoryItem, InventoryMovement, InventoryReservation | Inventory ops |
| **Source** | CommunicationRecord, Reminder | Customer health / ops counters |

There is **no** new Analytics table, **no** analytics repository, and **no** analytics domain event. HTTP resource is **`analytics`** (`/analytics/...`). Permission: **`analytics:read`**. Phase-1 **`/dashboards/*`** (`dashboards:read`) remains frozen and unchanged.

#### KPI basis (explicit)

| Concern | Rule |
|---------|------|
| Revenue / expenses / profit | **Confirmed** payments and **confirmed** vendor expenses (same basis as `ProfitabilityApplicationService`) |
| Lead conversion | Converted stages = `approved` \| `completed` |
| Customer health distribution | Mirrors P2-11 relationship health priority ladder (no AI) |
| Trends | Historical buckets only (`daily` / `weekly` / `monthly` / `yearly`) — **no forecasting** |
| Export | `csv` = UTF-8 text; `xlsx` format param = Excel-compatible **SpreadsheetML** (`.xls`), not Office Open XML binary |

#### Related EP1 IDs

EP1-KPI-001–007, EP1-MKT-001–002, P2-12

---

### EventProfitabilityView

**Bounded context:** Finance / BI  
**Module:** Finance + BI (read model)

#### Purpose

Computed view: customer revenue − vendor expenses per event (`EP1-FIN-005`, `EP1-KPI-004`). Not a mutable aggregate — derived from Payment, Invoice, and VendorExpense.

#### Business invariants

- Read-only composition
- No fabricated KPI baselines (`19` §2)
- Updated when underlying payments/expenses change

#### Related EP1 IDs

EP1-FIN-005, EP1-KPI-004

---

## Domain Services

Domain services encapsulate logic that does not belong to a single entity:

| Domain service | Responsibility | EP1 refs |
|----------------|----------------|----------|
| **EventConversionService** | Lead + Approved quotation → Event + workspace suggestion | EP1-AUT-006, W5 |
| **BusinessRuleEnforcement** | Hard blocks BR-001–003; provisional warn-only BR-004 | EP1-BR-* |
| **ProcurementVarianceService** | Compare actual vs quotation budget; flag variance | EP1-VEN-005 |
| **ProfitabilityCalculation** | Revenue − vendor expenses per event | EP1-FIN-005 |
| **MovementPermissionPolicy** | Whether user may confirm inventory/procurement/finance actions | EP1-STF-003 |
| **SuggestionFactory** | Create suggestions from domain events (ADR-017) | EP1-AUT-001–004 |

*Interfaces and implementations belong to application/domain layers — not specified here.*

---

## Domain Events

Cross-module **domain events** notify other contexts of facts that already happened. Phase 1 handler behaviour is governed by **[ADR-017](./12-architecture-decisions.md#adr-017-phase-1-domain-event-handlers-suggestion-only)** — handlers produce **Suggestions** and **in-app alerts** only.

### Emitted events (illustrative, not exhaustive)

| Event | Emitted by | Typical Phase 1 handler outcome |
|-------|------------|--------------------------------|
| `LeadCreated` | Lead | Attribution, optional notification |
| `LeadStageChanged` | Lead | Pipeline analytics |
| `LeadConverted` | Lead | Customer link verification |
| `QuotationApproved` | Quotation | **Suggestion:** activate workspace, generate checklist draft |
| `EventWorkspaceActivated` | Event | No calendar side effect — Calendar (P2-10) is a stateless read model that reflects `Event.eventStartDate`/`eventEndDate` directly; no `calendar.milestone` suggestion or write is produced |
| `StaffAssignmentConfirmed` | Staff | In-app alert (after human confirm) |
| `ProcurementLineStatusChanged` | Vendor | Workspace status refresh |
| `InventoryMovementStateChanged` | Inventory | Preparation status recalculation |
| `PaymentRecorded` | Finance | Approved gate satisfaction check |
| `EventCompleted` | Event | KPI read-model refresh |

**Rule:** No handler may auto-execute business actions listed in ADR-017 approval gates.

---

## Tenant Boundaries

Phase 1 tenant behaviour is defined in **[ADR-016](./12-architecture-decisions.md#adr-016-phase-1-single-tenant-mode-we-decor)**.

| Aspect | Phase 1 |
|--------|---------|
| **Tenants** | One seeded We Decor organisation |
| **Scoping** | Every aggregate carries `tenantId`; queries scoped via OrgContext |
| **Onboarding** | None |
| **Cross-tenant access** | Impossible by configuration (single tenant) |
| **RLS / isolation tests** | Deferred to Phase 6 SaaS |

---

## Existing System Ownership

Domain concepts that **reuse or extend** current We Decor systems during transition ([`11-roadmap.md`](./11-roadmap.md) Transitional Integrations):

| Current system | Domain concepts | Posture |
|----------------|-----------------|---------|
| **Lead Management Application** | Lead, sales pipeline, FollowUp, assignment, ReviewRequest, lead-source analytics | **Extend** — port patterns; do not rebuild sales core (W5) |
| **Quotation/Billing Application** | Quotation, QuotationLineItem, Invoice (offline) | **Parallel-run** — migrate PDF/GST patterns |
| **We Decor Website** | Lead capture (`LeadSource.website`) | **Integrate** — persist to Lead |
| **WhatsApp (external)** | Not modelled as aggregate | **Continue** — Timeline manual capture only |

Greenfield aggregates (no adequate current-system model): **Event**, **EventWorkspace**, **VendorProcurement**, **InventoryMovement**, **VendorExpense**, **TimelineEntry**, **IssueNote**, **StaffMember** (master), **Suggestion**.

---

## Traceability to EP1 Requirement IDs

| EP1 ID | Primary aggregate(s) |
|--------|----------------------|
| EP1-SAL-001 | Lead |
| EP1-SAL-002 | Lead (`LeadSource`) |
| EP1-SAL-003 | Lead |
| EP1-SAL-004 | Lead, StaffAssignment |
| EP1-SAL-005 | Lead (`FollowUp`) |
| EP1-SAL-006 | Lead, Suggestion (notification gates) |
| EP1-CUS-001 | Customer; Customer 360 overview / relationship read models (P2-11) |
| EP1-CUS-002 | TimelineEntry, CommunicationRecord (P2-09 operational log); Customer 360 timeline aggregation (P2-11) |
| EP1-CUS-003 | ReviewRequest |
| EP1-CUS-004 | IssueNote |
| EP1-FIN-001 | Quotation |
| EP1-FIN-002 | Invoice |
| EP1-FIN-003 | Payment, Attachment, FinancialDocument |
| EP1-FIN-004 | VendorExpense, FinancialDocument |
| EP1-FIN-005 | EventProfitabilityView |
| EP1-OPS-001 | EventWorkspace |
| EP1-OPS-003 | Task |
| EP1-OPS-004 | ExecutionProgress |
| EP1-OPS-005 | `CalendarEntryDto` (read model / projection — no owned aggregate, P2-10) |
| EP1-STF-001 | StaffMember |
| EP1-STF-002 | StaffAssignment, Suggestion |
| EP1-STF-003 | MovementPermissionPolicy |
| EP1-VEN-001 | Vendor |
| EP1-VEN-002 | VendorProcurement, ProcurementLine |
| EP1-VEN-003 | ProcurementLine (state machine) |
| EP1-VEN-004 | VendorExpense |
| EP1-VEN-005 | ProcurementVarianceService |
| EP1-VEN-006 | VendorIssueNote, ProcurementLineIssueNote |
| EP1-INV-001 | InventoryItem |
| EP1-INV-002 | LocationQuantity |
| EP1-INV-003 | InventoryMovement |
| EP1-INV-004 | PackingList |
| EP1-INV-005 | InventoryMovement (Returned → Cleaned/Ready) |
| EP1-INV-006 | DamageNote |
| EP1-INV-007 | Attachment |
| EP1-MKT-001–002 | FounderKpiSnapshot (Phase-1 `/dashboards/*`); Analytics sales/dashboard read models (P2-12 `/analytics/*`) |
| EP1-MKT-003 | Attachment (event content library) |
| EP1-MKT-004 | Lead |
| EP1-AUT-001–005 | Suggestion, BusinessRuleEnforcement |
| EP1-AUT-006 | Event |
| EP1-AUT-002 | EventWorkspace, Suggestion |
| EP1-AUT-003 | PackingList, Suggestion |
| EP1-AUT-004 | StaffAssignment, Suggestion |
| EP1-KPI-001–007 | FounderKpiSnapshot (Phase-1 frozen); Analytics DTOs (P2-12) |
| EP1-BR-001 | Payment, Lead, Event |
| EP1-BR-002 | Event |
| EP1-BR-003 | Event (`executionOwnerId`) |
| EP1-BR-004 | BusinessRuleEnforcement (warn only) |
| EP1-SUP-001–003 | Aliases of EP1-CUS-002, 003, 004 |

---

## W1–W5 Workflow Coverage

| Workflow | Domain path | Key aggregates | UAT refs |
|----------|-------------|----------------|----------|
| **W1** Approved Booking → Event Execution | Lead **Approved** → Payment confirms → **Event** created → **EventWorkspace** activated → **ExecutionProgress** + **Task** + **StaffAssignment** | Event, EventWorkspace, Task, StaffAssignment, ExecutionProgress | Z1, Z2, Z3; EP1-OPS-001, 003, 004 |
| **W2** Event Preparation → Inventory Movement | **PackingList** suggestion → **InventoryMovement** state machine → return → Cleaned/Ready | InventoryMovement, PackingList, InventoryItem | Z4; EP1-INV-003–005 |
| **W3** Event → Vendor Procurement | **VendorProcurement** lines → confirmation states → **VendorExpense** | VendorProcurement, ProcurementLine, Vendor, VendorExpense | Z3; EP1-VEN-001–004 |
| **W4** Customer Payment → Financial Completion | **Payment** (+ proofs) → **VendorExpense** → **EventProfitabilityView** → **Event** Completed (financial review) | Payment, VendorExpense, Event, Invoice | Z5, I5; EP1-FIN-003–005, EP1-BR-002 |
| **W5** Lead → Booking | **Lead** capture → **FollowUp** → **Quotation** → advance **Payment** → **Event** (no duplicate **Customer**) | Lead, Customer, Quotation, Payment, Event | W5; EP1-SAL-*, EP1-AUT-006 |

---

## Business Invariants (Cross-Cutting)

Consolidated hard rules — authoritative text in Business Bible; enforced by **BusinessRuleEnforcement** domain service.

| ID | Rule | Enforcement point |
|----|------|-------------------|
| **EP1-BR-001** | Advance payment before **Approved** | Lead stage transition; Event creation |
| **EP1-BR-002** | Financial review before **Completed** | Event completion |
| **EP1-BR-003** | Execution ownership before execution stages | ExecutionProgress milestone advance |
| **EP1-BR-004** | Provisional rules warn/recommend only | All policy checks |
| **EP1-AUT-001** | Nothing auto-executes | Domain event handlers (ADR-017) |
| **EP1-AUT-005** | Human approval gates on sensitive actions | Application services |

Source: [`14-business-rules.md`](../docs/business/14-business-rules.md), [`17-automation-opportunities.md`](../docs/business/17-automation-opportunities.md), Doc `19` §2.

---

## Future (Deferred) Domain Concepts

The following are **explicitly outside** Phase 1 domain scope (Doc `19` Scope Freeze). Listed for boundary clarity only — **not** designed here.

| Concept | Deferred to | Notes |
|---------|-------------|-------|
| Multi-tenant `Tenant` lifecycle | Phase 6 / Doc `20` | ADR-016 single seed only in Phase 1 |
| AI `Conversation` / `AiSuggestion` | Phase 5 | Rule-based Suggestion only in Phase 1 |
| WhatsApp `Message` / template automation | Phase 5 | External channel continues |
| Client portal `PortalUser` | Phase 4 | |
| Full CMS `Page` / `PageSection` | Phase 4 | EP1-MKT-003 uses Attachment adjunct only |
| Marketing `Campaign` / UTM | Phase 4 | Funnel via Lead + BI in Phase 1 |
| Structured customer quote approval portal | Phase 4+ | Manual WhatsApp OK |
| Complaint `Ticket` / SLA workflow | Post Phase 1 | IssueNote only |
| Accounting `LedgerEntry` / GST filing | Phase 3+ | |
| Payroll `PayRun` | Future (`06` staff doc) | |
| Multi-warehouse `Location` | Future (`08`) | JP Nagar only in Phase 1 |
| Event `Template` library | Phase 2 (`11-roadmap`) | |
| Auto-executing orchestration | Never without new business approval | `17` |

---

## Related Documents

| Document | Topic |
|----------|-------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | **Frozen Phase 1 business baseline** |
| [`04-business-domain.md`](./04-business-domain.md) | Generic ubiquitous language (pre–Phase 1 detail) |
| [`05-system-architecture.md`](./05-system-architecture.md) | Architecture and policies |
| [`06-module-design.md`](./06-module-design.md) | Module mapping |
| [`07-database-philosophy.md`](./07-database-philosophy.md) | **Next:** persistence from this model |
| [`11-roadmap.md`](./11-roadmap.md) | Delivery phasing |
| [`12-architecture-decisions.md`](./12-architecture-decisions.md) | ADR-016, ADR-017 |
| [`13-glossary.md`](./13-glossary.md) | Terminology |
| [`20-definition-of-done.md`](./20-definition-of-done.md) | Completion criteria |

---

*Last updated: 2026-07-13 (R4-01)*  
*Owner: Founding Engineering*  
*Version: 1.2 — draft for founder review*
