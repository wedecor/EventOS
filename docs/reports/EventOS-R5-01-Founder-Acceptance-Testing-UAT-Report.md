# Event OS — R5-01 Founder Acceptance Testing (UAT) Report

| Field | Value |
|-------|-------|
| **Task** | R5-01 — Founder Acceptance Testing (UAT) |
| **Date** | 2026-07-13 |
| **Backend** | `1.0.0-rc1` (approved) |
| **Frontend** | `1.0.0-rc1` (approved) |
| **Authority** | Business Bible + `docs/business/19` §10 Success Criteria |
| **Environment** | Live API/web **not running** (`localhost:3000` / `:3001` → no response) |
| **Code / docs changed** | **None** (UAT report only) |

---

## 1. UAT Summary

### Purpose

Validate that Phase 1 Event OS satisfies the **founder-approved** Business Bible UAT bar (Doc `19` §10): reduce Zakir dependency via a single source of truth, with must-pass workflows W1–W5 and Zakir/Ilyas acceptance criteria Z1–Z5 / I1–I5.

### What was possible in this session

| Activity | Result |
|----------|--------|
| Map modules → Doc 19 UAT criteria | **Complete** |
| Cross-check RC engineering evidence (F1-16 / F1-17) | **Complete** |
| Classify intentional Phase 1 gaps vs defects | **Complete** |
| Live founder walkthrough on running system | **Not possible** — no live API/Admin Portal |
| Joint founder sign-off (Ilyas + Zakir) | **Not obtained** — requires live UAT |

### Overall UAT outcome

| Outcome | Status |
|---------|--------|
| Engineering RC readiness | **Pass** (prior F1-16 / F1-17) |
| Official Founder UAT execution | **BLOCKED / PENDING** |
| Founder sign-off recommendation | **Not ready to sign off yet** — schedule live UAT |
| Production release recommendation | **Hold production go-live** until live FAT + joint founder approval |

**Go-live rule (Doc 19):** Phase 1 is accepted when §2–§5 criteria are **demonstrated on real We Decor events** and **both founders approve**. That demonstration has not occurred in this session.

---

## 2. Module-by-module results

Legend:

- **Eng Ready** — implemented in RC1 within approved F1 scope; unit/OpenAPI validated  
- **Live UAT** — founder-executable scenario on running system  
- **Gap** — intentional Phase 1 limitation (not a defect)

| Module | Eng Ready | Live UAT | Happy-path expectation | Result | Notes |
|--------|-----------|----------|------------------------|--------|-------|
| **Authentication** | Yes | Pending | Login, refresh, logout, password change; session revoke on password change | **Pending live** | F1-02 + F1-15; unit-tested |
| **Dashboard** | Yes | Pending | Founder KPIs + ops attention metrics | **Pending live** | Supports I2 / I3 partially |
| **Customers** | Narrow | Pending | Hub create/view/edit by id | **Pending live** | No list (OpenAPI); no contacts/timeline UI (**Gap**) |
| **Leads** | Narrow | Pending | List/create/stage/assign/follow-up | **Pending live** | Supports W5 start |
| **Quotations** | Narrow | Pending | Create/view/edit/send/approve/reject/revise | **Pending live** | No PDF/line-item UI (**Gap**); approve drives booking |
| **Bookings** | Narrow | Pending | Hub by id; status/cancel/complete/owner/stage advance | **Pending live** | No list (**Gap**) |
| **Event Workspace** | Narrow | Pending | View thin workspace; activate | **Pending live** | Not full ops hub (**Gap** vs Z3 rich intent) |
| **Vendors** | Narrow | Pending | Vendor master CRUD + issue note | **Pending live** | No procurement UI (**Gap** — W3) |
| **Staff** | Narrow | Pending | Staff master CRUD | **Pending live** | No assignment UI (**Gap** — Z3) |
| **Inventory** | Narrow | Pending | Item master + booking movements + transition + damage note | **Pending live** | No packing checklist/photos (**Gap** — Z2/W2 partial) |
| **Finance** | Narrow | Pending | Booking payments/invoices/expenses/profitability | **Pending live** | No proof upload/PDF (**Gap** — W4 partial) |
| **Reports** | Yes | Pending | Unused dashboard summaries + monthly chart | **Pending live** | No export (**Gap**) |
| **Settings** | Narrow | Pending | Tenant settings + password; Team/Templates/Integrations placeholders | **Pending live** | Placeholders = **Gap** |

### Doc 19 acceptance criteria vs RC1 product surface

| Criterion | Bible intent | RC1 delivery | UAT status |
|-----------|--------------|--------------|------------|
| **Z1** Approved events + prep status | One place | Dashboard ops + booking hub + execution stages | **Capable — Pending live** |
| **Z2** Structured checklists | Tasks/checklists SoT | **Tasks UI not shipped** (API exists) | **Partial / Gap** |
| **Z3** Staff + vendor from workspace | Workspace coordination | Thin workspace; staff/vendor **masters** only; assignments/procurement **no UI** | **Partial / Gap** |
| **Z4** Inventory planned→ready | Per-event movement FSM | Booking-scoped movements + `toStatus` | **Capable — Pending live** |
| **Z5** Payments/expenses/profitability | Per event | Booking finance panels | **Capable — Pending live** (proofs upload Gap) |
| **I1** E2E visibility | Enquiry→completion | Lead→quote→booking→workspace→finance path exists | **Capable — Pending live** |
| **I2** Founder KPIs | EP1-KPI-001–007 | Dashboard founder + settings targets | **Capable — Pending live** (targets values founder TBD) |
| **I3** At-risk events | Prep / payments / procurement | Dashboard pending payments + ops; procurement **no UI** | **Partial — Pending live** |
| **I4** Approval workflows | Human gates | Quote approve/reject; suggestion-only policy | **Capable — Pending live** |
| **I5** Per-event margin | Profitability | Booking profitability | **Capable — Pending live** |
| **W1** Approved → execution | Workspace + prep + staff + execution | Workspace activate + stages; staff assign UI **Gap** | **Partial — Pending live** |
| **W2** Prep → inventory | Checklist + movement | Movements yes; packing checklist UI **Gap** | **Partial — Pending live** |
| **W3** Vendor procurement | Full PO timeline | Vendor master only; procurement UI **Gap** | **Not demonstrable in UI** |
| **W4** Payment → financial completion | Proofs + P&L + complete | Payments/expenses/P&L yes; proof upload **Gap** | **Partial — Pending live** |
| **W5** Lead → booking | No duplicate entry | Lead→quote approve→booking | **Capable — Pending live** |

---

## 3. Defects

### Critical

**None identified** in RC engineering or OpenAPI conformance.

### High

**None identified** as product defects.  
*(W3 procurement UI absence is an **intentional Phase 1 gap**, not a regression.)*

### Medium

| ID | Finding | Classification |
|----|---------|----------------|
| UAT-M1 | Live Founder UAT could not execute (API/web down) | **Process / environment** — blocks sign-off, not a product bug |
| UAT-M2 | Doc 19 Z2/Z3/W3 exceed shipped Admin Portal UI (tasks, assignments, procurements) | **Intentional scope gap** — confirm with founders before treating as defect |

### Low / Cosmetic

| ID | Finding | Classification |
|----|---------|----------------|
| UAT-L1 | Settings Team / Templates / Integrations placeholders visible | Intentional IA placeholders |
| UAT-L2 | Hub-when-no-list UX (paste UUID) for customers/quotes/bookings | Intentional (no list APIs) |
| UAT-L3 | Reports bundle size / no chart code-split | F1-16 minor note |

### Failed scenarios (live)

**None executed** — environment blocked. Do not invent failures.

### Passed scenarios (engineering pre-checks only)

| Scenario | Evidence |
|----------|----------|
| Frontend validate | F1-17 `pnpm validate` pass |
| RBAC parity | F1-17 identical matrices |
| OpenAPI client paths | F1-17 unmatched = 0 |
| Auth API contracts | Unit tests login/refresh/logout/change-password |
| Module scopes | F1-01–F1-15 reports + F1-16 review |

These are **engineering gates**, not founder UAT passes.

---

## 4. Intentional Phase 1 gaps (must not be treated as bugs)

| Gap | Affects |
|-----|---------|
| No client/quotation/booking list endpoints | Hub UX |
| Quotation PDF / line-item UI | EP1-FIN-001 UI completeness |
| Tasks / checklist UI | Z2, W1/W2 |
| Suggestions accept/dismiss UI | Automation UX |
| Staff-assignments UI | Z3, W1 |
| Procurement UI | Z3, W3, I3 procurement issues |
| Inventory photos / packing lists | Z2, W2 |
| Finance proof upload / PDF / global lists | W4 |
| Reports CSV/Excel/PDF | Reporting |
| Branding; Settings Team/Templates/Integrations | Settings |
| WhatsApp remains external | Doc 19 constraint — **expected** |

---

## 5. Founder sign-off recommendation

### **DO NOT SIGN OFF YET**

Recommended founder actions:

1. Start API + Admin Portal (or staging) with seed data  
2. Execute live script below as **Ilyas** (owner) and **Zakir** (ops role as applicable)  
3. Explicitly accept or reject intentional gaps (especially **W3 procurement UI**, **Z2 checklists**, **Z3 assignments**)  
4. Joint written approval when Z/I/W criteria that remain in Phase 1 scope are demonstrated  

### Suggested live FAT script (minimum)

1. Login → Dashboard KPIs load  
2. Create lead → follow-up → create quotation → send → approve  
3. Open booking hub → set execution owner → advance stage → activate workspace  
4. Inventory: plan movement → transition toward cleaned/ready  
5. Finance: record payment + expense → view profitability  
6. Reports: open sales/finance/monthly revenue  
7. Settings: edit business name / targets; Security: change password (re-login)  
8. Logout / forbidden for role without permission  

---

## 6. Production readiness recommendation

| Layer | Recommendation |
|-------|----------------|
| Engineering / RC | **Ready** — do not reopen feature scope for UAT blockers that are intentional gaps |
| Founder UAT | **Incomplete** — blocked pending live environment + founder execution |
| Production go-live | **HOLD** until Doc 19 go-live rule is met (live demo + **Ilyas + Zakir** approval) |
| If founders accept gaps | Document acceptance of Partial Z2/Z3/W3 as Phase 1 exit criteria amendment via Scope Change Rule, then proceed to production |

---

## 7. Sign-off checklist (Doc 19)

| Item | Status |
|------|--------|
| Primary success statement understood | Captured (Bible) |
| Z1–Z5 demonstrated live | **Pending** |
| I1–I5 demonstrated live | **Pending** |
| P1–P5 reduction observed | **Pending** |
| W1–W5 run in Event OS | **Pending** (W3 UI not available) |
| Intentional gaps acknowledged by founders | **Pending** |
| Joint founder approval | **Pending** |

---

## STOP

UAT report complete. **No code, product, or engineering-documentation changes.**

Next: schedule **live Founder FAT** with Ilyas + Zakir, then production deployment only after joint approval.

---

*Report owner: Founding Engineering (facilitation)*  
*Founder approval: **Not yet obtained***  
*2026-07-13*
