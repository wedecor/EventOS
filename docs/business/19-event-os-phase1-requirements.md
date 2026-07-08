# We Decor Events — Event OS Phase 1 Business Requirements

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Ilyas (Co-Founder, We Decor Events) |
| **Primary Reviewer** | Zakir (Co-Founder, We Decor Events) |
| **Status** | Approved |
| **Approval** | Approved — Ilyas + Zakir (2026-07-08) |
| **Version** | 0.1 |
| **Created Date** | 2026-07-08 |
| **Last Updated** | 2026-07-08 |
| **Next Review Date** | Not Defined |
| **Document Purpose** | Consolidate **Phase 1 Event OS business requirements** from the Business Bible (`01`–`18`) into a single founder-approved handoff document for product and engineering. This is the business-layer PRD—not the engineering roadmap. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-08 | Ilyas + Zakir (Interview in progress) | Initial document created. Purpose and scope defined. Consolidated Phase 1 requirements pending interview validation. |
| 0.1 | 2026-07-08 | Capability matrix | Added **Capability Matrix — Existing vs Event OS Requirement** from Business Bible + code audits (`18`) of current and reference systems. |
| 0.1 | 2026-07-08 | Scope freeze | Added **Phase 1 Scope Freeze** — committed capabilities vs explicitly deferred; scope change rule. |
| 0.1 | 2026-07-08 | Traceability IDs | Assigned **EP1-{MOD}-###** identifiers to all committed Phase 1 capabilities; added Traceability Index. |
| 0.1 | 2026-07-08 | Traceability integrity | Integrity check **PASS**; corrected FIN-003 matrix duplicate, Index OPS count, KPI/BR matrix gaps, alias documentation. |
| 0.1 | 2026-07-08 | UAT interview | UAT Q1–Q5 captured and consolidated into Phase 1 UAT Success Criteria. |
| 0.1 | 2026-07-08 | UAT Q6 (Zakir) | Zakir confirmed Z1–Z5 and W1–W5; WhatsApp continues; Event OS as source of truth. |
| 0.1 | 2026-07-08 | UAT Q7 (Joint sign-off) | **Ilyas + Zakir approved** Phase 1 business baseline for development handoff. |
| 0.1 | 2026-07-08 | Engineering handoff | Added Engineering Handoff Validation — EP1→module map, reuse points, scope risks vs `06`/`11`. |

---

## Purpose of This Document

### Why Document 19 exists

Phase 1 requirements are **distributed** across domain documents (`04`–`17`) and master registries (`14`–`16`). This document:

1. **Consolidates** Phase 1 must-haves in one place
2. **Traces** each requirement to source Business Bible docs
3. **Defines success** from a We Decor business perspective
4. **Hands off** to engineering (`/docs/11-roadmap.md`, `/docs/06-module-design.md`) without duplicating technical design

### Boundary with other documents

| Document | Scope |
|----------|-------|
| Domain docs `04`–`17` | Authoritative workflow + module-specific Phase 1 notes |
| **`19-event-os-phase1-requirements.md` (this doc)** | **Single consolidated Phase 1 business requirements list** |
| `/docs/11-roadmap.md` | Engineering timeline, sprints, P0/P1/P2 |
| `/docs/06-module-design.md` | Technical module boundaries and APIs |
| `20-saas-evolution-plan.md` | Beyond Phase 1 / multi-tenant evolution |

**This document does not specify APIs, database schema, or sprint plans.**

---

## 1. Executive Summary

### Phase 1 Business Goal

Reduce **dependency on Zakir for operations** (`16-pain-points.md`) while enabling:

- Unified event lifecycle (lead → approved → execution → completed)
- Visibility into payments, expenses, and event profitability
- Structured procurement, inventory movement, and staff coordination
- Human-approved automation assistance (`17-automation-opportunities.md`)

### Current State

**Approved for development handoff** (Ilyas + Zakir, 2026-07-08). Phase 1 requirements, scope freeze, traceability IDs, and UAT success criteria consolidated in this document.

### Future Vision

Approved Phase 1 business requirements become the acceptance criteria for We Decor UAT and Event OS go-live.

---

## 2. Phase 1 Principles (Non-Negotiables)

| Principle | Source |
|-----------|--------|
| All can suggest; **nothing auto-executes** | `17` |
| Human approval for customer comms, vendor actions, staff assignment, pricing, execution | `17` |
| Provisional rules: **warn/recommend** only | `14` |
| No fabricated KPI baselines | `15` |
| Do not invent facts in workflows | All domain docs |

---

## 3. Phase 1 Module Requirements (Consolidated Index)

*Full requirement text remains in source docs until consolidated tables are completed.*

| Module area | ID prefix | Key Phase 1 capabilities | Primary source docs |
|-------------|-----------|-------------------------|---------------------|
| **Sales / Lead** | `EP1-SAL-` | Lead source tracking; pipeline; assignment notifications | `04`, `10` |
| **Operations** | `EP1-OPS-` | Workspace at Approved; calendar; execution checklists | `05`, `13`, `17` |
| **Staff** | `EP1-STF-` | Staff master; assignment; movement permissions | `06`, `17` |
| **Vendor / Procurement** | `EP1-VEN-` | Vendor master; per-event procurement; payments; variance flag | `07`, `09` |
| **Inventory** | `EP1-INV-` | Master; movement states; packing checklists | `08`, `17` |
| **Finance** | `EP1-FIN-` | Customer payments; vendor expenses; event profitability view | `09`, `15` |
| **Marketing / Content** | `EP1-MKT-` | Lead source dashboard; funnel by source; content library (decor media) | `10`, `11`, `15` |
| **Customer support** | `EP1-SUP-` / `EP1-CUS-` | Communication timeline; issue notes; review request tracking | `12` |
| **Business rules** | `EP1-BR-` | Hard blocks: advance before Approved; financial review before Completed; ownership before execution | `14` |
| **KPIs** | `EP1-KPI-` | Founder dashboard: 5 KPIs; weekly review; selective targets | `15` |
| **Automation** | `EP1-AUT-` | Recommendation-only assistance; approval gates; unified event record | `17` |

Detailed acceptance criteria per module: **Not Yet Completed**. Full ID list: **Traceability Index** below.

---

## 4. Capability Matrix — Existing vs Event OS Requirement

*Sources: Business Bible `01`–`18`; code audits in `18-technology-systems-landscape.md` (§Existing System Capability Audit, §Reference Systems Capability Audit).*

### How to read this matrix

| Column | Meaning |
|--------|---------|
| **ID** | Phase 1 requirement identifier (`EP1-{MOD}-###`) — see Traceability Index |
| **Business requirement** | What We Decor needs per Business Bible (source of truth) |
| **Current We Decor** | What exists today in production/custom apps (`current-systems/`) |
| **Reference pattern** | Architecture inspiration only — **not** We Decor business rules (`reference-systems/`) |
| **Status** | Gap vs Phase 1 business need |
| **Phase 1 decision** | What Event OS should do — business layer only |

**Status legend:** ✅ Already exists · 🟡 Exists partially / needs extension · 🔴 New build required · 🔵 Future SaaS capability

**Phase 1 decision legend:** **Reuse** · **Extend** · **Integrate** · **Replace later** · **Not Phase 1**

**System abbreviations:**

| Abbr | System |
|------|--------|
| **LM** | `lead-management-app` (We Decor Enquiries) |
| **QB** | `quotation-billing-app` (KA Furnitures Billing — offline) |
| **WEB** | `wedecor-website` |
| **CRM↯** | `crm-system` (AC Platform — reference only) |
| **INV↯** | `inventory-system` (Autoparts ERP — reference only) |

---

### Sales

| ID | Capability | Business area | Current We Decor | Reference pattern | Status | Phase 1 decision | Business source |
|----|------------|---------------|------------------|-------------------|--------|------------------|-----------------|
| **EP1-SAL-001** | **Lead capture** | Sales | **LM:** enquiry CRUD (admin create). **WEB:** contact API (no server persistence). Instagram/WhatsApp: manual entry | **CRM↯:** `public-intake` + persisted leads | 🟡 | **Extend** LM; **Integrate** WEB → Event OS lead endpoint | `03`, `04`, `10`, `18` |
| **EP1-SAL-002** | **Lead source tracking** | Sales | **LM:** source dropdown + analytics. **WEB:** `contact_form` tag only on API path | **CRM↯:** `LeadSource` enum (WEBSITE, INSTAGRAM, WHATSAPP, etc.) | 🟡 | **Extend** — unify all intake channels with consistent source taxonomy | `04`, `10`, `15` |
| **EP1-SAL-003** | **Sales pipeline / status** | Sales | **LM:** New → In Talks → Approved → Completed; kanban + calendar | **CRM↯:** lead + booking state machines | ✅ | **Reuse** workflow concept; **Extend** with hard business blocks (`14`) | `04`, `18` |
| **EP1-SAL-004** | **Lead assignment** | Sales | **LM:** `assignedTo` + FCM notification | **CRM↯:** lead assign + activity timeline | ✅ | **Reuse** pattern; migrate to unified event record | `04`, `06` |
| **EP1-SAL-005** | **Follow-ups** | Sales | **LM:** notes field + dashboard reminder (in_talks, 21-day window); no structured follow-up entity | **CRM↯:** lead notes + activities | 🟡 | **Extend** — structured follow-up dates/tasks per enquiry | `04`, `18` |
| **EP1-SAL-006** | **Sales notifications** | Sales | **LM:** FCM + in-app on assignment/status/payment field change | **CRM↯:** domain-event notification dispatcher | ✅ | **Reuse** notification model; **Extend** with Doc `17` approval gates | `04`, `17`, `18` |

---

### Customer

| ID | Capability | Business area | Current We Decor | Reference pattern | Status | Phase 1 decision | Business source |
|----|------------|---------------|------------------|-------------------|--------|------------------|-----------------|
| **EP1-CUS-001** | **Customer profile** | Customer | **LM:** embedded on enquiry. **QB:** Hive customer catalog (offline, separate) | **CRM↯:** `Customer` linked to leads/bookings | 🟡 | **Extend** — single customer identity across lead → quote → event | `03`, `18` |
| **EP1-CUS-002** | **Communication history** | Customer | WhatsApp/phone external only; **LM:** notes field | **CRM↯:** activity timeline on lead/booking | 🔴 | **New build** — communication timeline per event (`12` Phase 1) | `12`, `18` |
| **EP1-CUS-003** | **Review requests** | Customer | **LM:** WhatsApp review-request button (Google/Instagram/website links) | **CRM↯:** not primary pattern | ✅ | **Reuse** — port review-request flow to Event OS | `12`, `18` |
| **EP1-CUS-004** | **Issue / complaint notes** | Customer | Informal WhatsApp; no structured tracking | **CRM↯:** support tickets (over-engineered for Phase 1) | 🔴 | **New build** — lightweight issue notes per event (`12`) | `12` |

---

### Quotation & Finance

| ID | Capability | Business area | Current We Decor | Reference pattern | Status | Phase 1 decision | Business source |
|----|------------|---------------|------------------|-------------------|--------|------------------|-----------------|
| **EP1-FIN-001** | **Quotations + line items** | Quotation | **QB:** offline quotes with GST line items + PDF. **LM:** no line items | **CRM↯:** `Quotation` + `QuotationLineItem` + public approval | 🟡 | **Extend** — unified quote linked to enquiry; **Replace later** offline QB after migration | `04`, `07`, `18` |
| — | **Customer quote approval** | Quotation | Manual via WhatsApp; **QB:** no approval workflow | **CRM↯:** public `viewToken` approve/reject | 🔴 | **New build** (optional Phase 1: manual approval OK per `04`; structured approval **Extend**) | `04`, `18` |
| **EP1-FIN-002** | **Billing / invoices** | Finance | **QB:** invoice PDFs, amendments, cancel-with-reason | **CRM↯:** invoice lifecycle + PDF | 🟡 | **Extend** — event-linked billing; **Replace later** QB | `09`, `18` |
| **EP1-FIN-003** | **Customer payments (advance/balance) + proof storage** | Finance | **LM:** `advancePaid`, `paymentStatus` fields (no proofs). **QB:** no payment tracking. Proofs: WhatsApp/UPI screenshots only | **CRM↯:** payments + customer ledger (gateway webhooks ≠ proof upload) | 🟡/🔴 | **Extend** payment records per event; **New build** proof attachments (`09`) — *one committed ID; proofs are part of EP1-FIN-003* | `09`, `14`, `18` |
| **EP1-FIN-004** | **Vendor expenses (per event)** | Finance | Informal (WhatsApp, paper) | **CRM↯:** not event-expense oriented. **INV↯:** purchase invoices | 🔴 | **New build** — vendor expense lines per event (`09`, `07`) | `07`, `09` |
| **EP1-FIN-005** | **Event profitability view** | Finance | Not calculable today | **CRM↯:** finance analytics (booking-oriented). **INV↯:** P&L reports | 🔴 | **New build** — revenue − vendor expenses per event (`09`, `15`, `16`) | `09`, `15`, `16` |
| **EP1-BR-001** | **Advance-before-Approved rule** | Finance | Not enforced in **LM** code | **CRM↯:** different state rules | 🔴 | **New build** — hard block per `14` | `14`, `18` |
| **EP1-BR-002** | **Financial review before Completed** | Finance | Not enforced in **LM** code | — | 🔴 | **New build** — hard block per `14` | `14`, `18` |

---

### Operations

| ID | Capability | Business area | Current We Decor | Reference pattern | Status | Phase 1 decision | Business source |
|----|------------|---------------|------------------|-------------------|--------|------------------|-----------------|
| **EP1-OPS-001** | **Event workspace at Approved** | Operations | None — ops in WhatsApp/memory | **CRM↯:** `Booking` record (field-service, not event decor) | 🔴 | **New build** — auto-create ops workspace (`05`, `17`) | `05`, `17`, `18` |
| **EP1-BR-003** | **Execution ownership before execution** | Operations | **LM:** `assignedTo` (sales); no execution owner | **CRM↯:** technician assignment (wrong domain) | 🟡 | **Extend** — execution owner field + hard block (`14`). *ID under Business Rules; EP1-OPS-002 reserved/unused* | `05`, `14` |
| **EP1-STF-002** | **Staff assignment** | Operations | **LM:** sales assignee only; informal WhatsApp for crew | **CRM↯:** dispatch scoring (not applicable) | 🟡 | **Extend** — staff master + assignment recommendations; Zakir approves (`06`, `17`) | `06`, `17` |
| **EP1-STF-001** | **Staff master** | Staff | No staff master data model (beyond LM admin/staff users) | **CRM↯:** technician/customer models (different domain); **INV↯:** RBAC/location roles | 🔴 | **New build** — staff master aligned to `06` staffing model | `06`, `18` |
| **EP1-STF-003** | **Movement permissions** | Staff | Not defined/implemented in any current system | **INV↯:** location-scoped permissions (pattern) | 🔴 | **New build** — permissions for inventory/procurement actions (human-approved) | `06`, `07`, `08`, `09`, `18` |
| **EP1-OPS-003** | **Event / execution checklist** | Operations | None | **CRM↯:** job checklist patterns in booking flow | 🔴 | **New build** — event-linked checklists from SOP priorities (`13`) | `05`, `13`, `18` |
| **EP1-OPS-004** | **Execution tracking (status)** | Operations | **LM:** pipeline status only; no prep/load/venue states | **CRM↯:** booking states (EN_ROUTE, etc. — not applicable) | 🔴 | **New build** — execution stages per `05` | `05`, `18` |
| **EP1-OPS-005** | **Calendar / event dates** | Operations | **LM:** calendar view on enquiries | **CRM↯:** booking schedule | ✅ | **Reuse** — extend with ops milestones | `05`, `18` |

---

### Vendor

| ID | Capability | Business area | Current We Decor | Reference pattern | Status | Phase 1 decision | Business source |
|----|------------|---------------|------------------|-------------------|--------|------------------|-----------------|
| **EP1-VEN-001** | **Vendor master** | Vendor | Memory / informal lists | **INV↯:** party/supplier master. **CRM↯:** `Vendor` entity | 🔴 | **New build** — preferred vendors + statuses (`07`) | `07`, `18` |
| **EP1-VEN-002** | **Per-event procurement** | Vendor | WhatsApp coordination | **CRM↯:** inventory PO (warehouse-centric). **INV↯:** PO → GRN | 🔴 | **New build** — procurement lines linked to quote/budget (`07`) | `07`, `18` |
| **EP1-VEN-003** | **Procurement confirmation workflow** | Vendor | Informal | **INV↯:** PO status machine | 🔴 | **New build** — Planned → Requested → Confirmed → Delivered/Completed (`07`) | `07` |
| **EP1-VEN-004** | **Vendor payments** | Vendor | Zakir pays; informal records | **INV↯:** payables + payment allocation | 🔴 | **New build** — payment tracking with optional proofs (`07`, `09`) | `07`, `09` |
| **EP1-VEN-005** | **Cost variance flag + reasons** | Vendor | Not tracked | — | 🔴 | **New build** — flag when actual > budget + reason codes (`07`) | `07` |
| **EP1-VEN-006** | **Vendor issue notes** | Vendor | Informal | — | 🔴 | **New build** — lightweight notes at vendor + line level (`07`) | `07` |

---

### Inventory

| ID | Capability | Business area | Current We Decor | Reference pattern | Status | Phase 1 decision | Business source |
|----|------------|---------------|------------------|-------------------|--------|------------------|-----------------|
| **EP1-INV-001** | **Inventory master** | Inventory | Memory; JP Nagar storage (`08`) | **INV↯:** item master + categories. **CRM↯:** `InventoryItem` | 🔴 | **New build** — reusable/consumable/per-event taxonomy (`08`) | `08`, `18` |
| **EP1-INV-002** | **Stock quantity (location)** | Inventory | Not tracked | **INV↯:** append-only `stock_ledger` + location balances | 🔴 | **New build** — quantity at JP Nagar; **use INV↯ ledger pattern only** | `08`, `18` |
| **EP1-INV-003** | **Event stock movement states** | Inventory | Not tracked | **INV↯:** trade-doc moves only (no Planned→Picked→Packed…) | 🔴 | **New build** — movement state machine per `08` | `08`, `18` |
| **EP1-INV-004** | **Event packing lists** | Inventory | Memory / experience | — | 🔴 | **New build** — generated checklist + human review (`08`, `17`) | `08`, `17` |
| **EP1-INV-005** | **Returns + cleaning/ready** | Inventory | Informal return workflow | **INV↯:** stock adjustments | 🔴 | **New build** — Returned → Cleaned/Ready states (`08`) | `08` |
| **EP1-INV-006** | **Damage / loss tracking** | Inventory | Informal accountability | **INV↯:** adjustment reason codes | 🔴 | **New build** — damage notes + accountability (`08`) | `08`, `18` |
| **EP1-INV-007** | **Inventory photos** | Inventory | None structured | — | 🔴 | **New build** — photos on items/movements (`08`) | `08` |

---

### Marketing

| ID | Capability | Business area | Current We Decor | Reference pattern | Status | Phase 1 decision | Business source |
|----|------------|---------------|------------------|-------------------|--------|------------------|-----------------|
| **EP1-MKT-001** | **Lead source dashboard** | Marketing | **LM:** analytics breakdown by source | **CRM↯:** acquisition analytics | 🟡 | **Extend** — founder KPI #5 (`15`) | `10`, `15`, `18` |
| **EP1-MKT-002** | **Conversion funnel by source** | Marketing | **LM:** conversion rate KPI; not end-to-end ad spend | **CRM↯:** funnel by channel. **WEB:** GA4 optional | 🟡 | **Extend** — funnel in founder dashboard; ad spend integration **Not Phase 1** | `10`, `15` |
| **EP1-MKT-003** | **Content library (decor media)** | Marketing | Google Drive; **WEB:** Cloudinary for site gallery | — | 🔴 | **New build** — event-linked decor media library (`11`) | `11`, `18` |
| **EP1-MKT-004** | **SEO / public website** | Marketing | **WEB:** full Next.js SEO engine (31 localities, services) | **CRM↯:** programmatic SEO (different domain) | ✅ | **Integrate** lead capture; **Replace later** standalone site optional long-term | `10`, `18` |

---

### Automation & platform

| ID | Capability | Business area | Current We Decor | Reference pattern | Status | Phase 1 decision | Business source |
|----|------------|---------------|------------------|-------------------|--------|------------------|-----------------|
| **EP1-AUT-001** | **Recommendation-only policy** | Automation | Not enforced in apps | **CRM↯:** orchestration auto-runs (**do not copy**) | 🔴 | **New build** — all suggestions require human approval; nothing auto-executes (`17`) | `17`, `14` |
| **EP1-AUT-002** | **Workspace automation at Approved** | Automation | None | **CRM↯:** booking created on conversion (different trigger) | 🔴 | **New build** — suggest/create workspace; human confirms (`17`) | `17` |
| **EP1-AUT-003** | **Packing checklist generation** | Automation | None | — | 🔴 | **New build** — AI/rule-assisted draft; Zakir reviews (`17`) | `17` |
| **EP1-AUT-004** | **Staff assignment recommendations** | Automation | None | **CRM↯:** auto-dispatch scoring (**not applicable**) | 🔴 | **New build** — recommendations only; Zakir decides (`17`) | `17` |
| **EP1-AUT-005** | **Approval gates (no auto-execute)** | Automation | Not enforced in apps | **CRM↯:** orchestration auto-runs (**do not copy**) | 🔴 | **New build** — policy from `17`; mandatory gates for customer comms, vendor actions, staff assignment, pricing, execution | `17`, `14` |
| — | **AI assistance (quotes/messages)** | Automation | None in current apps | — | 🔵 | **Not Phase 1** core — optional P2 per engineering roadmap; suggestions only when added | `17`, `11-roadmap` |
| **EP1-AUT-006** | **Unified event record** | Platform | **LM** + **QB** disconnected; manual re-entry | **CRM↯:** lead → booking → quote → invoice chain | 🔴 | **New build** — single event lifecycle record (`16`, `18`) | `16`, `18` |
| **EP1-KPI-001** … **EP1-KPI-005** | **Founder KPI dashboard (5 KPIs)** | Platform | **LM:** 3–4 KPIs (no gross margin) | **CRM↯:** finance analytics dashboard | 🟡 | **Extend** — add event gross margin (`15`). *Canonical IDs: EP1-KPI-001 through EP1-KPI-005* | `15`, `18` |
| **EP1-KPI-006** | **Weekly review cadence** | Platform | Informal | — | 🟡 | **Extend** — weekly founder review per `15` | `15` |
| **EP1-KPI-007** | **Selective target support** | Platform | None | — | 🟡 | **Extend** — target fields; values **Not Defined** until founders set (`15`) | `15` |
| **EP1-BR-004** | **Provisional rules: warn/recommend only** | Platform | Not enforced in apps | — | 🔴 | **New build** — never auto-enforce provisional rules (`14`) | `14` |
| — | **Role-based access (founders/staff)** | Platform | **LM:** admin/staff. **QB:** PIN only | **CRM↯:** RBAC matrix. **INV↯:** location-scoped roles | 🟡 | **Extend** — Zakir/Ilyas/staff permissions per domain docs | `06`, `09`, `07`, `18` |
| — | **Multi-tenant SaaS** | Platform | None | **CRM↯:** `tenantId` throughout | 🔵 | **Not Phase 1** — We Decor single-tenant first (`20` future) | `01`, `02` |

---

### Matrix summary — Phase 1 build posture

| Posture | Count | Meaning |
|---------|-------|---------|
| **Reuse** | 4 | Port existing proven behaviour (pipeline, notifications, review requests, SEO surface) |
| **Extend** | 14 | Exists in part — unify, link, or add missing fields/workflows |
| **Integrate** | 2 | Connect website intake + optional legacy apps during transition |
| **New build** | 30 | No adequate We Decor implementation today |
| **Replace later** | 2 | Offline QB and possibly standalone apps after Event OS cutover |
| **Not Phase 1** | 3 | AI core, ad-spend integration, multi-tenant SaaS |

### Key planning rules (from this matrix)

1. **Do not rebuild** what **LM** already does well — migrate and extend (pipeline, assignment, notifications, analytics, review requests).
2. **Do not duplicate** **QB** offline billing long-term — migrate quotation/PDF capability into Event OS; run parallel until cutover.
3. **Do not copy** AC Platform dispatch, AMC, or auto-orchestration — reference patterns only.
4. **Do not copy** Autoparts ERP POS/GST/e-invoice stack for Phase 1 — borrow ledger/location patterns for inventory quantity only.
5. **Business Bible** defines *what*; this matrix defines *reuse vs build*; engineering docs define *how*.

### Evidence layers (keep separate)

| Layer | Document section |
|-------|------------------|
| How business operates today (interview) | `18` §2–§3 |
| What code actually implements | `18` §Existing System Capability Audit |
| Reference architecture patterns | `18` §Reference Systems Capability Audit |
| What Event OS Phase 1 must deliver | **This matrix** + §3 index above |

---

## 5. Phase 1 Validation Outcome

*Purpose:* Validate Phase 1 requirements against verified system reality from `18-technology-systems-landscape.md` (interview + code audit). This does **not** remove any Business Bible requirements; it classifies the **implementation posture** for Phase 1 planning.

### Validation method (classification)

| Class | Meaning |
|-------|---------|
| **Existing capability** | Already available in `current-systems/` (works today) |
| **Extension required** | Exists but needs Event OS enhancement to meet Business Bible Phase 1 need |
| **Integration required** | Existing system should connect during transition/cutover |
| **New build required** | Capability does not exist in current systems |
| **Deferred** | Intentionally not required in Phase 1 (per Business Bible scope) |

### Validation summary (by business area)

#### Sales

- **Existing capability**
  - Lead pipeline/status + kanban/calendar, assignment, notifications (LM)
  - Lead source analytics baseline (LM)
- **Extension required**
  - Structured follow-ups (beyond notes/reminder heuristics)
  - Standardized lead-source taxonomy across all intake paths (website/WhatsApp/Instagram/manual)
- **Integration required**
  - Website contact form → persisted lead in system of record (Event OS / LM replacement)
- **New build required**
  - None beyond the extensions above (sales core exists in LM)

#### Customer

- **Existing capability**
  - Review request WhatsApp flow (LM)
- **Extension required**
  - Customer profile unified across lead + quote + event (today split across LM embedded fields and QB local catalog)
- **New build required**
  - Communication timeline + lightweight issue notes (Doc `12`)

#### Quotation & Finance

- **Existing capability**
  - Quotation/invoice PDF + GST line items (QB — offline)
  - Basic payment fields on enquiry (`advancePaid`, `paymentStatus`) (LM) — proofs not captured
- **Extension required**
  - Event-linked quotation/billing (single event record; eliminate manual re-entry)
  - Customer payment lifecycle including proof attachments (Doc `09`)
- **Integration required**
  - Parallel-run legacy billing tool during cutover (QB) until Event OS billing stabilizes
- **New build required**
  - Vendor expense capture per event and profitability view (Docs `07`, `09`, `15`, `16`)
  - Hard blocks from Doc `14` (advance-before-Approved; financial review before Completed)

#### Operations

- **Existing capability**
  - Calendar view (LM) — sales-level scheduling only
- **Extension required**
  - Execution ownership beyond sales assignment (Doc `14` hard block: ownership before execution)
- **New build required**
  - Event operations workspace at Approved (Docs `05`, `17`)
  - Execution checklists + execution stage tracking (Docs `05`, `13`)
  - Staff master + staff assignment recommendations with Zakir approval (Docs `06`, `17`)
  - Movement permissions for procurement/inventory/finance actions (Doc `06` + domain permissions in `07`–`09`)

#### Vendor

- **New build required**
  - Vendor master, per-event procurement lines, confirmation timeline, vendor payments (with proofs), variance flag + reason, lightweight issue notes (Doc `07`)

#### Inventory

- **New build required**
  - Inventory master with We Decor taxonomy (reusable/consumable/per-event)
  - Movement state tracking (Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned/Ready)
  - Packing checklist workflow (human-reviewed) + returns + damage/loss accountability + photos (Doc `08`, `17`)

#### Marketing

- **Existing capability**
  - SEO + acquisition website surface (WEB)
  - Lead source analytics baseline (LM)
- **Extension required**
  - Conversion funnel by source (within Event OS founder dashboard)
- **New build required**
  - Event-linked content library for decor media (Doc `11`)
- **Deferred**
  - Advanced ad-spend attribution and deeper marketing analytics beyond current manual tracking (Doc `10`)

#### Automation (guardrails-first)

- **Existing capability**
  - None (policy exists, not enforced technically)
- **New build required**
  - Recommendation-only automations with mandatory human approval gates (Doc `17`)
- **Deferred**
  - Any auto-executing customer/vendor/staff actions (explicitly out of scope per Doc `17`)

### What changed from the original Phase 1 assumption (after audit)

- **Clarified reuse**: Sales/lead CRM is already strong in **LM**; Phase 1 should **extend**, not rebuild, the sales core.
- **Clarified replace-later**: Billing capability exists in **QB** but is offline/disconnected; it is a **transition tool**, not the long-term system of record.
- **Clarified integration gap**: Website lead intake is **not persisted** in the website itself; Phase 1 needs a reliable **website → lead** integration.
- **Clarified new-build scope**: Vendor, inventory movement states, ops workspace, profitability remain **true greenfield** relative to current systems.

### Traceability ID mapping (validation → committed IDs)

*§5 classifies implementation posture; it does not redefine scope. IDs below map validation themes to committed requirements.*

| Validation area | Primary committed IDs |
|-----------------|----------------------|
| Sales | EP1-SAL-001 – EP1-SAL-006 |
| Customer | EP1-CUS-001 – EP1-CUS-004 (Support aliases EP1-SUP-001 – EP1-SUP-003) |
| Quotation & Finance | EP1-FIN-001 – EP1-FIN-005; EP1-BR-001; EP1-BR-002 |
| Operations | EP1-OPS-001, EP1-OPS-003 – EP1-OPS-005; EP1-BR-003; EP1-STF-001 – EP1-STF-003 |
| Vendor | EP1-VEN-001 – EP1-VEN-006 |
| Inventory | EP1-INV-001 – EP1-INV-007 |
| Marketing | EP1-MKT-001 – EP1-MKT-004 |
| Automation | EP1-AUT-001 – EP1-AUT-006 |
| Deferred (no Phase 1 ID) | Multi-tenant SaaS (Doc `20`); ad-spend attribution; auto-execution |

---

## Consistency Scan Result

*Goal:* Ensure Phase 1 requirements are internally complete and traceable across:

- `## 3. Phase 1 Module Requirements`
- `## 4. Capability Matrix — Existing vs Event OS Requirement`
- `## 5. Phase 1 Validation Outcome`
- Source Business Bible documents (`docs/business/`)

### Complete Coverage

All module areas in `## 3` have corresponding coverage in the matrix and/or validation outcome:

- **Sales / Lead** → matrix `Sales` rows + validation `Sales`
- **Operations** → matrix `Operations` rows + validation `Operations`
- **Staff** → matrix `Staff master` + `Movement permissions` rows + validation `Operations` (staff master + permissions)
- **Vendor / Procurement** → matrix `Vendor` rows + validation `Vendor`
- **Inventory** → matrix `Inventory` rows + validation `Inventory`
- **Finance** → matrix `Quotation & Finance` rows + validation `Quotation & Finance`
- **Marketing / Content** → matrix `Marketing` rows + validation `Marketing`
- **Customer support** → matrix `Customer` rows + validation `Customer`
- **Business rules** → matrix rules-related rows + `## 7 Phase 1 Business Rules (Hard Blocks)` + validation (hard blocks called out)
- **KPIs** → matrix KPI row + `## 8 Phase 1 KPIs & Dashboards`

### Gaps Found

No remaining unmapped Phase 1 module areas.

### Conflicts Found

- **None found** where a capability was marked **Reuse** without verified implementation evidence.
- **None found** where a capability marked **New build** is already implemented in `current-systems/` (per `18` code audit).

### Duplicate requirements

Some items appear in both the matrix and validation outcome (e.g., website lead integration, ops workspace). This is intentional: the matrix is the cross-repo mapping; the validation outcome summarizes implementation posture.

### Recommended Corrections

No corrections required.

**Phase 1 requirements are fully traceable across module requirements, capability matrix, and validation outcome.**

---

## Phase 1 Scope Freeze

*Purpose:* Establish a clear boundary between **Phase 1 committed scope**, **future evolution** (reserved for `20-saas-evolution-plan.md`), and **explicitly out-of-scope** items. This section organizes existing decisions only — it does not add new features.

**Status:** **Approved** — Ilyas + Zakir (2026-07-08). No additional capabilities without Scope Change Rule (below).

---

### Committed Phase 1 Capabilities

*Event OS Phase 1 must deliver the following (sources: §3–§8, capability matrix, validation outcome).*

#### Sales

- **EP1-SAL-001** Lead capture across channels (extend existing lead app; integrate website intake)
- **EP1-SAL-002** Lead source tracking with consistent taxonomy (`04`, `10`)
- **EP1-SAL-003** Sales pipeline / status workflow (reuse; extend with business-rule hard blocks)
- **EP1-SAL-004** Lead assignment with notifications (reuse)
- **EP1-SAL-005** Structured follow-ups per enquiry (extend beyond notes/reminders)
- **EP1-SAL-006** Sales notifications with human-approval guardrails (`17`)

#### Customer

- **EP1-CUS-001** Unified customer profile across lead → quote → event (extend)
- **EP1-CUS-002** Communication timeline per event (new)
- **EP1-CUS-003** Review request tracking / WhatsApp flow (reuse from lead app)
- **EP1-CUS-004** Lightweight issue notes per event (new)

#### Finance

- **EP1-FIN-001** Event-linked quotations with line items (extend; migrate from offline billing tool)
- **EP1-FIN-002** Event-linked billing / invoices (extend)
- **EP1-FIN-003** Customer payment records (advance/balance) with proof attachments (extend)
- **EP1-FIN-004** Vendor expenses captured per event (new)
- **EP1-FIN-005** Event profitability view — revenue minus vendor expenses per event (new)
- **EP1-BR-001**, **EP1-BR-002** Business-rule hard blocks: advance before **Approved**; financial review before **Completed** (`14`)
- *Manual quote approval via WhatsApp remains acceptable in Phase 1 per `04` — structured customer approval workflow is not a committed must-have*

#### Operations

- **EP1-OPS-001** Event operations workspace at **Approved** (new; human-confirmed creation per `17`)
- **EP1-BR-003** Execution ownership before execution stages (extend + hard block)
- **EP1-OPS-003** Event-linked execution checklists from SOP priorities (new; structure per `13`)
- **EP1-OPS-004** Execution stage tracking beyond sales pipeline status (new)
- **EP1-OPS-005** Calendar / event dates with ops milestones (reuse + extend)

#### Staff

- **EP1-STF-001** Staff master aligned to frozen staffing model (`06` v1.0) (new)
- **EP1-STF-002** Staff assignment recommendations — Zakir approves (`17`) (new)
- **EP1-STF-003** Movement permissions for procurement/inventory/finance actions (new)

#### Vendor

- **EP1-VEN-001** Vendor master with preferred vendors and statuses (new)
- **EP1-VEN-002** Per-event procurement linked to quote/budget (new)
- **EP1-VEN-003** Procurement confirmation workflow: Planned → Requested → Confirmed → Delivered/Completed (new)
- **EP1-VEN-004** Vendor payment tracking with optional proofs (new)
- **EP1-VEN-005** Cost variance flag and reason codes (new)
- **EP1-VEN-006** Lightweight vendor issue notes at vendor and line level (new)

#### Inventory

- **EP1-INV-001** Inventory master with reusable/consumable/per-event taxonomy (new)
- **EP1-INV-002** Stock quantity tracking at JP Nagar storage location (new)
- **EP1-INV-003** Event stock movement states: Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned/Ready (new)
- **EP1-INV-004** Event packing lists with human-reviewed generation (new)
- **EP1-INV-005** Returns workflow with Cleaned/Ready state (new)
- **EP1-INV-006** Damage/loss tracking with accountability notes (new)
- **EP1-INV-007** Photos on inventory items/movements (new)

#### Marketing

- **EP1-MKT-001** Lead source dashboard in founder KPI view (extend)
- **EP1-MKT-002** Conversion funnel by source in founder dashboard (extend)
- **EP1-MKT-003** Event-linked content library for decor media (new)
- **EP1-MKT-004** Website SEO surface continues; website enquiries integrate into system of record (integrate)

#### Support

- **EP1-SUP-001** Communication timeline (see **EP1-CUS-002**)
- **EP1-SUP-002** Issue notes per event (see **EP1-CUS-004**)
- **EP1-SUP-003** Review request tracking (see **EP1-CUS-003**)

#### Automation

- **EP1-AUT-001** Recommendation-only assistance — **nothing auto-executes** (`17`)
- **EP1-AUT-002** Event workspace suggestion at Approved (human confirms)
- **EP1-AUT-003** Material/packing checklist generation (human reviews)
- **EP1-AUT-004** Staff assignment recommendations (Zakir decides; see **EP1-STF-002**)
- **EP1-AUT-005** Mandatory human-approval gates for customer comms, vendor actions, staff assignment, pricing, execution (`17`)
- **EP1-AUT-006** Unified event record across lead → quote → payment → ops → completion (new)

#### KPIs

- **EP1-KPI-001** Total enquiries
- **EP1-KPI-002** Conversion rate
- **EP1-KPI-003** Events completed
- **EP1-KPI-004** Event gross margin
- **EP1-KPI-005** Lead source performance
- **EP1-KPI-006** Weekly review cadence
- **EP1-KPI-007** Selective target support (values **Not Defined** until founders set)

#### Cross-cutting (Business Rules)

- **EP1-BR-004** Provisional rules: warn/recommend only — never auto-enforce (`14`)

*Hard blocks **EP1-BR-001**–**EP1-BR-003** are listed under Finance and Operations above.*

---

### Phase 1 Explicitly Not Included

*Deferred from Phase 1 per Business Bible scope, capability matrix (🔵 / Not Phase 1), or `## 9 Out of Scope`.*

#### Platform & SaaS evolution (see Doc `20`)

- Multi-tenant SaaS architecture and tenant onboarding
- Replacing standalone marketing website as long-term strategy (optional future; integrate only in Phase 1)

#### Automation & AI

- Advanced AI automation as core Phase 1 dependency
- Auto-execution of customer communications, vendor actions, staff assignment, pricing, or execution decisions (`17`)
- Automated customer/staff notifications without explicit human approval

#### Finance & accounting

- Full accounting / ERP replacement
- GST/tax workflows, payroll automation (`09`, `06` future)
- Auto vendor payments / purchases

#### Marketing

- Deep ad platform integrations and end-to-end ad-spend → revenue attribution (`10`)
- Advanced marketing analytics beyond manual lead-source tagging
- Social media auto-publishing (`11`)

#### Support & operations depth

- Full complaint ticketing / call-center-grade support workflow (`12`)
- Formal SOP document library **content** (Phase 1: structure + event-linked checklists only per `13`)

#### Consolidation & registry completeness

- Full business rules text consolidation (`14` v0.2+)
- Full KPI registry consolidation (`15` v0.2+)

#### Inventory & staffing scale

- Multi-warehouse inventory (`08` future)
- Payroll automation (`06` future)

#### Reference-system capabilities (not We Decor Phase 1)

- Technician GPS dispatch, AMC subscriptions, call-center omnichannel (AC Platform patterns — not applicable)
- Autoparts ERP POS, e-invoice, e-way bill, GSTR compliance stack (reference ERP — not Phase 1)

---

### Future Evolution (Not Phase 1 — Reserved for Doc `20`)

The following are **not excluded forever** but are explicitly **outside Phase 1 committed scope**:

- Multi-tenant SaaS product evolution
- Long-term replacement of legacy standalone apps after Event OS cutover
- Deeper automation and AI assistance beyond recommendation-only guardrails
- Advanced marketing attribution and analytics

*Authoritative roadmap for beyond Phase 1: `20-saas-evolution-plan.md` (not yet created).*

---

### Scope Change Rule

Any addition to **committed Phase 1 scope** requires:

1. **Business justification** — why the capability is needed now vs deferred
2. **Impact review** — effect on timeline, Zakir dependency reduction goal (`16`), and existing systems cutover
3. **Joint approval** — Ilyas + Zakir (aligned with material business rule change governance in `14`)
4. **Business Bible update** — amend the relevant domain document (`04`–`18`) and update this document (matrix + validation + scope freeze)

**Scope reductions** follow the same rule — deferring a committed capability is a material change.

---

## Traceability Index

*Purpose:* Quick lookup of all committed Phase 1 requirement IDs. Full detail in **§4 Capability Matrix** and **§12 Traceability Matrix**.

**ID format:** `EP1-{MOD}-{###}` where `{MOD}` is a three-letter module code.

| Module | ID range | Count | Notes |
|--------|----------|-------|-------|
| **Sales** | EP1-SAL-001 – EP1-SAL-006 | 6 | |
| **Customer** | EP1-CUS-001 – EP1-CUS-004 | 4 | |
| **Finance** | EP1-FIN-001 – EP1-FIN-005 | 5 | EP1-FIN-003 includes payment proof attachments |
| **Operations** | EP1-OPS-001, EP1-OPS-003 – EP1-OPS-005 | 4 | EP1-OPS-002 unused; ownership hard block = EP1-BR-003 |
| **Staff** | EP1-STF-001 – EP1-STF-003 | 3 | |
| **Vendor** | EP1-VEN-001 – EP1-VEN-006 | 6 | |
| **Inventory** | EP1-INV-001 – EP1-INV-007 | 7 | |
| **Marketing** | EP1-MKT-001 – EP1-MKT-004 | 4 | |
| **Support** | EP1-SUP-001 – EP1-SUP-003 | 3 | True aliases of Customer IDs (see below) |
| **Automation** | EP1-AUT-001 – EP1-AUT-006 | 6 | Dual-view cross-refs to OPS/INV/STF for AUT-002–004 |
| **KPIs** | EP1-KPI-001 – EP1-KPI-007 | 7 | EP1-KPI-001–005 compose founder dashboard |
| **Business Rules** | EP1-BR-001 – EP1-BR-004 | 4 | EP1-BR-003 also listed under Operations in Scope Freeze |

**Total committed IDs in Scope Freeze / §12:** 59  
**Unique capability destinations after collapsing Support aliases:** 56 (59 − 3 SUP aliases)

**True aliases (Support view → Customer canonical):**

| Alias ID | Canonical ID | Context |
|----------|--------------|---------|
| EP1-SUP-001 | EP1-CUS-002 | Support view of communication timeline |
| EP1-SUP-002 | EP1-CUS-004 | Support view of issue notes |
| EP1-SUP-003 | EP1-CUS-003 | Support view of review requests |

**Dual-view cross-references (both IDs remain committed; same underlying capability):**

| Module-view ID | Related ID | Context |
|----------------|------------|---------|
| EP1-AUT-002 | EP1-OPS-001 | Automation view of workspace at Approved |
| EP1-AUT-003 | EP1-INV-004 | Automation view of packing checklist generation |
| EP1-AUT-004 | EP1-STF-002 | Automation view of staff assignment recommendations |
| EP1-MKT-001 | EP1-KPI-005 | Lead-source dashboard vs KPI metric (same data) |

**Items without Phase 1 IDs (deferred / not committed):** structured customer quote approval; AI assistance core; multi-tenant SaaS (Doc `20`); role-based access extension (matrix only — not in Scope Freeze).

---

## 6. Phase 1 Automation Requirements

From `17-automation-opportunities.md`:

1. **EP1-AUT-002** Event workspace automation at **Approved**
2. **EP1-AUT-003** Material/packing checklist generation (human review)
3. **EP1-AUT-004** Staff assignment recommendations (Zakir decides)

*Policy:* **EP1-AUT-001** (recommendation-only; nothing auto-executes). **EP1-AUT-005** (mandatory approval gates).

---

## 7. Phase 1 Business Rules (Hard Blocks)

From `14-business-rules.md`:

1. **EP1-BR-001** Advance payment required before **Approved**
2. **EP1-BR-002** Critical financial records reviewed before **Completed**
3. **EP1-BR-003** Execution ownership assigned before execution stages

*Provisional policy:* **EP1-BR-004** — warn/recommend only; never auto-enforce.

---

## 8. Phase 1 KPIs & Dashboards

From `15-kpis.md`:

**Founder dashboard (weekly review):**

1. **EP1-KPI-001** Total enquiries
2. **EP1-KPI-002** Conversion rate
3. **EP1-KPI-003** Events completed
4. **EP1-KPI-004** Event gross margin
5. **EP1-KPI-005** Lead source performance

**Cadence & targets:** **EP1-KPI-006** weekly review; **EP1-KPI-007** selective target support (values **Not Defined** until founders set).

---

## 9. Out of Scope for Phase 1

*To be validated in interview. Initial list from domain docs:*

- Full business rules text consolidation (`14` v0.2+)
- Full KPI registry consolidation (`15` v0.2+)
- Formal SOP document library content (`13` — structure only in Phase 1)
- Automated customer/staff notifications without approval
- Auto vendor payments / purchases
- Social auto-publishing
- Full complaint ticketing workflow (`12`)
- Advanced marketing analytics / ad spend integration (`10`)
- GST/tax workflows, payroll automation, multi-warehouse (`09`, `06` future)

---

## 10. Success Criteria (Business UAT)

*Purpose:* Define **business acceptance criteria** for Phase 1 before development starts. These are founder-validated outcomes — not technical test cases, APIs, or implementation details.

**Interview status:** Q1–Q7 complete. **Joint founder approval:** **Approved (2026-07-08)**.

**Cross-reference:** Engineering success criteria in `/docs/11-roadmap.md` — business layer to align after UAT interview completes.

---

### UAT Interview Log

#### UAT Q1 — Primary success definition

**Question:** After Event OS Phase 1 is delivered, what is the single biggest outcome that would make you say *"Phase 1 is successful"*?

**Answer (founder):**

> Phase 1 is successful when Event OS reduces dependency on Zakir by creating a single source of truth for event planning, execution, and tracking, while ensuring no important operational steps are missed.

**Captured themes:**

| Theme | UAT signal |
|-------|------------|
| Reduce Zakir dependency | Primary success outcome (`16`) |
| Single source of truth | Event planning, execution, and tracking unified (`EP1-AUT-006`) |
| No missed operational steps | Execution checklists, stage tracking, hard blocks (`EP1-OPS-003`, `EP1-OPS-004`, `EP1-BR-001`–`003`) |

#### UAT Q2 — Zakir operational capabilities

**Question:** After Phase 1, what are the 3–5 most important things Zakir should be able to do in Event OS that he cannot reliably do today?

**Answer (founder):**

After Phase 1, Zakir should be able to:

1. See all approved events and their current preparation status in one place — know what is pending, ready, or requires attention.
2. Manage event execution through structured checklists — track packing, preparation, setup, and completion without depending on memory or WhatsApp.
3. Manage staff and vendor coordination from the event workspace — know who is assigned, what needs to be done, and what external dependencies exist.
4. Track inventory movement for each event — know what items are planned, picked, packed, loaded, returned, and ready.
5. Have event financial visibility — see payment status, expenses, and profitability information linked to each event.

**Mapped to committed requirements:**

| # | Zakir capability (UAT) | Primary EP1 IDs |
|---|------------------------|-----------------|
| 1 | Approved events + prep status in one place | EP1-OPS-001, EP1-OPS-004, EP1-OPS-005 |
| 2 | Structured execution checklists | EP1-OPS-003, EP1-INV-004 |
| 3 | Staff + vendor coordination from event workspace | EP1-STF-002, EP1-VEN-001 – EP1-VEN-003, EP1-OPS-001 |
| 4 | Per-event inventory movement tracking | EP1-INV-003, EP1-INV-004, EP1-INV-005 |
| 5 | Event financial visibility (payments, expenses, profitability) | EP1-FIN-003, EP1-FIN-004, EP1-FIN-005 |

#### UAT Q3 — Ilyas visibility and control

**Question:** After Phase 1, what should Ilyas be able to see and control in Event OS that he cannot reliably do today?

**Answer (founder):**

After Phase 1, Ilyas should be able to:

1. See complete business visibility from enquiry to event completion without depending on manual updates from Zakir — understand the status of every event, lead, and operational activity.
2. View founder-level dashboards and KPIs — track enquiries, conversions, completed events, lead source performance, and profitability without collecting data manually.
3. Identify events that need attention — see delayed preparation, pending payments, procurement issues, or operational risks before they become problems.
4. Have control through approval-based workflows — ensure important decisions such as pricing, vendor commitments, and operational changes follow defined business rules.
5. Understand event profitability — see revenue, expenses, and margins per event without manual reconciliation.

**Mapped to committed requirements:**

| # | Ilyas capability (UAT) | Primary EP1 IDs |
|---|------------------------|-----------------|
| 1 | End-to-end visibility without manual Zakir updates | EP1-AUT-006, EP1-SAL-003, EP1-OPS-001, EP1-OPS-004 |
| 2 | Founder dashboards and KPIs | EP1-KPI-001 – EP1-KPI-007, EP1-MKT-001, EP1-MKT-002 |
| 3 | Early identification of at-risk events | EP1-OPS-004, EP1-FIN-003, EP1-VEN-003, EP1-VEN-005, EP1-BR-001 – EP1-BR-003 |
| 4 | Approval-based control on key decisions | EP1-AUT-001, EP1-AUT-005, EP1-BR-001 – EP1-BR-004 |
| 5 | Per-event profitability without manual reconciliation | EP1-FIN-004, EP1-FIN-005 |

#### UAT Q4 — Business problems reduced

**Question:** Which specific business problems must be noticeably reduced for Phase 1 go-live acceptance?

**Answer (founder):**

Phase 1 must noticeably reduce these business problems:

1. Dependency on Zakir for operational visibility and coordination — Ilyas should not need to ask Zakir for every event status update.
2. Lack of a single source of truth for event information — customer details, event status, preparation progress, payments, and operational tasks should not be scattered across multiple places.
3. Manual re-entry and duplicated data between systems — customer and event information should flow without repeated copying between applications.
4. Lack of event profitability visibility — revenue, expenses, and margins should be visible per event instead of being calculated manually after completion.
5. Missed operational preparation steps — packing, inventory movement, vendor coordination, and execution tasks should be tracked through structured workflows.

**Mapped to pain points (`16`) and committed requirements:**

| Priority | Problem to reduce | Pain point link | Primary EP1 IDs |
|----------|-------------------|-----------------|-----------------|
| 1 | Zakir dependency for visibility/coordination | `16` #1 priority | EP1-AUT-006, EP1-OPS-001, EP1-KPI-001 – EP1-KPI-007 |
| 2 | No single source of truth | Scattered data across apps/WhatsApp | EP1-AUT-006, EP1-CUS-001, EP1-OPS-001 |
| 3 | Manual re-entry / duplicated data | LM ↔ QB disconnect (`18`) | EP1-AUT-006, EP1-FIN-001, EP1-FIN-002, EP1-SAL-001 |
| 4 | No event profitability visibility | Finance gap (`09`, `16`) | EP1-FIN-004, EP1-FIN-005 |
| 5 | Missed operational preparation steps | Ops in memory/WhatsApp (`05`, `08`) | EP1-OPS-003, EP1-OPS-004, EP1-INV-003 – EP1-INV-005, EP1-VEN-002 – EP1-VEN-003 |

#### UAT Q5 — Workflow success definitions

**Question:** Which end-to-end workflows must be considered successful when run entirely in Event OS for Phase 1 go-live?

**Answer (founder):**

The following end-to-end workflows must be successful for Phase 1 go-live, in priority order:

1. **Approved Booking → Event Execution Workflow** — booking approved after advance confirmation; event workspace created; preparation tasks, staff assignment, and execution tracking completed through Event OS.
2. **Event Preparation → Inventory Movement Workflow** — packing checklist generated; items planned, picked, packed, loaded, tracked at venue, returned, and marked ready.
3. **Event → Vendor Procurement Workflow** — vendor requirements identified; procurement tracked from request through confirmation, delivery/completion, and payment tracking.
4. **Customer Payment → Event Financial Completion Workflow** — customer advance and balance payments recorded; payment proofs captured where required; event expenses tracked; profitability visible before completion.
5. **Lead → Booking Workflow** — enquiry captured; lead source recorded; follow-up tracked; converted lead becomes an approved event without duplicate data entry.

*Founder note:* These workflows represent the minimum operational cycle required to reduce dependency on manual coordination and support scaling.

**Mapped to committed requirements:**

| Priority | Must-pass workflow | Primary EP1 IDs |
|----------|-------------------|-----------------|
| 1 | Approved Booking → Event Execution | EP1-BR-001, EP1-OPS-001, EP1-OPS-003, EP1-OPS-004, EP1-STF-002, EP1-AUT-002 |
| 2 | Event Preparation → Inventory Movement | EP1-INV-003, EP1-INV-004, EP1-INV-005, EP1-AUT-003 |
| 3 | Event → Vendor Procurement | EP1-VEN-002, EP1-VEN-003, EP1-VEN-004, EP1-VEN-005 |
| 4 | Customer Payment → Financial Completion | EP1-FIN-003, EP1-FIN-004, EP1-FIN-005, EP1-BR-002 |
| 5 | Lead → Booking | EP1-SAL-001, EP1-SAL-002, EP1-SAL-005, EP1-AUT-006, EP1-BR-001 |

#### UAT Q6 — Zakir validation

**Question:** Do Z1–Z5 capabilities and W1–W5 workflows accurately reflect Zakir’s daily operational needs for Phase 1?

**Answer (Zakir perspective):**

From Zakir’s perspective, the Z1–Z5 capabilities and W1–W5 workflows accurately represent the core operational needs for Phase 1. **No major capabilities are missing.**

**Workflow priority validation:**

| Workflow | Zakir validation |
|----------|------------------|
| W1 Approved Booking → Event Execution | **Correct highest priority** — daily operational coordination begins here |
| W2 Event Preparation → Inventory Movement | **Correct** — packing, loading, returns depend on memory/experience today |
| W3 Event → Vendor Procurement | **Correct** — vendor coordination and tracking are informal today |
| W4 Customer Payment → Financial Completion | **Correct** — important but less operationally urgent than execution workflows |
| W5 Lead → Booking | **Important** — existing Lead Management Application handles much of this; **extend rather than rebuild** is the right approach |

**Operational constraint (Phase 1 UAT):**

> Phase 1 should not try to replace every communication method immediately. WhatsApp will continue to be used, but Event OS should become the **source of truth** for event status, tasks, approvals, and tracking.

**Overall:** UAT criteria are realistic for Phase 1 and aligned with reducing operational dependency while allowing Zakir to continue managing events effectively.

*Scope alignment:* WhatsApp continuation does not add new Phase 1 scope — consistent with `EP1-CUS-002` (timeline, not channel replacement), `EP1-AUT-001` (no auto-execution), and matrix **Extend** posture for sales/lead (`EP1-SAL-001`–`006`).

---

### Phase 1 UAT Success Criteria (Consolidated)

*Business acceptance bar for Phase 1 go-live. Derived from UAT Q1–Q5. Does not define technical test cases.*

**Approval:** **Approved** — Ilyas + Zakir (2026-07-08). Business baseline for development handoff.

#### 1. Primary success statement

Phase 1 UAT passes when Event OS **reduces dependency on Zakir** by providing a **single source of truth** for event planning, execution, and tracking, while **ensuring no important operational steps are missed**.

#### 2. Zakir — operational acceptance (must be true)

| # | Business acceptance criterion | EP1 IDs |
|---|------------------------------|---------|
| Z1 | Zakir can see all approved events and preparation status in one place (pending, ready, needs attention) | EP1-OPS-001, EP1-OPS-004 |
| Z2 | Zakir can run execution through structured checklists with Event OS as the task/status source of truth (WhatsApp may continue for messaging) | EP1-OPS-003 |
| Z3 | Zakir can coordinate staff and vendors from the event workspace | EP1-STF-002, EP1-VEN-001 – EP1-VEN-003, EP1-OPS-001 |
| Z4 | Zakir can track per-event inventory through planned → ready states | EP1-INV-003 – EP1-INV-005 |
| Z5 | Zakir can see payment status, expenses, and profitability per event | EP1-FIN-003 – EP1-FIN-005 |

#### 3. Ilyas — visibility and control acceptance (must be true)

| # | Business acceptance criterion | EP1 IDs |
|---|------------------------------|---------|
| I1 | Ilyas has enquiry-to-completion visibility without asking Zakir for routine status updates | EP1-AUT-006, EP1-SAL-003, EP1-OPS-001 |
| I2 | Ilyas can review founder KPIs without manual data collection | EP1-KPI-001 – EP1-KPI-007 |
| I3 | Ilyas can identify at-risk events (delayed prep, pending payments, procurement issues) before they escalate | EP1-OPS-004, EP1-FIN-003, EP1-VEN-005 |
| I4 | Important decisions follow approval-based workflows and business rules | EP1-AUT-001, EP1-AUT-005, EP1-BR-001 – EP1-BR-004 |
| I5 | Ilyas can see per-event revenue, expenses, and margin without manual reconciliation | EP1-FIN-005 |

#### 4. Business problems — reduction acceptance (must be noticeably reduced)

| Priority | Problem | Accept when… |
|----------|---------|--------------|
| P1 | Zakir dependency for visibility/coordination | Ilyas no longer needs Zakir for every event status update |
| P2 | No single source of truth | Customer, status, prep, payments, and tasks live on one event record |
| P3 | Manual re-entry between systems | Lead → quote → event flows without duplicate copying |
| P4 | No event profitability visibility | Margin visible per event before/at completion, not calculated offline after |
| P5 | Missed operational preparation steps | Packing, inventory, vendor, and execution tasks tracked in structured workflows |

#### 5. Must-pass workflows (minimum operational cycle)

| Priority | Workflow | Business pass condition |
|----------|----------|-------------------------|
| W1 | Approved Booking → Event Execution | Advance confirmed → **Approved** → workspace created → prep, staff, execution tracked in Event OS |
| W2 | Event Preparation → Inventory Movement | Checklist generated → items tracked through planned → picked → packed → loaded → at venue → returned → ready |
| W3 | Event → Vendor Procurement | Requirements identified → request → confirmation → delivery/completion → payment tracked |
| W4 | Customer Payment → Financial Completion | Advance/balance recorded with proofs → expenses tracked → profitability visible → financial review before **Completed** |
| W5 | Lead → Booking | Enquiry captured with source → follow-up tracked → approved event created without duplicate entry |

*Human approval gates apply throughout per `EP1-AUT-001`, `EP1-AUT-005` — workflows pass with human decisions, not auto-execution.*

#### 6. Phase 1 UAT constraints (founder-validated)

| Constraint | UAT implication |
|------------|-----------------|
| WhatsApp continues in Phase 1 | UAT does **not** require replacing WhatsApp as a communication channel |
| Event OS = source of truth | Status, tasks, approvals, and tracking must be authoritative in Event OS even if coordination happens on WhatsApp |
| Lead workflow = extend | W5 passes when lead → booking flows without duplicate entry; rebuilding LM sales core is **not** the UAT bar (`EP1-SAL-003` reuse/extend) |

#### 7. UAT sign-off checklist

| Item | Status |
|------|--------|
| Primary success statement (Q1) | **Captured** |
| Zakir capabilities (Q2) | **Captured** |
| Ilyas visibility/control (Q3) | **Captured** |
| Problems to reduce (Q4) | **Captured** |
| Must-pass workflows (Q5) | **Captured** |
| Zakir validation (Q6) | **Confirmed** — Z1–Z5 and W1–W5 realistic; no major gaps |
| Joint founder UAT approval (Q7) | **Approved** |
| Joint founder document approval (Q7) | **Approved** |

**Go-live rule:** Phase 1 is accepted when **all** criteria in §2–§5 are demonstrated on real We Decor events during business UAT, and both founders approve execution results at go-live.

**Development handoff rule (Q7):** No additional Phase 1 capabilities without the documented **Scope Change Rule** (Scope Freeze section).

---

### Interview capture status

| Criterion | Status |
|-----------|--------|
| Primary success definition | **Captured (UAT Q1)** |
| Zakir operational capabilities | **Captured (UAT Q2)** |
| Ilyas visibility and control | **Captured (UAT Q3)** |
| Business problems reduced | **Captured (UAT Q4)** |
| Workflow success definitions | **Captured (UAT Q5)** |
| Zakir operational validation | **Confirmed (UAT Q6)** |
| Joint founder sign-off | **Approved (UAT Q7)** |

#### UAT Q7 — Joint founder sign-off

**Question:** Do Ilyas and Zakir jointly approve this document as the Phase 1 business baseline for development handoff?

**Review package:**

| # | Item | Reference |
|---|------|-----------|
| 1 | **Phase 1 goal** | Reduce dependency on Zakir; single source of truth for event planning, execution, and tracking |
| 2 | **Scope** | Committed Phase 1 capabilities only (Scope Freeze + 59 EP1 IDs) |
| 3 | **Guardrails** | No auto-execution (`EP1-AUT-001`); human approval for business decisions (`EP1-AUT-005`); WhatsApp continues — Event OS is source of truth for status/tasks/approvals |
| 4 | **UAT acceptance** | Z1–Z5 · I1–I5 · P1–P5 · W1–W5 (consolidated §10) |
| 5 | **Traceability** | Integrity check **PASS** |
| 6 | **Scope boundary** | Doc `20` / deferred items excluded |

**Answer:**

> **Approved.** The Phase 1 business baseline is approved for development handoff.

**Approved scope:**

- Phase 1 goal
- 59 EP1 requirement IDs
- Scope Freeze
- UAT success criteria
- Traceability model
- Human approval guardrails
- WhatsApp continuation with Event OS as source of truth

**Constraint:** No additional capabilities should be added to Phase 1 without following the documented **Scope Change Rule**.

| Founder | Sign-off | Date |
|---------|----------|------|
| Ilyas | **Approved** | 2026-07-08 |
| Zakir | **Approved** | 2026-07-08 |
| **Joint status** | **Approved for development handoff** | 2026-07-08 |

---

## 11. Dependencies & Prerequisites

| Dependency | Document |
|------------|----------|
| Current systems baseline | `18-technology-systems-landscape.md` |
| Staffing model | `06-staff-management.md` v1.0 |
| Business rules guardrails | `14-business-rules.md` |
| Engineering module design | `/docs/06-module-design.md` |
| Engineering roadmap | `/docs/11-roadmap.md` |

---

## Engineering Handoff Validation

*Purpose:* Validate that engineering documentation can implement the **approved** Phase 1 business baseline (`19-event-os-phase1-requirements.md` v0.1, approved 2026-07-08). This section maps EP1 requirements to engineering destinations. It does **not** change business requirements, write code, or redesign architecture.

**Validation date:** 2026-07-08  
**Engineering sources reviewed:** `/docs/06-module-design.md`, `/docs/11-roadmap.md`, `current-systems/` (lead-management-app, quotation-billing-app, wedecor-website)

### Handoff status

| Check | Result |
|-------|--------|
| All 59 EP1 IDs have a proposed engineering destination | **Yes** — see mapping below |
| Engineering roadmap Phase 1 matches business Phase 1 scope | **No** — **realignment required** (see scope risks) |
| Reuse/extend decisions align with capability matrix | **Yes** — with noted engineering gaps |
| Engineering items within approved business boundary | **Mostly** — roadmap items listed as out-of-scope risks |

**Action for engineering:** Update `/docs/11-roadmap.md` and refine `/docs/06-module-design.md` feature notes to reflect **business Phase 1** (this document) — not the pre-approval engineering phase split. Business baseline is authoritative.

---

### EP1 → Engineering destination map

*Posture from capability matrix: **Reuse** · **Extend** · **Integrate** · **New build***

#### Platform (cross-cutting)

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-AUT-001 | Recommendation-only policy | Platform policy layer | Automation guardrails | Enforce in all modules; no auto-execute orchestration |
| EP1-AUT-005 | Mandatory human-approval gates | Auth + Notification + domain modules | Approval workflow hooks | Gate customer comms, vendor actions, staff assign, pricing, execution |
| EP1-AUT-006 | Unified event record | Lead → Quotation → **Booking** (event hub) | Event lifecycle chain | **New build** linkage; migrate from LM+QB disconnect |
| EP1-BR-004 | Provisional warn/recommend only | Cross-cutting rules engine | Soft rules | Warn only; never auto-enforce |
| EP1-STF-003 | Movement permissions | **Auth** + Staff | RBAC / scoped permissions | **New build** — location/action permissions (pattern from reference ERP only) |

#### CRM + Customer + Support

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-CUS-001 | Unified customer profile | **CRM** + Lead | Client identity | **Extend** — unify LM enquiry + QB customer catalog |
| EP1-CUS-002 / EP1-SUP-001 | Communication timeline | **CRM** | `client_interactions` / event timeline | **New build** — per-event timeline (not WhatsApp replacement) |
| EP1-CUS-003 / EP1-SUP-003 | Review request tracking | **Lead** + Notification | Review-request flow | **Reuse** — port LM WhatsApp review-request pattern |
| EP1-CUS-004 / EP1-SUP-002 | Issue notes | **CRM** or Booking adjunct | Lightweight issue notes | **New build** — not full ticketing |

#### Lead + Sales (`current-systems/lead-management-app`)

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-SAL-001 | Lead capture | **Lead** + website integrate | Intake endpoints | **Extend** LM; **Integrate** `wedecor-website` contact → persisted lead |
| EP1-SAL-002 | Lead source taxonomy | **Lead** + Marketing attribution | Source enum / analytics | **Extend** LM source dropdown + unify channels |
| EP1-SAL-003 | Pipeline / status | **Lead** | Stage machine + kanban | **Reuse** LM workflow; **Extend** hard blocks |
| EP1-SAL-004 | Lead assignment | **Lead** + Notification | Assignment + FCM | **Reuse** LM `assignedTo` + notifications |
| EP1-SAL-005 | Structured follow-ups | **Lead** | Follow-up entity | **Extend** beyond LM notes/reminders |
| EP1-SAL-006 | Sales notifications | **Notification** + Lead | Domain notifications | **Reuse** LM model; **Extend** approval gates |

#### Quotation + Finance (`current-systems/quotation-billing-app`)

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-FIN-001 | Event-linked quotations | **Quotation** | Line items + PDF | **Extend** QB capability into Event OS; parallel-run QB until cutover |
| EP1-FIN-002 | Event-linked billing/invoices | **Finance** (Invoicing) | Invoice lifecycle | **Extend** QB PDF patterns; **Replace later** offline QB |
| EP1-FIN-003 | Customer payments + proofs | **Finance** (Payments) + **File** | Payment records + attachments | **Extend** LM payment fields; **New build** proof storage |
| EP1-FIN-004 | Vendor expenses per event | **Finance** (Expenses) | Event expense lines | **New build** — roadmap currently Phase 3 |
| EP1-FIN-005 | Event profitability view | **Finance** + **BI** | Per-event P&L | **New build** — roadmap currently Phase 3/5 |
| EP1-BR-001 | Advance before Approved | **Lead** + Finance rules | Hard block | **New build** enforcement |
| EP1-BR-002 | Financial review before Completed | **Booking** + Finance rules | Hard block | **New build** enforcement |

#### Operations + Event workspace

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-OPS-001 / EP1-AUT-002 | Event ops workspace at Approved | **Booking** (event workspace) | Ops workspace | **New build** — not generic booking-only in `06` today |
| EP1-OPS-003 | Execution checklists | **Task** | Event-linked checklists | **New build** — extend Task beyond generic CRUD |
| EP1-OPS-004 | Execution stage tracking | **Booking** + Task | Prep/load/venue states | **New build** — beyond LM pipeline status |
| EP1-OPS-005 | Calendar + ops milestones | **Calendar** | Event dates + milestones | **Reuse** LM calendar; **Extend** ops milestones |
| EP1-BR-003 | Execution ownership hard block | **Booking** + Staff | Execution owner field | **Extend** + hard block |

#### Staff

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-STF-001 | Staff master | **Staff** | Staff profiles | **New build** — roadmap currently Phase 2 |
| EP1-STF-002 / EP1-AUT-004 | Staff assignment recommendations | **Staff** + Task + AI (suggest only) | Recommendation UI | **New build** — Zakir approves; no auto-dispatch |

#### Vendor + Procurement

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-VEN-001 | Vendor master | **Vendor** | Vendor directory | **New build** — `06` has directory; add preferred/status |
| EP1-VEN-002 | Per-event procurement | **Vendor** | Procurement lines | **New build** — not rate-card assignment only |
| EP1-VEN-003 | Procurement confirmation workflow | **Vendor** | PO state machine | **New build** — Planned→Requested→Confirmed→Delivered |
| EP1-VEN-004 | Vendor payments | **Finance** + Vendor | Payables + proofs | **New build** |
| EP1-VEN-005 | Cost variance flag | **Vendor** + Finance | Variance + reason codes | **New build** |
| EP1-VEN-006 | Vendor issue notes | **Vendor** | Lightweight notes | **New build** |

#### Inventory + movement

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-INV-001 | Inventory master | **Inventory** | Item taxonomy | **New build** — reusable/consumable/per-event |
| EP1-INV-002 | Stock at JP Nagar | **Inventory** | Location quantity | **New build** — ledger pattern from reference only |
| EP1-INV-003 | Movement states | **Inventory** | Event movement FSM | **New build** — not allocation-only model in `06` |
| EP1-INV-004 / EP1-AUT-003 | Packing lists | **Inventory** + Task | Checklist generation | **New build** — human-reviewed generation |
| EP1-INV-005 | Returns + Cleaned/Ready | **Inventory** | Returns workflow | **New build** |
| EP1-INV-006 | Damage/loss tracking | **Inventory** | Accountability notes | **New build** |
| EP1-INV-007 | Inventory photos | **Inventory** + **File** | Item/movement photos | **New build** |

#### Marketing + KPIs + Website

| EP1 ID | Business requirement | Engineering module | Feature area | Implementation plan |
|--------|-------------------|-------------------|--------------|---------------------|
| EP1-MKT-001 / EP1-KPI-005 | Lead source dashboard | **BI** + Lead | Acquisition analytics | **Extend** LM analytics into founder dashboard |
| EP1-MKT-002 | Conversion funnel by source | **BI** + Lead | Funnel widgets | **Extend** — not full Marketing module |
| EP1-MKT-003 | Content library | **File** + Booking adjunct | Event-linked media | **New build** — not full CMS module |
| EP1-MKT-004 | Website SEO + lead integration | `wedecor-website` + **Lead** | Public intake API | **Integrate** — keep SEO site; persist leads to Event OS |
| EP1-KPI-001 – EP1-KPI-004 | Founder KPI metrics | **BI** | Dashboard widgets | **Extend** — gross margin **New** vs LM KPIs |
| EP1-KPI-006 | Weekly review cadence | **BI** | Review workflow | **Extend** — cadence support |
| EP1-KPI-007 | Selective targets | **BI** | Target fields | **Extend** — values TBD by founders |

---

### Requirements covered

| Category | EP1 count | Engineering destination | Posture summary |
|----------|-----------|-------------------------|-----------------|
| Sales | 6 | Lead, Notification, website integrate | Reuse/Extend/Integrate |
| Customer + Support | 4 (+3 aliases) | CRM, Lead | Reuse + New build |
| Finance | 5 (+2 BR) | Quotation, Finance, File | Extend + New build |
| Operations | 4 (+1 BR) | Booking, Task, Calendar | New build + Reuse |
| Staff | 3 | Staff, Auth | New build |
| Vendor | 6 | Vendor, Finance | New build |
| Inventory | 7 | Inventory, File, Task | New build |
| Marketing + KPIs | 11 | BI, Lead, File, website | Extend + New build |
| Automation + platform | 6 | Cross-cutting, Booking hub | New build + policy |
| **Total** | **59 IDs** | **All mapped** | 4 Reuse · 14 Extend · 2 Integrate · 30 New build |

**Must-pass UAT workflows (W1–W5)** engineering spine:

| Workflow | Primary engineering modules |
|----------|----------------------------|
| W1 Approved → Execution | Lead, Booking (workspace), Task, Staff |
| W2 Inventory movement | Inventory, Task |
| W3 Vendor procurement | Vendor, Finance |
| W4 Payment → completion | Finance, Booking rules |
| W5 Lead → Booking | Lead, Quotation, CRM — **extend LM**, not greenfield CRM |

---

### Requirements needing module mapping (gaps in `06-module-design.md`)

These EP1 requirements have a **proposed** destination but **`06-module-design.md` does not yet describe the feature area** at business-required depth. Engineering must extend module specs — without changing business scope:

| EP1 ID(s) | Gap in `06-module-design.md` | Proposed module | Notes |
|-----------|------------------------------|-----------------|-------|
| EP1-OPS-001, EP1-AUT-002 | No **event operations workspace** concept | Booking | Today: booking lifecycle only; business needs ops hub at Approved |
| EP1-OPS-004 | No **execution stage** model (prep/load/venue) | Booking + Task | Beyond pipeline status |
| EP1-INV-003, EP1-INV-005 | **Movement state machine** vs allocation-only | Inventory | Borrow ledger pattern only (`18` audit) |
| EP1-VEN-002, EP1-VEN-003 | **Procurement workflow** vs vendor assignment | Vendor | Business needs per-event PO timeline |
| EP1-CUS-002 | **Per-event communication timeline** | CRM | `logInteraction()` exists; event-scoped timeline not defined |
| EP1-AUT-005, EP1-STF-003 | **Approval gates** + movement permissions | Auth + platform | RBAC exists; domain-scoped permissions not defined |
| EP1-FIN-004, EP1-FIN-005 | **Event expenses + profitability** in Finance module | Finance | Module exists; event P&L not in Phase 1 engineering roadmap |
| EP1-KPI-001 – EP1-KPI-007 | **Founder dashboard** (5 KPIs) | BI | BI module marked Phase Intelligence in `06` |
| EP1-MKT-003 | **Event-linked content library** | File (+ adjunct) | CMS module is Growth — business needs lighter library only |

---

### Potential scope risks

#### Risk 1 — Engineering roadmap under-scopes business Phase 1 (HIGH)

`/docs/11-roadmap.md` **Phase 1 Foundation** delivers CRM, Lead, Quotation, Booking, Calendar, Task only. **Approved business Phase 1** also requires:

| Business area | EP1 examples | Engineering roadmap today | Risk |
|---------------|--------------|---------------------------|------|
| Staff | EP1-STF-001 – 003 | Phase 2 Operations | **Schedule mismatch** |
| Vendor / procurement | EP1-VEN-001 – 006 | Phase 2 | **Schedule mismatch** |
| Inventory movement | EP1-INV-001 – 007 | Phase 2 | **Schedule mismatch** |
| Event profitability | EP1-FIN-004, 005, KPI-004 | Phase 3 Finance / Phase 5 BI | **Schedule mismatch** |
| Founder KPI dashboard | EP1-KPI-001 – 007 | Phase 5 BI | **Schedule mismatch** |
| Content library | EP1-MKT-003 | Phase 4 Growth CMS | **Scope mismatch** |

**Mitigation:** Realign `/docs/11-roadmap.md` **We Decor Phase 1** to match `19` approved scope. Do **not** add business capabilities — reschedule engineering phases only.

#### Risk 2 — Engineering roadmap over-scopes business Phase 1 (MEDIUM)

| Engineering item (`11-roadmap.md`) | Business Phase 1 | Risk |
|-----------------------------------|------------------|------|
| Quotation **approve/reject** workflow (P0) | Manual WhatsApp OK (`04`); structured approval **not committed** | Building mandatory customer approval portal exceeds scope |
| **AI (Basic)** P2 quote/message | `EP1-AUT-001` — AI **not** Phase 1 core | Optional suggestions only if time; not UAT bar |
| **Tenant** module P0 (multi-tenant patterns) | Single-tenant We Decor first (`20` deferred) | Over-engineering tenant isolation for Phase 1 |
| **WhatsApp** module (Phase 5) | WhatsApp continues externally; Event OS = source of truth | Replacing WhatsApp exceeds scope |
| Marketing / Instagram / CMS / SEO modules (Phase 4) | Only KPI funnel + content library + website integrate | Full growth modules exceed scope |

**Mitigation:** Mark above as deferred or minimal implementation. Business UAT does not require them.

#### Risk 3 — Terminology mismatch (LOW)

| Engineering term | Business term | Resolution |
|------------------|---------------|------------|
| Booking | Event / event workspace | Map Booking module to unified **event record** hub (`EP1-AUT-006`) |
| Client | Customer | CRM Client = business Customer |
| Task | Execution checklist / packing list | Task module carries checklist workflows |

#### Risk 4 — Legacy cutover (MEDIUM)

| System | Risk | Mitigation per `19` |
|--------|------|---------------------|
| `lead-management-app` | Rebuilding sales core | **Reuse/extend** — W5 UAT bar |
| `quotation-billing-app` | Big-bang billing migration | **Parallel-run** until Event OS billing stable |
| `wedecor-website` | Replacing SEO site | **Integrate** lead capture only; site continues |

---

### Existing system reuse points

| Current system | Repo | Reuse in Event OS engineering | EP1 IDs | Do not |
|----------------|------|------------------------------|---------|--------|
| **Lead Management Application** | `current-systems/lead-management-app` | Pipeline, kanban, calendar, assignment, FCM notifications, lead-source analytics, review-request flow | EP1-SAL-003, 004, 006; EP1-CUS-003; EP1-MKT-001 (partial); W5 | Rebuild sales CRM from scratch |
| **Quotation/Billing Application** | `current-systems/quotation-billing-app` | GST line items, quote/invoice PDF generation, offline catalog patterns (migrate) | EP1-FIN-001, 002 | Treat QB as long-term system of record |
| **We Decor Website** | `current-systems/wedecor-website` | SEO surface, contact API → Event OS lead endpoint | EP1-SAL-001, EP1-MKT-004 | Require server-side lead persistence in Next.js alone |
| **Reference only** | `reference-systems/crm-system` | Patterns: lead→booking chain, notifications — **not** dispatch/AMC/auto-orchestration | — | Copy AC Platform automation |
| **Reference only** | `reference-systems/inventory-system` | Ledger/location quantity patterns only | EP1-INV-002 | Copy POS/GST/e-invoice stack |

---

### New build areas (confirmed greenfield vs current-systems)

| Area | EP1 IDs | Engineering module(s) | Confirmed new build |
|------|---------|----------------------|---------------------|
| Event operations workspace | EP1-OPS-001 | Booking | Yes |
| Operations / execution workflows | EP1-OPS-003, 004 | Task, Booking | Yes |
| Inventory movement states | EP1-INV-003 – 007 | Inventory, File | Yes |
| Vendor procurement | EP1-VEN-001 – 006 | Vendor, Finance | Yes |
| Event profitability | EP1-FIN-004, 005, KPI-004 | Finance, BI | Yes |
| Communication timeline | EP1-CUS-002 | CRM | Yes |
| Unified event record | EP1-AUT-006 | Lead→Quotation→Booking chain | Yes (linkage) |
| Approval / rules enforcement | EP1-BR-001 – 004, EP1-AUT-005 | Cross-cutting | Yes (policy enforcement) |

---

### Handoff checklist

| Item | Status |
|------|--------|
| Business baseline approved (`19`) | **Done** |
| EP1 → module mapping documented | **Done** (this section) |
| `11-roadmap.md` realigned to business Phase 1 | **Pending** — engineering action |
| `06-module-design.md` feature gaps addressed | **Pending** — engineering action |
| Engineering success criteria aligned to UAT Z/I/P/W | **Pending** — engineering action |
| Legacy system cutover plan (LM, QB, WEB) | **Pending** — engineering action |

**Authoritative business reference:** `docs/business/19-event-os-phase1-requirements.md`  
**Scope change rule:** Any new capability requires business Scope Change Rule — not engineering roadmap edits alone.

---

## 12. Traceability Matrix

| Requirement ID | Description | Source doc | Status |
|----------------|-------------|------------|--------|
| EP1-SAL-001 | Lead capture across channels | `03`, `04`, `10`, `18` | Committed |
| EP1-SAL-002 | Lead source tracking with consistent taxonomy | `04`, `10`, `15` | Committed |
| EP1-SAL-003 | Sales pipeline / status workflow | `04`, `18` | Committed |
| EP1-SAL-004 | Lead assignment with notifications | `04`, `06` | Committed |
| EP1-SAL-005 | Structured follow-ups per enquiry | `04`, `18` | Committed |
| EP1-SAL-006 | Sales notifications with approval guardrails | `04`, `17`, `18` | Committed |
| EP1-CUS-001 | Unified customer profile | `03`, `18` | Committed |
| EP1-CUS-002 | Communication timeline per event | `12`, `18` | Committed |
| EP1-CUS-003 | Review request tracking / WhatsApp flow | `12`, `18` | Committed |
| EP1-CUS-004 | Lightweight issue notes per event | `12` | Committed |
| EP1-FIN-001 | Event-linked quotations with line items | `04`, `07`, `18` | Committed |
| EP1-FIN-002 | Event-linked billing / invoices | `09`, `18` | Committed |
| EP1-FIN-003 | Customer payments with proof attachments | `09`, `14`, `18` | Committed |
| EP1-FIN-004 | Vendor expenses per event | `07`, `09` | Committed |
| EP1-FIN-005 | Event profitability view | `09`, `15`, `16` | Committed |
| EP1-OPS-001 | Event operations workspace at Approved | `05`, `17`, `18` | Committed |
| EP1-OPS-003 | Event-linked execution checklists | `05`, `13`, `18` | Committed |
| EP1-OPS-004 | Execution stage tracking | `05`, `18` | Committed |
| EP1-OPS-005 | Calendar / event dates with ops milestones | `05`, `18` | Committed |
| EP1-STF-001 | Staff master | `06`, `18` | Committed |
| EP1-STF-002 | Staff assignment recommendations | `06`, `17` | Committed |
| EP1-STF-003 | Movement permissions | `06`, `07`, `08`, `09`, `18` | Committed |
| EP1-VEN-001 | Vendor master | `07`, `18` | Committed |
| EP1-VEN-002 | Per-event procurement | `07`, `18` | Committed |
| EP1-VEN-003 | Procurement confirmation workflow | `07` | Committed |
| EP1-VEN-004 | Vendor payment tracking | `07`, `09` | Committed |
| EP1-VEN-005 | Cost variance flag + reason codes | `07` | Committed |
| EP1-VEN-006 | Vendor issue notes | `07` | Committed |
| EP1-INV-001 | Inventory master | `08`, `18` | Committed |
| EP1-INV-002 | Stock quantity at JP Nagar | `08`, `18` | Committed |
| EP1-INV-003 | Event stock movement states | `08`, `18` | Committed |
| EP1-INV-004 | Event packing lists | `08`, `17` | Committed |
| EP1-INV-005 | Returns + Cleaned/Ready workflow | `08` | Committed |
| EP1-INV-006 | Damage / loss tracking | `08` | Committed |
| EP1-INV-007 | Inventory photos | `08` | Committed |
| EP1-MKT-001 | Lead source dashboard | `10`, `15`, `18` | Committed |
| EP1-MKT-002 | Conversion funnel by source | `10`, `15` | Committed |
| EP1-MKT-003 | Event-linked content library | `11`, `18` | Committed |
| EP1-MKT-004 | Website SEO + lead integration | `10`, `18` | Committed |
| EP1-SUP-001 | Communication timeline (alias → EP1-CUS-002) | `12` | Committed |
| EP1-SUP-002 | Issue notes (alias → EP1-CUS-004) | `12` | Committed |
| EP1-SUP-003 | Review request tracking (alias → EP1-CUS-003) | `12` | Committed |
| EP1-AUT-001 | Recommendation-only policy | `17`, `14` | Committed |
| EP1-AUT-002 | Workspace automation at Approved | `17` | Committed |
| EP1-AUT-003 | Packing checklist generation | `17` | Committed |
| EP1-AUT-004 | Staff assignment recommendations | `17` | Committed |
| EP1-AUT-005 | Mandatory human-approval gates | `17`, `14` | Committed |
| EP1-AUT-006 | Unified event record | `16`, `18` | Committed |
| EP1-KPI-001 | Total enquiries | `15` | Committed |
| EP1-KPI-002 | Conversion rate | `15` | Committed |
| EP1-KPI-003 | Events completed | `15` | Committed |
| EP1-KPI-004 | Event gross margin | `15` | Committed |
| EP1-KPI-005 | Lead source performance | `15` | Committed |
| EP1-KPI-006 | Weekly review cadence | `15` | Committed |
| EP1-KPI-007 | Selective target support | `15` | Committed |
| EP1-BR-001 | Advance before Approved (hard block) | `14`, `18` | Committed |
| EP1-BR-002 | Financial review before Completed (hard block) | `14`, `18` | Committed |
| EP1-BR-003 | Execution ownership before execution (hard block) | `05`, `14` | Committed |
| EP1-BR-004 | Provisional rules: warn/recommend only | `14` | Committed |

*See **Traceability Index** for module ranges and cross-module aliases.*

---

## Traceability Integrity Check

*Performed: 2026-07-08. Purpose: Final validation that Phase 1 requirements are uniquely identifiable, consistent across sections, and scope-controlled.*

### Status

**PASS**

Phase 1 requirements are fully traceable and scope-controlled.

### Checks performed

| Check | Result | Evidence |
|-------|--------|----------|
| **ID completeness** | **PASS** | Every committed capability in Scope Freeze has an `EP1-{MOD}-###` ID. Scope Freeze and §12 each list the same **59** IDs. §3 carries module prefixes; Traceability Index enumerates full ranges. |
| **ID uniqueness** | **PASS** | No duplicate rows in §12. Matrix no longer repeats `EP1-FIN-003` on two rows (payments + proofs merged under one ID). `EP1-OPS-002` intentionally unused (ownership = `EP1-BR-003`). |
| **Alias validity** | **PASS** | True aliases (`EP1-SUP-001`–`003`) resolve to `EP1-CUS-002`, `EP1-CUS-004`, `EP1-CUS-003` — all present in Scope Freeze and §12. Dual-view pairs (`AUT`↔`OPS`/`INV`/`STF`, `MKT-001`↔`KPI-005`) document related committed IDs on both sides. |
| **Section consistency** | **PASS** | §4 matrix IDs align with Scope Freeze for all committed rows. §5 includes validation→ID mapping. §6 references `EP1-AUT-001`–`005`. §7 references `EP1-BR-001`–`004`. §8 references `EP1-KPI-001`–`007`. §12 matches Scope Freeze set equality. |
| **Scope boundary** | **PASS** | Deferred / Not Phase 1 matrix rows use `—` (no ID): customer quote approval, AI assistance core, RBAC extension, multi-tenant SaaS. §9 Out of Scope and Explicitly Not Included carry **zero** `EP1` IDs. Doc `20` SaaS topics remain outside Phase 1. Traceability work did not add new capabilities. |

### Numbered inventory (committed IDs)

| Module | IDs | Count |
|--------|-----|-------|
| Sales | EP1-SAL-001 – EP1-SAL-006 | 6 |
| Customer | EP1-CUS-001 – EP1-CUS-004 | 4 |
| Finance | EP1-FIN-001 – EP1-FIN-005 | 5 |
| Operations | EP1-OPS-001, EP1-OPS-003 – EP1-OPS-005 | 4 |
| Staff | EP1-STF-001 – EP1-STF-003 | 3 |
| Vendor | EP1-VEN-001 – EP1-VEN-006 | 6 |
| Inventory | EP1-INV-001 – EP1-INV-007 | 7 |
| Marketing | EP1-MKT-001 – EP1-MKT-004 | 4 |
| Support | EP1-SUP-001 – EP1-SUP-003 | 3 |
| Automation | EP1-AUT-001 – EP1-AUT-006 | 6 |
| KPIs | EP1-KPI-001 – EP1-KPI-007 | 7 |
| Business Rules | EP1-BR-001 – EP1-BR-004 | 4 |
| **Total** | | **59** |

### Defects found and corrected during this check

1. Matrix had two rows sharing **EP1-FIN-003** (payments vs proofs) — merged into one committed row.
2. Matrix omitted discrete rows for **EP1-KPI-006**, **EP1-KPI-007**, **EP1-BR-004** — added (no scope change; already in Scope Freeze).
3. Traceability Index overstated Operations range (`001–005` / count 5) — corrected to 4 IDs with **EP1-OPS-002** unused.
4. Alias table mixed true aliases with dual-view IDs — separated and documented.
5. §5 lacked ID mapping — added validation→committed ID table.

---

## 13. Current State (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Document status | **Approved for development handoff** (Ilyas + Zakir, 2026-07-08) |
| Phase 1 goal | Reduce Zakir operational dependency; unified event lifecycle + visibility |
| Build posture | 4 Reuse · 14 Extend · 2 Integrate · 30 New build · 2 Replace later |
| Traceability | 59 committed IDs; integrity check **PASS** |

---

## 14. Future Vision (Consolidated Snapshot)

Approved Phase 1 requirements → We Decor UAT → production daily operations on Event OS.

---

## 15. Document Status

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | **Approved** |
| **Approval** | **Approved** — Ilyas + Zakir (2026-07-08) |
| **Interview status** | UAT Q1–Q7 **Complete** |
| **Capability matrix** | **Captured (2026-07-08)** — cross-repo audit vs Business Bible |
| **Scope freeze** | **Approved (2026-07-08)** — committed vs deferred boundary |
| **Traceability IDs** | **Assigned (2026-07-08)** — EP1-{MOD}-### scheme; 59 IDs (see Traceability Index) |
| **Traceability integrity** | **PASS (2026-07-08)** |
| **UAT success criteria** | **Approved (2026-07-08)** — Q1–Q7; Zakir validated |
| **Development handoff** | **Approved (2026-07-08)** — Engineering Handoff Validation documented |
| **Next step** | Realign `/docs/11-roadmap.md` and `/docs/06-module-design.md` to approved Phase 1; Doc `20` when ready |

**Next document:** [20-saas-evolution-plan.md](./20-saas-evolution-plan.md)
