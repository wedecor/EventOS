# EventOS — Gap Analysis

| Field | Value |
|-------|-------|
| **Audit date** | 2026-11-12 |
| **Git ref** | `snapshot/2026-11-04-wip` @ `91feb7b` |
| **Companion** | Feature matrix + project status |

---

## 1. Broken / incomplete end-to-end workflows

Traced against controllers + web clients. Status: **Connected · Partial · Broken · Missing**.

| # | Workflow step | Status | Gap |
|---|---------------|--------|-----|
| 1 | Customer creates enquiry | **Connected** | Lead create form (“Enquiry”); no separate enquiry entity; create doesn’t attach `customerId` |
| 2 | Business manages lead | **Partial** | Stage/assign/follow-up create OK; follow-up list/complete UI missing |
| 3 | Lead → event | **Broken (portal)** | Approve can create event only with confirmed advance; no lead/quotation payment UI |
| 4 | Decoration proposal | **Missing** | No décor/package domain |
| 5 | Quotation receive/approve | **Partial** | Lifecycle mutations exist; line items not manageable in UI; “send” doesn’t deliver externally |
| 6 | Advance payment recorded | **Partial / Broken for conversion** | Booking finance OK; pre-booking advance path disconnected in UI |
| 7 | Vendors + team assigned | **Connected** | Workspace + procurement/staff assignment APIs wired |
| 8 | Event execution tracked | **Partial** | Workspace/checklists strong; cannot enter `in_execution` |
| 9 | Final payment recorded | **Partial** | Another payment record; no distinct final-settlement workflow |
| 10 | Profitability calculated | **Connected** | API + UI panels |

### Highest-impact disconnects

1. **Quotation line items** — API write, no read/UI → Send/approve totals fragile.  
   *Files:* `quotation.controller.ts`, `quotations.api.ts`, `quotation-detail-page.tsx`
2. **Advance before booking** — API yes, UI no.  
   *Files:* `payment.controller.ts`, `booking.application.service.ts`, `payments-panel.tsx`
3. **`in_execution` transition** — Complete dead.  
   *Files:* `booking.controller.ts`, `booking.application.service.ts`, `booking-detail-page.tsx`
4. **Décor proposal** — entire product area missing.

---

## 2. Product gaps vs marketed / assumed capabilities

| Expected capability | Gap type | Notes |
|---------------------|----------|-------|
| AI lead qualification / NL quotes / assistants | **Missing** | No LLM stack |
| Décor catalogue & packages | **Missing** | No models |
| PDF proposals/invoices | **Missing** | No PDF libs |
| WhatsApp/email/SMS delivery | **Missing** | Comms = records only |
| Online payments (Razorpay etc.) | **Missing** | Manual payment entries |
| Multi-tenant SaaS billing | **Missing** | Single-tenant ADR-016 |
| File uploads (proofs/photos) | **Missing** | Metadata keys only |
| Notification center | **Stub** | Header “coming soon” |
| Team admin / Integrations settings | **UI placeholder** | `ModulePlaceholderPage` |
| Customer/quote/booking lists | **Missing APIs** | Open-by-id hubs |

---

## 3. Frontend gaps

| Gap | Evidence |
|-----|----------|
| Open-by-id hubs | customers, quotations, bookings, events, finance |
| Quotation line-item UI | Explicitly omitted in client |
| Follow-up complete | `PATCH /follow-ups/:id` unused |
| Lead/quotation payments | No screens |
| Team / Integrations | Placeholders |
| Dual Security nav | `navigation.ts` |
| Notifications / Profile | Disabled stubs |
| No Playwright e2e | Only Vitest unit |
| Responsive | Basic breakpoints present; not device-QA’d in this audit |
| a11y | Some aria labels; no axe suite |

**Positive:** Most module pages call real APIs (not fake JSON). Placeholders are labeled.

---

## 4. Backend / database gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| No transition to `in_execution` | **Critical (workflow)** | Complete gated on missing state |
| Missing list endpoints (clients, quotations, bookings) | **High (UX/product)** | |
| No GET quotation line-items | **High** | |
| No PDF / file / mail / WhatsApp / pay adapters | **High (integrations)** | |
| Global rate limiting absent | **High (security at internet scale)** | Login throttle only |
| Calendar/Analytics N+1 | **Medium** | Scale risk |
| Suggestion creators absent | **Medium** | Dead feature surface |
| BullMQ unused | **Low** | Dead dependency |
| Secondary indexes / If-Match consistency | **Medium** | P2-13 residual |
| Time-coupled unit fixtures (`validUntil` Aug 2026) | **High (CI)** | Suite red as of Nov 2026 |

---

## 5. AI engineering gaps

| Expected control | Status |
|------------------|--------|
| LLM provider integration | Absent |
| Prompt management | Absent |
| Tool calling | Absent |
| Structured output validation | Absent |
| Context / retrieval | Absent |
| Retry / cost / token tracking | Absent |
| Hallucination controls | Absent |
| Human approval | Pattern exists (`Suggestion` accept) but unused |
| AI evaluation tests | Absent |

**Do not confuse:** deterministic analytics KPIs and heuristic staff scoring are **not** AI.

---

## 6. Testing & reliability gaps

### Executed this audit

| Suite | Result |
|-------|--------|
| API Jest unit | **FAIL** — 696 pass, **5 fail**, 701 total |
| Web Vitest | **PASS** — 120/120 |
| API e2e | **Not run** (requires live DB/app; present 14 specs) |

### Failing tests (verified cause)

`quotation.application.service.spec.ts` — approve cases fail with `INVALID_STATE` because fixture `validUntil: 2026-08-31` is before audit date **2026-11-12**. Production approve logic correctly rejects expired quotes; **fixtures are stale**.

### Coverage gaps

- No browser e2e for W1–W5 Doc 19 workflows.
- No load tests for calendar/analytics.
- No contract test for API↔Web RBAC equality (P2-13 follow-up).
- No AI eval (N/A until LLM exists).

---

## 7. Security gaps (severity)

| ID | Finding | Severity |
|----|---------|----------|
| S1 | No global API rate limiting | **High** (public exposure) |
| S2 | Client-only route guards (static export) | **Medium** (mitigated by API authZ) |
| S3 | Production secrets / deploy not verified live | **Medium** (ops) |
| S4 | Optional Sentry; web APM unclear | **Low–Medium** |
| S5 | File upload security | **Info / N/A** until uploads ship |
| S6 | Payment gateway / webhook auth | **Info / N/A** |
| S7 | Prompt injection | **Info / N/A** |
| S8 | XSS via `dangerouslySetInnerHTML` | **Info** — none found |

Auth baseline (JWT pin, refresh rotation/reuse handling per P2-13, Zod validation, tenantId queries, Helmet/CORS) is comparatively **strong**.

---

## 8. Deployment / commercial gaps

| Gap | Status |
|-----|--------|
| Staging/prod cloud provision | Pending (checklist unchecked) |
| Web container / CDN bake | No web Dockerfile |
| Founder live UAT (R5-01) | Blocked / pending historically |
| Founder sign-off + `v1.0.0` | Not done |
| Branch reconcile snapshot ↔ main | Diverged |
| Demo seed richness | Thin (admin + tenant only) |
| Multi-tenant commercial packaging | Not started |

---

## 9. Critical bugs (code-level)

| Bug | Impact | Evidence |
|-----|--------|----------|
| Complete requires `in_execution`; no API sets it | Cannot finish event lifecycle in product | booking service + controller + UI comment |
| Portal cannot add quotation line items | Send/approve flows fail or totals stay zero | web client omission + send rules |
| Advance UI only after booking | Approve→event often returns `eventId: null` | booking advance gate + payments panel scoping |
| Quotation unit tests red (expired fixtures) | CI signal untrustworthy | Jest failures Nov 2026 |

---

## 10. What is *not* a gap (avoid false alarms)

- Thin Customer/Quote/Booking hubs are often **intentional OpenAPI freezes**, not accidental bugs — still a **product** gap for SaaS.
- Communication Center without WhatsApp send was an explicit P2-09 out-of-scope.
- Calendar without writable CalendarEntry was intentional read aggregation (P2-10).
- Single-tenant Phase 1 is approved business scope (Doc 19 / ADR-016), not an implementation defect — it **is** a commercial SaaS gap.

---

*End of gap analysis.*
