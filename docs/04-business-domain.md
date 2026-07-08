# Business Domain Model

## Purpose of This Document

This document defines the ubiquitous language, bounded contexts, core aggregates, and business rules of the event management domain. All code, APIs, UI labels, and documentation must use these terms consistently. See also [13-glossary.md](./13-glossary.md).

---

## Ubiquitous Language

The following terms have precise meanings in Event OS. Using them incorrectly causes bugs and miscommunication.

| Term | Definition | Not To Be Confused With |
|------|------------|-------------------------|
| **Tenant** | An event management company using Event OS | A client of the event company |
| **Client** | A person or organization that hires the tenant for an event | The tenant itself |
| **Contact** | An individual associated with a client (bride, groom, PA, corporate contact) | A lead or staff member |
| **Lead** | A potential client inquiry not yet qualified or quoted | A confirmed client |
| **Opportunity** | A qualified lead with estimated value and probability | A booking |
| **Quotation** | A formal price proposal sent to a client for an event | An invoice |
| **Quote Line Item** | A single priced item or package in a quotation | An inventory item |
| **Package** | A pre-defined bundle of services/items at a set price | A software package |
| **Booking** | A confirmed agreement to deliver an event, converted from an approved quotation | A calendar entry |
| **Event** | The actual occasion being managed (wedding, corporate gala, birthday) | A calendar event or system event |
| **Event Date** | The date(s) the event takes place | The booking creation date |
| **Venue** | Physical location where the event occurs | The tenant's office |
| **Assignment** | Allocation of staff or vendor to an event | A task |
| **Task** | A unit of work with assignee, due date, and status | An event |
| **Inventory Item** | A physical asset tracked by the tenant (backdrop, furniture, lighting) | A quote line item |
| **Allocation** | Reservation of inventory items for a specific event date | A purchase |
| **Vendor** | External supplier providing goods or services to the tenant | Staff |
| **Staff** | Employee or contractor of the tenant | Vendor |
| **Invoice** | A bill for payment issued to a client | A quotation |
| **Payment** | Money received from a client against an invoice | An expense |
| **Expense** | Money paid by the tenant (vendor, staff, operational) | A payment received |

---

## Bounded Contexts

Event OS is divided into bounded contexts. Each context owns its aggregates and business rules.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     CRM      │────▶│     Lead     │────▶│  Quotation   │
│   Context    │     │   Context    │     │   Context    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Finance    │◀────│   Booking    │◀────│   (approved) │
│   Context    │     │   Context    │     └──────────────┘
└──────────────┘     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ Calendar │  │   Task   │  │ Inventory│
       │ Context  │  │ Context  │  │ Context  │
       └──────────┘  └──────────┘  └──────────┘
```

Contexts communicate via domain events and application service calls, never by sharing internal state.

---

## Core Aggregates

### CRM Context

#### Client (Aggregate Root)

Represents a person or organization that engages the tenant for events.

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | Tenant scope |
| `type` | enum | `individual`, `organization` |
| `name` | string | Display name |
| `contacts` | Contact[] | Embedded or referenced |
| `tags` | string[] | Segmentation |
| `source` | string | How they found the tenant |
| `status` | enum | `active`, `inactive`, `blocked` |
| `notes` | text | Free-form |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**Invariants:**
- A client must belong to exactly one tenant.
- A client must have at least one contact with a reachable communication method (phone or email).
- Client name must be unique per tenant (case-insensitive).

#### Contact (Entity within Client)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `name` | string | |
| `role` | string | e.g., "Bride", "Event Manager" |
| `phone` | PhoneNumber | Value object |
| `email` | Email | Value object |
| `isPrimary` | boolean | One primary per client |

---

### Lead Context

#### Lead (Aggregate Root)

An unqualified or in-progress sales opportunity.

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `clientId` | UUID? | Linked after identification |
| `source` | enum | `instagram`, `website`, `whatsapp`, `referral`, `walk_in`, `phone`, `other` |
| `sourceDetail` | string? | e.g., Instagram post URL, referrer name |
| `eventType` | string | e.g., "Wedding", "Corporate" |
| `eventDate` | DateRange? | Tentative |
| `venue` | string? | Tentative |
| `estimatedBudget` | Money? | |
| `guestCount` | integer? | |
| `stage` | enum | See pipeline stages below |
| `assignedTo` | UUID? | Staff member |
| `priority` | enum | `low`, `medium`, `high`, `urgent` |
| `lostReason` | string? | Required when stage = `lost` |
| `notes` | text | |

**Pipeline Stages:**
```
new → contacted → qualified → site_visit_scheduled → site_visit_completed → quoted → won | lost
```

**Invariants:**
- Stage transitions follow allowed paths (no skipping without admin override).
- `lostReason` required when moving to `lost`.
- `assignedTo` must reference active staff of the same tenant.

**Domain Events:**
- `LeadCreated`
- `LeadAssigned`
- `LeadStageChanged`
- `LeadQualified`
- `LeadLost`
- `LeadConverted` (to client/opportunity)

---

### Quotation Context

#### Quotation (Aggregate Root)

A formal price proposal.

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `leadId` | UUID? | Source lead |
| `clientId` | UUID | |
| `quotationNumber` | string | Human-readable, tenant-sequential |
| `version` | integer | Increments on revision |
| `status` | enum | `draft`, `sent`, `viewed`, `approved`, `rejected`, `expired`, `superseded` |
| `eventType` | string | |
| `eventDate` | DateRange | |
| `venue` | string? | |
| `lineItems` | QuoteLineItem[] | |
| `subtotal` | Money | Computed |
| `discount` | Money | |
| `tax` | Money | Computed per tenant tax rules |
| `total` | Money | Computed |
| `validUntil` | date | |
| `terms` | text | Payment terms, T&C |
| `notes` | text | Client-visible notes |
| `internalNotes` | text | Staff-only |
| `sentAt` | timestamp? | |
| `approvedAt` | timestamp? | |

#### QuoteLineItem (Entity)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `description` | string | |
| `packageId` | UUID? | If from a package |
| `quantity` | decimal | |
| `unitPrice` | Money | |
| `total` | Money | quantity × unitPrice |
| `sortOrder` | integer | Display order |

**Invariants:**
- Only `draft` quotations are editable.
- `sent` quotations require at least one line item with total > 0.
- `approved` is terminal; create new version to revise.
- `total` = `subtotal` - `discount` + `tax` (computed, never manually set).
- `quotationNumber` is unique per tenant.

**Domain Events:**
- `QuotationCreated`
- `QuotationSent`
- `QuotationViewed`
- `QuotationApproved`
- `QuotationRejected`
- `QuotationExpired`

---

### Booking Context

#### Booking (Aggregate Root)

A confirmed event agreement.

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `quotationId` | UUID | Source quotation |
| `clientId` | UUID | |
| `bookingNumber` | string | Human-readable, tenant-sequential |
| `status` | enum | `confirmed`, `in_preparation`, `in_progress`, `completed`, `cancelled` |
| `event` | EventDetails | Value object |
| `confirmedAt` | timestamp | |
| `cancelledAt` | timestamp? | |
| `cancellationReason` | string? | |

#### EventDetails (Value Object)

| Attribute | Type | Notes |
|-----------|------|-------|
| `eventType` | string | |
| `eventDate` | DateRange | |
| `venue` | Venue | Value object |
| `guestCount` | integer? | |
| `specialRequirements` | text? | |

**Invariants:**
- Booking can only be created from an `approved` quotation.
- One booking per approved quotation (1:1).
- Cancellation requires reason and triggers downstream cleanup (tasks, allocations).
- `eventDate` cannot be changed to a past date without admin override.

**Domain Events:**
- `BookingConfirmed`
- `BookingStatusChanged`
- `BookingCancelled`
- `BookingCompleted`

---

### Calendar Context

#### CalendarEntry (Aggregate Root)

A schedulable time block linked to business entities.

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `title` | string | |
| `type` | enum | `event`, `site_visit`, `meeting`, `blocked`, `other` |
| `dateRange` | DateRange | |
| `bookingId` | UUID? | |
| `leadId` | UUID? | |
| `staffIds` | UUID[] | Assigned staff |
| `location` | string? | |
| `status` | enum | `scheduled`, `completed`, `cancelled` |

**Invariants:**
- Staff double-booking detected and flagged (configurable: warn vs. block per tenant).
- Entries linked to bookings inherit booking cancellation.

---

### Task Context

#### Task (Aggregate Root)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `title` | string | |
| `description` | text? | |
| `bookingId` | UUID? | |
| `assignedTo` | UUID? | Staff |
| `dueDate` | timestamp? | |
| `priority` | enum | `low`, `medium`, `high`, `urgent` |
| `status` | enum | `pending`, `in_progress`, `completed`, `cancelled` |
| `completedAt` | timestamp? | |
| `templateId` | UUID? | If generated from event template |

**Invariants:**
- `completedAt` set automatically when status → `completed`.
- Tasks linked to cancelled bookings are auto-cancelled (configurable).

---

### Staff Context

#### StaffMember (Aggregate Root)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `userId` | UUID? | Link to auth user |
| `name` | string | |
| `role` | string | Job title |
| `department` | enum | `sales`, `operations`, `finance`, `marketing`, `management` |
| `phone` | PhoneNumber | |
| `email` | Email | |
| `status` | enum | `active`, `inactive`, `on_leave` |
| `skills` | string[] | For assignment matching |

---

### Vendor Context

#### Vendor (Aggregate Root)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `name` | string | |
| `category` | string | e.g., "Catering", "Florist", "Photography" |
| `contacts` | Contact[] | |
| `rateCard` | RateCardItem[] | Standard pricing |
| `status` | enum | `active`, `inactive`, `blacklisted` |
| `rating` | decimal? | Internal rating |

---

### Inventory Context

#### InventoryItem (Aggregate Root)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `name` | string | |
| `sku` | string? | |
| `category` | string | |
| `quantityTotal` | integer | Total owned |
| `quantityAvailable` | integer | Total minus allocated |
| `unit` | string | e.g., "piece", "set", "meter" |
| `condition` | enum | `good`, `fair`, `damaged`, `retired` |
| `location` | string? | Warehouse/storage location |

#### Allocation (Entity)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `inventoryItemId` | UUID | |
| `bookingId` | UUID | |
| `quantity` | integer | |
| `dateRange` | DateRange | Allocation period |
| `status` | enum | `reserved`, `checked_out`, `returned`, `cancelled` |

**Invariants:**
- `quantityAvailable` >= 0 at all times.
- Cannot allocate more than available for overlapping date ranges.

---

### Finance Context

#### Invoice (Aggregate Root)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `bookingId` | UUID | |
| `clientId` | UUID | |
| `invoiceNumber` | string | Tenant-sequential |
| `status` | enum | `draft`, `sent`, `partially_paid`, `paid`, `overdue`, `void` |
| `lineItems` | InvoiceLineItem[] | |
| `subtotal` | Money | |
| `tax` | Money | |
| `total` | Money | |
| `amountPaid` | Money | |
| `amountDue` | Money | Computed |
| `dueDate` | date | |
| `issuedAt` | timestamp? | |

#### Payment (Aggregate Root)

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` | UUID | |
| `tenantId` | UUID | |
| `invoiceId` | UUID | |
| `amount` | Money | |
| `method` | enum | `cash`, `bank_transfer`, `upi`, `card`, `cheque`, `other` |
| `reference` | string? | Transaction reference |
| `receivedAt` | timestamp | |
| `recordedBy` | UUID | Staff who recorded |

**Invariants:**
- Payment amount cannot exceed invoice `amountDue`.
- Invoice status auto-updates based on payments.
- Void invoices cannot receive payments.

---

## Value Objects

Shared across contexts (Shared Kernel):

### Money

```
{ amount: decimal(19,4), currency: ISO4217 }
```

- All arithmetic within same currency.
- Display formatting per tenant locale settings.
- Never use floating point for money.

### DateRange

```
{ start: date, end: date }
```

- `end` >= `start`.
- Supports single-day events (start === end).

### PhoneNumber

```
{ countryCode: string, number: string, e164: string }
```

- Validated and normalized to E.164 on creation.

### Email

```
{ value: string }
```

- Validated format on creation.
- Normalized to lowercase.

### Address

```
{ line1, line2?, city, state, postalCode, country }
```

### Venue

```
{ name, address?, capacity?, notes? }
```

---

## Key Business Rules

### Quotation Lifecycle

1. Sales creates quotation in `draft`.
2. Sales reviews and sends → `sent`.
3. Client views (tracked) → `viewed`.
4. Client approves → `approved` OR rejects → `rejected`.
5. If `validUntil` passes without action → `expired`.
6. To revise a sent quotation: create new version, mark old as `superseded`.

### Booking Creation

1. Only `approved` quotations can convert to bookings.
2. Booking creation is atomic: booking record + calendar entry + initial tasks (from template).
3. Booking confirmation triggers notification to assigned staff.

### Inventory Allocation

1. Allocation reserves quantity for a date range.
2. On event completion, allocation moves to `returned`.
3. On booking cancellation, allocations are `cancelled` and quantity released.

### Financial Flow

1. Booking → Invoice(s) (milestone or full).
2. Invoice → Payment(s).
3. Event P&L = Invoice total - Expenses (vendor + inventory + staff costs).

---

## Event Templates

Tenants configure **event templates** that define:

- Default task checklist for an event type
- Default quotation line items / packages
- Default staff roles required
- Default inventory items

Templates accelerate booking-to-delivery and are tenant-configurable.

---

## Multi-Tenancy in the Domain

Every aggregate root includes `tenantId`. Domain services receive tenant context and enforce:

- No cross-tenant data access.
- Tenant-specific configuration (tax rates, pipeline stages, numbering formats).
- Tenant-specific business rules via configuration, not code branches.

---

## Related Documents

| Document | Topic |
|----------|-------|
| [06-module-design.md](./06-module-design.md) | Module mapping to contexts |
| [07-database-philosophy.md](./07-database-philosophy.md) | Persistence strategy |
| [13-glossary.md](./13-glossary.md) | Extended terminology |
| [18-api-standards.md](./18-api-standards.md) | API representation of domain |

---

*Last updated: 2026-07-06*
*Owner: Product & Engineering*
