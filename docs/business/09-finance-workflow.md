# We Decor Events — Finance Workflow

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
| **Document Purpose** | Define how We Decor Events handles financial workflows end-to-end (quotes, advances, balances, vendor payments, expenses, profitability visibility, cash/UPI handling, and record-keeping)—separating founder policy (Ilyas) from tactical execution (Zakir). This will inform Event OS Finance, Payments, Procurement, and Reporting modules. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-07 | Ilyas + Zakir (Interview in progress) | Initial structure created. All operational facts pending interview capture; unknowns flagged **Not Yet Interviewed (Zakir)** / **Not Defined** / **Not Currently Measured**. |

---

## Purpose of This Document

This document describes **how We Decor manages finance today** (Current State) and what We Decor **wants to become** (Future Vision), specifically:

- Quotation → advance collection → Approved trigger (handoff to Operations)
- Balance collection timing and follow-ups
- Vendor payments and expense recording (cash/UPI) and attachment discipline
- Profitability visibility per event (planned vs actual) and variance handling
- Refunds, cancellations, and exceptional commercial decisions
- Financial record keeping and reconciliation (high level)
- Event OS Finance requirements and guardrails (human approval, audit trail)

It is derived from direct founder interviews (Ilyas) and tactical execution interviews (Zakir). **Founder business policy** is distinguished from **tactical execution (Zakir)**. Metrics not tracked are marked **Not Currently Measured**—never estimated. Undefined decisions are marked **Not Defined**.

**Intended audience:** Founders, product managers, engineers, AI agents, investors, and business leaders building Event OS Finance/Procurement/Reporting.

**Source:** Founder interview (Ilyas) + Tactical interview (Zakir), July 2026–July 2027  
**Status:** Version 0.1 — Draft (Document 09 of 20)

**Prerequisites:**
- [04-sales-process.md](./04-sales-process.md)
- [05-event-execution.md](./05-event-execution.md)
- [07-vendor-management.md](./07-vendor-management.md)
- [08-inventory-workflow.md](./08-inventory-workflow.md)

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

Customer and vendor finance workflows are **informal and Zakir-led**:

- Customer payments: mainly **UPI + cash**; advance verified manually → **Approved**
- Balance: usually before/on event day; unpaid balance handled case-by-case (no fixed block rule)
- Recording: UPI screenshots, WhatsApp, notes; no centralized billing/accounting system
- No formal customer invoices/receipts today
- Vendor expenses: bills/WhatsApp/UPI; linked to events via memory; Zakir pays (staff may assist/reimburse)
- Event profit: **not measured** per event today
- Refunds: rare; case-by-case; no fixed policy

### Founder Policy

**Not Defined** (refund thresholds, unpaid-balance execution rules, formal approval limits).

### Future Vision

Phase 1 finance focus:

1. Customer payment tracking
2. Vendor expense tracking per event
3. Event profitability view

Plus optional payment proofs, staff entry with Zakir control, and alignment with procurement variance review from `07`.

---

## 2. Scope

### In Scope

- Customer payments: advance, balance, receipts
- Payment methods (cash/UPI/bank transfer) and proof/attachments
- Vendor payments and expense capture
- Refunds/cancellations (commercial handling)
- Event-level profitability visibility (planned vs actual)
- Reconciliation and reporting (high level, not accounting deep-dive)
- Finance workflows that Event OS must support (Phase 1 vs later)

### Out of Scope

- Detailed tax filing/accounting compliance processes (unless defined later)
- Payroll and staff compensation specifics (see [06-staff-management.md](./06-staff-management.md))

---

## 3. Customer Payments Workflow (Advance → Balance)

### Current State

#### Payment methods used

Customers typically make payments through:

- **UPI**
- **Cash**

These are the main payment methods used for both **advance** and **balance** payments.

Bank transfers or other payment methods are **not commonly used** currently.

#### Balance collection timing (Current State)

- Balance payment is usually collected **before** or **on the event day**.
- Rule of thumb:
  - Advance payment collected at booking confirmation
  - Remaining balance collected before event execution or on event day
- We generally do not wait long after event completion to collect balances.

#### Payment collection ownership (Current State)

- Customer payment collection is primarily handled by **Zakir**.
- **Advance payment:** usually collected by Zakir at booking confirmation.
- **Balance payment:** usually collected by Zakir before or on the event day.
- Staff may assist with collection during event execution if required, but overall responsibility remains with Zakir.

#### Payment recording (Current State)

Customer payments are recorded **informally**:

- UPI transaction records/screenshots
- Cash tracking through notes or communication
- WhatsApp messages when payment details are shared

There is currently **no dedicated billing software, accounting app, or centralized payment tracking system**.

#### Advance verification → Approved (Current State)

Advance payment verification is done **manually**:

- **UPI payments:** verified through UPI transaction confirmation/screenshot
- **Cash payments:** confirmed based on cash being received

After confirming advance payment has been received, the booking is treated as **Approved**.

There is currently **no automated payment verification system**.

#### Customer receipts/invoices (Current State)

We do **not** provide a formal invoice or receipt system for customer payments today.

Payment confirmation is generally handled through:

- WhatsApp communication
- UPI transaction records/screenshots (where applicable)
- Verbal confirmation for cash payments

There is currently **no automated PDF invoice or formal receipt generation process**.

#### Unpaid balance before/on event day (Current State)

If balance is not paid before or on event day, action depends on situation:

- Zakir follows up with the customer for pending payment
- Team may proceed with the event based on trust level, relationship, and circumstances
- For important cases, payment status is considered before final execution decisions

There is currently **no fixed rule** or automatic restriction for unpaid balance before event execution.

### Founder Policy

**Not Defined.**

### Future Vision

Event OS should link:

- Quote → advance received → Approved status
- Event workspace + finance ledger items
- Balance due reminders (human-approved)

---

## 4. Vendor Payments & Expenses

### Current State

Vendor payments and event expenses are recorded **informally**:

- Paper bills received from vendors
- Bills/invoices shared through WhatsApp
- Payment records such as UPI transaction details (where applicable)
- Expenses are linked to events based on **experience and memory**

There is currently **no centralized expense tracking system, accounting software, or structured event-wise expense recording process**.

#### Vendor payment ownership (Current State)

- Vendor payments are primarily handled by **Zakir**.
- Zakir makes payments for most vendor categories (flowers, rentals, transport, and other event-related purchases).
- Staff may assist with payments in certain situations during event execution or purchasing.
- If staff make payments, they coordinate details and expenses back to Zakir.
- Overall responsibility for vendor payments remains with **Zakir**.

#### Staff reimbursement (Current State)

When staff pay expenses on behalf of the business during an event, reimbursement is handled by **Zakir**:

- Staff share expense details and bills/payment proof with Zakir
- Zakir reviews and reimburses, usually through cash or UPI
- In some cases, reimbursement may be adjusted later depending on situation

There is currently **no formal staff reimbursement tracking system**.

### Future Vision

Integrate with procurement from [07-vendor-management.md](./07-vendor-management.md) and inventory acquisition from [08-inventory-workflow.md](./08-inventory-workflow.md).

---

## 5. Documentation, Proofs, and Audit Trail

### Current State

**Not Yet Interviewed (Zakir).**

### Future Vision

Attach bills/invoices/UPI receipts where possible; mark missing with reason; retain history.

---

## 6. Event Profitability Visibility

### Current State

Profit per event is **not tracked** in a structured way.

There is a general understanding of revenue and expenses, but there is no formal calculation of:

**Revenue − Direct Event Costs = Event Profit**

Profitability is **not measured** at an individual event level today.

### Future Vision

Planned vs actual costs by category; variance reasons; warn Zakir before event marked Completed (aligned with `07`).

---

## 7. Refunds, Cancellations, and Exceptional Cases

### Current State

Refunds are **rare** in current operations.

Advance payment is generally considered against booking commitment and planned preparation.

If cancellation happens, decision is handled **case-by-case** depending on:

- Cancellation timing
- Work already started or expenses already incurred
- Customer situation

### Not Defined

- Fixed refund policy or predefined cancellation/refund rules
- Formal refund policy rules (unless already defined in Doc 04)

---

## 8. Reconciliation & Reporting (High Level)

### Current State

**Not Yet Interviewed (Zakir).**

### Not Currently Measured

- Cash leakage / missing receipt rate
- Per-event profit margin distribution

---

## 9. Event OS Finance Module Requirements

### Phase 1 Priorities (Founder + Operations)

For Phase 1, the top priorities are:

1. **Customer Payment Tracking**
   - Track advance payments, balance payments, payment dates, and payment methods
2. **Vendor Expense Tracking Per Event**
   - Track all event-related expenses including vendor payments, purchases, and supporting documents
3. **Event Profitability View**
   - Compare customer revenue against actual event expenses to understand profit per event

Deferred to later phases: automated payment verification, advanced accounting reports, and payment system integrations.

### Customer Payment Proof Attachments (Phase 1 Requirement)

Customer payment proof attachments should be **optional but recommended**:

- Allow attaching UPI screenshots or other payment proof when available
- Allow recording payment details even if proof attachment is not available
- Allow marking payment proof as missing with a reason

Mandatory proof is not required for Phase 1 (may not be practical for every payment, especially cash).

### Phase 1 (Must Have)

| Capability | Status |
|-----------|--------|
| Record customer advance and balance payments with method and proofs | Future Vision |
| Link payments to event and customer | Future Vision |
| Record vendor payments/expenses linked to procurement lines and events | Future Vision |
| Capture attachments (bills/invoices/UPI proofs) optional with “missing reason” | Future Vision |
| Planned vs actual cost visibility with variance reasons and review flag | Future Vision |
| Event profitability view (revenue vs actual expenses per event) | Future Vision |

### Guardrails

- Do not auto-send payment requests/reminders or auto-mark financial states without human approval.
- Preserve audit trail for edits (amounts, dates, method changes).

### Finance Record Permissions (Phase 1 Requirement)

- **Zakir:** primary owner for recording, editing, and approving customer payments and event expenses; responsible for finance accuracy.
- **Staff:** can enter expense details or upload supporting documents when they make payments on behalf of the business; should **not** modify final finance records without Zakir's control.
- Final responsibility for customer payments and event expenses remains with **Zakir**.

---

## 10. Current State (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Customer payment methods | UPI + cash (main); bank transfer uncommon |
| Advance → Approved | Manual verification (UPI screenshot / cash received) |
| Balance timing | Before or on event day; long post-event waits uncommon |
| Collection ownership | Primarily Zakir; staff may assist |
| Payment recording | Informal (UPI screenshots, WhatsApp, notes); no centralized system |
| Customer receipts/invoices | No formal system today |
| Unpaid balance | Case-by-case follow-up; may proceed based on trust; no fixed block rule |
| Vendor expenses | Informal bills/WhatsApp/UPI; event linkage via memory |
| Vendor payment ownership | Primarily Zakir; staff reimburse via Zakir |
| Staff reimbursement | Zakir reviews and pays cash/UPI; no formal tracking |
| Event profitability | Not measured per event today |
| Refunds/cancellations | Rare; case-by-case; no fixed policy |

---

## 11. Future Vision (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Phase 1 focus | Customer payment tracking; vendor expense per event; event profitability view |
| Payment proofs | Optional but recommended (customer + vendor); missing reason supported |
| Permissions | Zakir primary owner/approver; staff can enter/upload; no final edits without Zakir control |
| Deferred | Automated verification, advanced accounting reports, payment integrations |

---

## 12. Business Rules Registry (FW-01 onwards)

*Registry for Event OS Finance Workflow. Master registry planned for `14-business-rules.md`.*

| Rule ID | Rule | Type | Status |
|---------|------|------|--------|
| **FW-01** | Do not invent finance facts; unknowns must be labelled **Not Currently Measured / Not Yet Interviewed (Zakir) / Not Defined**. | Documentation Standard | Confirmed |

---

## 13. KPIs

| KPI | Definition | Status |
|-----|------------|--------|
| Advance collection rate | % bookings with advance received by due date | **Not Currently Measured** |
| Balance collection time | Days from event completion to balance received | **Not Currently Measured** |
| Attachment completeness | % vendor expenses with invoice/proof attached or missing reason | **Not Currently Measured** |
| Event gross margin | Revenue - direct costs per event | **Not Currently Measured** |

---

## 14. Risks

| Risk | Severity | Why It Matters | Current Mitigation |
|------|----------|----------------|--------------------|
| Missing proofs/receipts | Not Defined | Expense verification risk | **Not Yet Interviewed (Zakir)** |
| Cash handling leakage | Not Defined | Financial loss risk | **Not Yet Interviewed (Zakir)** |
| Late balance collection | Not Defined | Cashflow risk | **Not Yet Interviewed (Zakir)** |

---

## 15. Open Questions (Interview Backlog)

### Tactical Execution — Zakir

- Exact payment methods used for customer payments (cash/UPI/bank) and proof collection
- Balance collection timing and follow-up workflow
- How expenses are recorded today (apps, notes, bills)
- Who pays vendors and when; how vendor payments are linked to events today
- Whether any refunds/partial refunds happen and how decided
- Any monthly accounting/reconciliation routine

### Founder Policy — Ilyas

- Formal refund/cancellation policy stance (if any) — **Not Defined**
- Profitability visibility expectations and reporting cadence — **Not Defined**

---

## 16. Document Status

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Interview status** | Founder policy: **Not Defined**; Tactical execution: **Partially captured** (core Phase 1 requirements documented) |
| **Next step** | Paused at v0.1 core capture; deeper topics (reconciliation, cash handling, payroll linkage, GST/tax) deferred |

