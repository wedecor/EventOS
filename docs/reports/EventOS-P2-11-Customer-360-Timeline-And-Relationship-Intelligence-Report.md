# Event OS — P2-11 Customer 360° Timeline & Relationship Intelligence Report


| Field              | Value                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Feature**        | Customer 360° Timeline & Relationship Intelligence — read-only aggregation over CRM, Lead, Quotation, Booking, Communication, Finance |
| **Authority**      | Business Bible, Domain Model, Workspace composition, OpenAPI, Prisma                                               |
| **Scope**          | Customer overview, unified timeline, booking history, relationship indicators, financial summary, communications summary |
| **Business Bible** | Unchanged                                                                                                          |
| **Date**           | 2026-07-29                                                                                                         |


---

## 1. Executive Summary

P2-11 introduces **Customer 360° Timeline & Relationship Intelligence** as a **read-only aggregation / composition layer** inside the Customer module — not a new write-owning bounded context. `CustomerIntelligenceApplicationService` projects overview, chronological timeline, booking history, relationship indicators, financial summary, and communications summary at request time from `Customer`/`Contact`/`TimelineEntry`, `Lead`/`FollowUp`, `Quotation`, `Event`, `CommunicationRecord`/`Reminder`, `Invoice`, `Payment` (via bookings), and `FinancialDocument` — the modules that already own that state keep sole write responsibility.

There are **no** new Prisma tables, **no** intelligence repository, **no** intelligence domain events, and **no** migration. HTTP resource remains **`clients`** (`/clients/:customerId/...`; UI: Customers). Permission reuses **`clients:read`** (no new intelligence permission). `WorkspaceDto` remains unchanged and booking-centric; Customer 360 is customer-centric and deep-links to calendar, communications, finance, and workspace rather than expanding the Event Workspace.

**Verdict: APPROVED WITH MINOR NOTES**

---

## 2. Architecture Compliance

| Rule                                                        | Status                                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Customer 360 is read-only aggregation, no write ownership    | ✅ `CustomerIntelligenceApplicationService` exposes only `get*` methods; no mutations |
| No new Prisma tables / migration                             | ✅ No schema change; additive repository read methods only                       |
| Preserve Customer / Lead / Quotation / Booking / Communication / Finance ownership | ✅ Intelligence reads via existing repositories only; no new writes |
| HTTP resource remains `clients` (UI: Customers)              | ✅ `CustomerIntelligenceController` `@Controller('clients/:customerId')`         |
| Permission reuse `clients:read` (no new intelligence permission) | ✅ All six GET routes use `@Permissions('clients:read')`                     |
| `WorkspaceDto` unchanged; Workspace stays booking-centric    | ✅ No fields added; Customer 360 is a sibling customer-centric composition API   |
| No AI / predictive scoring                                   | ✅ Health is rule-based priority ladder only                                     |
| Business Bible unchanged                                     | ✅ `docs/business/` untouched                                                    |
| DDD boundaries                                               | ✅ Customer Intelligence owns no aggregate; every write path stays in its home module |

---

## 3. Backend Changes

| Area                             | Change                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Service                            | `CustomerIntelligenceApplicationService` in `apps/api/src/modules/customer/application/services/` — `getOverview`, `getTimeline`, `getBookings`, `getRelationship`, `getFinancialSummary`, `getCommunications` |
| DTOs                               | `customer-intelligence.dto.ts` — overview, timeline item, booking history, relationship, financial summary, communications summary |
| Controller                         | `CustomerIntelligenceController` — 6 `GET` routes under `clients/:customerId`, all `@Permissions('clients:read')` |
| Query validation                   | Timeline query Zod: optional `from` / `to` (`datetime`), optional comma-separated `sources`                  |
| Additive repo methods              | `findByCustomerId` on Lead, Event, Quotation, CommunicationRecord, Reminder, Invoice, Contact, TimelineEntry; `findByLeadIds` on FollowUp |
| Payment / documents                | Loaded via booking IDs (`paymentRepository.findByBookingId`, `financialDocumentRepository.findByBookingId`) — `Payment` has no `customerId` |
| Module wiring                      | `CustomerModule` + `ApplicationServicesModule` register service and controller                               |
| Repositories / migrations          | **No new persistence** — zero migration footprint                                                            |
| Workspace / booking controllers    | **Untouched** — no expansion of thin `WorkspaceDto`                                                          |

---

## 4. Database Changes

**None.**

- No Prisma model, no migration, no new table, enum, or column.
- Customer Intelligence reads exclusively through repositories already owned by the Customer, Lead, Quotation, Booking, Communication, and Finance modules.
- `apps/api/prisma/schema.prisma` is unmodified by this feature.

---

## 5. API Changes

Additive, read-only routes (all existing CRM / module endpoints unchanged):

| Method | Path | Permission | Notes |
| ------ | ---- | ---------- | ----- |
| GET | `/clients/:customerId/overview` | `clients:read` | Profile, contacts, interaction window, active bookings, health, deep links |
| GET | `/clients/:customerId/timeline` | `clients:read` | Unified chronological timeline; optional `from`, `to`, `sources` |
| GET | `/clients/:customerId/bookings` | `clients:read` | Booking history with workspace + calendar deep links |
| GET | `/clients/:customerId/relationship` | `clients:read` | Repeat flag, lifetime counts, preferred channel / event types, health |
| GET | `/clients/:customerId/financial-summary` | `clients:read` | Quoted / invoiced / paid / outstanding + document list |
| GET | `/clients/:customerId/communications` | `clients:read` | Channel usage, recent records, reminder counters |

Roles already holding `clients:read` (`owner`, `admin`, `sales_manager`, `operations_manager`, `coordinator`, `viewer`) gain Customer 360 access with **no matrix permission addition**. OpenAPI regenerated with controller export.

---

## 6. Frontend Changes

| Area              | Change                                                                              |
| ----------------- | -------------------------------------------------------------------------------------- |
| Feature module     | `apps/web/src/features/customers/` — `customer-intelligence.schemas.ts`, API client methods, hooks (`useCustomerOverviewQuery`, timeline/bookings/relationship/financial/communications) |
| Route              | `/app/customers/view/?id=` — Customer 360 page with tabs: Overview, Timeline, Bookings, Relationship, Finance, Communications |
| Deep links         | Calendar (`?customerId=`), Communications (`?customerId=`), Finance (`?customerId=`), Event Workspace / booking calendar filters |
| RBAC               | Gated by existing `clients:read` (`RequirePermission` / `Can`) — no new permission synced |
| Event Workspace    | **Not** expanded — Customer 360 is a separate customer-centric surface                 |

---

## 7. Timeline Aggregation Rules

`GET /clients/:customerId/timeline` builds a chronological `CustomerTimelineItemDto[]` from multiple sources, then optionally filters by `from` / `to` / `sources` and sorts by `occurredAt` then `id`:

| Source | Anchor | Notes |
| ------ | ------ | ----- |
| `lead` | `Lead.createdAt` | Stage + source meta; deep link to lead |
| `follow_up` | `FollowUp.dueAt` | Loaded via `findByLeadIds` for the customer's leads |
| `quotation` | `Quotation.createdAt` | Quotation number / revision / amount |
| `booking` | `Event.createdAt` | Booking confirmed row |
| `event_milestone` | `Event.eventStartDate`, `Event.completedAt` | Start / completed milestones when present |
| `communication` | `CommunicationRecord.occurredAt` | Channel / direction meta |
| `payment` | `Payment.receivedAt`; invoices use `sentAt ?? createdAt` | Payments via booking IDs; invoice items also tagged `source: 'payment'` with `kind: 'invoice'` |
| `financial_document` | `FinancialDocument.uploadedAt` | Soft-deleted docs excluded; via booking IDs |
| `timeline_entry` | `TimelineEntry.occurredAt` | CRM interaction adjunct |
| `reminder` | `Reminder.dueAt` | Customer-scoped reminders |

---

## 8. Relationship & Health Rules

`GET /clients/:customerId/relationship` (and overview health) derive:

| Field | Rule |
| ----- | ---- |
| `repeatCustomer` | `events.length >= 2` |
| `firstBookingDate` / `mostRecentBookingDate` | From booking `eventStartDate ?? createdAt`, sorted |
| Lifetime counts | `lifetimeBookingCount`, `completedBookingCount`, `cancelledBookingCount` |
| `preferredCommunicationChannel` | Mode of communication channels |
| `preferredEventTypes` | Top 3 event types by frequency |
| Indicators | `hasPendingReminders`, `hasFailedCommunications`, `daysSinceLastInteraction` |

**Health (rule-based priority — no AI):**

1. `follow_up_required` — failed communications **or** overdue pending reminders
2. `active` — any booking in `approved` / `in_preparation` / `in_execution`
3. `returning` — ≥2 bookings (also single-booking path when no active/dormant match)
4. `dormant` — ≥180 days since last interaction
5. else `active`

---

## 9. Financial Summary & Workspace Integration

### Financial rollup (`GET …/financial-summary`)

| Metric | Rule |
| ------ | ---- |
| `totalQuoted` | Sum of quotation totals **excluding** `superseded` and `rejected` |
| `totalInvoiced` | Sum of invoice totals **excluding** `void` |
| `totalPaid` | Sum of **confirmed** payments loaded via the customer's booking IDs (`Payment` has no `customerId`) |
| `outstandingBalance` | `max(0, totalInvoiced − totalPaid)` |
| Documents | Non-deleted financial documents via booking IDs |

### Workspace integration

| Concern | Integration |
| ------- | ------------ |
| `WorkspaceDto` | **Not** expanded — thin status DTO preserved |
| Centricity | Workspace remains **booking-centric**; Customer 360 is **customer-centric** |
| Deep links | Overview links to `/app/calendar/?customerId=…`, `/app/communications/?customerId=…`, `/app/finance/?customerId=…`; bookings link to workspace and calendar |
| Aggregates | Customer / Lead / Quotation / Event / Communication / Finance ownership preserved |

---

## 10. Documentation Updates

| Document | Update |
| -------- | ------ |
| `docs/07-domain-model.md` | Customer 360 read models documented under Customer + dedicated **Customer Intelligence (Read Model — P2-11)** section; bounded-context table and EP1-CUS-001/002 traceability updated; version 1.5 |
| `docs/09-api-design.md` | Customer module extended with six Customer 360 GET routes, aggregation notes, and `clients:read` permission map update; version 1.9 |
| `docs/05-system-architecture.md` | Phase 1 inventory + Event Workspace note for P2-11; event-flow exclusion note; Customer capability audit rows updated |
| `docs/10-implementation-specification.md` | Customer module re-specified with `CustomerIntelligenceApplicationService` / controller / additive repo reads; persistence exclusion + dependency diagram read edges; version 1.6 |
| OpenAPI | Regenerated |
| Business Bible (`docs/business/`) | **Unchanged** |

---

## 11. Testing

| Layer      | Result                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| Unit       | `customer-intelligence.application.service.spec.ts` — **6** tests (overview, timeline sort, relationship, financial summary, communications, NOT_FOUND) |
| API        | **697** tests passed; lint + build passed                               |
| Frontend   | **118** tests passed; typecheck + lint + build passed                   |
| OpenAPI    | Regenerated (`openapi:export` + web `openapi:generate`)                 |
| Validation | Read-only composition; no new tables; WorkspaceDto unchanged; no AI scoring; payment rollup via bookings |

---

## 12. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. No AI / predictive scoring — relationship health is a deterministic priority ladder only.
2. Payment rollup is via bookings (`Payment` has no `customerId`); customer financial paid totals depend on booking linkage completeness.
3. Follow-up list is lead-scoped via `findByLeadIds` (no direct `findByCustomerId` on FollowUp).
4. Recommended next: **P2-12 — BI / KPI dashboards**.

### Recommended next milestone

**P2-12 — BI / KPI dashboards**
