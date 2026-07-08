# We Decor Events — Business Rules (Master Registry)

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
| **Document Purpose** | Serve as the **master index and governance reference** for all We Decor business rules used by Event OS. Domain-specific rule registries remain authoritative in their source documents until consolidated here in a controlled revision. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-07 | Ilyas + Zakir (Interview in progress) | Initial master registry structure, rule namespace index, and governance framework. Full rule consolidation from domain docs pending controlled merge. |

---

## Purpose of This Document

This document is the **single master reference** for business rules that Event OS must enforce, recommend, or display—with clear provenance.

It provides:

1. **Rule namespace index** — which rule ID prefixes exist and where they are defined
2. **Rule type taxonomy** — how to classify rules (policy vs fact vs execution vs guardrail)
3. **Governance** — how rules are created, changed, approved, and versioned
4. **Consolidation status** — which domain registries are merged vs referenced only
5. **Event OS Business Rules Engine requirements** — how rules surface in the product

**Important:** Domain documents (`02`–`13`) contain the **authoritative rule text** today. This document must **not invent rules**. Consolidation copies rules here only through controlled revision with explicit approval.

**Intended audience:** Founders, product managers, engineers, AI agents, investors.

**Source:** Founder interview (Ilyas) + Tactical interview (Zakir), July 2026–July 2027  
**Status:** Version 0.1 — Draft (Document 14 of 20)

**Prerequisites:** All Business Bible documents `01`–`13`

---

## Document Scope

### In Scope

- Master rule index and namespaces
- Rule classification taxonomy
- Rule governance (ownership, approval, change control)
- Cross-document rule dependencies and conflicts
- Event OS rules engine requirements (Phase 1)

### Out of Scope

- Duplicating full rule text from every domain doc in v0.1 (consolidation is incremental)
- Application code implementation

---

## 1. Executive Summary

### Current State

Business rules are **distributed** across domain Business Bible documents. Each domain doc maintains its own registry section (e.g., BR in `02`, CJ in `03`, EX in `05`, SM in `06`).

A **single consolidated master list** does not yet exist in one file.

### Founder Policy

Joint approval required for material business rule changes (Ilyas + Zakir). Provisional rules: warn/recommend only in Event OS until confirmed.

### Future Vision

Event OS uses this master registry as the source of truth for configurable business rules—with human approval guardrails, clear rule provenance, and **warn/recommend** treatment for provisional rules until jointly approved.

---

## 2. Rule Namespace Index

| Prefix | Domain | Source Document | Registry Section | Consolidation Status |
|--------|--------|-----------------|------------------|-------------------|
| **BR** | Business model / commercial | `02-business-model.md` | Business Rules (BR-01+) | **Referenced** (authoritative in Doc 02) |
| **CJ** | Customer journey | `03-customer-journey.md` | Customer Journey Rules (CJ-01+) | **Referenced** |
| **SP** | Sales process | `04-sales-process.md` | Sales Process Rules | **Referenced** |
| **BC** | Booking confirmation | `04-sales-process.md` | Booking Confirmation Rules | **Referenced** |
| **LC** | Last-minute changes | `04-sales-process.md`, `05-event-execution.md` | Change rules | **Referenced** |
| **AI** (Sales) | Sales AI guardrails | `04-sales-process.md` | AI Sales Rules | **Referenced** |
| **EX** | Event execution philosophy | `05-event-execution.md` | EX rules | **Referenced** |
| **EP** | Event planning | `05-event-execution.md` | EP rules | **Referenced** |
| **MP** | Materials/procurement | `05-event-execution.md` | MP rules | **Referenced** |
| **ST** | Staff (execution context) | `05-event-execution.md` | ST rules | **Referenced** (staff detail: `06`) |
| **LG** | Logistics | `05-event-execution.md` | LG rules | **Referenced** |
| **ED** | Event day | `05-event-execution.md` | ED rules | **Referenced** |
| **IR** | Incidents | `05-event-execution.md` | IR rules | **Referenced** |
| **PH** | Photography | `05-event-execution.md` | PH rules | **Referenced** |
| **CA** | Capacity | `05-event-execution.md` | CA rules | **Referenced** |
| **AO** | AI operations | `05-event-execution.md` | AO rules | **Referenced** |
| **SM** | Staff management | `06-staff-management.md` | SM-01+ | **Referenced** |
| **VM** | Vendor management | `07-vendor-management.md` | VM-01+ | **Referenced** |
| **IW** | Inventory workflow | `08-inventory-workflow.md` | IW-01+ | **Referenced** |
| **FW** | Finance workflow | `09-finance-workflow.md` | FW-01+ | **Referenced** |
| **MK** | Marketing workflow | `10-marketing-workflow.md` | MK-01+ | **Referenced** |
| **SMW** | Social media workflow | `11-social-media-workflow.md` | SMW-01+ | **Referenced** |
| **CS** | Customer support | `12-customer-support.md` | CS-01+ | **Referenced** |
| **SOP** | Standard operating procedures | `13-standard-operating-procedures.md` | SOP-01+ | **Referenced** |

*Rule counts and full text consolidation: **Not Yet Completed**.*

---

## 3. Rule Type Taxonomy

| Type | Definition | Examples |
|------|------------|----------|
| **Founder Policy** | Strategic/non-negotiable business decisions set by founders | SM-17, EX-10, BR-14 |
| **Current State Fact** | How the business operates today (may change) | SM-02, SM-08 |
| **Tactical Execution (Zakir)** | Day-to-day operational practice | SM-04, SM-07 |
| **Operational Guardrail** | System/AI boundary—human approval required | AO-03, AI-03, VM-02 |
| **Documentation Standard** | How the Business Bible must be written | VM-01, FW-01, SOP-01 |

Rules must be labelled with **Type**, **Status** (Confirmed / Provisional / Not Defined), and **Source document**.

---

## 4. Rule Governance

### Current State

Business rule changes require approval from **both Ilyas and Zakir**.

Current approach:

- **Zakir** provides operational input (manages day-to-day execution)
- **Ilyas** provides business direction, governance, and final alignment
- Both should agree before changing important business rules affecting operations, customers, pricing, finance, or workflows

### Founder Policy

Joint approval required for material business rule changes (Ilyas + Zakir).

### Future Vision

Event OS should record rule change proposals with approver sign-off (Ilyas + Zakir) and maintain rule version history.

---

## 5. Known Cross-Document Rule Dependencies

| Topic | Rules | Notes |
|-------|-------|-------|
| Staff headcount | ST-01 (Doc 05) vs SM-02 (Doc 06) | **SM-02 authoritative** per Doc 06 v1.0; Doc 05 v1.1 synchronized |
| Decline if quality at risk | EX-10, ST-04, SM-17, CA-01 | Aligned across docs |
| Human approval for notifications | AO-03, AI-03, CS-02, SMW-02 | Aligned guardrails |
| Advance → Approved | BR-04, SP-04, BC-01, EX-02 | Aligned |

*Full conflict audit: **Not Yet Completed**.*

---

## 6. Event OS Business Rules Engine Requirements

### Phase 1 Hard Blocks (Founder + Operations)

For **Confirmed** rules, Phase 1 should enforce **hard blocks** (cannot proceed without explicit override) in these categories:

1. **Advance payment required before Approved**
   - Booking must not move to **Approved** until required advance payment is confirmed
2. **Event completion blocked on unresolved critical financial records**
   - Major procurement/payment records or cost variances require review before marking event **Completed** (aligned with Docs `07`, `09`)
3. **Required assignment/ownership before execution stages**
   - Event must not move forward without responsible ownership assigned (e.g., assigned staff/team or execution owner)

Other confirmed rules may remain **warnings/recommendations** until proven and formally confirmed for hard enforcement.

### Phase 1 (Must Have)

| Capability | Status |
|-----------|--------|
| Rule registry readable by module (sales, ops, staff, vendor, finance) | Future Vision |
| Rule provenance (source doc + rule ID + type) | Future Vision |
| Hard blocks for Phase 1 categories above | Future Vision |
| Warn/recommend for provisional rules | Future Vision |
| Rule status: Confirmed vs Provisional vs Not Defined | Future Vision |

### Guardrails

- Event OS must not enforce **Provisional** or **Not Yet Interviewed (Zakir)** rules as hard automation without human override.
- Rule changes require documented approval per governance model (Section 4).

### Provisional / Not Yet Interviewed Rules (Phase 1 Policy)

Rules marked **Provisional** or **Not Yet Interviewed (Zakir)** should be treated as:

**Warn / recommend (human must confirm)**

- System may display the rule and provide guidance
- Must **not** enforce as a hard restriction until officially confirmed and approved
- Users review and make the final decision

Purpose: allow business to evolve rules without blocking operations based on incomplete information.

---

## 7. Consolidation Roadmap

| Phase | Action | Status |
|-------|--------|--------|
| v0.1 | Master index + governance framework | **In progress** |
| v0.2+ | Copy confirmed rules from each domain doc into consolidated tables | **Not started** |
| v1.0 | Founder + Operations approval of master registry | **Not started** |

---

## 8. Current State (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Rule location | Distributed across `02`–`13` domain registries |
| Master file | Index only in v0.1; full consolidation pending |
| Governance | Joint approval (Ilyas + Zakir) for material rule changes |
| Provisional rules | Warn/recommend only; no hard enforcement until confirmed |

---

## 9. Future Vision (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Phase 1 hard blocks | Advance before Approved; financial review before Completed; ownership before execution |
| Provisional rules | Warn/recommend; human confirms |
| Consolidation | Incremental merge from domain docs with joint approval |

---

## 10. Open Questions (Interview Backlog)

- Who approves new/changed business rules?
- Whether provisional rules (Not Yet Interviewed Zakir) can ship in Event OS as recommendations only
- Priority rules for Phase 1 rules engine enforcement vs display-only

---

## 11. Document Status

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Interview status** | Governance: **Captured** (joint approval, provisional handling, Phase 1 hard blocks) |
| **Next step** | Paused at v0.1 framework; full rule consolidation deferred until domain docs stabilized |
