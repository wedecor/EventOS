# We Decor Events — Sales Process

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Ilyas (Co-Founder, We Decor Events) |
| **Primary Reviewer** | Zakir (Co-Founder, We Decor Events) |
| **Status** | Approved (Founder interview complete; tactical execution pending Zakir validation) |
| **Version** | 1.0 |
| **Created Date** | 2026-07-07 |
| **Last Updated** | 2026-07-07 |
| **Next Review Date** | 2027-01-07 |
| **Document Purpose** | Define how We Decor Events converts enquiries into bookings—the sales philosophy, process, policies, metrics, pain points, intelligence requirements, AI boundaries, and Event OS Sales Module vision—from founder interviews. This is the authoritative reference for Sales, CRM, Quotation, and AI Sales Assistant module design. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-07 | Ilyas (Founder interview) | Initial interview capture across 18 sales topics (founder / business policy level) |
| 1.0 | 2026-07-07 | Yuva Minds (Editorial review) | **Approved.** Full document produced with sales rules registry, software implications, consistency review against `01`–`03`, quality audit; tactical execution flagged for dedicated Zakir interview |

---

## Purpose of This Document

This document describes **how We Decor sells today at the policy and process level**—from qualified handover to Zakir through won (Approved) or lost—not what the customer experiences (see `03-customer-journey.md`).

It is derived from direct founder interviews (July 2026–July 2027). **Founder business policy** is distinguished from **tactical sales execution**, which remains **Not Yet Interviewed (Zakir)** where noted. Metrics not tracked are marked **Not Currently Measured**—never estimated.

**Intended audience:** Founders, product managers, engineers, AI agents, investors, and business leaders building Event OS Sales, CRM, Quotation, Lead Scoring, Follow-up Automation, and Analytics modules.

**Source:** Founder interview (Ilyas), July 2026–July 2027  
**Status:** Version 1.0 — Approved (Document 04 of 20)

**Prerequisites:**
- [01-business-vision.md](./01-business-vision.md)
- [02-business-model.md](./02-business-model.md)
- [03-customer-journey.md](./03-customer-journey.md)

---

## Document Scope: Policy vs Execution

| Layer | Source | Status in This Document |
|-------|--------|-------------------------|
| **Founder business policy** | Ilyas interview | Documented as authoritative |
| **Tactical sales execution** | Zakir's day-to-day behaviour | Flagged **Not Yet Interviewed (Zakir)** |
| **Future Event OS vision** | Founder preference | Clearly labelled **Future Vision** |

A dedicated **Zakir interview** is required before tactical workflows (scripts, cadences, application field usage, negotiation tactics) can be documented as business practice. See [Open Questions — Zakir Interview Block](#zakir-interview-block).

---

## Executive Summary

We Decor's sales process is **requirement-led, trust-first, and customized**. **Ilyas** qualifies and assigns every lead; **Zakir** owns discovery through close on WhatsApp. There is **no sales playbook**, **no objection handling guide**, and **no structured win/loss or negotiation logging**. Success is not booking-only: understanding requirements, delivering an accurate executable quotation, and building trust matter even when the customer does not book.

**Booking is won only at Approved** — advance payment (~20%) verified by Zakir. Verbal agreement does not reserve the event date. Negotiation adjusts **scope before price** (BR-14). Quotations are **PDF from Quotation and Billing Application**; apps are **not integrated** with Lead Management Application.

**Top sales pains:** fragmented customer information, WhatsApp dependency, manual follow-up with no pipeline visibility. **Top metrics to measure:** In Talks → Approved conversion, lost reasons, win rate by source, first response time, sales cycle length.

**AI policy (future):** AI assists as internal Sales Assistant; **never** auto-sends customer communication or issues quotations without human review.

**Event OS Sales Module phasing:** Phase 1 replace Lead Management Application; Phase 2 replace Quotation and Billing Application; Phase 3 retire legacy apps. Phase 1 priorities: unified pipeline, discovery gate, lead ↔ quote ↔ payment link, quotation creation, follow-up engine, WhatsApp timeline, design attachments, win/loss capture.

*For customer experience, see [03-customer-journey.md](./03-customer-journey.md). For pipeline statuses and payment rules, see [02-business-model.md](./02-business-model.md).*

---

## 1. Sales Philosophy

### Current State

**Primary objective before price or quotation:** Zakir fully understands customer requirements to recommend a suitable decoration solution—not quote from the first message or predefined packages.

| Area | What Must Be Understood |
|------|-------------------------|
| Event context | Type, date, location, completion time, venue type |
| Customer intent | Celebration, expectations, clear idea vs needs guidance |
| Design direction | Style, theme, colours, inspiration, must-haves vs optional |
| Practical constraints | Budget if shared, space, venue constraints, access, urgency |
| Trust / buying context | Comparing decorators, need for confidence, decision speed |

**Explicit avoids before quotation:** No immediate price; no package without discussion; no scope commit without requirements; no pricing from first message alone.

**No formal sales philosophy document or playbook exists.** Founders align informally on: deliver what is promised, transparency, understand before committing, satisfaction and trust.

### Non-Negotiables

- Never promise undeliverable decoration  
- Never mislead on pricing or scope  
- Never increase price post-booking without genuine scope change  
- Never compromise trust to win a booking  

### Not Yet Interviewed (Zakir)

- Price-first enquiry handling and redirect language  
- Discovery "complete enough" criteria  
- Whether approximate price shared before requirements  
- Insistence on price before details — outcomes  

### Future Vision

Formal sales philosophy may emerge from doc 04 + Zakir interview. Event OS enforces policy (requirement gate) without replacing judgement.

---

## 2. Sales Objectives

### Primary Objective

- Understand requirements correctly  
- Recommend suitable decoration solution  
- Provide accurate, executable quotation  
- Build trust for informed decision  

If customer does not book for reasons outside We Decor's control, effort is still successful if executed professionally.

### Secondary Objectives

- Respond in reasonable time  
- Clear customized quotation  
- Positive impression  
- Likelihood of future return  
- Positive perception even if no booking  

**Not current sales objectives:** milestone capture, referral tracking, customer intelligence, quotation turnaround measurement.

### What "Winning" Means

| Outcome | Definition |
|---------|------------|
| **Win** | Advance paid → **Approved** |
| **Partial success (informal)** | Requirements understood, accurate quote delivered, trust built — no formal classification |

### Failure (Policy Level)

- Quote without understanding requirements  
- Promise undeliverable decoration  
- Incorrect pricing communicated  
- Post-booking price increase without scope change  
- Misleading customer  
- Trust damage  
- Avoidable internal loss  

Tactical failure (ghosting, follow-up timing) — **Not Yet Interviewed (Zakir)**.

### Explicit Targets

| Target | Status |
|--------|--------|
| ~10% enquiry → booking conversion | Documented (02) |
| ~30+ events/month (business goal) | Documented (02) |
| Response time SLA | **Not Set** |
| Quote turnaround, follow-up, cycle targets | **Not Set** |

---

## 3. Requirement Discovery

### Minimum Information Before Quotation (Founder Policy — Event OS Gate)

**Customer:** Name, phone/WhatsApp  

**Event:** Type, date, location (area), venue type  

**Requirements:** Vision/expectations, style/theme or agreed design direction, must-have elements, space available (where relevant)  

### Field Classification

| Information | Classification |
|-------------|----------------|
| Customer name, phone, event type, date, location (area), lead source | **Intake (Ilyas)** — mandatory |
| Venue type, vision, style/theme, must-haves, design direction, space | **Discovery (Zakir)** — mandatory before quote |
| Full address, completion time | **Discovery** — usually post-booking; not mandatory before quote |
| Budget | **Optional** |
| Inspiration photos | **Nice-to-have** |
| Referral source | **Not Currently Captured** |
| Comparing other decorators | **Not Yet Interviewed (Zakir)** |

### Intake vs Discovery Split

**Ilyas:** Name, phone, event type, date, location (area), lead source, budget if shared, notes  

**Zakir:** Venue type, vision, style/colours, must-haves, inspiration, space, constraints, design direction, completion time, full address (usually after booking)  

### Not Structured Today

Referral source, structured preferences, vision, agreed design direction, venue constraints, cross-event preferences.

---

## 4. Customer Qualification

### Qualified Opportunity (Informal)

Enquiry We Decor can realistically deliver with a customized executable quotation. **No formal definition documented.**

**Current practice:** Ilyas intake → if serviceable with required fields → assign Zakir → deeper qualification in discovery.

### Qualification Scenarios

| Scenario | Policy | Decision By |
|----------|--------|-------------|
| Bangalore service area | Accept & quote | Ilyas |
| Outside Bangalore | Case-by-case on feasibility | Either |
| Far within Bangalore | Accept if feasible — transport in quote | Either |
| Date fully booked | **Decline** | Zakir |
| Same-day capacity maxed | **Decline** | Zakir |
| Home celebrations | Accept & quote — core | Either |
| Weddings / hotel / resort | Accept & quote — capacity-dependent | Either |
| Corporate events | **Not Yet Defined** | — |
| Event management request | Evaluate feasibility — no blanket decline | Either |
| Budget below cost | **Adjust scope first** | Zakir |
| Price-only, no requirements | **Not Yet Interviewed (Zakir)** | — |
| Undeliverable / unsafe | **Decline** | Zakir |
| Abusive customer | **Not Formally Defined** | — |

### Decline Authority

- **Ilyas:** Intake — obvious serviceability issues  
- **Zakir:** Capacity, feasibility, scope  
- **No dual-approval workflow**  

### Founder Qualification Principles

Accept what can be executed well; do not overbook; adjust scope before budget-based rejection; never compromise quality to win.

---

## 5. Budget Discovery

### Current State

| Policy | Detail |
|--------|--------|
| When discussed | During discovery if relevant — not required before requirements |
| Actively ask | **Sometimes** — not required for every customer |
| Minimum booking value | **None formal** (~₹3,000 events exist) |
| Quote without budget | **Yes** — if requirements sufficient |
| Budget vs design order | Requirements → ideas → quote — sequence **Not Yet Interviewed (Zakir)** |
| Price exceeds budget | Adjust scope first; decline if core expectations unachievable |
| Revision rounds | **No limit defined** |
| Budget field update | **No policy** |

### Founder Budget Principles

Budget supports design; requirements first; adjust scope before reject; budget helpful not mandatory; trust over forcing early disclosure.

### Future Vision (Event OS)

Budget: **optional, recommended, non-blocking** quotation field.

---

## 6. Design Recommendation

### Current State

| Area | Policy |
|------|--------|
| Sources | Past We Decor photos/videos, customer inspiration, internet references |
| Approach | No fixed option count — shared understanding goal — workflow **Not Yet Interviewed (Zakir)** |
| Approval checkpoint | Customer indicates concept acceptable — typically WhatsApp — **no formal workflow** |
| Customer inspiration | Inspiration — **not exact reproduction**; depends on budget, venue, feasibility |
| Changes pre-quote | Design may evolve until quotation finalized |
| Design record | **WhatsApp only** |
| Undecided customer | Guide via questions + portfolio — tactics **Not Yet Interviewed (Zakir)** |

**Agreed design direction = shared understanding**, not legally binding or pixel-perfect approval.

### Future Vision (Event OS)

Link reference photos, record direction, version history. **Recommend** design confirmation; **do not hard-block** quotation for missing formal approval record.

---

## 7. Pricing Strategy (Sales Conversation)

*Commercial pricing model in [02-business-model.md](./02-business-model.md#pricing-strategy). This section covers price communication during In Talks.*

### Current State

| Area | Policy |
|------|--------|
| Verbal price before PDF | Not prohibited, not required — **Not Yet Interviewed (Zakir)** |
| First formal offer | PDF from Quotation and Billing Application |
| Customer presentation | Single bundled price (BR-12) — no line-item breakdown |
| Price drivers explained | Design, requirements, venue, distance, complexity — not internal math |
| Scope change pricing | Customer informed of revised value — PDF vs WhatsApp **Not Yet Interviewed (Zakir)** |
| Pre-Approved price change | Scope/design/requirement changes only — not arbitrary |
| Negotiation exceptions | **None documented** (BR-14) |
| Authority | Zakir full authority — no value ceiling |

### Future Vision (Event OS)

**Internal view:** materials, labour, transport, margin. **Customer view:** bundled quote, scope, terms only.

---

## 8. Quotation Creation

### Process (Confirmed)

```
Review requirements (WhatsApp + Lead Management Application)
    → Review design direction (WhatsApp)
    → Calculate price (mental model)
    → Create quotation (Quotation and Billing Application)
    → Generate PDF
    → Send via WhatsApp
    → Discussion / revisions (WhatsApp)
```

| Attribute | Status |
|-----------|--------|
| Owner | Zakir only |
| Quotation number | **Yes** |
| Search past quotes | **Yes** — similar events |
| Lead integration | **None** |
| Post-send lead update | **No auto-sync** — manual **Not Yet Interviewed (Zakir)** |
| Official offer | PDF |
| Revisions | Update existing quotation (BR-15) |
| Validity | No formal expiry (BR-17) |

### Application Fields (Founder-Level)

Customer name, quotation amount, decoration scope, payment terms, PDF details — exact screens **Not Yet Interviewed (Zakir)**.

---

## 9. Negotiation

### Current State

| Area | Policy |
|------|--------|
| Negotiator | **Zakir only** — Ilyas not involved post-handover |
| Method | **Adjust scope, not price** |
| Order when too expensive | Value → scope adjust → alternatives → decline |
| Scope-down documentation | Customer informed — PDF vs WhatsApp **Not Yet Interviewed (Zakir)** |
| Walk-away | No formal policy — judgement |
| Competitor matching | **No policy** |
| Verbal yes pre-advance | Not binding — scope/price may change until advance |
| Record | **WhatsApp only** |

### Future Vision

Structured negotiation history on customer timeline: objections, scope revisions, quote revisions, rounds, final scope and value.

---

## 10. Objection Handling

### Current State

| Objection | Founder Policy Response |
|-----------|-------------------------|
| Price too high | Negotiation order (Topic 9) |
| Cheaper competitor | No auto price match — value focus |
| Need to think / family | Respect — no pressure; follow-up **Not Yet Interviewed (Zakir)** |
| Resend quote / delayed | Re-share; no expiry (BR-17) |
| Exact photo match | Inspiration — feasibility factors |
| On-time completion | Reassure if realistic — never overpromise |
| Don't know what they want | Guide + portfolio — flow **Not Yet Interviewed (Zakir)** |
| Date availability | Capacity check — decline if unavailable |
| Add without price increase | Scope add → commercial impact considered |
| Ghosting | Follow-up exists — timing/stop **Not Yet Interviewed (Zakir)** |

**No objection playbook.** **No structured logging.**

### Future Vision

Objection category, date, response, outcome, lost reason on sales timeline.

---

## 11. Follow-up Strategy

### Current State

| Area | Policy |
|------|--------|
| Ownership | **Zakir** — Ilyas only if reassigned |
| Start | ASAP after assignment; continues while action pending |
| Reminders | Manual dates in Lead Management Application — **not mandatory** (BR-08) |
| Channels | WhatsApp primary; phone when needed — switch rule **Not Yet Interviewed (Zakir)** |
| Max follow-ups / days | **No policy** |
| Pre vs post quote | Same workflow; different objectives — tactics **Not Yet Interviewed (Zakir)** |
| Event date urgency | Increase urgency as date approaches — no escalation matrix |
| Content / scripts | **None** |
| Activity log | Reminder dates only — no attempt/response log |

### Future Vision

Intelligent reminders, AI recommendations, event-date priority — **assist judgement, not rigid cadence**.

---

## 12. Win/Loss Process

### Won — Approved

| Item | Policy |
|------|--------|
| Criteria | Advance received and verified (BR-04) |
| Verifier | Zakir — no dual approval |
| Record | Approved quote, advance amount, payment proof |
| Integration | No auto-sync to Quotation app |

### Not Interested

Customer **explicitly** declines. No required "why" question. No required close notification.

### Closed / Lost

No response, chose competitor, inactive after follow-up (BR-06). Close timing — **Zakir's judgement**.

### Lost Reasons (Known)

- Lower-priced competitor  
- Date unavailable  
- Others **Not Currently Measured**  

### Reopening

| Scenario | Policy |
|----------|--------|
| Same event returns | **Reopen** lead where practical |
| Different celebration | **New lead** (CJ-07) |

### Reporting

**None structured** today.

### Future Vision

Required lost-reason capture before close: price, date unavailable, event cancelled, no response, competitor, budget mismatch, not feasible, other + notes.

---

## 13. Booking Confirmation

### Current State

| Step | Policy |
|------|--------|
| Trigger | Customer told booking confirms on advance |
| Pre-advance | Quote accepted in principle; date **not guaranteed**; In Talks |
| Advance | ~20% of final quotation (BR-18) — calculated, not fixed round |
| Methods | UPI, bank transfer, cash (BR-20) — no preferred method |
| Sequence | Payment → verify → Approved → inform customer |
| Confirmation message | **No standard template** |
| At confirmation | Date, scope, advance received, balance after event |
| Cancellation terms at confirm | **Not required** |
| Quotation app | Advance recorded — workflow **Not Yet Interviewed (Zakir)** |
| Partial/wrong/pending payment | **Not confirmed** — stays In Talks |

**Date reserved only after Approved.**

---

## 14. Sales Metrics

### Known Today

| Metric | Usage |
|--------|-------|
| ~200 enquiries/month (ads active) | Documented only |
| ~10% conversion | Documented — high-level |
| ~80% Instagram Ads share | Documented only |
| 2–3 day sales cycle | Documented — not actively measured |
| 75+ Google reviews | Informal trust signal |

### Founder Priority (If Measuring Five Tomorrow)

1. In Talks → Approved conversion  
2. Lost reason distribution  
3. Win rate by lead source  
4. First response time  
5. Sales cycle length  

**Lower priority:** quote turnaround, win by event type, revision count, follow-up count, repeat/referral vs cold.

### Review Today

Ads Manager + approximate volume/bookings + judgement. **No formal sales review.** Lead Management Application not used for analytics.

### Future Event OS Dashboard

**Day one:** enquiries, pipeline by status, In Talks → Approved, lost reasons, win by source, pending follow-ups, approaching events without confirmation, bookings vs target.

**Later:** cycle by event type, response trends, quote turnaround, negotiation success, repeat/referral conversion, follow-up effectiveness, salesperson performance, LTV, revenue by source, forecast, AI insights.

---

## 15. Sales Pain Points

### Summary

Pain is **not primarily pricing or competition** — it is **fragmented information**, **WhatsApp dependency**, **manual follow-up**, and **no structured sales intelligence**. Knowledge lives in **Zakir's experience**.

### Top Three (High Impact)

1. **Fragmented customer information** — conversion, time, CX, stress  
2. **WhatsApp dependency** — time, stress (conversion/CX medium)  
3. **Manual follow-up + no visibility** — conversion, time, stress  

### Partially Solved

Lead Management Application reminders; separate intake/quote apps; status tracking.

### Accepted for Now

WhatsApp-primary; Zakir experience; manual judgement over rigid automation.

### Sales-Specific Additions (vs 03)

No negotiation history, objection tracking, quote analytics, win/loss intelligence, full pipeline visibility.

---

## 16. Sales Intelligence

### Current State

**Virtually none** — experience, WhatsApp, Ads Manager, approximate counts.

### Priority Questions

1. Why losing deals?  
2. Which source converts best?  
3. How long to decide?  
4. What objections most often?  
5. Which quotations never convert?  

### Domain Boundaries

| Domain | Owns |
|--------|------|
| **Sales Intelligence** | Conversion, win/loss, cycle, quote performance, follow-up, objections, source, pipeline |
| **Customer Intelligence** (03) | Profile, family, milestones, preferences, relationship timeline |
| **Financial Intelligence** (02) | Revenue, margin, ROI, costs |

Repeat customer conversion: **Customer Intelligence** primary; **Sales Intelligence** consumes as input.

### Alerts vs Reports

**Alerts:** stale In Talks, approaching event still open, quote no response, reminder due, high-value stale.  

**Reports:** conversion trends, lost analysis, source performance, pipeline, cycle, win/loss, follow-up effectiveness.

### MVP Feature

**Sales Opportunity Health Dashboard** — pipeline, stale deals, follow-ups, event urgency, lost reasons, source performance, funnel.

---

## 17. AI-Assisted Sales

### Current State

**No AI in sales today.**

### Future Policy Summary

| Area | Policy |
|------|--------|
| Draft responses, discovery prompts, design match, price suggest, scope-down, follow-up draft, objection suggest, win/loss extract, lead priority | **Yes — Future** (human review) |
| Auto-send follow-up | **No — Never** |
| Auto-issue quotation | **No — Never** |
| Qualification chatbot | **Yes — Future (Limited)** — transparent handover before sales |

### Human-Only (Always)

Requirements understanding, final design, final price, negotiation, booking confirm, payment verify, commitments, sensitive situations, delivery/timing/scope promises.

### Transparency

Internal AI OK if human reviews all customer-facing output. Direct AI customer contact must be transparent.

### Data Required Before AI

Customer/lead data, discovery data, sales history (quotes, negotiation, follow-up, win/loss), portfolio data. Without structured data → **low confidence**.

### First AI Feature

**AI Sales Assistant** — priority, completeness, similar events, quote suggest, portfolio, follow-up draft, objection hints, scope-down, pre-send checklist.

---

## 18. Future Event OS Sales Module

### Replace vs Integrate

| Phase | Action |
|-------|--------|
| **Phase 1** | Replace **Lead Management Application**; integrate with Quotation and Billing Application where needed |
| **Phase 2** | Replace **Quotation and Billing Application** — quotes, PDF, payment milestones, history |
| **Phase 3** | Retire both legacy apps |

### Phase 1 Capabilities (Priority)

1. Unified lead pipeline  
2. Requirement discovery checklist + quotation gate  
3. Lead ↔ quotation ↔ payment linkage  
4. Quotation creation (internal costing + customer PDF)  
5. Follow-up management + reminder engine  
6. WhatsApp communication timeline  
7. Design direction + reference attachments  
8. Win/loss + lost reason capture  

**Phase 2:** Opportunity Health Dashboard, negotiation/objection timeline, sales analytics  

**Phase 3:** AI Sales Assistant, predictive intelligence, opportunity scoring  

### Users & Permissions

| Role | Access |
|------|--------|
| **Ilyas** | Intake, qualification, assignment, pipeline monitoring, analytics — **no quote/pricing edit post-assignment** |
| **Zakir** | Full sales execution through closure |
| **Future sales staff** | Same as Zakir — role-based permissions |

No quotation approval workflow today; configurable approval **future optional**.

### Module Boundaries

| Module | Ownership |
|--------|-------------|
| **Sales** | Lead creation → **Approved** |
| **Customer Intelligence** | Profile, family, milestones, preferences — Sales reads/writes interaction history |
| **Calendar / Booking** | **After Approved** — scheduling, resources, execution |
| **Marketing** | Campaigns, attribution — feeds leads; Sales returns conversion outcomes |
| **Finance** | Payments, invoices, receivables, profitability — Sales initiates; Finance accounts |

### Success Criteria

**Qualitative:** No WhatsApp memory dependency; complete sales timeline; founders know every opportunity status; AI reduces admin without replacing judgement.

**Measurable (future — baselines Not Currently Measured):** Improved In Talks → Approved, faster response, faster quotes, higher follow-up completion, complete lost reasons, reduced memory dependency, higher repeat/referral conversion.

### Founder Vision

Event OS Sales Module is the **operational brain of sales** — people, process, context, quotations, communication, payments, AI in one founder-aligned workflow with **human control of every commercial decision**.

---

## Sales Process Rules

*Registry for Event OS. Cross-references `02-business-model.md` BR-01–31 and `03-customer-journey.md` CJ-01–31. Master registry planned for `14-business-rules.md`.*

### Sales Philosophy (SP)

| ID | Rule |
|----|------|
| SP-01 | Understand before quoting — not from first message alone |
| SP-02 | Every quotation customized — no fixed packages (BR-11) |
| SP-03 | Never commit to undeliverable decoration |
| SP-04 | Approved = advance verified (BR-04) |
| SP-05 | No price increase without scope change (BR-22–24) |
| SP-06 | Build long-term trust over single sale |

### Sales Objectives (SO)

| ID | Rule |
|----|------|
| SO-01 | Primary success = understanding + executable solution + accurate quote + trust |
| SO-02 | Approved = successful conversion |
| SO-03 | Violation of SP rules = sales failure |
| SO-04 | No formal partial-success classification today |
| SO-05 | ~10% conversion known benchmark; no other targets set |

### Requirement Discovery (RD)

| ID | Rule |
|----|------|
| RD-01 | Intake mandatory: name, phone, event type, date, area, lead source |
| RD-02 | Quote requires vision, style/theme, must-haves, agreed design direction |
| RD-03 | Venue type required before quotation |
| RD-04 | Space mandatory when impacts feasibility |
| RD-05 | Full address and completion time not mandatory before quote |
| RD-06 | Budget optional |
| RD-07 | Referral source not captured |
| RD-08 | Discovery detail primarily in WhatsApp today |

### Customer Qualification (CQ)

| ID | Rule |
|----|------|
| CQ-01 | No formal qualified-lead definition |
| CQ-02 | Serviceable intake → assign Zakir |
| CQ-03 | Decline if date/capacity unavailable |
| CQ-04 | Decline if cannot deliver to quality standard |
| CQ-05 | Outside Bangalore: case-by-case |
| CQ-06 | Budget mismatch: adjust scope before decline |
| CQ-07 | Either founder may decline |
| CQ-08 | Corporate events: not defined |
| CQ-09 | Price-only refusal handling: Not Yet Interviewed (Zakir) |

### Budget Discovery (BD)

| ID | Rule |
|----|------|
| BD-01 | Budget not mandatory before quotation |
| BD-02 | May request sometimes — not every customer |
| BD-03 | No formal minimum booking value |
| BD-04 | Quote allowed without budget if requirements sufficient |
| BD-05 | Price over budget: adjust scope before decline |
| BD-06 | Decline only if core expectations unachievable |
| BD-07 | No defined revision round limit |
| BD-09 | Future Event OS: budget optional, recommended, non-blocking |

### Design Recommendation (DR)

| ID | Rule |
|----|------|
| DR-01 | Agreed design direction required before final quotation |
| DR-02 | Agreement = customer indicates concept acceptable — typically WhatsApp |
| DR-03 | Reference images = inspiration, not exact guarantee |
| DR-04 | Execution depends on budget, venue, space, materials, feasibility |
| DR-05 | Design may change until quotation finalized |
| DR-06 | No structured design record today |
| DR-08 | Future: record direction; recommend, don't hard-block quote |

### Pricing Strategy — Sales (PS)

| ID | Rule |
|----|------|
| PS-01 | Formal commercial offer = PDF quotation |
| PS-02 | Customer price always bundled (BR-12) |
| PS-03 | Internal costing never exposed to customer |
| PS-04 | Pre-Approved price change only with scope/design/requirement change |
| PS-06 | Customer informed of revised price on scope change |
| PS-07 | Adjust scope before price — no documented exceptions (BR-14) |
| PS-08 | Zakir full quotation authority |

### Quotation Creation (QC)

| ID | Rule |
|----|------|
| QC-01 | All quotations by Zakir (BR-10) |
| QC-03 | Official quotation = PDF |
| QC-04 | Quotation number per quotation |
| QC-05 | No Lead Management Application integration today |
| QC-06 | Revisions update existing quotation (BR-15) |
| QC-07 | No formal validity period (BR-17) |

### Negotiation (NG)

| ID | Rule |
|----|------|
| NG-01 | Zakir owns commercial negotiation |
| NG-02 | Ilyas not involved in pricing negotiation post-handover |
| NG-03 | Adjust scope before price (BR-14) |
| NG-05 | Order: value → scope → alternatives → decline |
| NG-07 | No competitor price-matching policy |
| NG-08 | Verbal agreement ≠ booking (BR-04) |

### Objection Handling (OH)

| ID | Rule |
|----|------|
| OH-01 | No objection playbook today |
| OH-02 | Price → NG-05; competitor → no auto match |
| OH-05 | Punctuality → reassure only if deliverable |
| OH-06 | Date → capacity check; decline if unavailable |

### Follow-up (FU)

| ID | Rule |
|----|------|
| FU-01 | Zakir owns follow-up post-assignment |
| FU-04 | Manual reminders available — not mandatory (BR-08) |
| FU-05 | WhatsApp primary |
| FU-07 | Closed / Lost after inactivity — judgement (BR-06) |
| FU-08 | Increase urgency as event date approaches |

### Win/Loss (WL)

| ID | Rule |
|----|------|
| WL-01 | Approved = advance verified |
| WL-03 | Not Interested = explicit decline |
| WL-04 | Closed / Lost = inactive / competitor / no response (BR-06) |
| WL-05 | Lost reason not required today (BR-09) |
| WL-07 | Same event → reopen; different celebration → new lead |
| WL-09 | Future: structured lost-reason required |

### Booking Confirmation (BC)

| ID | Rule |
|----|------|
| BC-01 | Approved = advance verified |
| BC-02 | Verbal agreement does not reserve date |
| BC-03 | Date reserved only after Approved |
| BC-04 | Advance ~20% (BR-18) |
| BC-05 | Partial/incorrect/pending → In Talks |

### Sales Metrics (SM)

| ID | Rule |
|----|------|
| SM-01 | ~10% conversion benchmark |
| SM-04 | Measurement priority: conversion → lost reasons → source → response → cycle |

### Sales Intelligence (SI)

| ID | Rule |
|----|------|
| SI-01 | No structured sales intelligence today |
| SI-05 | Actionable insights over vanity metrics |
| SI-06 | Alerts for action; dashboards for trends |

### AI-Assisted Sales (AI)

| ID | Rule |
|----|------|
| AI-01 | No AI in sales today |
| AI-02 | AI assists; humans decide commercial commitments |
| AI-03 | Never auto-send customer communication |
| AI-04 | Never issue quotation without human review |
| AI-05 | Chatbot limited to qualification; human before sales discussion |

---

## Key Metrics

### Known (Sales-Relevant)

| Metric | Value | Confidence |
|--------|-------|------------|
| Enquiries/month (ads active) | ~200 | Approximate |
| Overall conversion | ~10% | Approximate |
| Instagram Ads enquiry share | ~80% | Approximate |
| Typical sales cycle | 2–3 days | Documented — not measured |
| Advance payment | ~20% | Standard practice |
| Google reviews | 75+ five-star | Known — trust signal |

### Not Currently Measured (Sales Priority)

| Metric | Founder Priority |
|--------|------------------|
| In Talks → Approved conversion | **1** |
| Lost reason distribution | **2** |
| Win rate by lead source | **3** |
| First response time | **4** |
| Sales cycle length | **5** |
| Quotation turnaround | Lower |
| Negotiation rounds | Lower |
| Follow-up count before win/loss | Lower |
| Repeat/referral vs cold conversion | Lower |

---

## Software Implications

*Event OS module design. Derived from documented sales gaps.*

### Phase 1 — Critical

| Gap | Implication |
|-----|-------------|
| Disconnected apps | Unified lead → quote → payment in Sales Module |
| No discovery gate | Requirement checklist + quotation create gate (RD-01, RD-02) |
| No lost reasons | Mandatory lost-reason on close (WL-09) |
| Manual follow-up | Task management + event-date priority |
| WhatsApp system of record | Communication timeline linked to lead |
| No design record | Design direction + reference attachments |

### Phase 2 — High

| Gap | Implication |
|-----|-------------|
| No sales intelligence | Opportunity Health Dashboard |
| No negotiation/objection log | Structured timelines |
| Zakir mental pricing | Internal costing view + historical suggest |

### Phase 3 — Strategic

| Gap | Implication |
|-----|-------------|
| No AI assist | AI Sales Assistant (human-in-the-loop) |
| No lead scoring | Event-date-aware priority ranking |

### Module Integration Map

```
Marketing → [Lead Intake: Ilyas] → Sales Module (New → In Talks)
    → Quotation → Negotiation → Follow-up
    → Approved (advance) → Calendar/Booking + Finance
    ↔ Customer Intelligence (profile, history)
Sales → returns conversion outcomes → Marketing
```

### AI Agent Guardrails

- Never invent requirements, prices, or commitments  
- Distinguish founder policy from Not Yet Interviewed (Zakir) tactics  
- Never auto-send customer messages or issue quotes (AI-03, AI-04)  
- Low confidence when structured data missing  
- Human approval required for all customer-facing output  

---

## Consistency Review

### Verified Consistent with `01-business-vision.md`

| Topic | Status |
|-------|--------|
| Trust before profit; deliver what we promise | ✓ SP-03, SP-06 |
| Speed and follow-up critical | ✓ FU-01, SM-04 priority |
| Decline rather than deliver poorly | ✓ CQ-04, SP-03 |
| No fixed packages | ✓ SP-02 |
| Technology as competitive advantage | ✓ Event OS Sales Module vision |

### Verified Consistent with `02-business-model.md`

| Topic | Status |
|-------|--------|
| Pipeline: New → In Talks → Approved → Completed | ✓ |
| BR-04 Approved = advance | ✓ BC-01, NG-08 |
| BR-08 manual follow-up reminders | ✓ FU-04 |
| BR-11–17 quotation rules | ✓ QC, PS |
| BR-14 scope not price | ✓ NG-03, BD-05 |
| BR-22–24 pricing integrity | ✓ SP-05 |
| Zakir quotes; Ilyas intake | ✓ |
| ~10% conversion; ~200 enquiries | ✓ SM-01 |
| Disconnected applications | ✓ QC-05 |
| Lost to price / date unavailable | ✓ WL, OH |

### Verified Consistent with `03-customer-journey.md`

| Topic | Status |
|-------|--------|
| Ilyas intake → Zakir sales | ✓ |
| WhatsApp-primary; Instagram qualification template | ✓ |
| PDF quotation via WhatsApp | ✓ QC-03 |
| No playbook; manual follow-up | ✓ FU, OH-01 |
| Each celebration = new lead; same-event reopen (04 extends) | ✓ WL-07 + CJ-07 |
| Customer pain points | ✓ Topic 15 confirms and extends |
| Customer Intelligence boundary | ✓ Topic 16 SI-03 |

### Known Cross-Document Notes

| Topic | Note |
|-------|------|
| Reopen same event vs new lead per celebration | **04 clarifies:** same event may reopen; different celebration = new lead — consistent with CJ-07 intent |
| 02 says quotation details recorded in Lead Management Application during In Talks | **04:** discovery/design primarily WhatsApp; quote in Quotation app — structural fragmentation confirmed |
| Tactical sales behaviour | **04 explicitly defers to Zakir interview** — not contradiction |

---

## Document Review & Quality Audit

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Business Clarity** | 9/10 | Founder policies clear across 18 topics; tactical gaps honestly flagged |
| **Sales Process Completeness** | 7.5/10 | Policy-complete; execution detail pending Zakir interview |
| **SaaS Readiness** | 9.5/10 | Phase 1–3 module plan, rules registry, integration map directly actionable |
| **AI Readiness** | 9.5/10 | Clear assist/never boundaries; data prerequisites documented |
| **Strategic Value** | 9/10 | Distinguishes policy vs execution; Event OS vision aligned with 02/03 |

**Overall document quality: 9/10**

**Why not 10/10:** Tactical sales execution (Zakir) not yet interviewed. No measured baselines for success metrics. Corporate event and abusive-customer policies undefined.

---

## Open Questions

### Zakir Interview Block

*Required before tactical sections can be upgraded from Not Yet Interviewed to business practice.*

**Sales Discovery**
- Price-first enquiry handling  
- Discovery completion criteria  
- Requirement gathering sequence  

**Design Recommendation**
- Number of options presented  
- Conversation flow for undecided customers  
- Design approval confirmation process  

**Pricing & Quotation**
- Verbal pricing before PDF  
- Revision workflow (PDF vs WhatsApp)  
- Exact Quotation and Billing Application workflow, fields, revision mechanics  
- Manual Lead Management Application updates after quote  

**Negotiation**
- Competitor quote handling  
- Scope revision process  
- Walk-away heuristics  

**Objection Handling & Follow-up**
- Standard responses; ghosting recovery; decision-delay follow-up  
- Cadence; WhatsApp vs phone; max attempts; reminder discipline  

**Booking Confirmation**
- Payment verification workflow  
- Confirmation message  
- Quotation app recording process  

### For Future Documents

| Document | Topics |
|----------|--------|
| `05-event-execution.md` | Post-Approved handoff to operations |
| `09-finance-workflow.md` | Payment recording, receivables |
| `10-marketing-workflow.md` | Attribution → Sales conversion loop |
| `14-business-rules.md` | Merge SP through AI rules |
| `15-kpis.md` | Sales KPI definitions and targets |

---

## Document Governance

### Document Owner

**Ilyas** (Co-Founder, We Decor Events)

### Primary Reviewer

**Zakir** (Co-Founder, We Decor Events) — **required** to validate tactical execution sections in Zakir interview block.

### Review Schedule

| Review Type | Frequency |
|-------------|-----------|
| Scheduled review | Every 6 months (Next: 2027-01-07) |
| Triggered review | Within 30 days of material sales process change |
| Zakir interview completion | Upgrade to v1.1 when tactical block validated |

### Changes Requiring Revision

- New pipeline statuses or handoff process  
- Quotation authority or approval workflow changes  
- Payment term changes (advance %, booking confirmation rules)  
- Formal sales playbook adoption  
- Event OS Phase 1 go-live (update current vs future sections)  
- AI policy changes for customer-facing automation  

### Freeze Policy

**Version 1.0 is frozen** for founder-level business policy. Tactical execution sections remain **provisional** until Zakir interview. Material business changes or Zakir validation increment version per governance rules. Next planned document: **`05-event-execution.md`**.

---

## Related Documents

### Business Bible

| Document | Relationship |
|----------|--------------|
| [01-business-vision.md](./01-business-vision.md) | **Prerequisite** — values, speed, trust |
| [02-business-model.md](./02-business-model.md) | **Prerequisite** — pipeline, pricing, BR-01–31 |
| [03-customer-journey.md](./03-customer-journey.md) | **Prerequisite** — customer experience (complementary scope) |
| [05-event-execution.md](./05-event-execution.md) | **Next** — post-Approved operations |
| [09-finance-workflow.md](./09-finance-workflow.md) | Payments, receivables |
| [10-marketing-workflow.md](./10-marketing-workflow.md) | Lead attribution, conversion loop |
| [14-business-rules.md](./14-business-rules.md) | Master rules registry |
| [15-kpis.md](./15-kpis.md) | KPI definitions |
| [17-automation-opportunities.md](./17-automation-opportunities.md) | Automation from sales gaps |

### Engineering Foundation

| Document | Relationship |
|----------|--------------|
| [04-business-domain.md](../04-business-domain.md) | Sales domain entities |
| [06-module-design.md](../06-module-design.md) | Lead, Quotation, CRM modules |
| [11-roadmap.md](../11-roadmap.md) | Sales Module delivery phases |

---

*Version 1.0 — Approved (founder policy)*  
*Last updated: 2026-07-07*  
*Source: Founder interview (Ilyas) + editorial review*  
*Tactical execution: Pending Zakir interview*  
*Next document: [05-event-execution.md](./05-event-execution.md)*
