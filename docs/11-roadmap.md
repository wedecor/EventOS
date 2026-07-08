# Product Roadmap

## Purpose of This Document

This document defines the phased delivery plan for Event OS. Each phase has clear goals, deliverables, success criteria, and dependencies. Phases are sequential—each builds on the previous.

**Business baseline (authoritative for We Decor Phase 1):** [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) — approved 2026-07-08 (Ilyas + Zakir).

---

## Phase 1 Roadmap Alignment Notes

### Previous roadmap mismatch identified

The pre-approval roadmap split We Decor delivery across engineering **Phases 1–5** in a way that **did not match** the approved business Phase 1 scope:

| Area | Previous engineering placement | Approved business Phase 1 (`19`) |
|------|-------------------------------|--------------------------------|
| Staff, Vendor, Inventory | Phase 2 Operations | **Phase 1** (EP1-STF, EP1-VEN, EP1-INV) |
| Payments, expenses, profitability | Phase 3 Finance | **Phase 1** (EP1-FIN-003 – 005) |
| Founder KPI dashboard | Phase 5 Intelligence (BI) | **Phase 1** (EP1-KPI-001 – 007) |
| Event ops workspace, execution stages | Not explicit | **Phase 1** (EP1-OPS-001 – 004) |
| Structured quote approval portal | Phase 1 P0 | **Deferred** — manual WhatsApp OK |
| AI (Basic) | Phase 1 P2 | **Deferred** — not Phase 1 core |
| Multi-tenant Tenant module | Phase 1 P0 | **Deferred** — single-tenant We Decor first |
| Full WhatsApp / CMS / Marketing | Phases 4–5 | **Deferred** — integrate/extend only in Phase 1 |

### Corrections applied

1. **Phase 1** now reflects the full **approved business Phase 1** scope (59 EP1 IDs, UAT W1–W5).
2. **Staff, Vendor, Inventory, Finance, BI/KPIs, and operations workspace** moved **into Phase 1**.
3. **Structured quote approval, AI automation, multi-tenant SaaS, WhatsApp replacement, full CMS/marketing** moved **out of Phase 1**.
4. **Transitional integrations** documented for Lead Management App, Quotation/Billing App, and Website.
5. **Success criteria** aligned to business UAT (Z/I/P/W) in Doc `19` §10 — not pre-approval engineering-only criteria.
6. **Phase 1 timeline** marked for **re-estimation** — approved scope exceeds original 12-week Foundation plan.

### Business baseline used

`docs/business/19-event-os-phase1-requirements.md` (v0.1, approved for development handoff 2026-07-08)

*Scope changes to Phase 1 require the documented **Scope Change Rule** in Doc `19` — not roadmap edits alone.*

---

## Roadmap Overview

```
2026 Q3–Q4       2027 Q1          2027 Q2          2027 H2          2028+
├────────────────├────────────────├────────────────├────────────────├──────────
│  PHASE 1       │  PHASE 2       │  PHASE 3       │  PHASE 4       │  PHASE 5
│  We Decor      │  Operations    │  Finance       │  Growth        │  Intelligence
│  Phase 1       │  Enhancements  │  Depth         │  Platform      │  & SaaS
│  (Approved     │                │                │                │
│   Business     │                │                │                │
│   Scope)       │                │                │                │
│                │                │                │                │
│ Sales/Lead     │ Calendar+      │ Payment        │ Marketing      │ WhatsApp
│ Customer       │ Booking        │ gateway        │ campaigns      │ Advanced AI
│ Finance        │ enhancements   │ Accounting     │ Instagram      │ Full BI
│ Operations     │ Event          │ sync           │ Full CMS       │ Predictive
│ Staff          │ templates      │ Tax/GST depth  │ Client portal  │ automation
│ Vendor         │                │                │ Deep ad        │
│ Inventory      │                │                │ integrations   │ Multi-tenant
│ Marketing*     │                │                │                │ SaaS
│ Support        │                │                │                │
│ Automation     │                │                │                │
│ KPIs           │                │                │                │
│ Platform       │                │                │                │
└────────────────┴────────────────┴────────────────┴────────────────┴──────────
     ▲
     │
  We Decor
  UAT go-live
  (Doc 19)

* Phase 1 Marketing = content library + website lead integration + KPI funnel — not full marketing platform
```

---

## Transitional Integrations (Phase 1)

*Parallel operation during Event OS build and cutover. Source: Doc `19` capability matrix + Engineering Handoff Validation.*

### Lead Management Application (`current-systems/lead-management-app`)

| Approach | Detail |
|----------|--------|
| **Strategy** | **Extend** existing capability — do **not** rebuild sales CRM from scratch |
| **Reuse** | Pipeline/kanban, assignment, FCM notifications, lead-source analytics, review-request flow, calendar |
| **Extend** | Structured follow-ups, unified customer link, hard business blocks, website + channel intake |
| **EP1 refs** | EP1-SAL-001 – 006; EP1-CUS-003; W5 Lead → Booking |
| **Cutover** | Migrate/port proven LM behaviour into Event OS Lead module; run parallel until UAT passes W5 |

### Quotation/Billing Application (`current-systems/quotation-billing-app`)

| Approach | Detail |
|----------|--------|
| **Strategy** | **Parallel operation** during transition; **reuse** quotation/invoice capability |
| **Reuse** | GST line items, quote/invoice PDF generation, offline catalog patterns (migrate into Event OS) |
| **Extend** | Event-linked quotes/billing in unified event record |
| **Replace later** | Offline QB after Event OS billing stabilizes — not long-term system of record |
| **EP1 refs** | EP1-FIN-001, EP1-FIN-002 |
| **Cutover** | Parallel-run QB until Event OS quotation/billing meets FIN UAT; then deprecate manual re-entry |

### We Decor Website (`current-systems/wedecor-website`)

| Approach | Detail |
|----------|--------|
| **Strategy** | **Continue** SEO/site operations; **integrate** lead capture only |
| **Reuse** | Next.js SEO engine, locality/service pages, contact API |
| **Integrate** | Contact form → persisted lead in Event OS (not server-only webhook without persistence) |
| **Do not** | Replace standalone marketing website in Phase 1; do not require full CMS in Event OS |
| **EP1 refs** | EP1-SAL-001, EP1-MKT-004 |
| **Cutover** | Website remains public surface; Event OS becomes system of record for enquiries |

### Communication guardrail (Phase 1)

**WhatsApp continues** for coordination. Event OS is the **source of truth** for event status, tasks, approvals, and tracking — not a full WhatsApp replacement (Doc `19` UAT Q6).

---

## Phase 1: We Decor Phase 1 (Approved Business Scope)

**Timeline:** 2026 Q3–Q4 (*re-estimate required* — scope expanded from original 12-week Foundation plan)  
**Goal:** Deliver the approved Phase 1 business baseline — reduce Zakir dependency via a single source of truth for event planning, execution, and tracking (Doc `19` UAT Q1).  
**Business reference:** EP1-001 – EP1-059 (59 IDs); must-pass workflows W1–W5.

### Phase 1 deliverables by business area

#### Platform

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Auth** | Login, logout, password reset, JWT, role-based access (founders/staff), movement permissions | P0 | EP1-STF-003; extend LM admin/staff model |
| **Notification** | In-app + push notifications; human-approval guardrails on outbound actions | P0 | EP1-SAL-006, EP1-AUT-005 |
| **File** | Upload, storage, signed URLs — payment proofs, inventory photos | P0 | EP1-FIN-003, EP1-INV-007 |
| **Tenant (minimal)** | Single-tenant We Decor configuration only — settings, feature flags | P1 | Not multi-tenant SaaS (deferred) |
| **Rules / policy** | Hard blocks, provisional warn-only, approval gates, no auto-execution | P0 | EP1-BR-001 – 004; EP1-AUT-001, 005 |

#### Sales

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Lead** | Extend LM: lead capture (all channels), source taxonomy, pipeline/status, assignment, structured follow-ups | P0 | EP1-SAL-001 – 006 |
| **Lead → Booking** | Unified event/customer record; lead converts to approved event without duplicate entry | P0 | EP1-AUT-006; W5 |
| **Website integrate** | Persist website enquiries into Event OS | P0 | EP1-SAL-001, EP1-MKT-004 |

#### Customer

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **CRM** | Unified customer profile across lead → quote → event | P0 | EP1-CUS-001 |
| **CRM** | Per-event communication timeline | P0 | EP1-CUS-002, EP1-SUP-001 |
| **CRM** | Lightweight issue notes per event | P0 | EP1-CUS-004, EP1-SUP-002 |
| **Lead/CRM** | Review request tracking (port LM WhatsApp flow) | P0 | EP1-CUS-003, EP1-SUP-003 |

#### Finance

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Quotation** | Event-linked quotations + line items; PDF (reuse QB patterns); parallel-run QB | P0 | EP1-FIN-001 |
| **Finance: Invoicing** | Event-linked billing/invoices | P0 | EP1-FIN-002 |
| **Finance: Payments** | Customer advance/balance lifecycle + proof attachments | P0 | EP1-FIN-003; EP1-BR-001 |
| **Finance: Expenses** | Vendor expenses per event | P0 | EP1-FIN-004 |
| **Finance: Profitability** | Event profitability view (revenue − vendor expenses) | P0 | EP1-FIN-005, EP1-KPI-004 |
| **Finance: Rules** | Financial review before Completed | P0 | EP1-BR-002; W4 |

*Deferred from Phase 1:* structured customer quote approval portal (manual WhatsApp OK); full accounting/GST/tax replacement; payment gateway automation.

#### Operations

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Booking (event workspace)** | Event operations workspace at Approved (human-confirmed) | P0 | EP1-OPS-001, EP1-AUT-002; W1 |
| **Booking** | Execution stage tracking (beyond sales pipeline) | P0 | EP1-OPS-004; W1 |
| **Booking** | Execution ownership + hard block before execution | P0 | EP1-BR-003 |
| **Task** | Event-linked execution checklists (SOP structure) | P0 | EP1-OPS-003; W1 |
| **Task** | Operational task tracking | P0 | W1 |
| **Calendar** | Event dates + ops milestones (extend LM calendar) | P0 | EP1-OPS-005 |

#### Staff

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Staff** | Staff master (aligned to Doc `06` staffing model) | P0 | EP1-STF-001 |
| **Staff** | Staff assignment recommendations — Zakir approves | P0 | EP1-STF-002, EP1-AUT-004; W1 |
| **Auth/Staff** | Movement permissions (procurement/inventory/finance actions) | P0 | EP1-STF-003 |

#### Vendor

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Vendor** | Vendor master (preferred vendors, statuses) | P0 | EP1-VEN-001 |
| **Vendor** | Per-event procurement linked to quote/budget | P0 | EP1-VEN-002; W3 |
| **Vendor** | Procurement confirmation workflow (Planned → Requested → Confirmed → Delivered/Completed) | P0 | EP1-VEN-003; W3 |
| **Vendor** | Vendor payment tracking + optional proofs | P0 | EP1-VEN-004; W3 |
| **Vendor** | Cost variance flag + reason codes | P1 | EP1-VEN-005 |
| **Vendor** | Lightweight vendor issue notes | P1 | EP1-VEN-006 |

#### Inventory

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Inventory** | Inventory master (reusable/consumable/per-event); JP Nagar location | P0 | EP1-INV-001, EP1-INV-002 |
| **Inventory** | Movement states: Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned/Ready | P0 | EP1-INV-003; W2 |
| **Inventory** | Event packing lists (human-reviewed generation) | P0 | EP1-INV-004, EP1-AUT-003; W2 |
| **Inventory** | Returns + Cleaned/Ready workflow | P0 | EP1-INV-005; W2 |
| **Inventory** | Damage/loss tracking + accountability notes | P1 | EP1-INV-006 |
| **Inventory** | Photos on items/movements | P1 | EP1-INV-007 |

#### Marketing (Phase 1 scope only)

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Content library** | Event-linked decor media library | P1 | EP1-MKT-003 |
| **Website** | Continue SEO site; integrate lead capture (see Transitional Integrations) | P0 | EP1-MKT-004 |
| **BI (founder)** | Lead source dashboard + conversion funnel by source | P0 | EP1-MKT-001, EP1-MKT-002, EP1-KPI-005 |

*Deferred from Phase 1:* full CMS, Instagram module, campaign management, deep ad platform integrations, social auto-publishing.

#### Support

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **CRM** | Communication history (timeline) | P0 | EP1-SUP-001 → EP1-CUS-002 |
| **CRM** | Issue notes | P0 | EP1-SUP-002 → EP1-CUS-004 |
| **Lead/CRM** | Review tracking | P0 | EP1-SUP-003 → EP1-CUS-003 |

*Deferred from Phase 1:* full complaint ticketing / call-center workflow.

#### Automation (Phase 1 guardrails)

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **Policy** | Recommendation-only assistance — nothing auto-executes | P0 | EP1-AUT-001 |
| **Booking/Task** | Workspace suggestion at Approved; packing checklist draft; staff recommendations | P0 | EP1-AUT-002 – 004 |
| **Platform** | Mandatory human-approval gates | P0 | EP1-AUT-005 |
| **Platform** | Unified event record (lead → quote → payment → ops → completion) | P0 | EP1-AUT-006 |

*Deferred from Phase 1:* advanced AI automation as core dependency; auto-executing workflows.

#### KPIs

| Module | Features | Priority | EP1 / notes |
|--------|----------|----------|-------------|
| **BI (founder dashboard)** | Total enquiries, conversion rate, events completed, event gross margin, lead source performance | P0 | EP1-KPI-001 – 005 |
| **BI** | Weekly review cadence support | P0 | EP1-KPI-006 |
| **BI** | Selective target support (values TBD by founders) | P1 | EP1-KPI-007 |

### P0 vs P1 vs P2 (Phase 1)

- **P0** — Required for approved Phase 1 UAT go-live (Doc `19` §10 W1–W5, Z1–Z5, I1–I5).
- **P1** — Committed Phase 1 scope with slightly lower UAT criticality (e.g. variance flags, damage tracking, content library).
- **P2** — **Not used for committed Phase 1 scope** — reserved for optional engineering extras only if explicitly approved via Scope Change Rule.

### Suggested delivery sequence (Phase 1)

*Order follows must-pass workflow priority W1→W5 from Doc `19`. Sprints are indicative — timeline requires re-estimation.*

| Sprint block | Focus | Workflows / EP1 themes |
|--------------|-------|----------------------|
| **0** | Scaffold, Auth, File, Notification, single-tenant config | Platform |
| **1** | CRM + Lead extend (LM port), website lead integrate, unified customer | W5, Sales |
| **2** | Quotation + Finance core (QB parallel), payments + proofs, business rules | W4, Finance |
| **3** | Booking event workspace, execution stages, checklists, calendar | W1, Operations |
| **4** | Staff master, assignment recommendations, movement permissions | W1, Staff |
| **5** | Vendor master, procurement workflow, vendor payments | W3, Vendor |
| **6** | Inventory master, movement states, packing lists, returns | W2, Inventory |
| **7** | Profitability view, founder KPI dashboard, automation guardrails | Finance, KPIs, Automation |
| **8** | Content library, polish, legacy cutover, **business UAT** (Doc `19`) | Marketing, cutover |

### Phase 1 success criteria (business UAT)

*Aligned to Doc `19` §10 — business acceptance, not technical test cases.*

**Primary:** Phase 1 succeeds when Event OS reduces Zakir dependency via single source of truth and no missed operational steps.

**Zakir (Z1–Z5):**

- [ ] Approved events + prep status visible in one place
- [ ] Execution via structured checklists (Event OS = source of truth; WhatsApp may continue)
- [ ] Staff + vendor coordination from event workspace
- [ ] Per-event inventory movement tracked through ready states
- [ ] Payment status, expenses, and profitability visible per event

**Ilyas (I1–I5):**

- [ ] Enquiry-to-completion visibility without routine manual updates from Zakir
- [ ] Founder KPIs without manual data collection
- [ ] At-risk events identifiable before escalation
- [ ] Approval-based control on key decisions
- [ ] Per-event profitability without manual reconciliation

**Problems reduced (P1–P5):**

- [ ] Zakir dependency for visibility/coordination noticeably reduced
- [ ] Single source of truth for event information
- [ ] Manual re-entry between systems reduced
- [ ] Event profitability visible per event
- [ ] Operational preparation steps tracked in structured workflows

**Must-pass workflows (W1–W5):**

- [ ] W1 Approved Booking → Event Execution
- [ ] W2 Event Preparation → Inventory Movement
- [ ] W3 Event → Vendor Procurement
- [ ] W4 Customer Payment → Financial Completion
- [ ] W5 Lead → Booking (extend LM — not rebuild)

**Technical milestones (Phase 1):**

- [ ] Modular monolith with business modules required for W1–W5
- [ ] CI pipeline: lint, type-check, test, build
- [ ] Staging + production environments
- [ ] Error tracking and structured logging
- [ ] Legacy parallel-run plan executed (LM, QB, website)

---

## Phase 2: Operations Enhancements

**Timeline:** 2027 Q1 (*tentative*)  
**Goal:** Deepen operations tooling after Phase 1 business UAT go-live.

### Deliverables

| Module | Features | Priority |
|--------|----------|----------|
| **Calendar (Enhanced)** | Staff conflict detection, multi-view (day/week/month) | P1 |
| **Booking (Enhanced)** | Event templates, enhanced status workflows | P1 |
| **Task (Enhanced)** | Reusable event templates, checklist templates library | P1 |
| **Inventory (Enhanced)** | Advanced availability rules, bulk operations | P2 |

### Success Criteria

- [ ] Event templates reduce repetitive setup for recurring event types
- [ ] Calendar conflict warnings support staffing decisions
- [ ] Operations enhancements do not require changes to approved Phase 1 UAT bar

*Note: Core staff, vendor, inventory, and ops workspace capabilities are **Phase 1** — this phase is **enhancement only**.*

---

## Phase 3: Finance Depth

**Timeline:** 2027 Q1–Q2 (*tentative*)  
**Goal:** Extend financial capabilities beyond Phase 1 profitability and payment tracking.

### Deliverables

| Module | Features | Priority |
|--------|----------|----------|
| **Finance: Payment gateway** | Online payment collection (optional) | P1 |
| **Finance: Tax** | Configurable tax rules, GST depth | P1 |
| **Reports** | Extended P&L, receivables, revenue reports beyond founder dashboard | P1 |
| **Integrations** | Accounting software sync | P2 |

### Success Criteria

- [ ] Extended finance reports complement Phase 1 per-event profitability
- [ ] No regression to Phase 1 payment/proof/expense workflows

*Note: Phase 1 already includes invoicing, payments, proofs, expenses, and event profitability (EP1-FIN-001 – 005). This phase adds **depth** — not a replacement for Phase 1 finance scope.*

*Deferred:* full accounting / ERP replacement (Doc `19` explicitly not Phase 1).

---

## Phase 4: Growth Platform

**Timeline:** 2027 Q2 (*tentative*)  
**Goal:** Marketing platform, client-facing digital products, and acquisition depth beyond Phase 1 KPI funnel and content library.

### Deliverables

| Module | Features | Priority |
|--------|----------|----------|
| **Marketing** | Campaign tracking, advanced lead source attribution | P1 |
| **Instagram** | Account connection, post analytics, DM lead capture | P1 |
| **CMS** | Full website page management through Event OS | P1 |
| **SEO** | Meta tags, sitemap, structured data management in Event OS | P2 |
| **Client Portal** | Client login, view quotes, approve bookings, track event | P1 |
| **Ad integrations** | Deep ad platform → revenue attribution | P2 |

### Success Criteria

- [ ] Growth modules extend — do not replace — Phase 1 website integrate and KPI funnel
- [ ] Client portal optional; manual WhatsApp quote approval remains valid until portal explicitly approved for scope

*Deferred from Phase 1:* full CMS/marketing platform, deep ad integrations, structured customer quote approval portal, Instagram automation.

---

## Phase 5: Intelligence & Automation

**Timeline:** 2027 H2 (*tentative*)  
**Goal:** Advanced AI, messaging automation, and full BI beyond Phase 1 founder dashboard.

### Deliverables

| Module | Features | Priority |
|--------|----------|----------|
| **WhatsApp** | Business API integration, automated responses, templates | P1 |
| **AI (Advanced)** | Lead scoring, schedule optimization, margin analysis | P1 |
| **BI (Full)** | Custom dashboards, ad-hoc widgets, scheduled reports beyond Phase 1 KPIs | P1 |
| **Automation** | Smart follow-ups, anomaly detection, workflow automation (with governance) | P2 |

### Success Criteria

- [ ] Advanced automation respects Doc `19` human-approval guardrails if applied to We Decor
- [ ] WhatsApp integration supplements — does not replace — external WhatsApp coordination until explicitly scoped

*Deferred from Phase 1:* advanced AI as core dependency; full WhatsApp replacement; auto-execution without approval.

---

## Phase 6: Multi-Tenant SaaS (Future)

**Timeline:** 2028+ (TBD — see `docs/business/20-saas-evolution-plan.md` when created)  
**Goal:** Onboard external event management companies as paying tenants.

### Deliverables

| Area | Features |
|------|----------|
| **Onboarding** | Self-service signup, tenant provisioning, guided setup |
| **Billing** | Subscription management, usage metering, payment processing |
| **Isolation** | Row-level security, tenant data export, tenant deletion |
| **Customization** | Per-tenant branding, workflow configuration, custom fields |
| **Admin** | Super-admin panel, tenant management, usage monitoring |

### Prerequisites

- We Decor Phase 1 UAT passed and stable in production (Doc `19`)
- Doc `20` SaaS evolution plan approved
- Core workflows proven stable

*Deferred from Phase 1:* multi-tenant SaaS implementation (EP1 explicitly excluded; Doc `20` reserved).

---

## Cross-Phase Concerns

| Concern | Ongoing Activity |
|---------|-----------------|
| **Security** | Regular audits, dependency updates |
| **Performance** | Query optimization, load testing before go-live |
| **Documentation** | Keep `11-roadmap.md` aligned with Doc `19` scope freeze |
| **Testing** | Coverage per [15-testing-strategy.md](./15-testing-strategy.md) |
| **Monitoring** | Expand dashboards as modules ship |
| **Scope control** | Phase 1 changes require Doc `19` Scope Change Rule |

---

## Prioritization Framework

When choosing what to build within a phase:

1. **Is it in approved Phase 1 (Doc `19`)?** → Phase 1 P0/P1
2. **Does it complete a must-pass workflow (W1–W5)?** → Phase 1 P0
3. **Does it reduce Zakir dependency / manual re-entry?** → Bump priority within phase
4. **Is it explicitly deferred in Doc `19`?** → Later phase only
5. **Does it enable future SaaS (Doc `20`)?** → Architecture awareness only — not Phase 1 delivery

### What We Explicitly Defer (from Phase 1)

| Feature | Defer To | Business source |
|---------|----------|-----------------|
| Multi-tenant SaaS | Phase 6 / Doc `20` | Doc `19` Scope Freeze |
| Advanced AI automation (core) | Phase 5 | EP1-AUT-001; matrix 🔵 |
| Structured customer quote approval portal | Phase 4+ | Manual WhatsApp OK per `04` |
| Full WhatsApp replacement | Phase 5 | Doc `19` UAT Q6 |
| Full CMS / marketing platform | Phase 4 | EP1-MKT-003 library only in Phase 1 |
| Deep ad platform integrations | Phase 4 | Doc `19` Scope Freeze |
| Full accounting / ERP / GST replacement | Phase 3+ | Doc `19` Scope Freeze |
| Auto-execution workflows | Not Phase 1 | EP1-AUT-001, EP1-AUT-005 |
| Complaint ticketing / call-center | Post Phase 1 | Doc `19` Scope Freeze |
| AI (Basic) quote/message drafting | Phase 5 (optional) | Was old Phase 1 P2 — not UAT bar |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Phase 1 scope larger than original 12-week plan | High | Re-estimate timeline; sprint blocks per W1–W5; Doc `19` is scope authority |
| We Decor adoption resistance | High | Weekly demos; Zakir-validated UAT criteria; gradual LM/QB cutover |
| Scope creep | High | Doc `19` Scope Change Rule; no roadmap-only scope additions |
| Rebuilding LM sales core | High | Extend/port LM — W5 UAT explicitly not a rebuild bar |
| QB cutover too early | Medium | Parallel-run until FIN UAT passes |
| AI / WhatsApp / CMS pressure | Medium | Deferred list + UAT constraints documented |
| Key person dependency | High | Documentation-first; Event OS as source of truth |
| Data migration | Medium | Phased migration; transitional integrations section |

---

## Related Documents

| Document | Topic |
|----------|-------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | **Authoritative Phase 1 business baseline** |
| [02-product-vision.md](./02-product-vision.md) | Full product vision |
| [06-module-design.md](./06-module-design.md) | Module details (*alignment pending*) |
| [20-definition-of-done.md](./20-definition-of-done.md) | Phase completion criteria |

---

*Last updated: 2026-07-08*  
*Owner: Product & Engineering*  
*Alignment: Doc `19` approved business Phase 1 (2026-07-08)*
