# Module Design

## Purpose of This Document

This document defines every module in Event OS: its responsibility, public interface, dependencies, domain events, and data ownership. Module boundaries are contractual—code outside a module may only interact through the documented interface.

**Business baseline (authoritative for We Decor Phase 1):** [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md)  
**Delivery timeline:** [`docs/11-roadmap.md`](./11-roadmap.md) — realigned 2026-07-08

*This document defines module **responsibility and Phase 1 coverage**. It does not specify database schema, APIs, or implementation details beyond existing interface sketches.*

---

## Phase 1 Module Alignment Notes

### Previous mismatch

Before alignment, **Module Implementation Phases** placed Staff, Vendor, Inventory, and Finance outside Phase 1, and BI/Marketing/CMS inside Growth/Intelligence phases. That split **did not match** the approved business Phase 1 scope (59 EP1 IDs, UAT W1–W5).

| Module area | Previous phase placement | Approved Phase 1 (`19`) |
|-------------|-------------------------|-------------------------|
| Staff, Vendor, Inventory | Operations (post-MVP) | **Phase 1** |
| Finance (payments, expenses, profitability) | Finance phase | **Phase 1** |
| BI founder dashboard | Intelligence | **Phase 1** (founder KPIs only) |
| Booking | Generic booking lifecycle | **Phase 1** + event workspace + execution stages |
| Vendor / Inventory feature depth | Assignment / allocation only | **Phase 1** procurement + movement state machine |
| AI (Basic), Tenant multi-tenant | Foundation MVP | **Deferred** |
| WhatsApp, full CMS, Marketing platform | Growth / Intelligence | **Deferred** |

### Corrections made

1. **Phase 1 coverage blocks** added to each module in approved scope — with EP1 IDs and existing-system relationships.
2. **Module Implementation Phases** table updated to match [`11-roadmap.md`](./11-roadmap.md).
3. **Booking, Vendor, Inventory, Task, Finance, BI** responsibility descriptions extended at **coverage level only** (no architecture redesign).
4. **Deferred modules** explicitly marked outside Phase 1 (multi-tenant SaaS, client portal, AI automation, full CMS, WhatsApp replacement, advanced BI, full accounting).
5. **Cross-cutting automation / business rules** documented as platform policy spanning modules (`EP1-AUT-001`, `EP1-AUT-005`, `EP1-BR-001`–`004`).

### Reference documents

| Document | Role |
|----------|------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | Business source of truth — EP1 IDs, scope freeze, UAT |
| [`docs/11-roadmap.md`](./11-roadmap.md) | Engineering delivery phases and transitional integrations |

**Separation maintained:** Business requirement (Doc `19`) → Module responsibility (this document) → Future implementation (roadmap sprints, not defined here).

---

## Phase 1 Module Summary

| Module | Phase 1 | EP1 IDs (primary) | Existing system relationship |
|--------|---------|-------------------|------------------------------|
| **Auth** | Yes | EP1-STF-003 | Extend LM admin/staff roles |
| **Tenant** | Minimal | — | Single-tenant We Decor config only |
| **Notification** | Yes | EP1-SAL-006, EP1-AUT-005 | Reuse LM FCM patterns |
| **File** | Yes | EP1-FIN-003, EP1-INV-007 | New (proofs, photos) |
| **CRM** | Yes | EP1-CUS-001–004, EP1-SUP-001–003 | Extend; unify LM + QB customer |
| **Lead** | Yes | EP1-SAL-001–006, EP1-AUT-006 | **Extend** `lead-management-app` — do not rebuild |
| **Quotation** | Yes | EP1-FIN-001 | **Reuse/extend** `quotation-billing-app`; parallel-run |
| **Booking** | Yes | EP1-OPS-001, 004, EP1-BR-003, EP1-AUT-002, 006 | New ops workspace on booking hub |
| **Calendar** | Yes | EP1-OPS-005 | Reuse LM calendar view |
| **Task** | Yes | EP1-OPS-003, EP1-AUT-003, EP1-INV-004 | New event checklists + ops tracking |
| **Staff** | Yes | EP1-STF-001–003, EP1-AUT-004 | New |
| **Vendor** | Yes | EP1-VEN-001–006 | New procurement workflow |
| **Inventory** | Yes | EP1-INV-001–007 | New movement states |
| **Finance** | Yes | EP1-FIN-002–005, EP1-BR-001–002 | Extend QB patterns; new expenses/P&L |
| **BI** | Partial | EP1-KPI-001–007, EP1-MKT-001–002 | Extend LM analytics; founder dashboard only |
| **Content library** | Partial | EP1-MKT-003 | File + event adjunct — not CMS module |
| **Marketing** | No | — | Funnel via BI/Lead in Phase 1 |
| **CMS / SEO / Instagram** | No | — | `wedecor-website` continues externally |
| **AI Assistant** | No | — | Deferred |
| **WhatsApp** | No | — | External WhatsApp continues; Event OS = source of truth |
| **Reports (extended)** | No | — | Phase 3 depth |
| **Policy / rules** | Cross-cutting | EP1-AUT-001, EP1-BR-001–004 | Enforced across modules |

---

## Module Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM MODULES                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │  Tenant  │  │  Notify  │  │   File   │              │
│  │          │  │ (minimal)│  │          │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────────────────────┤
│                    BUSINESS MODULES (Phase 1 core)                       │
│  ┌──────┐ ┌──────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐            │
│  │ CRM  │ │ Lead │ │ Quotation │ │ Booking │ │ Calendar │            │
│  └──────┘ └──────┘ └───────────┘ └─────────┘ └──────────┘            │
│  ┌──────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Task │ │ Staff  │ │ Vendor  │ │Inventory│ │ Finance │            │
│  └──────┘ └────────┘ └─────────┘ └─────────┘ └─────────┘            │
├─────────────────────────────────────────────────────────────────────────┤
│              PHASE 1 PARTIAL / CROSS-CUTTING                             │
│  ┌────────────────┐  ┌─────────────────────────────────────┐         │
│  │ BI (founder)   │  │ Policy: rules, approvals, no auto-exec │         │
│  └────────────────┘  └─────────────────────────────────────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│              DEFERRED (post Phase 1 — see roadmap)                       │
│  Marketing · Instagram · CMS · SEO · AI · WhatsApp · Reports (full)    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Module Design Rules

Every module adheres to these rules:

1. **Single responsibility** — One module, one bounded context.
2. **Explicit public API** — Exported application services and DTOs only.
3. **Private internals** — Domain entities, repositories, and internal services are not exported.
4. **Owned data** — Each module owns its database tables; no other module queries them directly.
5. **Event-driven side effects** — Cross-module async effects use domain events.
6. **Synchronous calls for reads** — Cross-module reads go through application service interfaces.
7. **No circular dependencies** — Dependency graph is a DAG.

---

## Platform Modules

### Auth Module

**Responsibility:** User authentication, session management, password reset, role-based access.

| Aspect | Detail |
|--------|--------|
| **Owns** | `users`, `sessions`, `password_reset_tokens` |
| **Depends on** | Tenant (for user-tenant association) |
| **Exposes** | `IAuthService.login()`, `.logout()`, `.refreshToken()`, `.resetPassword()` |
| **Events emitted** | `UserLoggedIn`, `PasswordChanged` |
| **Events consumed** | None |

**Why separate from Tenant:** Authentication is a cross-cutting concern used by all modules. Separating it prevents every module from implementing auth logic.

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Founder/staff role-based access; movement permissions for procurement, inventory, and finance actions |
| **EP1 IDs** | EP1-STF-003 |
| **Existing systems** | Extend LM admin/staff user model — not a greenfield auth design for sales roles |

---

### Tenant Module

**Responsibility:** Tenant lifecycle, settings, feature flags, branding configuration.

| Aspect | Detail |
|--------|--------|
| **Owns** | `tenants`, `tenant_settings`, `tenant_features` |
| **Depends on** | None (root module) |
| **Exposes** | `ITenantService.getSettings()`, `.updateSettings()`, `.isFeatureEnabled()` |
| **Events emitted** | `TenantCreated`, `TenantSettingsUpdated` |
| **Events consumed** | None |

**Why separate:** Tenant configuration is read by every module. A single source prevents configuration sprawl.

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1 (minimal)** — single-tenant We Decor configuration only (see **ADR-016**) |
| **Business capabilities** | We Decor settings and feature flags for one organisation |
| **EP1 IDs** | None dedicated — supports all modules |
| **Existing systems** | N/A |
| **Deferred** | Multi-tenant SaaS onboarding, tenant isolation, per-tenant billing (Doc `20` / Phase 6) |

---

### Notification Module

**Responsibility:** Deliver notifications via email, in-app, and push. WhatsApp delivery via dedicated WhatsApp module is **deferred**.

| Aspect | Detail |
|--------|--------|
| **Owns** | `notifications`, `notification_preferences`, `notification_templates` |
| **Depends on** | Tenant (settings), Auth (user preferences) |
| **Exposes** | `INotificationService.send()`, `.getUnread()`, `.markRead()` |
| **Events emitted** | `NotificationSent`, `NotificationDelivered` |
| **Events consumed** | All business events that trigger notifications |

**Why separate:** Notification delivery is a cross-cutting concern. Business modules emit events; Notification module decides how and when to notify.

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Sales notifications; guardrails so automated customer/staff notifications require human approval |
| **EP1 IDs** | EP1-SAL-006, EP1-AUT-005 (with policy layer) |
| **Existing systems** | Reuse LM FCM + in-app notification patterns |

---

### File Module

**Responsibility:** File upload, storage, retrieval, and metadata management.

| Aspect | Detail |
|--------|--------|
| **Owns** | `files` (metadata), object storage (blobs) |
| **Depends on** | Tenant |
| **Exposes** | `IFileService.upload()`, `.getSignedUrl()`, `.delete()` |
| **Events emitted** | `FileUploaded`, `FileDeleted` |
| **Events consumed** | Entity deletion events (cascade file cleanup) |

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Payment proof attachments; inventory item/movement photos; decor media for content library |
| **EP1 IDs** | EP1-FIN-003, EP1-INV-007, EP1-MKT-003 (storage layer) |
| **Existing systems** | N/A — new structured attachment storage |

---

### Policy & Business Rules (cross-cutting)

**Responsibility:** Human-approval gates, hard business blocks, provisional warn/recommend-only rules, no auto-execution policy.

*Not a separate deployable module in the architecture diagram — enforced across Lead, Booking, Finance, and automation entry points. Handler contract: **ADR-017**.*

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1 (cross-cutting)** |
| **Business capabilities** | Advance before Approved; financial review before Completed; execution ownership before execution; provisional rules warn only; recommendation-only automation |
| **EP1 IDs** | EP1-AUT-001, EP1-AUT-005, EP1-BR-001, EP1-BR-002, EP1-BR-003, EP1-BR-004 |
| **Existing systems** | Not enforced in LM/QB today — new policy enforcement in Event OS |

---

## Business Modules

### CRM Module

**Responsibility:** Client and contact management, interaction history, per-event support records.

| Aspect | Detail |
|--------|--------|
| **Owns** | `clients`, `contacts`, `client_interactions` |
| **Depends on** | Tenant, Auth |
| **Exposes** | `IClientService.create()`, `.update()`, `.getById()`, `.search()`, `.addContact()`, `.logInteraction()` |
| **Events emitted** | `ClientCreated`, `ClientUpdated`, `ContactAdded` |
| **Events consumed** | `LeadConverted` (auto-create or link client) |

**Public DTOs:**
- `ClientDto`, `ContactDto`, `ClientSearchResult`
- `CreateClientCommand`, `UpdateClientCommand`

**Internal (not exported):**
- `Client` entity, `ClientRepository`, `ClientMapper`

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Unified customer profile; per-event communication timeline; lightweight issue notes; support view of customer history |
| **EP1 IDs** | EP1-CUS-001, EP1-CUS-002, EP1-CUS-004, EP1-SUP-001, EP1-SUP-002 |
| **Existing systems** | Extend LM embedded customer fields; unify with QB offline customer catalog |

---

### Lead Module

**Responsibility:** Lead capture, pipeline management, qualification, assignment, follow-ups, review requests.

| Aspect | Detail |
|--------|--------|
| **Owns** | `leads`, `lead_stage_history` |
| **Depends on** | CRM (client linking), Staff (assignment), Tenant (pipeline config) |
| **Exposes** | `ILeadService.create()`, `.updateStage()`, `.assign()`, `.qualify()`, `.convert()`, `.search()`, `.getPipeline()` |
| **Events emitted** | `LeadCreated`, `LeadStageChanged`, `LeadAssigned`, `LeadQualified`, `LeadLost`, `LeadConverted` |
| **Events consumed** | External lead capture (website form; other channels manual/API) |

**Key business logic (domain layer):**
- Stage transition validation
- Pipeline view aggregation
- Lead scoring (**deferred** — via AI module, not Phase 1)

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Lead capture (all channels); lead source taxonomy; pipeline/status; assignment; structured follow-ups; sales notifications; review request tracking; lead → booking without duplicate entry |
| **EP1 IDs** | EP1-SAL-001 – EP1-SAL-006, EP1-CUS-003, EP1-SUP-003, EP1-AUT-006 (lifecycle chain), EP1-MKT-004 (website intake) |
| **Existing systems** | **Extend** `current-systems/lead-management-app` — pipeline, kanban, calendar, assignment, FCM, analytics, review requests. **Do not rebuild** sales core (W5 UAT) |

---

### Quotation Module

**Responsibility:** Quotation creation, versioning, sending, PDF generation. Structured customer approval portal **deferred** (manual WhatsApp OK in Phase 1).

| Aspect | Detail |
|--------|--------|
| **Owns** | `quotations`, `quotation_line_items`, `quotation_versions` |
| **Depends on** | CRM (client), Lead (source), Tenant (numbering, tax), File (PDF generation) |
| **Exposes** | `IQuotationService.create()`, `.addLineItem()`, `.send()`, `.approve()`, `.reject()`, `.revise()`, `.generatePdf()` |
| **Events emitted** | `QuotationCreated`, `QuotationSent`, `QuotationApproved`, `QuotationRejected`, `QuotationExpired` |
| **Events consumed** | `LeadQualified` (suggest quotation creation) |

**Cross-module interaction example:**
```
QuotationApproved event →
  Booking Module listens → creates booking / event workspace
  Notification Module listens → notifies operations team
  Task Module listens → generates checklist draft
```

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Event-linked quotations with line items and PDF |
| **EP1 IDs** | EP1-FIN-001 |
| **Existing systems** | **Reuse/extend** `quotation-billing-app` GST/PDF capability; **parallel-run** until Event OS billing stable |
| **Deferred** | Structured customer quote approval portal (`.approve()` / `.reject()` as customer-facing workflow) |

---

### Booking Module

**Responsibility:** Event lifecycle hub — booking record, **event operations workspace**, execution stages, ownership, and completion. Serves as the unified event record anchor (`EP1-AUT-006`).

| Aspect | Detail |
|--------|--------|
| **Owns** | `bookings` |
| **Depends on** | Quotation, CRM, Calendar, Task, Staff, Vendor, Inventory, Finance, Tenant |
| **Exposes** | `IBookingService.createFromQuotation()`, `.updateStatus()`, `.cancel()`, `.complete()`, `.getById()`, `.search()` |
| **Events emitted** | `BookingConfirmed`, `BookingStatusChanged`, `BookingCancelled`, `BookingCompleted` |
| **Events consumed** | `QuotationApproved` / Approved stage transition |

**Orchestration on Approved / workspace creation:**
1. Create or activate event operations workspace (human-confirmed per `EP1-AUT-002`)
2. Emit workspace / status events
3. Calendar Module creates or extends event entry
4. Task Module receives checklist generation trigger
5. Notification Module alerts operations

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Event workspace at Approved; execution stage tracking (beyond sales pipeline); execution ownership hard block; unified event record hub |
| **EP1 IDs** | EP1-OPS-001, EP1-OPS-004, EP1-BR-003, EP1-AUT-002, EP1-AUT-006 |
| **Existing systems** | No LM/QB equivalent — **new build** on booking bounded context |
| **Note** | Business term *event workspace* maps to Booking module responsibilities — not a separate module |

---

### Calendar Module

**Responsibility:** Unified calendar for events, site visits, meetings, and ops milestones.

| Aspect | Detail |
|--------|--------|
| **Owns** | `calendar_entries` |
| **Depends on** | Staff (availability), Booking, Lead |
| **Exposes** | `ICalendarService.createEntry()`, `.update()`, `.cancel()`, `.getByDateRange()`, `.checkConflicts()` |
| **Events emitted** | `CalendarEntryCreated`, `CalendarEntryUpdated`, `CalendarConflictDetected` |
| **Events consumed** | `BookingConfirmed`, `BookingCancelled`, `LeadStageChanged` (site visit) |

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Event dates with operations milestones |
| **EP1 IDs** | EP1-OPS-005 |
| **Existing systems** | Reuse LM calendar view concept; extend with ops milestones |
| **Deferred** | Staff conflict detection, multi-view enhancements (Phase 2) |

---

### Task Module

**Responsibility:** Task creation, assignment, tracking, completion — including **event-linked execution checklists** and operational task tracking.

| Aspect | Detail |
|--------|--------|
| **Owns** | `tasks`, `task_templates` |
| **Depends on** | Staff (assignment), Booking, Inventory, Tenant |
| **Exposes** | `ITaskService.create()`, `.assign()`, `.updateStatus()`, `.complete()`, `.getByAssignee()`, `.generateFromTemplate()` |
| **Events emitted** | `TaskCreated`, `TaskAssigned`, `TaskCompleted`, `TaskOverdue` |
| **Events consumed** | `BookingConfirmed` / workspace created (checklist generation trigger) |

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Event-linked execution checklists (SOP structure); operational task tracking; human-reviewed packing checklist generation support |
| **EP1 IDs** | EP1-OPS-003, EP1-AUT-003, EP1-INV-004 |
| **Existing systems** | N/A — **new build** checklist workflow |
| **Deferred** | Reusable event template library (Phase 2 enhancement) |

---

### Staff Module

**Responsibility:** Staff member profiles, assignment support, availability — aligned to We Decor staffing model.

| Aspect | Detail |
|--------|--------|
| **Owns** | `staff_members`, `staff_availability` |
| **Depends on** | Auth (user link), Tenant |
| **Exposes** | `IStaffService.create()`, `.update()`, `.getById()`, `.search()`, `.getAvailability()` |
| **Events emitted** | `StaffMemberCreated`, `StaffStatusChanged` |
| **Events consumed** | None |

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Staff master; staff assignment recommendations (Zakir approves); coordination from event workspace |
| **EP1 IDs** | EP1-STF-001, EP1-STF-002, EP1-AUT-004 |
| **Existing systems** | N/A — **new build** (LM has assignee field only, not staff master) |
| **Related** | Movement permissions owned with Auth — EP1-STF-003 |

---

### Vendor Module

**Responsibility:** Vendor directory, **per-event procurement**, confirmation workflow, payment tracking, and issue notes.

| Aspect | Detail |
|--------|--------|
| **Owns** | `vendors`, `vendor_rate_cards`, `vendor_assignments` |
| **Depends on** | Booking, Finance, Tenant |
| **Exposes** | `IVendorService.create()`, `.update()`, `.assignToBooking()`, `.getRateCard()` |
| **Events emitted** | `VendorCreated`, `VendorAssigned` |
| **Events consumed** | `BookingConfirmed` (procurement planning) |

*Phase 1 extends module responsibility to procurement workflow and confirmation tracking — beyond rate-card assignment in original design.*

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Vendor master; per-event procurement; confirmation tracking (Planned → Requested → Confirmed → Delivered/Completed); vendor payment tracking; cost variance flag; vendor issue notes |
| **EP1 IDs** | EP1-VEN-001 – EP1-VEN-006 |
| **Existing systems** | N/A — informal WhatsApp/paper today — **new build** |

---

### Inventory Module

**Responsibility:** Inventory master, location quantity, **event movement state machine**, packing workflow, returns, and damage tracking.

| Aspect | Detail |
|--------|--------|
| **Owns** | `inventory_items`, `inventory_allocations` |
| **Depends on** | Booking, File, Tenant |
| **Exposes** | `IInventoryService.createItem()`, `.allocate()`, `.release()`, `.checkAvailability()`, `.getByCategory()` |
| **Events emitted** | `InventoryAllocated`, `InventoryReleased`, `InventoryLow` |
| **Events consumed** | Booking / workspace events (movement lifecycle) |

*Phase 1 extends module responsibility to movement states Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned/Ready — beyond allocation-only model.*

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Inventory master (reusable/consumable/per-event); JP Nagar quantity; movement states; packing lists; returns + Cleaned/Ready; damage/loss; photos |
| **EP1 IDs** | EP1-INV-001 – EP1-INV-007 |
| **Existing systems** | N/A — **new build**; borrow ledger/location **patterns only** from reference ERP (`18` audit) |

---

### Finance Module

**Responsibility:** Event-linked invoicing, customer payments with proofs, vendor expenses, and **event profitability view**.

| Aspect | Detail |
|--------|--------|
| **Owns** | `invoices`, `invoice_line_items`, `payments`, `expenses` |
| **Depends on** | Booking, CRM, Quotation, Vendor, Tenant |
| **Exposes** | `IInvoiceService.create()`, `.send()`, `.recordPayment()`, `.void()`, `IExpenseService.create()`, `.getProfitability()` |
| **Events emitted** | `InvoiceCreated`, `InvoiceSent`, `PaymentReceived`, `InvoiceOverdue` |
| **Events consumed** | Booking lifecycle events for payment and completion gates |

#### Phase 1 coverage

| | |
|---|---|
| **Phase** | **Phase 1** |
| **Business capabilities** | Event-linked billing/invoices; customer payment lifecycle with proofs; vendor expenses per event; event profitability (revenue − vendor expenses); financial hard blocks |
| **EP1 IDs** | EP1-FIN-002, EP1-FIN-003, EP1-FIN-004, EP1-FIN-005, EP1-BR-001, EP1-BR-002 |
| **Existing systems** | Extend QB invoice/PDF patterns; extend LM `advancePaid` / `paymentStatus` fields with proofs |
| **Deferred** | Full accounting replacement; GST/tax automation; payment gateway; accounting software sync (Phase 3+) |

---

## Growth Modules

*None of the following are Phase 1 modules. Phase 1 uses Lead/BI for funnel visibility and File for content library only.*

### Marketing Module

**Responsibility:** Campaign management, lead source attribution, UTM tracking.

| Aspect | Detail |
|--------|--------|
| **Owns** | `campaigns`, `campaign_leads` |
| **Depends on** | Lead, CRM |
| **Exposes** | `ICampaignService.create()`, `.trackLead()`, `.getAnalytics()` |
| **Events consumed** | `LeadCreated` (attribute to campaign) |

*Phase: **4 — Growth Platform** (deferred). Phase 1 lead source funnel covered by **Lead + BI** (EP1-MKT-001, EP1-MKT-002).*

---

### Instagram Module

**Responsibility:** Instagram Business account integration, post analytics, lead capture from DMs.

| Aspect | Detail |
|--------|--------|
| **Owns** | `instagram_accounts`, `instagram_posts`, `instagram_insights` |
| **Depends on** | Lead, Tenant (credentials) |
| **Exposes** | `IInstagramService.connect()`, `.syncPosts()`, `.getInsights()`, `.captureLead()` |
| **Events consumed** | None (generates `LeadCreated` via Lead module) |

*Phase: **4 — Growth Platform** (deferred)*

---

### CMS Module

**Responsibility:** Public website content management for tenant websites.

| Aspect | Detail |
|--------|--------|
| **Owns** | `pages`, `page_sections`, `media_gallery` |
| **Depends on** | Tenant, File |
| **Exposes** | `ICmsService.createPage()`, `.publish()`, `.getPublicPage()` |

*Phase: **4 — Growth Platform** (deferred). Phase 1: `wedecor-website` continues; EP1-MKT-003 uses File + event adjunct — not full CMS.*

---

### SEO Module

**Responsibility:** SEO metadata management, sitemap generation, structured data.

| Aspect | Detail |
|--------|--------|
| **Owns** | `seo_metadata`, `sitemaps` |
| **Depends on** | CMS, Tenant |
| **Exposes** | `ISeoService.updateMetadata()`, `.generateSitemap()` |

*Phase: **4 — Growth Platform** (deferred). Phase 1: SEO remains in `wedecor-website` (EP1-MKT-004 integrate lead capture only).*

---

### Event Content Library (Phase 1 adjunct)

**Responsibility:** Event-linked decor media library for We Decor.

*Not a standalone module in the architecture map — Phase 1 capability implemented via **File** + Booking/CRM adjunct.*

| | |
|---|---|
| **Phase** | **Phase 1** |
| **EP1 IDs** | EP1-MKT-003 |
| **Deferred** | Full CMS module |

---

## Intelligence Modules

### AI Assistant Module

**Responsibility:** AI-powered assistance across workflows—quote generation, communication drafting, scheduling suggestions, insights.

| Aspect | Detail |
|--------|--------|
| **Owns** | `ai_conversations`, `ai_suggestions`, `prompt_templates` |
| **Depends on** | All business modules (reads context), Tenant (AI config) |
| **Exposes** | `IAiService.generateQuotation()`, `.draftMessage()`, `.suggestSchedule()`, `.askAssistant()` |
| **Events consumed** | Contextual (triggered by user action, not automatic) |

See [09-ai-development-guide.md](./09-ai-development-guide.md).

*Phase: **5 — Intelligence** (deferred). Not Phase 1 core. Checklist/assignment **recommendations** in Phase 1 are rule-based with human approval — not AI module dependency.*

---

### WhatsApp Module

**Responsibility:** WhatsApp Business API integration for automated messaging and lead capture.

| Aspect | Detail |
|--------|--------|
| **Owns** | `whatsapp_messages`, `whatsapp_templates`, `whatsapp_conversations` |
| **Depends on** | Lead, Notification, CRM, Tenant (API credentials) |
| **Exposes** | `IWhatsAppService.sendMessage()`, `.sendTemplate()`, `.handleWebhook()` |
| **Events consumed** | Business events configured for WhatsApp notification |

*Phase: **5 — Intelligence** (deferred). Phase 1: external WhatsApp continues; Event OS is source of truth for status/tasks/approvals — **not** full WhatsApp replacement.*

---

### Reports Module

**Responsibility:** Standard and custom report generation and scheduling.

| Aspect | Detail |
|--------|--------|
| **Owns** | `report_definitions`, `report_runs` |
| **Depends on** | All business modules (reads aggregated data) |
| **Exposes** | `IReportService.generate()`, `.schedule()`, `.getAvailable()` |

*Phase: **3 — Finance Depth** for extended reports. Phase 1 event profitability via **Finance + BI** founder dashboard.*

---

### BI Module

**Responsibility:** Dashboards, KPIs, and business intelligence visualizations.

| Aspect | Detail |
|--------|--------|
| **Owns** | `dashboards`, `dashboard_widgets`, `kpi_definitions` |
| **Depends on** | Reports, all business modules |
| **Exposes** | `IBiService.getDashboard()`, `.getKpi()`, `.createWidget()` |

#### Phase 1 coverage (partial module)

| | |
|---|---|
| **Phase** | **Phase 1 (founder dashboard only)** |
| **Business capabilities** | Founder dashboard: total enquiries, conversion rate, events completed, event gross margin, lead source performance; weekly review cadence; selective targets; lead source funnel visibility |
| **EP1 IDs** | EP1-KPI-001 – EP1-KPI-007, EP1-MKT-001, EP1-MKT-002 |
| **Existing systems** | Extend LM analytics (3–4 KPIs); add gross margin |
| **Deferred** | Advanced BI — custom dashboards, ad-hoc widgets, scheduled reports (Phase 5) |

---

## Module Dependency Graph

```
Tenant (minimal) ─────────────────────────────────────┐
  │                                                    │
  ▼                                                    │
Auth ─────────────────────────────────────────────┐    │
  │                                              │    │
  ▼                                              ▼    ▼
CRM ──▶ Lead ──▶ Quotation ──▶ Booking ──▶ Finance
                  │                │
                  │                ├──▶ Calendar
                  │                ├──▶ Task
                  │                ├──▶ Staff
                  │                ├──▶ Inventory
                  │                └──▶ Vendor
                  │
File ─────────────────────────────────────────────── (proofs, photos, content)
Notification ────────────────────────────────────── (consumes all events)
BI (founder) ─────────────────────────────────────── (reads aggregated module data)
Policy/Rules ────────────────────────────────────── (cross-cutting gates)

Deferred: AI Assistant · WhatsApp · Marketing · CMS · SEO · Reports (full)
```

**Rule:** Arrows represent "depends on" (imports interface from). No reverse arrows. No cycles.

---

## Module Interface Contract

Every module's public interface follows this pattern:

```typescript
// Exported from module's index.ts
export interface ILeadService {
  create(command: CreateLeadCommand, context: TenantContext): Promise<LeadDto>;
  updateStage(id: string, stage: LeadStage, context: TenantContext): Promise<LeadDto>;
  assign(id: string, staffId: string, context: TenantContext): Promise<LeadDto>;
  search(query: LeadSearchQuery, context: TenantContext): Promise<PaginatedResult<LeadDto>>;
}

// Commands and DTOs are also exported
export { CreateLeadCommand, LeadDto, LeadSearchQuery };
```

**What is NOT exported:**
- Domain entities (`Lead`, `Client`)
- Repository interfaces and implementations
- Internal mappers and validators
- Database models / ORM entities

---

## Cross-Module Communication Patterns

### Pattern 1: Synchronous Service Call (Same Request)

Used when Module A needs data from Module B to complete its own operation.

```
QuotationService.create()
  → ClientService.getById(clientId)     // Read client data
  → QuotationRepository.save(quotation)  // Own data
```

### Pattern 2: Domain Event (Side Effects)

Used when Module A's action should trigger independent actions in other modules.

```
QuotationService.approve(quotation)
  → Quotation.status = 'approved'
  → EventBus.emit(QuotationApproved)
      → BookingHandler: create event workspace
      → NotificationHandler: notify team
      → TaskHandler: generate checklist draft
```

*Phase 1 constraint: handlers **suggest** actions; human confirms — no auto-execution (`EP1-AUT-001`).*

### Pattern 3: Shared Read Model (Future)

For complex cross-module queries (dashboards, reports), use materialized views or read models rather than joining across module tables.

*Phase 1 founder dashboard (BI) reads aggregated data per this pattern.*

---

## Module Implementation Phases

*Aligned with [`11-roadmap.md`](./11-roadmap.md) and Doc `19` approved business Phase 1.*

| Phase | Modules / scope | Rationale |
|-------|-----------------|-----------|
| **Phase 1 — We Decor (approved business scope)** | Auth, Tenant (minimal), Notification, File, CRM, Lead, Quotation, Booking, Calendar, Task, Staff, Vendor, Inventory, Finance, BI (founder dashboard), Policy/Rules (cross-cutting), File-based content library adjunct | All 59 EP1 IDs; UAT W1–W5; extend LM, parallel-run QB, integrate website |
| **Phase 2 — Operations enhancements** | Calendar (enhanced), Booking (templates), Task (templates) | Post-go-live depth — not required for Phase 1 UAT |
| **Phase 3 — Finance depth** | Reports (extended), payment gateway, tax/GST depth, accounting sync | Beyond Phase 1 profitability and payment proofs |
| **Phase 4 — Growth platform** | Marketing, Instagram, CMS, SEO, Client Portal, ad integrations | Full marketing/CMS — not Phase 1 content library + funnel |
| **Phase 5 — Intelligence** | WhatsApp, AI (advanced), BI (full), automation | Not Phase 1; WhatsApp external continues |
| **Phase 6 — Multi-tenant SaaS** | Tenant (full), onboarding, billing, isolation | Doc `20` — explicitly deferred from Phase 1 |

### Explicitly outside Phase 1 module delivery

| Item | Deferred to |
|------|-------------|
| Multi-tenant SaaS | Phase 6 / Doc `20` |
| Client portal | Phase 4 |
| AI automation (core dependency) | Phase 5 |
| Full CMS | Phase 4 |
| Full WhatsApp replacement | Phase 5 |
| Advanced BI (custom dashboards) | Phase 5 |
| Full accounting / ERP replacement | Phase 3+ |
| Structured customer quote approval portal | Phase 4+ |
| Instagram / campaign marketing module | Phase 4 |

---

## Related Documents

| Document | Topic |
|----------|-------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | **Authoritative Phase 1 business baseline** |
| [11-roadmap.md](./11-roadmap.md) | Module delivery timeline (realigned) |
| [04-business-domain.md](./04-business-domain.md) | Domain model per module |
| [05-system-architecture.md](./05-system-architecture.md) | Overall architecture |
| [10-folder-structure.md](./10-folder-structure.md) | Code organization per module |
| [20-definition-of-done.md](./20-definition-of-done.md) | Phase completion criteria |

---

*Last updated: 2026-07-08*  
*Owner: Founding Engineering*  
*Alignment: Doc `19` + `11-roadmap.md` (2026-07-08)*
