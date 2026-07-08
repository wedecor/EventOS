# Definition of Done

## Purpose of This Document

This document defines the criteria that must be met before any work item—feature, bug fix, module, or phase—is considered complete. "Done" means production-ready, not "code written." There is no separate quality tier for MVP.

**Business baseline (authoritative for We Decor Phase 1):** [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md)  
**Aligned with:** [`11-roadmap.md`](./11-roadmap.md), [`06-module-design.md`](./06-module-design.md) (2026-07-08)

---

## Phase 1 DoD Alignment Review

### Status

**PASS** (after corrections applied 2026-07-08)

Phase 1 Definition of Done now reflects the approved business baseline, UAT criteria (Z/I/P/W), and realigned roadmap/module design. Deferred capabilities are excluded from Phase 1 completion criteria.

### Previous mismatch

| Area | Previous DoD | Approved Phase 1 (`19`) |
|------|--------------|-------------------------|
| Phase 1 scope | Lead, quotation, booking only (Foundation MVP) | Full ops: staff, vendor, inventory, finance, KPIs, event workspace |
| Phase 1 success | "Lead-to-booking journey" only | UAT Z1–Z5, I1–I5, P1–P5, W1–W5 |
| Phase 2 done | Staff/vendor/inventory required for Phase 2 complete | Staff/vendor/inventory are **Phase 1** business requirements |
| Phase 3 done | Finance/profitability for Phase 3 | Payments, expenses, profitability are **Phase 1** |
| Phase 5 done | BI dashboards for Phase 5 | Founder KPI dashboard is **Phase 1** (partial BI) |
| Phase 1 implied | Quotation approved through Event OS portal | Manual WhatsApp quote approval OK — portal deferred |
| Universal DoD | "Must work for any tenant" | Phase 1: single-tenant We Decor; multi-tenant SaaS deferred |

### Changes made

1. Replaced **Phase 1 (Foundation/MVP) Done Criteria** with **Phase 1 We Decor (Approved Business Scope)** — business success, UAT Z/I/P/W, capability checklist, transitional integrations.
2. Renumbered **Phase 2–6** done criteria to match realigned [`11-roadmap.md`](./11-roadmap.md) (enhancements / depth / growth / intelligence / SaaS).
3. Updated **Module-Specific Quality Gates** for Phase 1 modules; moved conflict detection and event templates to Phase 2; marked AI gate as non–Phase 1 completion.
4. Added **Phase 1 exclusions** — explicit list of deferred items that must **not** block Phase 1 done.
5. Clarified **single-tenant Phase 1** in universal testing and "What Done Does NOT Mean" without removing forward-compatible architecture expectations.

### Remaining risks

| Risk | Mitigation |
|------|------------|
| Phase 1 scope larger than original MVP timeline | Business UAT (Z/I/P/W) is the phase gate — not legacy Foundation checklist |
| Universal DoD still references `tenantId` | Phase 1 uses single-tenant We Decor configuration; full multi-tenant isolation tests deferred to Phase 6 |
| Engineering module DoD may reference deferred interface methods | Module done = Phase 1 coverage per `06-module-design.md`, not full module catalogue |
| Business UAT at go-live vs development handoff | Development handoff approved (Doc `19` Q7); **go-live** requires founders sign UAT on real events |

### Reference documents

| Document | Role |
|----------|------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | Business source of truth — EP1 IDs, UAT, scope freeze |
| [`11-roadmap.md`](./11-roadmap.md) | Engineering delivery phases |
| [`06-module-design.md`](./06-module-design.md) | Module Phase 1 coverage |

---

## Universal Definition of Done

Every pull request merged to `main` must satisfy ALL of the following:

### Code Quality

- [ ] Code follows [08-coding-standards.md](./08-coding-standards.md)
- [ ] TypeScript strict mode passes with zero errors
- [ ] ESLint passes with zero errors (warnings justified in PR)
- [ ] Prettier formatting applied
- [ ] No `any` types without documented justification
- [ ] No `// TODO` without a linked GitHub issue
- [ ] No commented-out code
- [ ] No `console.log` in production code (use structured logger)
- [ ] No secrets, API keys, or credentials in code

### Architecture

- [ ] Changes respect module boundaries per [06-module-design.md](./06-module-design.md)
- [ ] Domain logic lives in domain layer (not controllers, not repositories)
- [ ] Dependencies point inward (domain has no infrastructure imports)
- [ ] Cross-module communication uses public interfaces or domain events
- [ ] Organisation/tenant scoping enforced on all data operations (`tenantId` or equivalent — Phase 1: single We Decor tenant)
- [ ] Authorization checked in application service layer

### Testing

- [ ] Unit tests for all domain business rules
- [ ] Unit tests for application service use cases
- [ ] Integration test for every new/modified API endpoint
- [ ] Cross-tenant isolation test for every new/modified data endpoint **(required from Phase 6 multi-tenant SaaS; Phase 1: single-tenant access-control tests)**
- [ ] Authorization test (403 for insufficient permissions) for protected endpoints
- [ ] All tests pass in CI
- [ ] Coverage does not decrease below targets in [15-testing-strategy.md](./15-testing-strategy.md)
- [ ] Bug fixes include a regression test

### Security

- [ ] Input validation with Zod schemas at API boundary
- [ ] No SQL injection vectors (parameterized queries only)
- [ ] Authentication required on all non-public endpoints
- [ ] Authorization verified for the operation
- [ ] Audit logging for sensitive operations (per [14-security-principles.md](./14-security-principles.md))
- [ ] Error responses do not leak internal details
- [ ] Security checklist in [14-security-principles.md](./14-security-principles.md) reviewed

### API

- [ ] Endpoints follow [18-api-standards.md](./18-api-standards.md) conventions
- [ ] Request/response formats match documented schemas
- [ ] Proper HTTP status codes used
- [ ] Error responses include `code`, `message`, and `requestId`
- [ ] OpenAPI specification updated (if API changes)

### Documentation

- [ ] Relevant `/docs` files updated (if behavior, architecture, or API changed)
- [ ] ADR created for architectural decisions ([12-architecture-decisions.md](./12-architecture-decisions.md))
- [ ] JSDoc on public application service methods
- [ ] PR description includes summary, test plan, and screenshots (if UI)

### Review

- [ ] Code reviewed and approved by at least one engineer
- [ ] All review comments resolved
- [ ] CI pipeline passes (lint, typecheck, test, build)

---

## Feature Definition of Done

In addition to universal criteria, a feature is done when:

### Functional

- [ ] Feature implements the acceptance criteria from the user story
- [ ] Feature works correctly in staging environment
- [ ] Edge cases handled (empty states, validation errors, concurrent access)
- [ ] Feature is accessible per [17-ui-design-system.md](./17-ui-design-system.md) accessibility requirements

### UI (if applicable)

- [ ] UI matches design system ([17-ui-design-system.md](./17-ui-design-system.md))
- [ ] Loading states implemented (skeleton, spinner)
- [ ] Error states implemented (toast, inline errors)
- [ ] Empty states implemented (illustration + CTA)
- [ ] Responsive behavior verified (desktop primary, mobile functional)
- [ ] Keyboard navigation works

### Data

- [ ] Database migration created and tested (if schema changes)
- [ ] Migration is backward-compatible
- [ ] Seed data updated (if new entities need dev data)
- [ ] Data integrity constraints enforced (unique, foreign key, check)

### Integration

- [ ] Domain events emitted for significant state changes
- [ ] Event handlers implemented for downstream side effects
- [ ] Notifications sent where appropriate (per module design)

---

## Module Definition of Done

A module (e.g., Lead, Quotation, Booking) is done when:

### Complete Module Checklist

- [ ] **Domain layer** — Entities, value objects, domain events, repository interfaces, business rules
- [ ] **Application layer** — All use cases from module design, commands, queries, DTOs
- [ ] **Infrastructure layer** — Repository implementation, event handlers, external adapters
- [ ] **Presentation layer** — All API endpoints from module design
- [ ] **Frontend** — List page, detail view, create/edit forms
- [ ] **Tests** — Unit tests (domain + application), integration tests (all endpoints), E2E test (if part of critical journey)
- [ ] **Documentation** — Module design updated, API standards updated, domain model updated
- [ ] **Security** — Full security checklist completed
- [ ] **Seed data** — Development seed data for module entities

### Module-Specific Quality Gates

| Module | Additional Criteria | Phase |
|--------|-------------------|-------|
| **CRM** | Client search returns results < 200ms; per-event communication timeline and issue notes functional | Phase 1 |
| **Lead** | Pipeline view renders all stages with correct counts; extend LM behaviour — W5 without duplicate entry | Phase 1 |
| **Quotation** | PDF generation produces valid, readable document; event-linked to enquiry | Phase 1 |
| **Quotation** | Total calculation correct (subtotal - discount + tax) | Phase 1 |
| **Booking** | Event workspace created at Approved (human-confirmed); execution stages tracked | Phase 1 |
| **Booking** | Booking/event creation from quotation is atomic (all-or-nothing) | Phase 1 |
| **Task** | Event-linked execution checklists completable; packing list human-reviewed | Phase 1 |
| **Staff** | Staff master + assignment recommendations with human approval | Phase 1 |
| **Vendor** | Procurement workflow states tracked per event | Phase 1 |
| **Inventory** | Movement states Planned → Cleaned/Ready tracked per event | Phase 1 |
| **Finance** | Payment proofs attachable; event profitability view accurate per event | Phase 1 |
| **Finance** | Payment recording updates event financial status | Phase 1 |
| **BI (founder)** | Five Phase 1 KPIs display without manual data collection | Phase 1 |
| **Calendar** | Staff conflict detection works correctly | Phase 2+ |
| **Task** | Tasks auto-generated from reusable event template | Phase 2+ |
| **AI** | AI suggestions require user acceptance before applying | Phase 5+ (not Phase 1 completion) |
| **Auth** | Brute force protection active on login endpoint | All phases |

*Phase 1 module done = meets universal DoD + Phase 1 rows above for modules in approved scope (`06-module-design.md`).*

---

## Bug Fix Definition of Done

- [ ] Root cause identified and documented in PR
- [ ] Fix addresses root cause (not just symptoms)
- [ ] Regression test added that would have caught the bug
- [ ] No new bugs introduced (verified by existing test suite)
- [ ] If production bug: incident logged, affected data assessed

---

## Phase Definition of Done

A roadmap phase ([11-roadmap.md](./11-roadmap.md)) is done when its criteria are met **and** business UAT sign-off is obtained where applicable.

### Phase 1 — We Decor (Approved Business Scope) Done Criteria

*Authoritative business acceptance: Doc `19` §10. Engineering modules: `06-module-design.md` Phase 1 coverage.*

#### Business success (primary)

- [ ] Event OS **reduces dependency on Zakir** for operational visibility and coordination (founders confirm P1)
- [ ] Event OS is the **source of truth** for event status, tasks, approvals, and tracking (WhatsApp may continue for messaging)
- [ ] No important operational preparation steps missed in structured workflows (founders confirm P5)
- [ ] **Joint founder business UAT sign-off** on real We Decor events (Ilyas + Zakir)

#### UAT — Zakir operational acceptance (Z1–Z5)

- [ ] **Z1** — All approved events and preparation status visible in one place (pending, ready, needs attention)
- [ ] **Z2** — Execution through structured checklists; Event OS authoritative for task/status
- [ ] **Z3** — Staff and vendor coordination from event workspace
- [ ] **Z4** — Per-event inventory tracked through planned → ready states
- [ ] **Z5** — Payment status, expenses, and profitability visible per event

#### UAT — Ilyas visibility and control (I1–I5)

- [ ] **I1** — Enquiry-to-completion visibility without routine manual updates from Zakir
- [ ] **I2** — Founder KPIs reviewable without manual data collection
- [ ] **I3** — At-risk events identifiable (delayed prep, pending payments, procurement issues)
- [ ] **I4** — Important decisions follow approval-based workflows and business rules
- [ ] **I5** — Per-event revenue, expenses, and margin without manual reconciliation

#### UAT — Problem reduction (P1–P5)

- [ ] **P1** — Zakir dependency for visibility/coordination noticeably reduced
- [ ] **P2** — Single source of truth for customer, status, prep, payments, tasks
- [ ] **P3** — Manual re-entry between systems noticeably reduced
- [ ] **P4** — Event profitability visible per event (not offline-only after completion)
- [ ] **P5** — Operational prep steps tracked in structured workflows

#### UAT — Must-pass workflows (W1–W5)

- [ ] **W1** — Approved Booking → Event Execution (advance → Approved → workspace → prep/staff/execution in Event OS)
- [ ] **W2** — Event Preparation → Inventory Movement (checklist → planned → picked → packed → loaded → at venue → returned → ready)
- [ ] **W3** — Event → Vendor Procurement (request → confirmation → delivery/completion → payment tracked)
- [ ] **W4** — Customer Payment → Financial Completion (payments + proofs → expenses → profitability → financial review before Completed)
- [ ] **W5** — Lead → Booking (capture, source, follow-up, approved event without duplicate entry — **extend LM**)

#### Phase 1 capability completion (engineering)

- [ ] **Event workspace** — operations hub at Approved (EP1-OPS-001)
- [ ] **Operations checklist** — event-linked execution checklists (EP1-OPS-003)
- [ ] **Staff management** — staff master, assignment recommendations, movement permissions (EP1-STF-001 – 003)
- [ ] **Vendor procurement** — master, per-event procurement, confirmation, payments (EP1-VEN-001 – 006)
- [ ] **Inventory movement** — master, movement states, packing, returns (EP1-INV-001 – 007)
- [ ] **Finance visibility** — payments, proofs, expenses, profitability (EP1-FIN-002 – 005)
- [ ] **KPI dashboard** — founder five KPIs + weekly review support (EP1-KPI-001 – 007)
- [ ] **Communication timeline** — per-event timeline + issue notes (EP1-CUS-002, EP1-CUS-004)
- [ ] **Automation guardrails** — recommendation-only; mandatory human approval; no auto-execution (EP1-AUT-001, EP1-AUT-005)
- [ ] **Business rules** — hard blocks and provisional warn-only rules enforced (EP1-BR-001 – 004)

#### Transitional integrations (Phase 1)

- [ ] **Lead Management App** — extended/port migrated; sales core not rebuilt from scratch
- [ ] **Quotation/Billing App** — parallel-run until Event OS billing stable; manual re-entry eliminated for UAT events
- [ ] **Website** — SEO site continues; lead capture integrated into Event OS system of record

#### Engineering / operational gates

- [ ] All Phase 1 P0 modules per [`11-roadmap.md`](./11-roadmap.md) meet **Module Definition of Done**
- [ ] Phase 1 P1 modules meet module DoD where committed in scope freeze
- [ ] Staging and production environments operational
- [ ] CI/CD pipeline functional
- [ ] Database backups verified (restore tested)
- [ ] Error tracking active (Sentry)
- [ ] Zero P0 bugs open against Phase 1 UAT criteria
- [ ] We Decor staff trained on Phase 1 workflows
- [ ] Stable production operation for agreed burn-in period (founders define duration at UAT)

#### Explicitly NOT required for Phase 1 done

The following must **not** appear as Phase 1 completion blockers:

| Deferred item | Deferred to |
|---------------|-------------|
| Multi-tenant SaaS | Phase 6 / Doc `20` SaaS evolution |
| AI automation as core dependency | Phase 5 |
| Full WhatsApp replacement | Phase 5 (external WhatsApp continues) |
| Client portal | Phase 4 |
| Full CMS / marketing platform | Phase 4 |
| Advanced BI (custom dashboards, ad-hoc widgets) | Phase 5 |
| Full accounting / ERP replacement | Phase 3+ |
| Structured customer quote approval portal | Phase 4+ (manual WhatsApp OK) |
| Instagram / deep ad integrations | Phase 4+ |
| Auto-execution without human approval | Out of scope (EP1-AUT-001) |

---

### Phase 2 — Operations Enhancements Done Criteria

*Core staff, vendor, inventory, and ops workspace are Phase 1 — this phase is post-go-live depth only.*

- [ ] Calendar enhancements meet module DoD (conflict detection, multi-view)
- [ ] Reusable event templates and checklist templates operational
- [ ] Booking enhancements do not regress Phase 1 UAT (W1–W5)

### Phase 3 — Finance Depth Done Criteria

*Phase 1 already includes payments, proofs, expenses, and event profitability.*

- [ ] Payment gateway integration (if adopted) meets module DoD
- [ ] Extended reports and tax/GST depth operational
- [ ] Accounting software sync (if adopted) verified
- [ ] Finance depth does not regress Phase 1 W4 / I5 / Z5 criteria

### Phase 4 — Growth Platform Done Criteria

- [ ] Marketing, Instagram, CMS modules meet module DoD (where delivered)
- [ ] Client portal functional (if in scope for this phase)
- [ ] Growth features do not replace Phase 1 website integrate + KPI funnel

### Phase 5 — Intelligence Done Criteria

- [ ] WhatsApp Business API integration operational (if in scope)
- [ ] Advanced AI features meet acceptance rate targets (> 70%) where delivered
- [ ] Full BI dashboards beyond Phase 1 founder KPIs operational
- [ ] No auto-execution without human approval for We Decor (EP1-AUT-001 guardrail preserved)

### Phase 6 — Multi-Tenant SaaS Done Criteria

- [ ] Multi-tenant onboarding, isolation, and billing per [`11-roadmap.md`](./11-roadmap.md)
- [ ] Cross-tenant isolation tests required for all data endpoints
- [ ] Doc `20` SaaS evolution plan approved by founders

---

## AI Feature Definition of Done

*Applies when AI features are in scope. **Not a Phase 1 completion criterion** — Phase 1 uses human-approved recommendations only (`EP1-AUT-001`).*

AI features have additional criteria per [09-ai-development-guide.md](./09-ai-development-guide.md):

- [ ] Prompt template created and versioned
- [ ] AI output validated against Zod schema
- [ ] User must explicitly accept/reject suggestions (never auto-applied)
- [ ] AI suggestion logged in `ai_suggestions` table
- [ ] Token usage logged for cost tracking
- [ ] Rate limiting applied to AI endpoints
- [ ] AI context respects user permissions (cannot access unauthorized data)
- [ ] Error handling for AI provider failures (timeout, rate limit, invalid response)
- [ ] Feature flag controls availability per tenant

---

## Database Migration Definition of Done

- [ ] Migration SQL reviewed in PR
- [ ] Migration tested against clean database (creates successfully)
- [ ] Migration tested against existing data (upgrade path works)
- [ ] Migration is backward-compatible (old code works with new schema)
- [ ] Rollback strategy documented (down migration or forward-fix plan)
- [ ] Indexes added for new query patterns
- [ ] No full-table locks on large tables (use concurrent index creation)

---

## Deployment Definition of Done

Per [16-deployment-strategy.md](./16-deployment-strategy.md):

- [ ] Staging deployment successful
- [ ] Staging UAT passed (for feature releases)
- [ ] Production deployment successful
- [ ] Smoke tests pass (health check, login, core action)
- [ ] No error rate spike in monitoring (15-minute observation)
- [ ] Database migration applied successfully
- [ ] Rollback plan confirmed before deploy

---

## What "Done" Does NOT Mean

| Not Done | Why |
|----------|-----|
| "It works on my machine" | Must work in staging with CI passing |
| "Tests coming in next PR" | Tests are part of the same PR |
| "Docs will be updated later" | Docs are part of the same PR |
| "We'll add error handling before launch" | Error handling is required now |
| "Known issue, will fix later" | Known issues must be tracked as P0/P1 bugs |
| "AI generated it, looks fine" | AI-generated code requires same review as human code |
| "It'll work for We Decor" | Phase 1 must pass We Decor UAT (Z/I/P/W); future SaaS configurability per Phase 6 — not a Phase 1 blocker |

---

## Escalation

If a DoD criterion cannot be met:

1. Document which criterion and why in the PR
2. Create a GitHub issue for the deferred criterion
3. Get explicit approval from engineering lead
4. Never merge without approval for skipped security or testing criteria

---

## Related Documents

| Document | Topic |
|----------|-------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | **Authoritative Phase 1 business UAT criteria** |
| [11-roadmap.md](./11-roadmap.md) | Engineering delivery phases (realigned) |
| [06-module-design.md](./06-module-design.md) | Module Phase 1 coverage |
| [03-product-principles.md](./03-product-principles.md) | Principle 9: Production-ready from day one |
| [08-coding-standards.md](./08-coding-standards.md) | Code quality standards |
| [14-security-principles.md](./14-security-principles.md) | Security checklist |
| [15-testing-strategy.md](./15-testing-strategy.md) | Testing requirements |
| [19-development-workflow.md](./19-development-workflow.md) | Development process |

---

*Last updated: 2026-07-08*  
*Owner: Founding Engineering*  
*Alignment: Doc `19` + `11-roadmap.md` + `06-module-design.md` (2026-07-08)*
