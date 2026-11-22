# EventOS — Feature Matrix (Source-Verified)

| Field | Value |
|-------|-------|
| **Audit date** | 2026-11-12 |
| **Git ref** | `snapshot/2026-11-04-wip` @ `91feb7b` |
| **Statuses** | Fully implemented · Partially · UI only · Backend only · Mock/demo · Not implemented |

**Rule:** Status requires evidence in Prisma and/or Nest controllers/services and/or web API clients + pages. Documentation alone is insufficient.

---

## Legend

| Status | Meaning |
|--------|---------|
| **Fully implemented** | End-to-end path exists (API + usable UI) for the core happy path |
| **Partially** | Significant capability exists but missing list/read/UI/transition pieces |
| **UI only** | Screen without backend |
| **Backend only** | API/DB without Admin Portal client |
| **Mock/demo** | Simulated behavior or incomplete stub presented as feature |
| **Not implemented** | No domain models/APIs/UI |

---

## A. Customer & Lead Management

| Capability | Status | Evidence |
|------------|--------|----------|
| Lead capture | **Fully implemented** | `Lead` model; `LeadController` POST/GET/list; web `create-lead-page.tsx`, `leads-list-page.tsx` |
| Customer profiles | **Partially** | `Customer`/`Contact`; `GET/PATCH/POST /clients/:id` (no list); hub open-by-id; Customer 360 under `/clients/:id/*` |
| Lead status / pipeline | **Fully implemented** | `Lead.stage` + history; `PATCH …/stage`; web lead detail transitions |
| Follow-up management | **Partially** | Create `POST …/follow-ups`; `PATCH /follow-ups/:id` API; **no list**; UI create-only |
| Communication history | **Fully implemented** | `TimelineEntry`, `CommunicationRecord`; timeline + communications + Customer 360 UIs |

---

## B. Event Management

| Capability | Status | Evidence |
|------------|--------|----------|
| Create / manage events | **Partially** | Created via quotation approve → booking; **no** booking list/create API; hubs open-by-id |
| Event lifecycle | **Partially** | activate → `in_preparation`; cancel; complete requires `in_execution` (**no writer** for that status) |
| Dates and venues | **Fully implemented** | Fields on Lead/Quotation/Event; copied on booking create; shown in UI |
| Event requirements | **Partially** | `requirementsNotes` on Event; displayed; dedicated edit UX thin/absent |
| Event checklists | **Fully implemented** | Checklist templates + event checklists modules; workspace UI |
| Event assignments | **Fully implemented** | `StaffAssignment` APIs + workspace staff assignment UI |
| Event timelines | **Fully implemented** | Notes, workspace activity, calendar timeline aggregation |

---

## C. Decorations & Package Management

| Capability | Status | Evidence |
|------------|--------|----------|
| Decorations catalogue | **Not implemented** | No Prisma models / modules / web features |
| Decoration packages | **Not implemented** | Same |
| Custom decoration requests | **Not implemented** | Same |
| Theme and design management | **Not implemented** | App “theme” = `next-themes` light/dark only |
| Pricing configuration | **Not implemented** | Quotation line unit prices ≠ décor catalogue pricing |
| Image / gallery management | **Not implemented** | No gallery; financial docs use `storageKey` metadata only |

---

## D. Quotation & Proposal Management

| Capability | Status | Evidence |
|------------|--------|----------|
| Quotation generation | **Partially** | Header create/update/get; **no list API**; hub open-by-id |
| Itemized pricing | **Backend only** | `QuotationLineItem` POST/PATCH/DELETE; **no GET**; web client omits line-items |
| Discounts and taxes | **Fully implemented** | Fields + totals calculator; web edit form |
| Proposal generation | **Partially** | `send` status transition; no rich proposal artifact / delivery |
| PDF generation | **Not implemented** | No PDF libs in app deps; UI states not shipped |
| Quotation revisions | **Fully implemented** | `revisionNumber` / supersede; `POST …/revise`; web action |
| Customer approval | **Fully implemented** | approve/reject APIs + UI; approve attempts booking create |

---

## E. Vendor Management

| Capability | Status | Evidence |
|------------|--------|----------|
| Vendor profiles | **Fully implemented** | Vendor CRUD + list; web vendors feature |
| Vendor services | **Partially** | Free-text `servicesProvided` / category — not service catalogue |
| Vendor quotations | **Fully implemented** | `ProcurementQuote` create/list/approve |
| Vendor assignments | **Fully implemented** | `VendorProcurement` + lines/PO/timeline; booking nested + pages |
| Vendor payments | **Partially** | Human `VendorExpense` recording; no automated vendor payouts |
| Vendor availability | **Not implemented** | No vendor availability model (staff/inventory availability exist) |

---

## F. Financial Management

| Capability | Status | Evidence |
|------------|--------|----------|
| Event budgets | **Partially** | Lead estimated budget; procurement `budgetedAmount`; no Budget aggregate |
| Customer payments | **Fully implemented** | `Payment` APIs; booking finance payments panel |
| Advance payments | **Partially** | Advance gate in booking create (API); UI lacks lead/quotation payment capture |
| Outstanding balances | **Partially** | Customer 360 outstanding; no full AR aging product |
| Expenses | **Fully implemented** | Vendor expenses + void; booking finance UI |
| Profitability | **Fully implemented** | `GET …/profitability` = payments − expenses; UI panels |
| Financial reports | **Fully implemented** | Analytics + reports/dashboard endpoints + web pages |

---

## G. Scheduling & Operations

| Capability | Status | Evidence |
|------------|--------|----------|
| Event calendar | **Fully implemented** | Read-only calendar aggregation API + `/app/calendar` |
| Task management | **Fully implemented** | Task module + web tasks + workspace |
| Team assignments | **Fully implemented** | Staff assignment lifecycle + scheduling |
| Resource availability | **Partially** | Staff availability + inventory availability; not venue/décor pool |
| Event execution tracking | **Partially** | Workspace/stages/checklists strong; `in_execution` hole blocks complete |
| Notifications and reminders | **Partially** | Reminder + preference CRUD; **no** push/email/SMS/WhatsApp send; header bell stub |

---

## H. AI Capabilities

| Capability | Status | Kind / evidence |
|------------|--------|-----------------|
| AI lead qualification | **Not implemented** | No LLM |
| NL quotation generation | **Not implemented** | No LLM |
| Event planning assistant | **Not implemented** | `Suggestion` accept/dismiss only; no creators; no UI |
| Décor recommendations | **Not implemented** | Domain + LLM absent |
| Customer message generation | **Not implemented** | Manual templates only |
| Vendor recommendations | **Not implemented** | Absent |
| Budget optimization | **Not implemented** | Absent |
| AI-powered business insights | **Not implemented** | Analytics are deterministic aggregates (**not AI**) |

**Related non-AI:** `GET scheduling/recommendations` — heuristic scoring (Backend + UI if wired in scheduling pages).

---

## Cross-cutting platform capabilities

| Capability | Status | Evidence |
|------------|--------|----------|
| Authentication | **Fully implemented** | JWT + refresh cookie + web login bootstrap |
| Authorization (RBAC) | **Fully implemented** | Roles/permissions guards; web `Can` / permission provider |
| Multi-tenant SaaS | **Not implemented** | Single Phase-1 tenant pattern (ADR-016) |
| File uploads | **Not implemented** | Infra env examples only |
| Object storage | **Not implemented** | Same |
| Email/SMS/WhatsApp send | **Not implemented** | Records/channels only |
| Payment gateway | **Not implemented** | Manual payment records |
| Realtime notifications | **Not implemented** | No WS/SSE product path |
| Mobile / PWA | **Partially** | Responsive CSS; no PWA manifest/service worker found in audit |
| Monitoring (Sentry API) | **Partially** | SDK wired; optional DSN; web Sentry not verified as wired |

---

## Coverage summary (count of matrix rows A–H)

| Status | Approx count |
|--------|-------------:|
| Fully implemented | 24 |
| Partially | 16 |
| Backend only | 1 |
| UI only / Mock | 0–2 (placeholders counted under Partial) |
| Not implemented | 18+ (incl. entire décor domain + AI set) |

---

## Key modules / files (index)

| Domain | Backend | Frontend |
|--------|---------|----------|
| Auth | `apps/api/src/modules/auth/` | `apps/web/src/features/auth/` |
| Lead | `…/lead/` | `…/features/leads/` |
| Customer | `…/customer/` | `…/features/customers/` |
| Quotation | `…/quotation/` | `…/features/quotations/` |
| Booking/Event | `…/booking/` | `…/features/bookings/`, `events/` |
| Vendor | `…/vendor/` | `…/features/vendors/` |
| Finance/Payment | `…/finance/`, `…/payment/` | `…/features/finance/` |
| Staff | `…/staff/` | `…/features/staff*`, `staff-assignments/` |
| Inventory | `…/inventory/` | `…/features/inventory/` |
| Calendar | `…/calendar/` | `…/features/calendar/` |
| Communication | `…/communication/` | `…/features/communications/` |
| Analytics | `…/analytics/`, `…/dashboard/` | `…/features/analytics/`, `reports/`, `dashboard/` |
| Checklist | `…/checklist/` | `…/features/checklists/` |
| Schema | `apps/api/prisma/schema.prisma` | — |

---

*End of feature matrix.*
