# M4 — Feature Feasibility & Prioritization

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Based on** | `docs/ai/M4_AI_READINESS_AUDIT.md` + HEAD code |
| **Branch** | `release/m0-m1-core-workflows` @ `787e081` |

Scores: **1 = poor / hard**, **5 = strong / ready**.

---

## 1. Feature scores

| Feature | Business value | Data readiness | Implementation complexity* | Operational risk | Testability | Notes |
|---------|----------------|----------------|----------------------------|------------------|-------------|-------|
| **M4.1 Lead Intelligence** | 5 | 4 | 3 (complexity inverted: 3 = medium) | 2 | 4 | Lead fields + notes + follow-ups exist |
| **M4.2 Quotation Assistant** | 5 | **1** (catalogue) / 3 (free-text only) | 4–5 | 4 | 3 | Catalogue missing; financial risk if totals drift |
| **M4.3 Event Planning** | 4 | 4 | 3 | 2 | 4 | Tasks/checklists/booking data exist |
| **M4.4 Business Intelligence** | 5 | **5** | 3 | 3 | **5** | Dashboards/analytics already deterministic |
| **M4.5 Communication Assistant** | 4 | 4 | 3 | 3 | 4 | M3 email + CommunicationRecord; must stay human-gated |

\*Complexity: higher = harder. Risk: higher = more dangerous if wrong.

### Composite readiness (value × data / complexity risk)

Recommended order by **evidence**, not by M4.x numbering:

1. **M4.4 Business Intelligence** — highest data readiness; safest if tools wrap existing services.
2. **M4.1 Lead Intelligence** — strong CRM fields; no catalogue dependency.
3. **M4.5 Communication Assistant** — drafts only; send already explicit.
4. **M4.3 Event Planning** — rich ops data; careful with status semantics.
5. **M4.2 Quotation Assistant** — **postpone catalogue-grounded mode**; optional thin free-text suggester after M4.1.

---

## 2. Feature detail

### M4.1 — Lead Intelligence

| | |
|--|--|
| **Outcome** | Summaries, extracted requirements, missing-info prompts, follow-up priority suggestions |
| **Existing** | `Lead`, `FollowUp`, `LeadStageHistory`, lead APIs, customer link, notes |
| **Missing** | Dedicated enquiry transcript entity; qualification score (optional) |
| **Dependencies** | LLM provider port; prompt versioning; authz (`leads:read`) |
| **Risks** | Invented budget/dates; overconfident “hot lead” labels |
| **Can start?** | **Yes** (immediately after LLM scaffolding) |

### M4.2 — Quotation Assistant

| | |
|--|--|
| **Outcome** | Suggested line items / quantities / pricing explanations |
| **Existing** | Free-form `QuotationLineItem`; `calculateQuotationTotals`; revise/supersede; PDF |
| **Missing** | **Décor/service catalogue**, package pricing, catalogue search API |
| **Dependencies** | Catalogue domain **or** explicit free-text-only scope |
| **Risks** | LLM invents SKUs/prices; bypasses totals calculator; customer-facing wrong quotes |
| **Can start?** | **Only** as “draft free-text lines for human edit” **or** after catalogue milestone |

### M4.3 — Event Planning Assistant

| | |
|--|--|
| **Outcome** | Checklists, timelines, missing tasks, risk notes |
| **Existing** | `Event`, `Task`, `EventChecklist` / templates, staff scheduling heuristics, workspace |
| **Missing** | Perfect FSM UX for all statuses (product debt) |
| **Dependencies** | `bookings:read`, `tasks:*`, `checklists:*` |
| **Risks** | Suggesting impossible dates; ignoring cancellations |
| **Can start?** | **Yes**, after M4.1 scaffolding reusable |

### M4.4 — Business Intelligence Assistant

| | |
|--|--|
| **Outcome** | NL questions answered from EventOS records |
| **Existing** | `AnalyticsApplicationService`, `DashboardController` KPIs, profitability service |
| **Missing** | NL→tool router; allowlist of tools; refusal for unsupported questions |
| **Dependencies** | `analytics:read` / `dashboards:read` / finance permissions; no raw SQL tool |
| **Risks** | Wrong date windows; leaking cross-tenant data (mitigated if tools are tenant-scoped services); LLM math |
| **Can start?** | **Yes — recommended first vertical after shared LLM port** |

### M4.5 — Communication Assistant

| | |
|--|--|
| **Outcome** | Draft emails / follow-ups; history summaries |
| **Existing** | Communication records; outbound email; quotation/invoice email endpoints |
| **Missing** | Draft entity or Suggestion payload for “approve to send” |
| **Dependencies** | Human approval UX; never auto-call `…/email` |
| **Risks** | Invented prices/promises; accidental send |
| **Can start?** | **Yes**, after M4.1/M4.4 patterns for grounding |

---

## 3. Dependency graph

```
shared/llm + modules/ai (provider, prompts, execution log, authz)
        │
        ├── M4.4 BI tools ──► Analytics/Dashboard/Profitability services
        ├── M4.1 Lead tools ──► Lead/Customer/Communication read services
        ├── M4.5 Draft tools ──► Communication read + (optional) Suggestion accept → send
        ├── M4.3 Planning tools ──► Booking/Task/Checklist services
        └── M4.2 Quote tools ──► BLOCKED on catalogue OR free-text-only mode
                                      └── calculateQuotationTotals (never LLM)
```

---

## 4. Classification

| Class | Features |
|-------|----------|
| Implement soon (after LLM scaffold) | M4.4, M4.1, M4.5 drafts, M4.3 |
| Needs domain model improvement | M4.2 catalogue-grounded suggestions; optional `leadId` on communications; expose `PATCH /leads/:id` |
| Needs new operational capability | Optional: AI usage metering; draft-approval UI; unify outstanding-balance contract for BI |
| Needs bugfix (parallel) | Quotation discount/tax PATCH without `calculateQuotationTotals` |
| Postpone | Multi-agent planners, RAG/vector DB, LangChain, autonomous sends, catalogue-dependent quoting |

---

## 5. Recommended implementation sequence

| Step | Milestone | Why |
|------|-----------|-----|
| 0 | AI foundation (provider port, execution log, tool authz) | Shared by all features |
| 1 | **M4.4** BI copilot (read-only tools) | Highest readiness; proves grounding |
| 2 | **M4.1** Lead intelligence | High sales value; low finance risk |
| 3 | **M4.5** Communication drafts + approval | Leverages M3 email |
| 4 | **M4.3** Planning assistant | Ops leverage |
| 5 | Catalogue domain (separate product milestone) | Unblocks honest M4.2 |
| 6 | **M4.2** catalogue-aware quotation assistant | Only after step 5 |

---

## 6. Risks across the program

1. Treating inventory stock as a décor catalogue (incorrect domain).
2. Letting the model compute revenue/totals.
3. Auto-sending customer email.
4. Logging full prompts with PII/secrets.
5. Building LangChain/multi-agent stacks before a single tool-using endpoint works.

---

*End of M4 feature feasibility.*
