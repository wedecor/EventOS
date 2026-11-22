# M4 — AI Readiness Audit

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Branch** | `release/m0-m1-core-workflows` |
| **HEAD at audit** | `787e081` |
| **M3 feat commit** | `35cc002` (ancestor) |
| **M2 commit** | `d8ed43c` (ancestor) |
| **Method** | Read-only source inspection (Prisma, Nest modules, Admin Portal, docs) |
| **Constraint** | No application code, dependency, or schema changes |

**Sources of truth for current product:** HEAD code + `docs/release/M3_RELEASE_COMMIT_REPORT.md`. Older `docs/audit/EVENTOS_*` files (ref `91feb7b`) remain useful for historical gaps but are **stale** on M2/M3 capabilities (PDF, email, documents, integrations, Playwright).

---

## 1. Repository state (verified)

| Check | Result |
|-------|--------|
| Branch | `release/m0-m1-core-workflows` |
| Working tree | Clean at audit start |
| M3 ancestry | `35cc002` is ancestor of HEAD |
| Push | Not required for this audit |

### Backend layout

`apps/api` — NestJS 11 modular monolith under `apps/api/src/modules/`:

`admin`, `analytics`, `auth`, `booking`, `calendar`, `checklist`, `communication`, `customer`, `dashboard`, `documents`, `finance`, `integrations`, `inventory`, `lead`, `payment`, `quotation`, `staff`, `task`, `tenant`, `vendor` (+ `application-services.module.ts`, `repositories.module.ts`).

Shared infrastructure: `apps/api/src/shared/{audit,crypto,mail,pdf,storage,database,presentation,...}`.

### Frontend layout

`apps/web` — Next.js 15 static export Admin Portal. Features under `apps/web/src/features/` including `leads`, `quotations`, `bookings`, `finance`, `documents`, `communications`, `dashboard`, `analytics`, `settings`, `checklists`, `tasks`, `inventory`, `vendors`, `staff*`.

### Data / auth facts (HEAD)

| Fact | Evidence |
|------|----------|
| **56** Prisma models | `rg -c '^model '` on `apps/api/prisma/schema.prisma` |
| **9** roles | `PHASE1_ROLES` in `apps/api/src/modules/auth/domain/rbac.ts` |
| **73** permissions | `PERMISSIONS` array in same file |
| Single-tenant Phase 1 | ADR-016; repositories take `tenantId` first |
| Global guards | `JwtAuthGuard` + `PermissionsGuard` |
| Tenant decorator | `@TenantId()` returns hardcoded `PHASE1_TENANT_ID` (does **not** use JWT `tenantId`) — safe only while ADR-016 single-tenant holds |
| Request correlation | `generateRequestId` / `x-request-id` in `apps/api/src/config/logging.config.ts` |
| Log redaction | `LOG_REDACT_CONFIG` redacts Authorization, cookies, password fields — **not** general PII/prompt payloads |
| Roadmap naming | Use **M4-AI** (AI Business Copilot) vs **M4-CH** (customer channels + payments). Older audit file still says “M4 = channels/payments” and “M6 = AI” — treat those as historical labels for M4-CH / AI assists |
| Tenant boundary doc | `docs/ai/PHASE1_TENANT_SECURITY_BOUNDARY.md` — JWT tenant claim is **not** the scope boundary |
| Outstanding metrics | `apps/api/src/shared/finance/outstanding-balance.definitions.ts` — three distinct formulas |
| Quotation header totals | Discount/tax `PATCH` recalculates via `calculateQuotationTotals` (remediation) |
| Lead update API | `PATCH /leads/:id` exposes existing `updateLead` |
| Comm ↔ lead | Nullable `CommunicationRecord.leadId` + `GET /leads/:id/communications` |

---

## 2. Current architecture (for AI placement)

```
Admin Portal (static Next)
    → Bearer JWT + refresh cookie
NestJS API (/api/v1)
    → @Permissions + @TenantId
Application services (Result<>)
    → Prisma repositories (tenant-scoped)
PostgreSQL + Redis (auth throttle/health; BullMQ unused in src)
```

**Recommendation (architecture, not implementation):** add an application-owned `modules/ai` that calls existing application services via **tools**, with a thin `shared/llm` provider port. Do **not** let the LLM query Prisma directly.

Existing human-approval seam: `Suggestion` model + `SuggestionApplicationService` accept/dismiss (`apps/api/src/modules/admin/...`). **No producers create suggestions today** — useful pattern for AI proposals.

---

## 3. Catalogue readiness — **NOT READY**

### Verified fact: no décor / service catalogue domain

Searches across Prisma and quotation code found **no** models or fields for:

- Product / décor item / package catalogue
- Catalogue category with sellable pricing
- Images/descriptions as sellable SKUs
- `catalogItemId` / `productId` / `packageId` on quotation lines

`QuotationLineItem` (`schema.prisma`) is free-form:

- `description: String`
- `quantity: Int`
- `unitPriceAmount: Decimal`
- No FK to inventory or catalogue

`InventoryItem` exists but is an **ops stock** model (SKU, warehouse qty, taxonomy, condition) — not a customer-facing décor price list. Quotation module has **zero** references to inventory/catalogue IDs.

### Admin Portal

No catalogue management feature under `apps/web/src/features/`. Inventory UI manages stock, not sellable décor packages.

### Implication for M4.2

A Quotation Assistant that requires “suggested items must exist in the catalogue” **cannot** be honestly implemented until a catalogue domain exists **or** the feature is explicitly scoped to free-text line proposals (human enters prices; totals still via `calculateQuotationTotals`).

---

## 4. Pricing readiness — **STRONG (deterministic; free-form lines)**

### Source of truth

`calculateQuotationTotals` in  
`apps/api/src/modules/quotation/application/services/quotation-totals.calculator.ts`:

```
subtotal = Σ(quantity × unitPriceAmount)
total = subtotal − discountAmount + taxAmount
```

Documented as the **only** place the formula is implemented. Line-item mutations recalculate via this function. Discount and tax are quotation-level amounts (not rate engines).

### Historical preservation

- Line items store their own `description` + `unitPriceAmount` at write time.
- Revision flow supersedes quotations (`revise` → `status: superseded` + `supersededById`) rather than mutating issued totals in place (`quotation.application.service.ts`).
- PDF generation reads persisted quotation + line items (`quotation-pdf.application.service.ts`) — not live catalogue prices.

### Frontend vs backend

Admin Portal line-item UI exists (`quotation-line-items-panel.tsx`, `quotationsApi.listLineItems`). Totals are server-owned; UI displays API values. **AI must never replace this calculator.**

### Gap vs package pricing

No package pricing, no price books, no tier rules. Custom lines are first-class (free-form description + unit price).

### Verified pricing defect (non-AI)

`QuotationApplicationService.updateQuotation` can PATCH `discountAmount` / `taxAmount` **without** calling `calculateQuotationTotals`, so header `totalAmount` may stay stale until a later line-item mutation. AI and UI must not treat a post-discount PATCH response as authoritative until this is fixed or totals are recomputed on that path.

### Revisions

`createNewRevision` supersedes the prior quotation and copies **header** money fields; **line items are not cloned** onto the new draft (historical lines remain on the superseded quotation).

---

## 5. Lead readiness — **GOOD for summarization; LIMITED for “qualification score”**

### Model (`Lead` in `schema.prisma`)

| Field | Present |
|-------|---------|
| `source` / `sourceDetail` | Yes (`LeadSource` enum) |
| `stage` | Yes (`new`, `in_talks`, `approved`, `completed`, `lost`, `cancelled`) |
| `lostReason` | Yes |
| `assignedToId` | Yes |
| `customerId` | Optional |
| Event requirements | `eventType`, `eventStartDate`, `eventEndDate`, `venue`, `estimatedBudgetAmount`, `guestCount`, `notes` |
| Follow-ups | `FollowUp` + stage history `LeadStageHistory` |

### Services / APIs

Lead module under `apps/api/src/modules/lead/` — create, stage update, assign, follow-ups. Web lead create/view flows exist (M2 Playwright exercises them).

### Gaps that matter for AI (minimal)

- No structured “qualification checklist” or score field.
- Notes are free-text (good for LLM input; treat as untrusted).
- **`PATCH /leads/:id` now exposed** (remediation) — reuses `updateLead()`; create schema still omits `customerId` (link via PATCH).
- **`CommunicationRecord` has no `leadId`** — lead-scoped history must go via customer/booking/quotation links.
- Lost reason is free-text (no catalogue enum).
- Analytics “converted” = lead stage `approved` \| `completed`, not “has Event” (`CONVERTED_LEAD_STAGES` in `analytics.application.service.ts`).

**Sufficient for M4.1** if AI extracts/summarizes from existing fields + notes + related communications, without inventing a new CRM.

---

## 6. Booking / event readiness — **GOOD for planning assistance**

### Model (`Event`)

Dates, venue (`venueName`), `eventType`, `guestCount`, `requirementsNotes`, status FSM (`approved` → `in_preparation` → `in_execution` → `completed` / `cancelled`), workspace/preparation statuses, execution owner, cancellation reason.

### Related ops data

| Capability | Evidence |
|------------|----------|
| Tasks | `Task` model + task module |
| Checklists | `ChecklistTemplate`, `EventChecklist`, checklist module |
| Staff | assignments + scheduling heuristics (`scheduling.application.service.ts`) |
| Vendors | procurements / lines |
| Inventory | reservations/movements (ops, not catalogue) |
| Expenses | `VendorExpense` |
| Documents | `StoredDocument` (M3) |
| Comms | `CommunicationRecord` (+ booking/quotation/invoice links) |

### Known product risk (not AI-specific)

Historical audit flagged incomplete `in_execution` transition UX. Planning assistant should read **actual** status fields and not invent execution progress.

---

## 7. Financial reporting readiness — **GOOD for tool-backed BI**

### Existing deterministic APIs (prefer these as AI tools)

| Area | Entry points |
|------|----------------|
| Founder / ops KPIs | `DashboardController` — `/api/v1/dashboards/*` (`founder`, `sales-summary`, `lead-pipeline`, `monthly-revenue`, pending payments, upcoming events, …) |
| Analytics BI | `AnalyticsController` — `/api/v1/analytics/{dashboard,sales,finance,...}` with `from`/`to` |
| Per-booking profit | `GET /api/v1/bookings/:id/profitability` → `ProfitabilityApplicationService` (confirmed payments − confirmed vendor expenses) |
| Payments / invoices / expenses | Finance + payment modules; void/soft-delete semantics on records |

### Strengths

- Aggregations are application-owned SQL/repository logic, not LLM math.
- Tenant scoped.
- Period params exist on analytics/dashboard.
- Profitability explicitly documents revenue basis (confirmed payments).

### Caveats

- Revenue definitions must be disclosed in answers (payments vs invoice totals). Profitability uses **confirmed payments − confirmed vendor expenses** (ignores invoices by design).
- **Outstanding balance is defined differently** across surfaces (e.g. quotation−payments on pending-payments dashboard vs invoice−payments on customer intelligence vs invoice status sums in analytics). BI tools must pick one contract and cite it.
- Invoice statuses `partially_paid` / `paid` exist on the enum but Phase 1 commands do not transition them.
- No typed payment kind (advance vs balance) — advance gating is “any confirmed payment on lead/quotation.”
- Cancelled/voided filtering must follow each service’s existing rules — tools should call services, not reimplement.
- Do **not** allow arbitrary SQL generation by the model.

**M4.4 is feasible now** if every numeric answer comes from these services (or thin wrappers), with the LLM only selecting tools and narrating results.

---

## 8. Communications readiness — **GOOD for drafts; send already human-gated**

M3:

- `OutboundEmailApplicationService` sends quotation/invoice PDF email on **explicit API/UI action**.
- Creates `CommunicationRecord` with provider acceptance (not delivery proof).
- Duplicate-send window (`MAIL_IDEMPOTENCY_WINDOW_SEC`).
- Settings → Integrations for provider config; secrets write-only.

AI can draft message bodies; **must not** call send endpoints without a separate human confirmation step (Suggestion accept or dedicated “approve draft” action).

---

## 9. AI integration readiness — **NOT PRESENT**

| Check | Result |
|-------|--------|
| OpenAI / Anthropic / AI SDK deps | **Absent** from `apps/api/package.json` / web deps |
| LLM modules / prompts | **Absent** |
| Env keys for LLM | **Absent** from `env.schema.ts` (M3 adds storage/mail only) |
| Structured output / tool-calling infra | **Absent** |
| Usage / cost tracking | **Absent** |
| BullMQ | Dependency present; **no** worker imports under `src/` for AI jobs |
| Suggestion producers | **Absent** (accept/dismiss only) |

IntegrationSettings (`modules/integrations`) can later store **non-secret** AI prefs + encrypted API keys using existing `secret-box`, but that is a future extension — not implemented.

HTTP patterns: Nest services call ports (mail/storage). No shared generic outbound HTTP client with standardized retries for third-party LLM yet.

---

## 10. Security baseline relevant to AI

| Control | Status |
|---------|--------|
| JWT identity → `@CurrentUser` / `@TenantId` | Present |
| Permission gates on controllers | Present (`@Permissions`) |
| Tenant-scoped repositories | Present |
| Document download auth | `documents:read` + tenant `findById` (M3) |
| AuditLogService | Present; extend with AI execution events |
| Prompt injection surface | Customer notes, uploads, email bodies — treat as untrusted |
| Forbidden autonomous money actions | Approve quote, record payment, mark paid — already permissioned human APIs |

---

## 11. Summary matrix

| Domain | AI-ready? | Blocking gap |
|--------|-----------|--------------|
| AuthZ / tenancy | Yes | — |
| Lead intelligence | Yes (with free-text notes) | Optional structured qualification |
| Quotation assistant (catalogue-grounded) | **No** | **No décor catalogue** |
| Quotation totals | Yes (deterministic) | AI must not compute totals |
| Event planning | Mostly yes | Status FSM product quirks |
| Business intelligence | Yes | Tool-only numerics |
| Communication drafts | Yes | Human approve before send |
| LLM provider stack | **No** | New `shared/llm` + config |

---

## 12. Facts vs assumptions

**Facts:** catalogue absence; free-form line items; `calculateQuotationTotals`; analytics/dashboard/profitability endpoints; 9 roles / 73 permissions; no LLM SDK; Suggestion accept/dismiss without creators; M3 mail/docs/integrations.

**Assumptions / recommendations:** module names `modules/ai` + `shared/llm`; reuse Suggestion for approvals; prefer Anthropic or OpenAI direct SDK (decision deferred to roadmap); postpone catalogue-dependent quotation matching until a catalogue milestone.

---

*End of M4 AI readiness audit.*
