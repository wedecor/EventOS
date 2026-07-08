# We Decor Events — Vendor Management

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
| **Document Purpose** | Define how We Decor Events selects, manages, and pays vendors/suppliers across flowers, materials, transport, fabrication, and other external dependencies—separating founder policy (Ilyas) from tactical execution (Zakir). This will inform Event OS Vendor, Procurement, Inventory, and Finance module design. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-07 | Ilyas + Zakir (Interview in progress) | Initial structure created. All business facts pending interview capture; unknowns flagged **Not Yet Interviewed (Zakir)** / **Not Defined** / **Not Currently Measured**. |

---

## Purpose of This Document

This document describes **how We Decor manages vendors today** (Current State) and what We Decor **wants to become** (Future Vision), specifically:

- Vendor categories and use-cases (flowers, props, printing, transport, fabrication, rentals, etc.)
- Vendor selection criteria and approval authority
- Pricing, negotiation, and rate stability
- Payment terms, advances, credit, and settlement
- Quality checks, issue resolution, and escalation
- Risk management (shortages, price spikes, availability)
- Vendor data that Event OS must capture (master data + per-event procurement)

It is derived from direct founder interviews (Ilyas) and tactical execution interviews (Zakir). **Founder business policy** is distinguished from **tactical execution (Zakir)**. Metrics not tracked are marked **Not Currently Measured**—never estimated. Undefined decisions are marked **Not Defined**.

**Intended audience:** Founders, product managers, engineers, AI agents, investors, and business leaders building Event OS Procurement/Vendor/Inventory/Finance workflows.

**Source:** Founder interview (Ilyas) + Tactical interview (Zakir), July 2026–July 2027  
**Status:** Version 0.1 — Draft (Document 07 of 20)

**Prerequisites:**
- [01-business-vision.md](./01-business-vision.md)
- [02-business-model.md](./02-business-model.md)
- [05-event-execution.md](./05-event-execution.md)
- [06-staff-management.md](./06-staff-management.md)

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

We Decor’s vendor management is **relationship-driven and informal**, operated primarily by **Zakir**:

- Preferred vendors are maintained in Zakir’s memory (no formal list/system)
- Purchases are confirmed via phone/WhatsApp
- No centralized procurement/payment tracker; documentation exists as paper bills/WhatsApp invoices and UPI transaction records
- No vendor credit/pay-later arrangements

Vendor categories used include fresh flowers, balloons, fabric, rentals, printing, lighting, transport/porters, furniture rentals, sound, and per-event freelance helpers/temps (boundary defined; workforce management is in `06`).

### Founder Policy

Major vendor relationship decisions (e.g., permanently blocking an important vendor) should be discussed and decided jointly by **Zakir + Ilyas**. Formal approval/escalation rules by spend/category are **Not Defined**.

### Future Vision

Phase 1 vendor management in Event OS should prioritize:

1. **Vendor Master + Vendor Status Management**
2. **Per-Event Procurement Management**
3. **Payment Tracking**

Other features (price history, confirmation tracking, delivery timing tracking, and a full issue workflow) can be phased later. Phase 1 should still include a **lightweight vendor issue/feedback note** field.

---

## 2. Scope

### In Scope

- Vendor categories used in event operations (materials + services)
- Vendor sourcing and onboarding (how a vendor becomes “trusted”)
- Vendor selection and allocation per event
- Pricing, negotiation, and rate changes
- Payment methods and payment timing (cash/UPI/credit)
- Vendor credit policy (if any) and settlement discipline
- Handling shortages, substitutions, and emergencies
- Vendor quality checks and complaint handling
- Vendor performance evaluation and retention/removal
- Data and workflows required for Event OS Vendor/Procurement modules

### Out of Scope

- Staff hiring and pool management (see [06-staff-management.md](./06-staff-management.md))
- Operational management of temporary decorators (sourcing, trust-building, training, performance) is defined in [06-staff-management.md](./06-staff-management.md). This document treats per-event engagement of temporary decorators/helpers only as an **external service dependency** in procurement context.
- Detailed inventory storage/warehouse processes (see `08-inventory-workflow.md` — planned)
- Customer-facing complaint handling (see `12-customer-support.md` — planned)
- Detailed accounting and reconciliation (see `09-finance-workflow.md` — planned)

---

## 3. Vendor Categories (Vendor Taxonomy)

### Current State

| Category | Typical use-cases | Examples | Notes |
|----------|--------------------|----------|------|
| Fresh flower suppliers | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used in **most events** |
| Balloon suppliers | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used in **most events** |
| Fabric suppliers | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used in **most events** |
| Transport and porter service providers | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used in **most events** |
| Stage and decoration material rental vendors | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used **sometimes** |
| Printing vendors | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used **sometimes** |
| Lighting vendors | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used **sometimes** |
| Furniture rental vendors | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used **sometimes** |
| Sound system vendors | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used **sometimes** |
| Freelance workers (additional manpower / specialized services) | Not Yet Interviewed (Zakir) | Not Defined | Category confirmed; used **sometimes**; clarify boundary vs decorator temp pool in `06-staff-management.md` |

### Current State — Frequency Summary

| Frequency | Vendor categories |
|----------|-------------------|
| **Most events** | Fresh flower suppliers; Balloon suppliers; Fabric suppliers; Transport and porter service providers |
| **Sometimes** | Stage and decoration material rental vendors; Printing vendors; Lighting vendors; Furniture rental vendors; Sound system vendors; Freelance workers (temporary decorators/helpers engaged per event) |

### Boundary Note — Temporary Decorators as “Freelance Workers”

### Current State

- “Freelance workers” in this document refers mainly to **trusted temporary decorators and helpers** engaged **per event** to supplement manpower for large events or busy periods.
- Workforce management details (trusted pool operations, trust-building, performance, training) are **out of scope here** and covered in [06-staff-management.md](./06-staff-management.md).

### Future Vision

Event OS maintains a stable vendor taxonomy and maps each procurement line item to a vendor category, enabling:

- Rate comparison and forecasting by category
- Vendor performance histories by category
- Substitution suggestions during shortages (human-approved)

---

## 4. Vendor Sourcing & Onboarding

### Current State

We maintain a **preferred list of 1–3 trusted vendors per category** and purchase from them regularly.

#### Where the preferred list lives today

- The preferred vendor list is maintained in **Zakir’s memory and experience**.
- There is **no spreadsheet, software system, or formal document** storing the preferred vendor list today.

#### Preferred vs backup count (Current State)

- Preferred vendor count is generally around **1–3 vendors per category**.
- Some categories may have additional backup options where availability is important.
- There is **no fixed number** defined; counts vary by category and availability.
- Exact preferred/backup counts per category: **Not Currently Measured**.

#### Categories where backups are especially important (Current State)

Availability risk is higher close to the event for:

- Fresh flower suppliers
- Transport and porter service providers
- Stage and decoration material rental vendors
- Lighting vendors
- Sound system vendors

#### Tactical Execution (Zakir) — Trial to Trusted/Preferred

A new vendor becomes “preferred” based on **actual experience and performance** through real purchases.

**Criteria used:**

- Product/material/service quality
- Competitive pricing
- Reliability and timely delivery
- Consistency across purchases

**Process (current):**

- Test via actual purchases
- If quality/service is satisfactory and pricing is competitive, continue working with the vendor and treat them as trusted/preferred

Thresholds (e.g., number of purchases/events before “preferred”) and any category-specific differences: **Not Yet Interviewed (Zakir)**.

### Founder Policy

**Not Defined.**

### Future Vision

Vendor onboarding checklist in Event OS:

- KYC/identity basics (as needed)
- Category and service area (locations served)
- Rates / rate card (if applicable)
- Payment terms (advance, credit days)
- Quality standards / acceptance criteria
- Escalation contact and backup contact

---

## 5. Vendor Selection per Event

### Tactical Execution (Zakir)

For each purchase:

- Zakir compares **price and quality** among the **preferred vendors** for that category.
- Zakir places the order with the vendor offering the **best value** for that purchase.
- If none of the preferred vendors can provide the required material/service with acceptable pricing/availability, Zakir sources from **another vendor** for that purchase.

How “best value” is evaluated (exact criteria/weights) and whether this differs by category: **Not Yet Interviewed (Zakir)**.

### Founder Policy

**Not Defined.**

### Future Vision

Event OS supports per-event procurement planning:

- Preferred vendor suggestions by category + location + historical performance
- Conflict warnings if vendor capacity is likely constrained (manual input)
- Human approval required before purchase/confirmation

---

## 5A. Vendor Delivery Timing & Coordination

### Current State

- Vendor delivery/arrival timing is coordinated based on event requirements.
- We communicate the required delivery/arrival timing depending on when materials/services are needed at the venue.
- There is **no formal vendor delivery tracking system**, documented SLA, or standardized “must arrive by” rule across vendors.

### Tactical Execution (Zakir) — When vendor is delayed

- Follow up with the vendor
- Take corrective action to avoid impacting event execution
- If required, arrange alternatives or coordinate with another vendor

### Future Vision

Event OS can capture:

- Required delivery/arrival time per vendor commitment (per event)
- Check-in status (expected / delayed / delivered) (manual updates)
- Late-delivery incidents linked to vendor history (no auto-penalties unless defined)

---

## 5B. Vendor Confirmation & Communication

### Current State

- Orders/bookings are confirmed via **phone calls** or **WhatsApp**.
- Confirmation is based on the conversation and acknowledgement received from the vendor.
- There is **no formal purchase order** or structured confirmation workflow today.

### Future Vision

- Per-event vendor “commitment” record with:
  - What is being supplied
  - When it is needed
  - Confirmation status (pending/confirmed)
  - Confirmation channel (call/WhatsApp)
  - Proof/reference (optional: WhatsApp message link/screenshot upload)

### Phase 1 Requirement — Simple Confirmation Workflow

Event OS should support a simple confirmation workflow per procurement line:

**Planned → Requested → Confirmed → Delivered/Completed**

Notes should be available for additional details/exceptions.

### Phase 1 Requirement — Timestamps for Confirmation Timeline

Phase 1 should capture timestamps for the full vendor confirmation timeline:

- **Requested time** — when the order/service request is communicated to the vendor
- **Confirmed time** — when the vendor accepts and confirms the order
- **Delivered time** — when the material/equipment reaches the venue or required location (goods delivery)
- **Completed time** — when the setup/installation/service work is finished (services)

This creates a complete timeline and supports vendor reliability analysis in later phases.

### Definition — Delivered vs Completed (Phase 1 Requirement)

The final workflow state should be supported as a common “final” state, but with category-appropriate meaning:

- **Delivered** (materials/items): used for vendor-supplied items reaching the required location/team (e.g., flowers, balloons, fabric, printing materials, rental items delivered).
- **Completed** (services): used for service-based vendors when the work is finished (e.g., sound setup completed, lighting service completed, transport service completed).

Event OS should support this distinction while keeping a common final workflow state.

### Category Mapping — Delivered vs Completed (Phase 1)

#### Delivered (material / item-based)

- Fresh flower suppliers
- Balloon suppliers
- Fabric suppliers
- Stage and decoration material rental vendors
- Printing vendors
- Furniture rental vendors

#### Completed (service-based)

- Transport and porter service providers
- Lighting vendors
- Sound system vendors
- Freelance workers (temporary decorators/helpers)

### Override Requirement (Phase 1)

Some vendor categories can involve **both delivery and on-site service**, depending on the order. Phase 1 should support **two checkpoints on the same procurement line**:

- **Delivered timestamp** — when the item/equipment reaches the venue/location
- **Completed timestamp** — when setup/installation/service is finished

Examples (can be both):

- Lighting vendors — equipment delivery + installation/setup
- Sound system vendors — equipment delivery + setup/operation
- Stage and decoration material rental vendors — delivery + setup/installation
- Furniture rental vendors — delivery + placement/setup

---

## 5C. Vendor Relationship Ownership (Who Coordinates)

### Current State

- **Zakir** is primarily responsible for contacting and coordinating with vendors.
- Permanent decorators/staff generally do **not** manage vendor relationships directly.
- Staff may assist with **purchasing or collections** when required, but coordination remains mainly with Zakir.

---

## 5D. Purchase Authority & Approvals

### Current State

- Vendor purchases are mostly **Zakir-driven**.
- There is **no fixed purchase amount limit** or vendor category requiring prior Ilyas approval.
- For major financial decisions or exceptional cases, Zakir may discuss with Ilyas, but formal approval rules are **Not Defined**.

---

## 6. Pricing, Negotiation, and Rate Stability

### Current State

Pricing decisions are made per purchase by comparing **price and quality** among preferred vendors, selecting the best value option.

Vendor prices—especially **fresh flower prices**—can change depending on season, availability, and demand.

Operational handling of price changes:

- Negotiate with vendors where possible
- Compare with alternative vendors
- Switch vendors if required
- Adjust material choices when needed

Structured recording of price changes: **No** (knowledge primarily in Zakir’s experience/market understanding).

### Not Currently Measured

- Frequency of vendor price changes
- Savings due to negotiation

### Future Vision

- Store “last paid price” per item/vendor
- Price variance alerts (human-approved)
- Separate vendor-provided rates vs internally approved cost ceilings (if defined)
- Support both:
  - **Structured rate card** for common items/services (item-wise pricing)
  - **Free-form pricing notes** for special conditions, negotiation details, and vendor-specific context
  - **Last paid price history** to compare future purchases/quotes and track price changes over time

---

## 7. Payment Terms, Credit, and Settlement Discipline

### Current State

#### Credit usage (overall)

- **No credit / pay-later arrangements are used with vendors currently.**
- Payments are settled immediately, after delivery/service completion, or through advance + balance arrangements depending on vendor category.

#### Fresh flower suppliers

| Attribute | Current practice |
|----------|------------------|
| Payment timing | Payment is made **immediately during purchase** |
| Credit usage | Generally **no credit** used for flower purchases |

#### Balloon suppliers

| Attribute | Current practice |
|----------|------------------|
| Payment timing | Payment is made **immediately during purchase** or **when materials are received** |
| Credit usage | Generally **no credit** used for balloon purchases |

#### Fabric suppliers

| Attribute | Current practice |
|----------|------------------|
| Payment timing | Payment is made **immediately during purchase** or **when materials are received** |
| Credit usage | Generally **no credit** used for fabric purchases |

#### Transport and porter service providers

| Attribute | Current practice |
|----------|------------------|
| Payment timing | Payment is made **after service is completed** |
| Credit usage | Generally **no credit** or long-term settlement arrangements |

#### Stage and decoration material rental vendors

| Attribute | Current practice |
|----------|------------------|
| Payment timing | **Advance payment** is made before the event; remaining payment cleared **after the event** once rental service is finished / materials are returned |
| Credit usage | Generally **no credit** arrangements |
| Security deposit | Generally **no separate refundable deposit**; special deposit arrangements handled case-by-case |

#### Printing vendors

| Attribute | Current practice |
|----------|------------------|
| Payment timing | Depends on vendor/order arrangement; generally settled **during purchase** or **after receiving printed materials** |
| Credit usage | No regular credit arrangements |

#### Lighting vendors

| Attribute | Current practice |
|----------|------------------|
| Payment timing | Payment is settled **after service is completed** (typically after event/service completion) |
| Credit usage | No regular credit arrangements |

#### Furniture rental vendors

| Attribute | Current practice |
|----------|------------------|
| Payment timing | **Advance payment** before the event; remaining payment cleared **after the event** once furniture is returned |
| Credit usage | Generally **no credit** arrangements |
| Security deposit | Generally **no separate refundable deposit**; special deposit arrangements handled case-by-case |

#### Sound system vendors

| Attribute | Current practice |
|----------|------------------|
| Payment timing | Payment is settled **after service is completed** (after event/service completion) |
| Credit usage | Generally **no credit** arrangements |

#### Freelance workers (temporary decorators/helpers engaged per event)

| Attribute | Current practice |
|----------|------------------|
| Payment timing | Payment is made **after the event is completed** (end of event or shortly after) |
| Dependency on customer balance timing | Payments are **not dependent** on customer balance collection; cleared based on work completed |

Other categories: **Not Yet Interviewed (Zakir)**.

#### Purchase & Payment Documentation (Current State)

Vendor purchases and payments are documented via:

- Paper bills received from vendors
- Bills/invoices shared through WhatsApp
- Payment records such as UPI transaction details (when applicable)

There is **no centralized app, spreadsheet, or structured system** for managing vendor purchases and payments today.

#### Payment Methods (Current State + Requirement)

### Current State

- Vendor payments are made via a mix of **cash** and **UPI**.

### Future Vision / Requirement

- Event OS should record the **payment method for every vendor transaction** (e.g., cash, UPI) so payment history and expense tracking are clear.

#### Attachments (Phase 1 Requirement)

Phase 1 should support attaching proofs to procurement/payment records:

- Vendor bills/invoices
- Photos of paper bills
- PDFs (if available)
- UPI/payment proof screenshots (where required)

Recording only amount + notes is not sufficient; attachments support expense verification history.

Attachments should be **optional but strongly recommended**:

- Allow attaching documents whenever available
- Allow marking “attachment missing” with a reason (because some small vendors may not provide formal bills/invoices)

### Not Defined

- Standard payment terms by vendor category
- Whether We Decor prefers advance payments or credit (current: **no credit used**; advance/balance used for some rentals)
 - Formal approval rules for major vendor purchases based on amount/category/impact

### Future Vision

Event OS tracks:

- Purchase commitments linked to events
- Payment status (advance/partial/final), method (cash/UPI/bank transfer), timestamps
- Vendor balances and upcoming settlements
- Policy guardrails (e.g., “do not over-commit credit beyond X”) — **Not Defined**

---

## 8. Quality Control & Issue Resolution

### Current State

If vendor-supplied items/services are not acceptable, We Decor prioritizes corrective action to ensure event quality and customer experience are not impacted.

Typical corrective actions (depending on situation):

- Ask vendor to **replace or correct** the issue
- **Source from another vendor** if required
- **Stop working** with the vendor if quality issues continue

#### Disputes (pricing/quality/wrong item/damage)

Resolution patterns depend on type/impact. Common actions:

- Ask vendor to replace/correct
- Negotiate to resolve pricing/quality differences
- Accept minor issues if they do not impact the final event outcome
- Switch vendor if unresolved or if issues repeat
- Stop using vendor if repeated problems occur

#### Issue Tracking

Vendor issues are tracked **informally**:

- Primarily via experience and memory
- Some details may exist in WhatsApp conversations
- There is **no structured vendor issue tracking system** or formal record today

### Future Vision

Phase 1 should support **lightweight issue/feedback capture** (no full workflow), stored at **both levels**:

#### Phase 1 — Vendor-level notes

- General vendor history
- Overall reliability
- Repeated quality or service concerns
- Reasons for status changes (Paused/Blocked)

#### Phase 1 — Per-event procurement line notes

- Context-specific issues tied to a particular event/purchase (e.g., wrong items, quality problems in a specific order, delivery/service issues)

Later phases can add structured issue workflows, analytics, and automated prompts.

---

## 9. Shortages, Substitutions, and Emergency Procurement

### Current State

If a preferred vendor cannot supply close to the event (unavailability or unacceptable price/quality), Zakir typically makes a substitution/vendor switch decision to ensure event requirements are fulfilled on time.

Decision factors (as used operationally):

- Availability
- Quality
- Pricing

Escalation to Ilyas may happen for major/critical situations, but exact escalation criteria are **Not Defined**.

### Founder Policy

Aligned with execution philosophy: recover by substitution where practical rather than failing delivery. Detailed vendor/emergency behaviour: **Not Yet Interviewed (Zakir)**.

### Future Vision

Event OS supports:

- Substitution options by category with approved alternatives
- Escalation prompts when substitution affects customer expectations or commercial scope

### Substitution Boundary (Current State)

- Substitutions are usually handled **behind the scenes** while maintaining the agreed design and overall look.
- If a substitution would **significantly change** the visible design/theme/customer expectation, **customer alignment is required** before making the change.

---

## 10. Vendor Performance & Retention

### Current State

Vendor changes are **rare**.

Preferred vendors are typically added/replaced only when there are issues such as:

- Poor quality
- Unreliable service
- Pricing concerns
- Availability problems

Seasonal vendor replacement process: **No** (none defined today).

Vendor change frequency: **Not Currently Measured**.

### Not Currently Measured

- Vendor on-time rate
- Defect/quality issue rate
- Disputes frequency

### Future Vision

Simple performance signals per vendor:

- Reliability (on-time, responsiveness)
- Quality consistency
- Pricing fairness/stability
- Ease of coordination

---

## 11. Vendor Data Model (Event OS Requirements)

### Phase 1 (Must Have)

| Capability | Status |
|-----------|--------|
| Vendor master (name, category, contacts, location/area) | Future Vision |
| Preferred/backup vendors per category | Future Vision |
| Per-event procurement list linked to vendor | Future Vision |
| Payment record linked to vendor + event | Future Vision |
| Notes / issues log linked to vendor + event | Future Vision |
| Attachments on procurement/payment (bills, invoices, receipts) | Future Vision |

### Phase 1 Priorities (Founder + Operations)

For Phase 1, the top priorities are:

1. **Vendor Master + Vendor Status Management**
2. **Per-Event Procurement Management**
3. **Payment Tracking**

Phase 1 should include a **lightweight vendor issue/feedback note** field (not a full issue workflow).

Issue/feedback notes should be captured at:

- **Vendor level** (general history/reliability/repeated concerns)
- **Per-event procurement line level** (issues tied to a specific purchase/event)

### Procurement Linkage (Phase 1 Requirement)

Per-event procurement should be linked to **both**:

- The **event** (what materials/services were purchased for that event)
- The **quotation line items / budget** (to compare planned/quoted assumptions vs actual procurement costs)

Purpose: improve event profitability understanding, identify cost differences, and improve future quotations.

### Cost Variance Flag (Phase 1 Requirement)

If actual procurement cost exceeds the quotation/budget assumption, Phase 1 should:

- Record cost variance
- Show difference between estimated vs actual procurement cost
- Warn/flag Zakir to review before marking the event **Completed**

Alert threshold rules (variance %, amount, category sensitivity): **Not Defined**.

### Cost Variance Reason (Phase 1 Requirement)

Phase 1 should require selecting a reason for procurement cost variance from a small list:

- Market price increase (especially seasonal changes in flowers/materials)
- Vendor price change
- Vendor change due to availability or quality issues
- Customer scope change or additional requirements
- Emergency purchase
- Material wastage or damage
- Incorrect estimation during quotation
- Other (with notes)

---

## 11A. Cost Increase Handling (Current State)

### Current State

Cost increases are handled case-by-case:

- If cost increase is due to **normal market changes / minor fluctuations**, We Decor usually **absorbs** the additional cost and maintains the customer commitment.
- If the increase is **significant** or caused by **customer requirement/scope change**, pricing may be **revised after discussion with the customer**.

### Not Defined

- Fixed threshold for when additional costs should be absorbed vs passed to the customer.

Deferred to later phases: price history (beyond last-paid), confirmation workflow enhancements, delivery timing tracking, and full issue management workflow.

### Procurement Ownership & Permissions (Phase 1 Requirement)

- **Zakir** is the primary owner who can create, update, and manage procurement records.
- **Permanent decorators/staff** can assist with purchases and upload supporting documents/attachments when required.
- Final responsibility for procurement accuracy and vendor-related records remains with **Zakir**.

### Vendor Master — Minimum Fields (Current Requirement)

Minimum information to store per vendor:

- Vendor name
- Vendor category
- Contact person name
- Phone number / WhatsApp number
- Vendor location / area served
- Items or services provided
- Pricing details / rate information
- Payment terms
- Preferred vendor vs backup vendor status
- Vendor status (Preferred / Active / Backup / Paused / Blocked)
- Quality and reliability notes
- Previous purchase history
- Issue / feedback history

**Tax-related details:** should be **optional** (many small vendors may not have complete tax documentation).

### Vendor Status Model (Future Vision / Requirement)

Event OS should support explicit vendor statuses:

- **Preferred** — trusted vendors used regularly
- **Active** — available vendors who can be used when required
- **Backup** — alternative vendors used when preferred vendors are unavailable
- **Paused** — temporarily not used due to issues or other reasons
- **Blocked** — should not be used again due to repeated quality or reliability problems

Status changes should be supported by:

- Notes (reason for status change)
- Linked issue history (so decisions are auditable)

### Authority Model — Status Changes (Current + Policy)

#### Tactical Execution (Zakir) — Day-to-day

- Vendor status changes can be managed by **Zakir** for day-to-day operational decisions.

#### Founder Policy (Ilyas) — Major/critical decisions

- Major decisions (e.g., **permanently blocking an important vendor** or changing critical vendor relationships) should be **discussed and decided jointly** by Zakir + Ilyas.

#### Permissions (Phase 1 Requirement)

- Vendor status changes should be **restricted to Zakir**.
- Permanent decorators/staff should **not** have permission to change vendor status.

#### Not Defined

- Exact approval rules based on category, spend, or impact.

### Guardrails

- Procurement and vendor confirmations must remain **human-approved**
- Do not auto-purchase or auto-pay vendors

---

## 12. Current State (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Vendor categories | Fresh flowers; balloons; fabric; rentals (stage/decoration, furniture); printing; lighting; transport/porters; sound; per-event freelance helpers/temps |
| Frequency | Most events: flowers, balloons, fabric, transport/porters. Sometimes: rentals/printing/lighting/furniture/sound/freelance helpers |
| Preferred list | Typically 1–3 preferred vendors/category; some categories need extra backups (availability-driven); exact counts **Not Currently Measured** |
| Selection | Compare price+quality among preferred; choose best value; fallback to non-preferred vendor if required |
| Onboarding to preferred | Trial via actual purchases; criteria: quality, competitive pricing, reliability/timely delivery, consistency |
| Payments | No vendor credit; mix of cash+UPI; category-specific timing (immediate, after service, advance+balance for rentals) |
| Documentation | Paper bills, WhatsApp invoices, UPI transaction details; no centralized system |
| Issue resolution | Replace/correct → negotiate → accept minor issues if non-impacting → switch vendor → stop using if repeated |
| Tracking | Vendor issues + preferred list tracked informally (memory; sometimes WhatsApp); no structured logs |

---

## 13. Future Vision (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Phase 1 focus | Vendor Master + statuses; per-event procurement; payment tracking |
| Vendor Master | Minimum fields captured; tax details optional |
| Status model | Preferred / Active / Backup / Paused / Blocked with reason notes + issue history |
| Pricing | Structured rate card + free-form notes + last paid price history |
| Governance | Day-to-day by Zakir; major/critical vendor relationship decisions jointly with Ilyas; detailed approval thresholds **Not Defined** |

---

## 14. Business Rules Registry (VM-01 onwards)

*Registry for Event OS Vendor Management. Master registry planned for `14-business-rules.md`.*

| Rule ID | Rule | Type | Status |
|---------|------|------|--------|
| **VM-01** | Do not invent vendor facts; unknowns must be labelled **Not Currently Measured / Not Yet Interviewed (Zakir) / Not Defined**. | Documentation Standard | Confirmed |
| **VM-02** | Vendor confirmations and procurement actions require explicit human approval. | Founder Policy (Operational guardrail) | Confirmed (principle) |

---

## 15. KPIs

| KPI | Definition | Status |
|-----|------------|--------|
| Vendor on-time delivery rate | % deliveries on/before required time | **Not Currently Measured** |
| Vendor quality issue rate | Issues per 100 procurements | **Not Currently Measured** |
| Vendor credit exposure | Outstanding payables by vendor | **Not Currently Measured** |
| Price variance | Difference between expected vs actual purchase price | **Not Currently Measured** |

---

## 16. Risks

| Risk | Severity | Why It Matters | Current Mitigation |
|------|----------|----------------|--------------------|
| Vendor shortages / unavailability | Not Defined | Could impact delivery quality/timing | **Not Yet Interviewed (Zakir)** |
| Price spikes (flowers/peak season) | Not Defined | Margin risk; quote mismatch | **Not Yet Interviewed (Zakir)** |
| Late deliveries | Not Defined | Execution delays | **Not Yet Interviewed (Zakir)** |
| Quality defects | Not Defined | Customer dissatisfaction | **Not Yet Interviewed (Zakir)** |
| Payment disputes | Not Defined | Vendor relationship risk | **Not Yet Interviewed (Zakir)** |

---

## 17. Open Questions (Interview Backlog)

### Tactical Execution — Zakir

- Which vendor categories exist today, and which are “must-have” vs occasional?
- How are vendors found and selected (preferred vendor list vs ad hoc)?
- How many vendors per category are currently trusted? **Not Currently Measured** unless known.
- Payment terms by category (advance vs end-of-day vs weekly settlement; credit usage)
- How urgent/emergency purchases happen on event day (who goes, where, time buffers)
- Negotiation patterns (fixed vendors vs shopping around)
- Quality checks and what counts as “reject” vs “adjust on site”
- What failures happened before and how they were recovered (no frequencies unless measured)
- Whether vendor reliability affects whether We Decor accepts bookings on peak days

### Founder Policy — Ilyas

- Vendor governance expectations (standardization vs flexibility)
- Preferred risk posture (pay extra to ensure quality vs optimize cost)
- Policy on credit (avoid vs acceptable) — **Not Defined**
- Future: whether We Decor wants long-term contracts/rate cards — **Not Defined**

---

## 18. Document Status

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Interview status** | Founder policy: **Not Defined**; Tactical execution: **Not Yet Interviewed (Zakir)** |
| **Next step** | Continue interview and populate Current State + policies |

