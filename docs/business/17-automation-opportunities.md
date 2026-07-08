# We Decor Events — Automation Opportunities

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Ilyas (Co-Founder, We Decor Events) |
| **Primary Reviewer** | Zakir (Co-Founder, We Decor Events) |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Version** | 0.1 |
| **Created Date** | 2026-07-08 |
| **Last Updated** | 2026-07-08 |
| **Next Review Date** | Not Defined |
| **Document Purpose** | Define automation and AI-assisted opportunities for We Decor Events—derived from pain points (`16-pain-points.md`) and domain gaps—with explicit human-approval guardrails for Event OS. Distinguish Phase 1 automation from Future Vision. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-08 | Ilyas + Zakir (Interview in progress) | Initial automation opportunities framework. Opportunities pending founder validation interview. |

---

## Purpose of This Document

This document:

1. Maps **pain points** → **automation/assistance opportunities**
2. Classifies opportunities as **Phase 1** vs **Future Vision**
3. Defines **automation guardrails** (human approval, no auto-customer/staff notifications without review)
4. Distinguishes **automation** (workflow assistance) from **AI** (recommendations, summaries)
5. Records what must **remain manual** by founder policy

Opportunities must be **derived from documented pains/gaps**—not invented.

**Intended audience:** Founders, product managers, engineers, AI agents, investors.

**Source:** Founder interview (Ilyas) + Tactical interview (Zakir), July 2026–July 2027  
**Status:** Version 0.1 — Draft (Document 17 of 20)

**Prerequisites:**
- [16-pain-points.md](./16-pain-points.md)
- [14-business-rules.md](./14-business-rules.md) (guardrails)
- Domain docs `04`–`13` (module-specific AI/automation notes)

---

## 1. Executive Summary

### Current State

We Decor has **minimal automation** today. Operations rely on human coordination (Zakir), WhatsApp, and disconnected applications.

Documented guardrails across Business Bible:

- No auto-send customer communications without human approval (`04` AI-03, `12` CS-02)
- No auto-send staff notifications without human approval (`05` AO-03)
- No auto-publish social content (`11` SMW-02)
- No auto vendor purchase/payment (`07` VM-02)
- Provisional rules: warn/recommend only (`14`)

### Founder Policy

Phase 1 automation priorities defined (Section 4). All assistance requires human approval per guardrails (Section 2).

### Future Vision

Technology reduces operational dependency on single coordinators while preserving human judgement.

---

## 2. Automation Principles & Guardrails

### Founder Policy (Cross-document)

| Principle | Source |
|-----------|--------|
| AI/automation **assists**; humans **decide** commercial and operational commitments | `04`, `05` |
| Never auto-notify customers without human approval | `04` AI-03 |
| Never auto-notify staff without human approval | `05` AO-03 |
| Never auto-publish social content | `11` SMW-02 |
| Never auto-purchase or auto-pay vendors | `07` VM-02 |
| Provisional business rules: warn/recommend only | `14` |

### What Must Remain Manual (Phase 1 Policy)

**All can suggest; nothing auto-executes.**

Event OS may provide recommendations and assistance, but **final decisions must remain with humans**.

The following must **always require human approval** before any action:

- Customer communication and commitments
- Vendor selection, negotiation, and payments
- Staff assignment decisions
- Pricing changes or customer quotations
- Event execution decisions

---

## 3. Pain → Opportunity Mapping

| Pain (`16`) | Opportunity area | Event OS module |
|-------------|------------------|-----------------|
| Zakir operational dependency | Operations workspace, calendar, checklists, assignment records | Operations, Calendar, Staff |
| No event profitability visibility | Payment + expense capture, variance flags | Finance, Vendor |
| Manual cross-area tracking | Unified event record, attachments, timelines | All modules |
| Inventory challenges | Movement states, packing checklists | Inventory |
| Scaling + quality | SOP-linked checklists, status visibility | Operations, SOP |

*Detailed opportunity list: **Pending interview**.*

---

## 4. Phase 1 Automation Opportunities

### Top 3 Priorities (Founder + Operations)

All Phase 1 automations work as **recommendations/assistance with human approval**—not full autopilot.

1. **Event Workspace Automation**
   - Automatically create event workspace and required operational tasks/checklists once booking is **Approved**
   - Include execution checklist, packing requirements, and important event details
2. **Material/Packing Checklist Generation**
   - Generate suggested packing list based on event type, design requirements, and previous similar events
   - Zakir/team review and modify before execution
3. **Staff Assignment Recommendations**
   - Suggest suitable staff allocation based on event requirements and availability
   - Final assignment decision remains with **Zakir**

### Future Vision

Additional automation (calendar conflicts, procurement variance flags, payment reminders, AI summaries) deferred to later phases unless promoted by interview.

---

## 5. Future Vision Automation & AI

### Cross-references (domain docs — not consolidated)

| Domain | AI/Automation notes | Source |
|--------|---------------------|--------|
| Sales | AI assists quoting/follow-up; human approves | `04` |
| Operations | Conflict detection, checklists, travel warnings | `05` |
| Staff | Staffing recommendations; human approval | `06` |
| Vendor | Price variance alerts; procurement timeline | `07` |
| Finance | Variance review before Completed | `09` |
| Marketing | Funnel dashboards (not auto-actions) | `10` |

---

## 6. What Not to Automate

### Founder Policy (Phase 1)

See [Section 2 — What Must Remain Manual](#2-automation-principles--guardrails).

No auto-execution in Phase 1 for customer comms, vendor actions, staff assignment, pricing/quotes, or execution decisions.

---

## 7. Event OS Automation Module Requirements

### Phase 1 (Must Have)

| Capability | Status |
|-----------|--------|
| Human approval gates on notifications and status changes | Future Vision |
| Workflow assistance (reminders, checklists, conflict warnings) | Future Vision |
| Audit trail for automated suggestions accepted/rejected | Future Vision |

---

## 8. Current State (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Automation today | Minimal; manual coordination dominant |
| Guardrails | Documented across `04`–`14`; human approval required |
| Phase 1 priorities | Event workspace automation; packing checklist generation; staff assignment recommendations |

---

## 9. Future Vision (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Phase 1 | Workspace + checklists + staff recommendations (human-approved) |
| Deferred | Full autopilot, auto-notifications, auto-purchases, auto-customer messages |

---

## 10. Document Status

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Interview status** | Phase 1 opportunities and guardrails: **Captured** |
| **Next step** | Paused at v0.1 core; deeper Phase 2/AI topics deferred |

**Next document:** [18-technology-systems-landscape.md](./18-technology-systems-landscape.md)
