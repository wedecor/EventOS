# M4 — Pre-Implementation Remediation Plan

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Branch** | `release/m0-m1-core-workflows` |
| **HEAD at write** | `787e081` |
| **Preserved M3** | `35cc002` (ancestor) |
| **Nature** | Plan + **implementation status** (remediation landed; no LLM provider) |
| **Track naming** | **M4-AI** = AI Business Copilot; **M4-CH** = customer channels + payments |
| **Companion audits** | `docs/ai/M4_AI_READINESS_AUDIT.md`, `M4_FEATURE_FEASIBILITY.md`, `M4_TARGET_ARCHITECTURE.md`, `M4_IMPLEMENTATION_ROADMAP.md`, `M4_AI_SECURITY_REVIEW.md`, `PHASE1_TENANT_SECURITY_BOUNDARY.md` |

**Legend:** **Fact** = verified in source. **Hypothesis** = plausible but not proven by a failing test/runtime trace in this pass. **Recommendation** = proposed remediation.

---

## 1. Quotation financial consistency

### 1.1 Verified root cause

**Fact:** Discount/tax updates persist header amounts without recalculating `subtotalAmount` / `totalAmount`.

| Step | Evidence |
|------|----------|
| API accepts discount/tax | `updateQuotationSchema` in `apps/api/src/modules/quotation/presentation/schemas/quotation.schemas.ts` — optional `discountAmount`, `taxAmount` (≥ 0) |
| Controller maps fields | `QuotationController.updateQuotation` → `quotationService.updateQuotation(..., { discountAmount, taxAmount, ... })` |
| Service writes without totals | `QuotationApplicationService.updateQuotation` (`quotation.application.service.ts` ~L135–168) calls `quotationRepository.update` with `validUntil`, `notes`, `discountAmount`, `taxAmount` only — **no** call to `calculateQuotationTotals` |
| Authoritative calculator exists | `calculateQuotationTotals` in `quotation-totals.calculator.ts`: `subtotal = Σ(qty × unitPrice)`; `total = subtotal − discount + tax` (cent rounding) |
| Line-item path is correct | `QuotationLineItemApplicationService` add/update/remove loads lines + current discount/tax → `calculateQuotationTotals` → `*WithQuotationTotals` repository methods |
| PDF uses persisted headers | `QuotationPdfApplicationService` reads `quotation.discountAmount` / `taxAmount` / `totalAmount` from DB |

**Fact:** Unit tests for `calculateQuotationTotals` and line-item services exercise recalculation; `updateQuotation` specs in `quotation.application.service.spec.ts` do **not** assert that changing discount/tax updates `totalAmount`.

**Hypothesis:** Operators/UI may change discount/tax on a draft with existing lines and see a stale total until the next line mutation. PDF/email would then show the stale header total.

### 1.2 Authoritative recalculation path (recommendation)

**Single owner:** `calculateQuotationTotals` remains the only formula implementation.

**Recommended change (future implementation — not in this task):**

1. In `QuotationApplicationService.updateQuotation`, after validating draft status:
   - Load current line items via `QuotationLineItemRepository.findByQuotationId`.
   - Resolve effective `discountAmount` / `taxAmount` (incoming or existing).
   - `totals = calculateQuotationTotals({ lineItems, discountAmount, taxAmount })`.
   - Persist `discountAmount`, `taxAmount`, `subtotalAmount`, `totalAmount` atomically (new repository method e.g. `updateHeaderWithTotals`, or extend `quotationRepository.update` to accept totals).
2. Do **not** recompute totals on the frontend or in AI tools.
3. Optional: reject discount > subtotal if product policy requires it (today calculator allows negative total via large discount — **fact** of current formula; policy TBD).

### 1.3 Data model / API / migration

| Area | Implication |
|------|-------------|
| Schema | No migration required for the fix |
| API | Same `PATCH /quotations/:id` contract; response totals become consistent |
| PDF / email | Automatically correct once persisted totals are fixed |

### 1.4 Regression tests (required when implementing)

- Draft with lines; PATCH discount and/or tax → `totalAmount` equals calculator output.
- PATCH notes/validUntil only → totals unchanged.
- Non-draft PATCH still `INVALID_STATE`.
- After discount PATCH, PDF totals match GET quotation.
- Concurrent version conflict still surfaces.

### 1.5 Acceptance criteria

- After any successful draft header update that touches discount/tax, `subtotalAmount` and `totalAmount` equal `calculateQuotationTotals` over current lines.
- AI and Admin UI continue to display server totals only.

### 1.6 Risks

- Existing drafts may already have inconsistent totals in DB — optional one-time repair script (deferred decision).
- Changing behavior may surprise clients that relied on stale totals (unlikely intentional).

---

## 2. Outstanding balance definitions

Three **distinct** money concepts exist. Naming them clearly is required before AI BI tools.

### 2.1 Definition A — Booking collection gap (quotation − booking payments)

| | |
|--|--|
| **Name (recommended)** | `bookingCollectionGap` / product: “Pending collection vs quotation” |
| **Service** | `FinanceDashboardQueryService.getPendingPayments` |
| **Endpoint** | `GET /api/v1/dashboards/pending-payments` (`DashboardController`) |
| **Also rolled into** | `OperationsDashboardQueryService` (`pendingPaymentsCount` / `pendingPaymentsAmount`) |
| **Formula** | Per non-cancelled booking: `amountDue = quotation.totalAmount − Σ(confirmed payments with bookingId = event.id)`; keep if `amountDue > ε` |
| **Source fields** | `Event.status`, `Event.quotationId` → `Quotation.totalAmount`; `Payment.status === 'confirmed'` and `Payment.bookingId` |
| **Payment types** | All confirmed booking-linked payments (no advance/balance kind field exists) |
| **Advance treatment** | Advances recorded only on lead/quotation (**without** `bookingId`) are **excluded** from the subtractor |
| **Voided invoices** | Not used |
| **Canceled bookings** | Excluded (`status !== 'cancelled'`) |
| **Completed bookings** | Still included if gap > 0 |

### 2.2 Definition B — Customer invoice AR (invoiced − paid)

| | |
|--|--|
| **Name (recommended)** | `customerInvoiceOutstanding` |
| **Service** | `CustomerIntelligenceApplicationService` (financial summary path ~L608–629) |
| **Endpoint** | Customer intelligence financial summary under `/api/v1/clients/:customerId/...` (customer module) |
| **Formula** | `outstandingBalance = max(0, totalInvoiced − totalPaid)` where `totalInvoiced = Σ invoice.totalAmount` for `status !== 'void'`; `totalPaid = Σ confirmed payments on customer’s bookings` |
| **Source fields** | Customer’s invoices + payments via bookings |
| **Payment types** | Confirmed payments on any of the customer’s bookings (not filtered by `invoiceId`) |
| **Advance treatment** | Lead/quotation-only advances (no booking) not included in `totalPaid` |
| **Voided invoices** | Excluded from invoiced sum |
| **Canceled bookings** | Payments on canceled bookings still count if present; bookings not filtered out of payment fetch |
| **Draft invoices** | **Included** in `totalInvoiced` (only void excluded) — material semantic |

### 2.3 Definition C — Open invoice face value (and dashboard variant)

| | |
|--|--|
| **Name (recommended)** | `openInvoiceFaceValue` vs `openInvoiceNetOfInvoiceLinkedPayments` |
| **Service** | `AnalyticsApplicationService.getFinance` → `outstandingReceivables`; `getDashboard` → `outstandingPayments` |
| **Endpoints** | `GET /api/v1/analytics/finance`, `GET /api/v1/analytics/dashboard` |
| **Formula (finance)** | `outstandingReceivables = Σ invoice.totalAmount` where `status ∈ {sent, partially_paid}` — **payments not subtracted** (`getFinance` ~L463–508) |
| **Formula (dashboard)** | Same open-invoice sum as face value, then `outstandingPayments = max(0, openSum − paidAgainstOpen)` where `paidAgainstOpen = Σ amount` of **all** confirmed payments with `invoiceId != null` (`getDashboard` ~L270–324) |
| **Voided / draft / paid** | Void, draft, and `paid` invoices excluded from the open set (by status filter) |
| **Canceled bookings** | Not filtered; invoice status drives inclusion |
| **Note (verified quirk)** | Dashboard subtractor is **not** scoped to the open invoices in the sum — any invoice-linked confirmed payment reduces the metric. `partially_paid` / `paid` are rarely reached by Phase 1 commands (**fact** from prior audit) — so open set is mostly `sent` |

### 2.4 Related (not one of the “three,” but AI must not confuse)

| Concept | Location | Formula sketch |
|---------|----------|----------------|
| Invoice PDF outstanding | `InvoicePdfApplicationService` | `max(0, invoice.total − confirmed payments linked to invoice **or** booking-scoped with null invoiceId)` |
| Event profitability | `ProfitabilityApplicationService` | confirmed booking payments − confirmed vendor expenses (not AR) |

### 2.5 Recommendation (do not silently rename APIs)

1. **Keep all three formulas** initially; assign **stable semantic names** in AI tool metadata and docs.
2. **Authoritative “customer owes us” for Copilot (default):** Definition B (`customerInvoiceOutstanding`), with explicit disclosure that draft invoices currently inflate the figure — **product decision** whether to exclude `draft` later.
3. **Authoritative “booking still to collect vs sold quotation”:** Definition A — required for ops collection lists; disclose that pre-booking advances are invisible here.
4. **Authoritative “open invoices on books”:** Definition C face value for receivables aging narratives; use dashboard net variant only when explaining invoice-linked collections.
5. **Do not** change response shapes in a silent patch. If semantics change (e.g. exclude draft invoices from B), version the DTO field or add a new field and deprecate the old name in OpenAPI.

### 2.6 Migration / API

- No DB migration for documentation/tooling phase.
- Optional later: add `kind` on `Payment` (`advance` \| `balance` \| …) — **deferred**; would improve A and advance gating clarity.

### 2.7 Regression / acceptance

- Snapshot tests locking current formulas for A/B/C.
- AI BI tools must return `metricId` + `formulaDescription` matching one of the three.
- Any future semantic change requires an explicit ADR + changelog.

---

## 3. Tenant context and authorization

### 3.1 Verified facts

| Fact | Evidence |
|------|----------|
| Phase 1 is **intentionally single-tenant** | ADR-016 comments on `@TenantId()` and `PHASE1_TENANT_ID` |
| Hardcoded tenant | `apps/api/src/shared/presentation/tenant-context.decorator.ts` returns `PHASE1_TENANT_ID` only; **ignores** `ExecutionContext` / JWT |
| Canonical id | `apps/api/src/shared/tenant/phase1-tenant.ts` = `00000000-0000-0000-0000-000000000001` (aligned with seed) |
| JWT still carries `tenantId` | `JwtStrategy` maps `payload.tenantId` onto `AuthenticatedUser` |
| Controllers use `@TenantId()` for queries | Not `user.tenantId` |
| Repositories filter by passed `tenantId` | Defense in depth **within** the single seeded tenant |
| AuthZ boundary that exists | JWT identity + **RBAC permissions** (9 roles / 73 permissions), not JWT tenant isolation |

**Fact:** Claiming “JWT tenant isolation” today would be **false**. Isolation is “all API data for the We Decor Phase-1 tenant,” gated by login + permissions.

### 3.2 Security boundary (current deployment)

```
Internet → JWT (user, role, tenantId claim unused for scoping)
        → PermissionsGuard
        → Services query WHERE tenant_id = PHASE1_TENANT_ID
```

Risk if a second tenant row were inserted without code changes: JWT might say tenant B while queries still hit tenant A (or vice versa depending on seed) — **multi-tenant is unsafe until `@TenantId()` reads the token**.

### 3.3 Recommendations

**Minimum safe approach for current single-business We Decor:**

1. Keep hardcoded `@TenantId()` for Phase 1 **or** assert `user.tenantId === PHASE1_TENANT_ID` and reject mismatches (hardening without full multi-tenant).
2. Document in AI security that tools inherit the same Phase-1 tenant constant.
3. Never trust client-supplied tenant ids.

**Future multi-tenant migration (separate program; was “M7” in older roadmap):**

1. `@TenantId()` reads `AuthenticatedUser.tenantId` from JWT.
2. Seed/login must issue correct tenant claim.
3. Audit every raw query; add integration tests for cross-tenant denial.
4. Revisit IntegrationSettings / storage key prefixes / document paths (already tenant-prefixed in storage keys — good).

### 3.4 Acceptance (when hardening)

- Documented ADR stating single-tenant security model.
- Optional: mismatch guard between JWT tenant and Phase-1 constant.
- No AI feature depends on multi-tenant JWT scoping until migration lands.

---

## 4. Lead lifecycle remediation for AI

### 4.1 Verified gaps

| Gap | Evidence |
|-----|----------|
| No `PATCH /leads/:id` | `LeadController` exposes list/get/create, `PATCH :id/stage`, assign, follow-ups, payments — **no** general update |
| Service already implements update | `LeadApplicationService.updateLead` + `UpdateLeadData` on repository; covered by unit tests |
| Create omits `customerId` | `createLead` mapping in controller / `createLeadSchema` — no customer field |
| Comms lack `leadId` | `CommunicationRecord` in Prisma: booking/customer/vendor/staff/quotation/invoice — **no** `leadId` |
| Follow-ups exist | `FollowUpController` `PATCH /follow-ups/:id`; nested under lead |

### 4.2 `UpdateLeadData` fields already modeled (**fact**)

From `lead.repository.ts` `UpdateLeadData`: event dates, venue, budget, guest count, notes, source fields, `customerId`, etc. (service validates terminal stages and date/budget rules).

### 4.3 Recommendations (minimum for lead intelligence)

1. **Expose `PATCH /leads/:id`** (permission `leads:write`, If-Match version) wiring existing `updateLead` — Zod schema mirroring safe updatable fields including optional `customerId` link.
2. **Optional:** allow `customerId` on create for convenience (same validation as update).
3. **`leadId` on `CommunicationRecord`:**  
   - **Necessary?** Not strictly for MVP AI if tools join via `customerId` / quotation / booking.  
   - **Useful?** Yes for “comms before customer/quotation exist.”  
   - **Compatibility:** nullable column + optional FK; existing rows remain `NULL`; backfill not required. Migration when implementing — **out of scope for this planning doc’s “no migrations” constraint**, listed as future work.
4. Do **not** redesign stage FSM; AI must not auto-transition stages.

### 4.4 API / data model summary

| Change | Type | Blocks AI? |
|--------|------|------------|
| `PATCH /leads/:id` | API only | Improves data quality for AI; not a hard blocker for read-only analyze |
| `customerId` on create | API | Same |
| `communication_records.lead_id` | Migration + API | Optional enhancement |

### 4.5 Tests / acceptance

- Update lead fields; terminal stage rejected; concurrency via If-Match.
- AI analyze uses updated notes/venue after PATCH.
- If `leadId` added: create outbound/manual comm with lead link; list-by-lead endpoint optional.

---

## 5. Roadmap naming collision

### 5.1 Verified conflict

| Source | “M4” meaning |
|--------|----------------|
| `docs/audit/EVENTOS_IMPLEMENTATION_ROADMAP.md` | **M4 — Channel + payments** (WhatsApp, Razorpay); **M6 — AI assists** |
| Current AI program (`docs/ai/*`, product prompt) | **M4 — AI Business Copilot** |
| Git history | M0/M1, M2, M3 (integrations) already used as product milestones on `release/m0-m1-core-workflows` |

### 5.2 Recommendation — unambiguous scheme

Use **lettered tracks** plus keep sequential product milestones for shipped work:

| Label | Meaning |
|-------|---------|
| **M0–M3** | Already shipped/committed product milestones (workflows, live E2E, integrations) — **immutable names** |
| **M4-AI** (or **Milestone AI-1**) | AI Business Copilot program described in `docs/ai/*` |
| **M4-CH** (or **Milestone CH-1**) | Former audit “M4 Channel + payments” |
| **M5-CAT** | Décor catalogue (audit M5) |
| **M6** vacated / avoid | Do not reuse bare “M6” without qualifier |

**In all new docs and commit messages:** prefer `M4-AI` over bare `M4` when referring to the copilot.

**Do not** rewrite historical audit files’ headings in this task; add a pointer note when those files are next edited.

**Implementation scope unchanged:** renaming docs does not add WhatsApp/Razorpay or AI code.

---

## 6. Recommended implementation sequence (remediation before / beside AI)

| Order | Work | Why |
|------:|------|-----|
| 1 | Quotation discount/tax recalculation fix | Financial truth; PDF/AI safety |
| 2 | Document + lock outstanding-balance metric IDs (A/B/C) in BI tool design | Prevent AI mixing formulas |
| 3 | Tenant security note + optional JWT≠Phase1 assert | Honest boundary |
| 4 | `PATCH /leads/:id` (+ optional create `customerId`) | Lead data hygiene |
| 5 | Roadmap rename to M4-AI / M4-CH in active docs | Human clarity |
| 6 | Optional `leadId` on communications | Better grounding |
| 7 | Then M4-AI foundation (provider port) per `M4_IMPLEMENTATION_ROADMAP.md` |

Items 1–5 are **pre-AI correctness**; 6–7 enable richer copilot features.

---

## 7. Cross-cutting: security implications

- Fixing quotation totals reduces risk of customer-facing under/overstated PDFs.
- Clarifying AR metrics reduces incorrect financial advice from AI.
- Tenant hardening prevents false confidence in multi-tenant readiness.
- Lead PATCH increases write surface — keep `leads:write`, version checks, audit if material field changes (optional).

---

## 8. Deferred decisions

1. Exclude `draft` invoices from customer outstanding (Definition B)?
2. Include lead/quotation advances in booking collection gap (Definition A) via payment attribution rules?
3. Negative totals when discount > subtotal — clamp or reject?
4. Whether to backfill `leadId` on historical communication rows.
5. When to implement full JWT-based `@TenantId()` (multi-tenant program).

---

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Silent semantic change to dashboards | Additive fields + explicit deprecation |
| AI ships before totals fix | Gate M4-AI BI/quote features on totals regression green |
| Docs-only naming drift | Use `M4-AI` in all new AI commits/PRs |
| Scope creep into catalogue/WhatsApp | Keep those on M5-CAT / M4-CH tracks |

---

## 10. Implementation status (foundation remediation)

| Item | Status | Notes |
|------|--------|-------|
| Quotation discount/tax → `calculateQuotationTotals` | **Done** | `QuotationApplicationService.updateQuotation` |
| Outstanding metric IDs + pure calculators + reconciliation tests | **Done** | `shared/finance/outstanding-balance.definitions.ts`; OpenAPI descriptions updated |
| `PATCH /leads/:id` | **Done** | Reuses `updateLead`; audit `lead.updated` |
| Nullable `CommunicationRecord.leadId` + migration | **Done** | `20261112060000_m4_ai_communication_lead_id`; `GET /leads/:id/communications` |
| Phase-1 tenant boundary tests + doc | **Done** | No auth semantics change |
| LLM provider / AI framework | **Deferred** | Starts at M4-AI M4.0 |
| Draft-invoice exclusion from customer AR | **Deferred** | Product decision |
| JWT-based `@TenantId()` | **Deferred** | Multi-tenant program |
| Backfill historical `leadId` | **Deferred** | Null remains valid |

## 11. Original planning constraint (historical)

The first revision of this file was planning-only. Application remediation above supersedes §10 of that revision.

---

*End of M4-AI pre-implementation remediation plan.*
