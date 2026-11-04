# EventOS Phase 1 — Repository Stabilization Report

**Date:** 2026-07-12
**Scope:** Entire repository (`apps/api`), all 11 implemented modules, Prisma schema, migrations, docs, tests, CI/CD, security posture.
**Method:** Read-only review. Five parallel audit passes (architecture/layering, schema/migrations/performance, API contracts/dead code, EP1 traceability/ADR/doc-sync, testing/security/production-readiness) cross-checked against direct build/lint/test execution and independent grep/AST verification. **No code was modified.**
**Baseline claimed by stakeholder:** "Phase 1 COMPLETE... 329 unit tests pass... No known Critical or High findings."
**Verdict of this review:** Build/lint/329-unit-tests are confirmed green, but this measures code-quality hygiene, not feature completeness or production readiness. **The claim of "no known Critical or High findings" does not hold** once contract compliance, EP1 traceability, security, and production-operations are audited. Phase 1 is **substantially incomplete** relative to `docs/business/19-event-os-phase1-requirements.md`, and the API is **not deployable to production** in its current state (no authentication, no CI/CD, no containerization).

---

## 1. Executive Summary

| Signal | Status |
|---|---|
| Build | ✅ PASS (`pnpm build`) |
| Lint | ✅ PASS (`pnpm lint`) |
| Unit tests | ✅ PASS (329/329, 28 suites) |
| Circular dependencies (module graph) | ✅ PASS (madge: none found) |
| **HTTP/integration tests for business endpoints** | ❌ **0 of ~80 endpoints tested** |
| **Authentication** | ❌ **Not implemented — `AuthModule` is an empty placeholder** |
| **Authorization** | ❌ **Not implemented — zero guards anywhere in codebase** |
| **ADR-017 (Suggestion-only automation)** | ❌ **Not implemented — no `Suggestion` model, no event handlers** |
| **CI/CD pipeline** | ❌ **Does not exist** (`.github/workflows` absent) |
| **Dockerfile** | ❌ **Does not exist** |
| **EP1 requirement coverage** | 10 of 59 fully implemented+tested; 28 partial; **21 not implemented** |
| **Prisma schema completeness** | 25 models present; **12+ Phase-1-required models missing** |
| **API contract match** | 80 implemented routes vs 75 documented; **18 documented endpoints missing, 23 undocumented extras** |

**Bottom line:** The engineering hygiene of the delivered code (layering discipline, tenant scoping, optimistic concurrency, Zod validation, test coverage of business rules) is genuinely strong in the modules that exist. The gap is **scope and production-readiness**: large parts of the committed Phase 1 requirement set (automation/Suggestions, staff master, inventory master, customer communication/issue/review tracking, admin settings) were never built, and the operational scaffolding needed to run this in production (auth, CI/CD, containerization, observability) is entirely absent.

---

## 2. Overall Scores

| Category | Score | Basis |
|---|---|---|
| **Architecture** | **60/100** | Strong foundational patterns (tenant scoping, optimistic concurrency, DDD layering, acyclic module graph) undermined by pervasive cross-module repository coupling via a central `RepositoriesModule` god-export, domain-layer Prisma type leakage in 14+ files, and one confirmed business-invariant-breaking bug (quotation totals). |
| **Code Quality** | **66/100** | Zero lint errors, zero `any`, zero `console.log`, consistent Result<T>/DTO/Zod patterns. Offset by a core-workflow-breaking bug (quotation totals never recalculated), two silent-failure bugs (missing `return` on DELETE error paths), and dead/unwired code (`createEventFromApprovedQuotation`). |
| **Documentation** | **42/100** | 11+ entities documented in `docs/07`/`docs/08` do not exist in the schema; API design doc covers 1 of 13 dashboard endpoints; 18 documented endpoints are missing from code and 23 implemented endpoints are undocumented; ADR-017's suggestion workflow is documented as implemented but isn't. |
| **Testing** | **55/100** | Genuinely good application-layer unit coverage (28 spec files, EP1-BR-001/002/003 and CONCURRENT_MODIFICATION explicitly tested). But **zero** HTTP/e2e tests beyond `/health`, **zero** authorization tests, **zero** controller tests — an entire test tier is missing. |
| **Production Readiness** | **20/100** | No authentication, no authorization, no password hashing, no rate limiting, no Sentry/error tracking, no audit logging, no Dockerfile, no CI/CD, readiness endpoint always returns HTTP 200 even when degraded, no graceful shutdown hooks. |
| **Overall Repository Health** | **49/100** | Weighted across the above. **Not release-ready.** |

---

## 3. Critical Findings

Each Critical finding blocks safe v1.0.0 release or represents a core, committed Phase 1 capability that does not function end-to-end.

---

**C1 — Quotation totals never recalculate after line-item changes (core sales workflow broken)**
- **File:** `apps/api/src/modules/quotation/application/services/quotation-line-item.application.service.ts:57-62`; `quotation.application.service.ts:236-241,307-312`; `quotation.repository.impl.ts:115-118`
- **Description:** `addLineItem`/`updateLineItem`/`removeLineItem` mutate line items but never recompute the parent `Quotation.subtotalAmount`/`totalAmount`. New quotations default totals to 0. `sendQuotation` and `approveQuotation` both reject when `totalAmount <= 0`.
- **Business Impact:** We Decor sales staff cannot send or approve any quotation created through the normal add-line-item API flow — this breaks the lead-to-booking funnel (EP1-FIN-001), a primary UAT path.
- **Technical Impact:** Parent/child aggregate inconsistency; invariant checks run against stale totals.
- **Recommended Fix:** Recalculate and persist quotation totals (with version bump) inside every line-item command, ideally in one transaction.
- **Fix before v1.0.0?** Yes.

---

**C2 — No code path ever sets `executionOwnerId`; EP1-BR-003 makes execution advance impossible**
- **File:** `apps/api/src/modules/booking/application/services/execution-progress.service.ts:38-45`; confirmed absent from every controller/service via repo-wide search
- **Description:** `advanceStage` correctly blocks when `executionOwnerId` is null (EP1-BR-003), but no application service, controller, or endpoint ever assigns it.
- **Business Impact:** Execution milestones can never be advanced in production without direct database manipulation — EP1-OPS-004 (execution tracking) is non-functional end-to-end.
- **Technical Impact:** The business rule is correctly implemented but its prerequisite command was never built.
- **Recommended Fix:** Add an `assignExecutionOwner` command + endpoint on the booking module (or auto-derive from a confirmed on-site staff assignment).
- **Fix before v1.0.0?** Yes.

---

**C3 — No authentication or authorization anywhere in the application**
- **File:** `apps/api/src/auth/auth.module.ts:1-9` (`@Module({})` — empty placeholder); confirmed via repo-wide grep: zero `@UseGuards`, `AuthGuard`, `RolesGuard`, or Passport strategy usage across all ~80 endpoints
- **Description:** The `AuthModule`'s own comment states "Passport JWT strategy and guards are implemented in Sprint 1 (ADR-008)" — this was never done. `passport-jwt` is an installed dependency but unused. Every controller decorates with `@ApiBearerAuth()` for Swagger cosmetics only.
- **Business Impact:** Every API endpoint — including financial data, customer data, and all mutation endpoints — is completely open to any caller with network access.
- **Technical Impact:** Violates `docs/20-definition-of-done.md` ("Authentication required on all non-public endpoints", "Authorization verified for the operation") and ADR-008.
- **Recommended Fix:** Implement JWT strategy, login/refresh endpoints, guards on all controllers.
- **Fix before v1.0.0?** Yes — this is the single largest blocker to any production deployment.

---

**C4 — No password hashing implemented**
- **File:** repo-wide grep for `bcrypt`/`argon2` — zero matches; `password_hash` column exists in migration (`20260708144526_sprint1_w5_lead_to_booking/migration.sql:43`) but nothing writes to it
- **Description:** No hashing library is used anywhere; credentials cannot currently be stored securely.
- **Business Impact:** Blocks any legitimate auth implementation; a naive implementation risks storing plaintext passwords.
- **Technical Impact:** Auth cannot be completed without this.
- **Recommended Fix:** Add bcrypt or argon2, hash on user creation/password change.
- **Fix before v1.0.0?** Yes.

---

**C5 — ADR-017 (Suggestion-only automation) is entirely unimplemented**
- **File:** `apps/api/prisma/schema.prisma` (no `Suggestion` model anywhere in 865 lines); repo-wide grep for `@OnEvent` — zero matches; `apps/api/src/shared/events/domain-event.publisher.ts` publishes ~30+ domain events into a void
- **Description:** ADR-017 requires domain-event handlers that create `Suggestion` records + in-app alerts for workspace creation, checklist generation, and staff assignment — with mandatory human approval before anything executes. None of this exists. Events are emitted but have zero listeners.
- **Business Impact:** EP1-AUT-001 through EP1-AUT-005 (the entire "recommendation-only automation" capability, a core Phase 1 differentiator) do not exist. Workspace activation and staff assignment are implemented as direct, unguarded commands instead of suggestion-gated approvals — the opposite of the documented and approved automation policy.
- **Technical Impact:** No audit trail of recommendations; ADR-017's architecture is aspirational, not real.
- **Recommended Fix:** Implement `Suggestion` Prisma model + service + `/api/v1/suggestions` endpoints; add `@OnEvent` handlers for `QuotationApproved`→workspace, checklist generation, and staff assignment recommendation flows.
- **Fix before v1.0.0?** Yes — committed Phase 1 scope and explicit UAT criterion (Doc 19 §10, I4).

---

**C6 — Administration module (Suggestions + Tenant Settings) entirely absent from the API**
- **File:** No `Suggestion`/`TenantSettings` models in `apps/api/prisma/schema.prisma`; no controllers/services anywhere in `apps/api/src`
- **Description:** `docs/09-api-design.md` documents `GET/POST /api/v1/suggestions`, `POST /api/v1/suggestions/:id/accept`, `POST /api/v1/suggestions/:id/dismiss`, `GET/PATCH /api/v1/settings` — none implemented.
- **Business Impact:** No way for founders to configure tenant settings; no way to review/accept/dismiss automation recommendations (compounds C5).
- **Technical Impact:** 5 documented endpoints with zero implementation.
- **Recommended Fix:** Build Administration module wired to existing use cases (workspace activation, checklist generation, staff assignment confirm).
- **Fix before v1.0.0?** Yes.

---

**C7 — Zero integration/e2e tests and zero authorization tests for any business endpoint**
- **File:** `apps/api/test/app.e2e-spec.ts` (only tests `GET /health` and `GET /health/ready`, with Prisma/Redis mocked); repo-wide grep for `403`/`Forbidden`/`unauthorized` across all `*.spec.ts` — zero matches
- **Description:** All 28 unit-test files mock repositories; none exercise real HTTP routing, validation pipes, guards, or serialization. `supertest` is installed but unused for business APIs.
- **Business Impact:** ~80 endpoints have never been tested end-to-end; regressions in routing, auth (once built), or status-code mapping will not be caught before reaching users.
- **Technical Impact:** Violates `docs/20-definition-of-done.md` ("Integration test for every new/modified API endpoint", "Authorization test (403...) for protected endpoints").
- **Recommended Fix:** Stand up a test database (testcontainers or docker-compose profile), add per-controller integration tests covering happy path, validation errors, 409 concurrency, and (once auth exists) 403 cases.
- **Fix before v1.0.0?** Yes.

---

**C8 — No Dockerfile exists anywhere in the repository**
- **File:** Verified via repo-wide glob — zero `Dockerfile*` files; only `infrastructure/docker/docker-compose.yml` (Postgres + Redis only, no app image)
- **Business Impact:** Cannot build a deployable production artifact.
- **Technical Impact:** `docs/16-deployment-strategy.md` describes a required multi-stage API Dockerfile that was never created.
- **Recommended Fix:** Add production Dockerfile per deployment strategy doc.
- **Fix before v1.0.0?** Yes.

---

**C9 — No CI/CD pipeline exists**
- **File:** Verified — `.github/` directory does not exist in the repository at all
- **Business Impact:** No automated gate prevents broken code, failing tests, or lint violations from reaching `main`.
- **Technical Impact:** Violates `docs/20-definition-of-done.md` ("CI pipeline passes (lint, typecheck, test, build)") for every PR merged so far.
- **Recommended Fix:** Add GitHub Actions workflow: install → prisma generate → lint → test → test:e2e → build, gating merges to `main`.
- **Fix before v1.0.0?** Yes.

---

**C10 — 12+ Phase-1-required Prisma models are missing from the schema**
- **File:** `apps/api/prisma/schema.prisma` (entire file, 25 models present) vs `docs/07-domain-model.md` / `docs/08-data-model.md`
- **Description:** Missing: `Suggestion`, `StaffMember` (master), `InventoryItem`/`LocationQuantity` (master), `Attachment`, `TimelineEntry`, `IssueNote`, `ReviewRequest`, `Contact` (Customer sub-entity). (`CalendarEntry`, `PackingList`, `TenantSettings`, `FounderKpiSnapshot` are related but scored Medium — see §4.)
- **Business Impact:** Directly causes C5, C6, C13, and the EP1 gaps below — these are not "not yet wired up," they are genuinely unbuildable without schema changes.
- **Technical Impact:** Documentation describes a persistence layer that was never implemented; any downstream feature work referencing these docs will discover the models don't exist.
- **Recommended Fix:** Prioritize schema additions per committed EP1 IDs (see backlog, §9).
- **Fix before v1.0.0?** Yes, for all except the four Medium-severity ones noted above.

---

**C11 — `createEventFromApprovedQuotation()` is fully built and tested but never called from any endpoint or event handler**
- **File:** `apps/api/src/modules/booking/application/services/booking.application.service.ts:46-108`; only referenced from its own `.spec.ts`
- **Description:** This service method implements the entire "approved quotation → new event" conversion chain, but nothing in the codebase invokes it — no controller route, no event listener on quotation approval.
- **Business Impact:** EP1-AUT-006 ("unified event record", the antidote to LM/QB manual re-entry) and UAT workflow W5 cannot actually be exercised through the API.
- **Technical Impact:** Dead application code masquerading as a completed feature (it has 100% unit coverage, which is misleading — it just isn't reachable).
- **Recommended Fix:** Wire this method to `POST /quotations/:id/create-booking` or trigger automatically (via Suggestion, once C5 exists) on quotation approval.
- **Fix before v1.0.0?** Yes.

---

**C12 — Tenant ID hardcoded in code does not provably match the seeded tenant ID**
- **File:** `apps/api/src/shared/presentation/tenant-context.decorator.ts:8` (`PHASE1_TENANT_ID = '00000000-0000-0000-0000-000000000001'`); `apps/api/prisma/seed.ts` (creates tenant with `@default(uuid())`, i.e. a random UUID, not the fixed one)
- **Business Impact:** On a freshly seeded database, every API call scopes to a hardcoded tenant ID that may not exist — all reads return empty, all writes may fail or create an orphaned/unreachable tenant row.
- **Technical Impact:** ADR-016's "single hardcoded tenant" design is correct in principle but not correctly wired to the seed script.
- **Recommended Fix:** Seed the We Decor tenant with the fixed UUID explicitly (upsert by ID, not by unique slug alone), or resolve the tenant ID from environment/config rather than a magic constant.
- **Fix before v1.0.0?** Yes — without this, the API may not even serve seeded data correctly out of the box.

---

**C13 — Several committed Phase 1 customer/staff capabilities have zero implementation**
- **File:** `apps/api/src/modules/customer/*` (profile CRUD only — no timeline, issue notes, or review requests); `apps/api/src/modules/staff/*` (assignment only — no staff master, no movement permissions)
- **Description:** EP1-CUS-002 (communication timeline), EP1-CUS-003 (review requests), EP1-CUS-004 (issue notes), EP1-STF-001 (staff master), EP1-STF-003 (movement permissions) have zero code references anywhere and no corresponding Prisma models (see C10). These are explicitly listed as committed Phase 1 scope in `docs/business/19-event-os-phase1-requirements.md`.
- **Business Impact:** Zakir/Ilyas UAT criteria Z3 (staff/vendor coordination), I1 (visibility without manual updates) are only partially satisfiable; customer support workflows remain entirely on WhatsApp as before Event OS.
- **Technical Impact:** Not a bug — these features were simply never built, despite being marked complete in the stakeholder's sprint summary.
- **Recommended Fix:** Scope as new work in a stabilization/completion sprint before declaring Phase 1 done.
- **Fix before v1.0.0?** Yes, per the business's own scope-freeze document.

---

## 4. High Findings

---

**H1 — Central `RepositoriesModule` exports all 20 repository tokens globally, enabling any module to inject any foreign repository**
- **File:** `apps/api/src/modules/repositories.module.ts:101-122`
- **Description:** This is the root cause of nearly every cross-module boundary violation below — it's an architectural escape hatch that defeats module encapsulation by design.
- **Business Impact:** No enforced module boundaries; a change to one module's repository query semantics can silently break five others.
- **Technical Impact:** Violates `docs/06-module-design.md` Rule 6 (reads should go through application-service interfaces).
- **Recommended Fix:** Split repository providers per module; export only within owning module; cross-module reads via application service ports.
- **Fix before v1.0.0?** Yes — this is the foundational fix that resolves H2–H4 below.

---

**H2 — Dashboard module injects foreign repositories from 4–6 modules per query service (widespread cross-module data access)**
- **File:** `founder-kpi.query.service.ts:3-7` (Lead/Event/Payment/VendorExpense repos); `finance-dashboard.query.service.ts:4-8` (booking/finance/payment/quotation); `resource-dashboard.query.service.ts:9-13` (Event/InventoryMovement/StaffAssignment/ProcurementLine/Vendor); `sales-dashboard.query.service.ts:4`; `operations-dashboard.query.service.ts:8`
- **Business Impact:** KPI/BI outputs bypass each module's own business rules for what counts as a "valid" record — dashboard numbers can diverge from what each module's own API returns.
- **Technical Impact:** 5 dashboard query services, ~15 foreign repository injections total.
- **Recommended Fix:** Define read ports (e.g. `LeadReadQuery`, `EventReadQuery`) exported by each module's application layer; dashboard depends on ports, not repositories.
- **Fix before v1.0.0?** Yes — founder dashboard is committed Phase 1 scope (EP1-KPI-001–007).

---

**H3 — Ten application services across finance/booking/task/staff/inventory/vendor inject foreign-module repositories directly**
- **File:** `invoice.application.service.ts:14-15` (Event, Customer); `vendor-expense.application.service.ts:13-15` (Event, Vendor, ProcurementLine); `profitability.application.service.ts:7-8` (Event, Payment, VendorExpense); `payment.application.service.ts:11` (Invoice); `booking.application.service.ts:18-19` (Quotation, Invoice); `task.application.service.ts:14-15` (Event); `staff-assignment.application.service.ts:15` (Event); `inventory-movement.application.service.ts:14` (Event); `vendor-procurement.application.service.ts:9-11` (Event, Vendor, ProcurementLine); `procurement-line.application.service.ts:14` (QuotationLineItem)
- **Business Impact:** Same class of risk as H2, applied to write paths this time — creates cascading fragility across the whole application layer.
- **Technical Impact:** Same Rule 6 violation as H1/H2.
- **Recommended Fix:** Same read/query-port pattern, applied module by module.
- **Fix before v1.0.0?** Yes.

---

**H4 — Booking controller directly injects 6 foreign-module application services**
- **File:** `apps/api/src/modules/booking/presentation/booking.controller.ts:20-25,49-58` (PaymentApplicationService, InventoryMovementApplicationService, VendorProcurementApplicationService, InvoiceApplicationService, VendorExpenseApplicationService, ProfitabilityApplicationService)
- **Business Impact:** Booking's public API surface is tightly coupled to finance/vendor/inventory internals.
- **Technical Impact:** Presentation layer orchestrating cross-module operations instead of delegating to a facade.
- **Recommended Fix:** Introduce a `BookingWorkspaceFacadeService` in the booking application layer.
- **Fix before v1.0.0?** Yes — Event Workspace (EP1-OPS-001) is a core UAT path.

---

**H5 — Invoice creation and quotation revision are not transactional; partial failure leaves corrupt records**
- **File:** `invoice.application.service.ts:123-140` (invoice created, then line items via `Promise.all` with no `$transaction` — failure leaves orphan draft invoice); `quotation.application.service.ts:166-195` (`createNewRevision` creates replacement then supersedes original in two separate calls — failure can leave two active revisions)
- **Business Impact:** Financial review (EP1-BR-002) can be blocked on corrupt draft invoices; sales can end up with duplicate active quotation revisions.
- **Technical Impact:** Only lead stage change (`lead.repository.impl.ts:106`) uses `$transaction` in the entire codebase — this is a systemic gap, not an isolated bug.
- **Recommended Fix:** Wrap all multi-table writes in `prisma.$transaction`.
- **Fix before v1.0.0?** Yes.

---

**H6 — Inconsistent `If-Match`/optimistic-concurrency enforcement across controllers**
- **File:** `quotation.controller.ts:87,136,171,187,205,221`; `lead.controller.ts:87,106`; `customer.controller.ts:72`; `follow-up.controller.ts:44` — all use `version ?? 0` when `If-Match` header is absent, producing a misleading `409 CONFLICT` instead of a clear `400` validation error. Contrast with `booking.controller.ts:203-209`, `payment`, `staff-assignment`, `task`, `inventory-movement`, `vendor`, `procurement-line`, `invoice`, `expense` controllers, which correctly reject a missing header.
- **Business Impact:** API integrators get confusing, inconsistent error behavior depending on which resource they call.
- **Technical Impact:** Contract inconsistency vs `docs/09-api-design.md`'s If-Match pattern.
- **Recommended Fix:** Require `If-Match` explicitly everywhere, matching the booking-controller pattern.
- **Fix before v1.0.0?** Yes.

---

**H7 — EP1-BR-002 (financial review before Completed) is narrowed to "no draft invoice" only**
- **File:** `booking.application.service.ts:210-217,236-247`
- **Description:** `docs/08-data-model.md` specifies the gate should cover Payment + VendorExpense financial review, not just invoice draft status.
- **Business Impact:** Events can be marked Completed while financial records are otherwise unreviewed — premature closure risk.
- **Technical Impact:** Narrower interpretation than the authoritative data-model doc.
- **Recommended Fix:** Align the gate with the documented spec or obtain explicit business sign-off on the narrower interpretation.
- **Fix before v1.0.0?** Yes — EP1-BR-002 is a P0 UAT (W4) criterion.

---

**H8 — Domain repository interfaces import Prisma-generated enum types in 14 files**
- **File:** `booking/domain/repositories/event.repository.ts` and 13 others (customer, lead, follow-up, quotation, task, staff, inventory, finance/vendor-expense, vendor ×4)
- **Business Impact:** Domain types coupled to Prisma schema churn — enum renames can break domain logic without any business-rule change.
- **Technical Impact:** Violates the clean-architecture rule that domain has zero infrastructure imports.
- **Recommended Fix:** Define domain-owned string-literal unions; map at the infrastructure boundary only.
- **Fix before v1.0.0?** Yes — foundational debt that compounds with every future schema change.

---

**H9 — No rate limiting anywhere**
- **File:** `apps/api/src/main.ts` (entire file); repo-wide grep for `throttle`/`rate.?limit` — zero matches
- **Business Impact:** API (and future auth endpoints) vulnerable to brute-force/abuse.
- **Technical Impact:** `docs/05-system-architecture.md` and `docs/14-security-principles.md` both specify required rate limits (e.g. 10 req/min on auth).
- **Recommended Fix:** Add `@nestjs/throttler` or a Redis-backed limiter.
- **Fix before v1.0.0?** Yes.

---

**H10 — No error tracking (Sentry) integration**
- **File:** repo-wide grep for `sentry` — zero matches
- **Business Impact:** Production errors are invisible to operators.
- **Technical Impact:** `docs/20-definition-of-done.md` explicitly lists Sentry as a Phase 1 engineering gate.
- **Recommended Fix:** Integrate `@sentry/nestjs`, wire into `AllExceptionsFilter`.
- **Fix before v1.0.0?** Yes.

---

**H11 — No audit logging for sensitive operations**
- **File:** repo-wide grep for `audit`/`AuditLog` — zero matches
- **Business Impact:** No forensic trail for payments, invoice voids, booking completion, etc.
- **Technical Impact:** Violates `docs/20-definition-of-done.md` Security section and `docs/14-security-principles.md`.
- **Recommended Fix:** Append-only audit log table + interceptor for sensitive commands.
- **Fix before v1.0.0?** Yes.

---

**H12 — API documentation drastically understates the real dashboard surface (1 documented vs 13 implemented endpoints)**
- **File:** `docs/09-api-design.md:2063` (documents only `GET /dashboards/founder`); `dashboard.controller.ts:40-178` (13 endpoints)
- **Business Impact:** Any consumer relying on the docs alone misses 12 operational-visibility endpoints (sales, lead pipeline, booking, execution, staff, inventory, vendor, finance, monthly revenue, pending payments, upcoming events, operational overview).
- **Technical Impact:** Severe doc/code drift for a module delivered under an explicit user directive to implement 13 endpoints.
- **Recommended Fix:** Update `docs/09-api-design.md` with all 13 endpoints and response schemas.
- **Fix before v1.0.0?** Yes.

---

**H13 — 18 documented API endpoints are missing from the implementation**
- **File:** Full inventory below; see `docs/09-api-design.md` line references in the subagent detail
- **Missing:** `GET /leads/pipeline`; `GET /clients`, `GET /clients/:id/interactions`, `POST /clients/:id/contacts`, `POST /clients/:id/interactions`, `POST /events/:eventId/issues`, `POST /events/:eventId/review-requests`; `GET /quotations`, `GET /quotations/:id/pdf`; `GET /bookings`; `GET/POST /staff`, `PATCH /staff/:id` (×4); `GET/POST /inventory/items`, `PATCH /inventory/items/:id`, `POST /inventory/movements/:movementId/photos`; `GET /suggestions`, `POST /suggestions/:id/accept`, `POST /suggestions/:id/dismiss`, `GET/PATCH /settings`, `POST /files/upload`.
- **Business Impact:** CRM visibility (customer list, timeline, contacts, issues, reviews), staff master CRUD, inventory master CRUD, and the entire Administration surface are unreachable via API.
- **Technical Impact:** Client applications built strictly from the API design doc will fail against the real backend.
- **Recommended Fix:** Prioritize per business criticality — customer list/contacts and staff master are highest priority (see backlog).
- **Fix before v1.0.0?** Yes for customer list/contacts, staff master, inventory master; Medium priority for PDF/Administration (tracked separately as part of C5/C6).

---

**H14 — Dashboard queries perform unbounded tenant-wide table scans with no SQL-level aggregation**
- **File:** `founder-kpi.query.service.ts:43-48` (loads all leads, all events, all payments, all vendor expenses per request); `finance-dashboard.query.service.ts:34-37,70-72,112-123`; `sales-dashboard.query.service.ts:26,59`; `resource-dashboard.query.service.ts:34,65,81-83`; `operations-dashboard.query.service.ts:109-122` (composes ~7 unbounded calls for the "operational overview" endpoint alone)
- **Business Impact:** Dashboard latency will degrade linearly (or worse) as We Decor's transaction history grows; the most-used founder-facing screens are the most exposed.
- **Technical Impact:** In-memory aggregation over full-table `findAll()` results instead of SQL `GROUP BY`/`COUNT`.
- **Recommended Fix:** Push aggregations into SQL via dedicated repository summary methods.
- **Fix before v1.0.0?** No for initial We Decor data volume; Yes before sustained production load.

---

**H15 — No pagination on any list endpoint**
- **File:** `lead.controller.ts:34-38` (`GET /leads`), `vendor.controller.ts:39-50` (`GET /vendors`), `dashboard.controller.ts:163-168` (`GET /dashboards/pending-payments`) — confirmed zero `page`/`pageSize` usage across all controllers
- **Business Impact:** Tenant-wide lists (leads, vendors, pending payments) will eventually return unbounded payloads.
- **Technical Impact:** Violates `docs/18-api-standards.md`'s documented `page`/`pageSize` (default 20, max 100) contract.
- **Recommended Fix:** Add pagination to `GET /leads`, `GET /vendors`, and `GET /dashboards/pending-payments` first (tenant-wide, highest risk); booking/task-scoped lists are naturally bounded and lower priority.
- **Fix before v1.0.0?** Yes for the three tenant-wide list endpoints named above.

---

**H16 — Two silent-failure bugs: DELETE error paths return success**
- **File:** `quotation.controller.ts:156-158`; `task.controller.ts:215-217`
- **Description:** Both have `if (!result.ok) { resultToResponse(result); }` — missing `return`. When the delete fails, the response falls through to the success path (`204 No Content`) instead of propagating the error.
- **Business Impact:** Clients believe a delete succeeded when it actually failed (e.g. due to a stale version or business-rule rejection).
- **Technical Impact:** Simple one-line bug, but silent data-integrity-adjacent failure.
- **Recommended Fix:** Add the missing `return`.
- **Fix before v1.0.0?** Yes — trivial fix, real impact.

---

**H17 — Staff assignment and vendor procurement API contracts diverge from documented Suggestion-based flow**
- **File:** `staff-assignment.controller.ts:69-93` (direct `POST /staff-assignments` + `/confirm`); `workspace.service.ts:17-60` + `booking.controller.ts:193-214` (direct `POST /bookings/:id/activate-workspace`)
- **Description:** Docs specify these actions happen via `POST /suggestions/:id/accept`; the implementation bypasses the Suggestion layer entirely (consistent with C5/C6 — the layer doesn't exist).
- **Business Impact:** No human-approval audit trail for workspace creation or staff assignment decisions, contrary to ADR-017's design intent.
- **Technical Impact:** API/doc drift compounding the ADR-017 gap.
- **Recommended Fix:** Once the Suggestion layer (C5) exists, route these through it; keep direct endpoints only as the "accept" implementation detail.
- **Fix before v1.0.0?** Yes, bundled with C5.

---

**H18 — Booking, invoice, and quotation number allocation is not race-safe**
- **File:** `booking.application.service.ts:89-103`; `quotation.application.service.ts:63-71`; `invoice.application.service.ts:120-131` — each does `findMaxXNumber()` then `create()` as two separate, unlocked calls
- **Business Impact:** Concurrent creation (two staff creating bookings/quotations/invoices at the same moment) can produce duplicate numbers and a 500 error from the unique constraint.
- **Technical Impact:** Classic read-then-write race condition.
- **Recommended Fix:** Wrap in a transaction with row locking, or switch to a DB sequence.
- **Fix before v1.0.0?** Yes — booking/quotation/invoice creation are all P0 flows.

---

## 5. Medium Findings (Condensed)

| # | File | Description | Business Impact | Fix before v1.0? |
|---|---|---|---|---|
| M1 | `dashboard/.../*.query.service.ts` (multiple) | Dashboard application layer imports Prisma-generated enum types directly | Dashboard projections break on Prisma enum renames | Yes |
| M2 | `execution-progress.service.ts:2` | Non-dashboard application service also imports `PreparationStatus` from `@prisma/client` | Same Prisma-coupling risk in core ops path | Yes |
| M3 | `vendor.application.service.ts:169-205` | Vendor status update + issue note creation not transactional | Status change and audit note can diverge on partial failure | Yes |
| M4 | `lead.application.service.ts:111-159` vs `lead.controller.ts` | `updateLead()` fully implemented, but no `PATCH /leads/:id` route exposes it | Sales staff cannot edit lead details (venue, dates, budget) via API | Yes |
| M5 | `quotation-line-item.application.service.ts:29-62` | Line-item mutations don't bump parent quotation `version` | Lost-update risk between quotation header and line items | Yes |
| M6 | `apps/api/prisma/schema.prisma` (no `CalendarEntry`) | EP1-OPS-005 calendar/milestone model missing; partially compensated by Event date fields + dashboard "upcoming events" | Weaker ops milestone scheduling than LM calendar reuse target | No — partial compensation sufficient for initial UAT |
| M7 | `apps/api/prisma/schema.prisma` (no `PackingList`) | EP1-INV-004 packing checklist has no persistence structure | Packing checklist workflow (and its AUT-003 automation) impossible | Yes |
| M8 | `apps/api/prisma/schema.prisma` (no `TenantSettings`) | ADR-016 calls for a `tenant_settings` table; doesn't exist | No tenant-configurable settings surface | No — single-tenant Phase 1 can hardcode values |
| M9 | `Payment.leadId`/`quotationId` (schema.prisma:356-357) | Indexed but no FK constraint to `Lead`/`Quotation` | Orphan payment rows referencing non-existent leads/quotes possible | Yes — finance integrity |
| M10 | `Task.assignedTo` (schema.prisma:427) | Plain UUID, no FK | Invalid assignee IDs can be stored | Yes |
| M11 | Migration rollback docs | No down-migration/rollback strategy documented for either migration | Production migration failure recovery is ad hoc | Yes — explicit DoD requirement |
| M12 | `dashboard.controller.ts:163-168` | `GET /dashboards/pending-payments` returns unbounded `items` array | Large payment backlogs overwhelm the UI | Yes |
| M13 | `vendor-procurement.application.service.ts:99-110` | 1+N query pattern loading procurement lines per procurement header | Slow workspace procurement tab for events with many vendors | No — bounded by typical event size |
| M14 | `task.application.service.ts:125-132` | 1+N query pattern for checklist items per task | Slow task list for checklist-heavy events | No |
| M15 | `invoice.application.service.ts:157-164` | 1+N query pattern for line items per invoice | Slow invoice list for bookings with many invoices | No |
| M16 | Repo-wide, all controllers | Path params (`:id`) never Zod/UUID validated (only bodies/queries are) | Malformed IDs reach services as raw DB errors instead of clean 400s | Yes |
| M17 | `apps/api/src/config/env.schema.ts:11` | `CORS_ORIGIN` defaults to `*` | Production misconfiguration risk if env var not set | Yes |
| M18 | `apps/api/src/main.ts:57-65` | No `app.enableShutdownHooks()` | In-flight requests may be dropped during deploys/restarts | Yes |
| M19 | `apps/api/src/config/env.schema.ts:16` | `JWT_SECRET` is optional in env validation | App could start in production without a signing key once auth exists | Yes |
| M20 | `apps/api/src/common/health/health.controller.ts:20` | Readiness endpoint always returns HTTP 200, even when `status: 'degraded'` | Load balancers/orchestrators may route traffic to unhealthy pods | Yes |
| M21 | EP1-BR-004 (provisional warn-only rules) | Not implemented anywhere — no rule engine, no tests | 4th committed business rule category entirely missing | Yes |
| M22 | `invoice.application.service.spec.ts` | EP1-BR-002 tested only via the booking module, not independently in finance | Financial review gate could regress in finance-only code paths undetected | Yes |
| M23 | booking ↔ finance, payment ↔ finance, booking ↔ inventory, booking ↔ vendor | Bidirectional cross-module TypeScript imports (mitigated at NestJS DI level by hub modules, but present at compile-time) | Harder to extract modules later; tight coupling | No for Phase 1 single-tenant; Yes before Phase 6 modular extraction |
| M24 | EP1-VEN-004 (vendor payments) | No distinct vendor-payment-tracking capability; only generic `VendorExpense` exists (functionally overlapping but not labeled/traced as VEN-004) | Vendor payables workflow slightly under-specified vs domain doc | No — functionally covered by VendorExpense, needs traceability comment only |
| M25 | `docs/business/19...md` EP1-SAL-006 | Sales notifications (FCM/in-app on assignment/status change) not implemented — no Notification module | Sales team lacks assignment/status alerts | Yes |
| M26 | `docs/business/19...md` EP1-MKT-003, EP1-MKT-004 | Decor media library and website→lead intake integration not implemented | Marketing media stays on Google Drive; website leads still require manual re-entry | Yes (MKT-004 integration), No (MKT-003 can follow later) |
| M27 | `docs/business/19...md` EP1-KPI-007 | Selective KPI target support not implemented | Founders cannot set/compare KPI targets in-app | No — business doc says values undefined until founders set them |
| M28 | Additional undocumented Prisma indexes (~19 across models) | Extra indexes beyond what `docs/08-data-model.md` specifies | None — indexes are reasonable and harmless | No — doc-only drift |
| M29 | `apps/api/prisma/migrations/` | Single 507-line monolithic migration for Sprint 2–5, using standard (not concurrent) `CREATE INDEX` | Negligible now; could lock large tables at scale | No — acceptable at launch volume |
| M30 | `lead.module.ts:8`, `customer.module.ts:7` | Modules import `RepositoriesModule` directly even though controllers only need `ApplicationServicesModule` | None immediate | No — cleanup only |
| M31 | 23 undocumented "extra" endpoints (task checklist ×3, staff-assignment lifecycle ×6, vendor issue-notes, inventory movement GET-by-id, 12 dashboard endpoints) | Implemented but not in `docs/09-api-design.md` | Minor confusion for API consumers relying solely on docs | Yes — doc update only |

---

## 6. Low Findings (Condensed)

| # | File | Description | Fix before v1.0? |
|---|---|---|---|
| L1 | `lead.repository.impl.ts:100-103` | Repository conflates NOT_FOUND with version conflict (`ConcurrentModificationError` thrown for missing records) | No |
| L2 | `invoice.repository.ts:58-62` | Repository interface exposes a business-policy-named query (`hasDraftInvoiceForBooking`) — blurs repo/application boundary | No |
| L3 | `quotation.application.service.ts:217-273` | `approveQuotation` doesn't re-check EP1-BR-001 — appears intentional (advance gates Lead Approved, not quotation approval) | No — confirm intent with product |
| L4 | Enum naming drift: `PaymentStatus`/`VendorExpenseStatus` use `confirmed` where docs say `recorded` | Terminology-only mismatch, behaviorally equivalent | No |
| L5 | `Invoice` model lacks `amountPaid`/`amountDue` denormalized fields (doc suggests them) | Derived in application code instead; acceptable | No |
| L6 | Append-only audit tables (`LeadStageHistory`, damage/issue notes) correctly lack `version` field | N/A — this is correct, noted for completeness | No |
| L7 | `infrastructure/docker/docker-compose.yml` | Hardcoded dev-only DB/JWT credentials (`eventos:eventos`, test secret) | No — dev-only, must not reach prod config |
| L8 | `tenant-context.decorator.ts` | Hardcoded tenant not derivable from JWT (expected for Phase 1 single-tenant; blocks Phase 6 SaaS only) | No |
| L9 | `vendor.controller.ts:105-120` | `POST /vendors/:id/issue-notes` implemented but not in API design doc | No — doc update only |
| L10 | `payment.controller.ts:35-47` | Payment create accepts extra undocumented fields (`leadId`, `quotationId`, `notes`) | No |
| L11 | `all-exceptions.filter.ts:46` | Error envelope includes an extra `path` field not in the documented contract | No |
| L12 | `lead.schemas.ts` source enum includes `manual`, doc uses `other` | Minor taxonomy drift | No |

---

## 7. EP1 Requirement Traceability (All 59 IDs)

| Status | Count | IDs |
|---|---|---|
| **Implemented (code + tests)** | 10 | EP1-FIN-004, EP1-FIN-005, EP1-VEN-001, EP1-VEN-003, EP1-VEN-005, EP1-VEN-006, EP1-INV-003, EP1-INV-006, EP1-BR-001, EP1-BR-002, EP1-BR-003 *(11 counted by evidence; subagent totals reconcile to 10 strict/28 partial — see note below)* |
| **Partial** (some enforcement/API exists, real gaps remain) | 28 | EP1-SAL-001–005, EP1-CUS-001, EP1-FIN-001–003, EP1-OPS-001, EP1-OPS-003–005, EP1-STF-002, EP1-VEN-002, EP1-INV-005, EP1-MKT-001–002, EP1-AUT-004, EP1-AUT-006, EP1-KPI-001–006 |
| **Not Implemented** | 21 | EP1-SAL-006, EP1-CUS-002–004, EP1-SUP-001–003, EP1-STF-001, EP1-STF-003, EP1-INV-001–002, EP1-INV-004, EP1-INV-007, EP1-MKT-003–004, EP1-AUT-001–003, EP1-AUT-005, EP1-VEN-004, EP1-KPI-007, EP1-BR-004 |
| **Total** | **59** | |

*Note: minor count reconciliation differences (10 vs 11 "implemented") exist between the two audit passes depending on whether EP1-INV-006 is scored Implemented or Partial; both agree on the >20 Not-Implemented figure, which is the material finding.*

**Key takeaway:** More than a third of committed Phase 1 requirement IDs (21 of 59) have **zero code presence** — not partially built, not tested-but-unwired, but genuinely absent. This directly contradicts a "Phase 1 COMPLETE" characterization.

---

## 8. ADR Compliance Summary

| ADR | Requirement | Verdict |
|---|---|---|
| **ADR-016(a)** | `tenantId` never accepted from request body/query | ✅ **PASS** — zero `tenantId` in Zod request schemas |
| **ADR-016(b)** | Full tenant-resolution plumbing (seeded tenant, JWT→tenant) | ❌ **FAIL** — hardcoded UUID with no guaranteed match to seed (C12); no JWT/OrgContext at all (C3) |
| **ADR-017(a)** | Nothing auto-executes without human approval | ✅ **PASS (vacuously)** — no handlers exist, so nothing *can* auto-execute; but this is an absence of the feature, not a safety guarantee |
| **ADR-017(b)** | Suggestion pattern for workspace/checklist/staff automation | ❌ **FAIL** — Suggestion subsystem does not exist (C5) |

---

## 9. Technical Debt Summary

**Architectural debt (highest leverage fix):** The single `RepositoriesModule` god-export (H1) is the root cause of ~15 individual cross-module coupling findings (H2, H3, H4, and most of the Medium list). Fixing this one architectural pattern — replacing direct repository injection with per-module read/query ports — would resolve the majority of the "module boundary violation" findings in one coordinated refactor rather than 15 separate ones.

**Transactional debt:** Only one code path in the entire codebase (`lead.repository.impl.ts:106`, lead stage change) uses `$transaction`. Every other multi-table write (invoice creation, quotation revision, vendor status+note, three number-allocation races) is unprotected. This is a systemic gap, not isolated incidents.

**Testing debt:** The unit-test suite (329 tests) is real and covers genuine business-rule logic well. But it is exactly one layer of the required test pyramid — there is no integration layer at all. This is the kind of gap that "all tests pass" headlines hide.

**Documentation debt:** `docs/07-domain-model.md` and `docs/08-data-model.md` describe a persistence layer (11+ entities) that does not exist in Prisma. `docs/09-api-design.md` is stale on the dashboard module (13x under-documented) and missing 18 endpoints entirely. Anyone onboarding from docs alone will build incorrect mental models of what exists.

**Scope debt:** 21 of 59 EP1 IDs are unbuilt. This is the largest single risk to the "Phase 1 complete" narrative and should be resolved (either by building the features or by formally re-scoping them out of Phase 1 with business sign-off) before any v1.0.0 declaration.

---

## 10. Documentation Drift Summary

| Doc | Drift |
|---|---|
| `docs/07-domain-model.md`, `docs/08-data-model.md` | 11+ documented entities (`Suggestion`, `StaffMember`, `InventoryItem`, `Attachment`, `TimelineEntry`, `IssueNote`, `ReviewRequest`, `Contact`, `CalendarEntry`, `PackingList`, `TenantSettings`, `FounderKpiSnapshot`) do not exist in `schema.prisma` |
| `docs/09-api-design.md` | Dashboard: 1 documented vs 13 implemented endpoints. 18 documented endpoints missing from code (customer list/timeline/contacts/issues/reviews, staff master, inventory master, PDF export, Administration/Suggestions/Settings, files upload). 23 implemented endpoints undocumented. |
| `docs/12-architecture-decisions.md` (ADR-016, ADR-017) | Both ADRs describe capabilities (tenant plumbing, Suggestion pattern) that are not actually implemented as designed |
| `docs/06-module-design.md` | Notification, Calendar, File, and Administration modules described but not present as modules in the codebase |

---

## 11. Release Readiness Assessment

**Not ready for v1.0.0 / production release.**

Three independent categories of blocker exist simultaneously, any one of which alone would prevent a responsible production launch:

1. **Security:** No authentication or authorization exists. This is not a hardening gap — it is total absence of the control.
2. **Operational infrastructure:** No CI/CD, no Dockerfile, no error tracking, no audit logging. There is no repeatable, gated path to deploy this code, and no way to observe it once deployed.
3. **Functional completeness:** 21 of 59 committed Phase 1 requirement IDs are unbuilt, including a core sales-workflow-breaking bug (quotation totals) and a core ops-workflow deadlock (execution owner assignment never settable).

The code that *does* exist is generally well-structured and well-tested at the unit level, which is a solid foundation to build on — but "well-tested unit logic behind an unauthenticated API with no deployment pipeline" is not a releasable product.

---

## 12. Prioritized Stabilization Backlog

Ordered by blocking severity and dependency order (not yet grouped into Immediate/Before-Release/Post-v1.0 buckets, per instruction to treat that grouping as a follow-up step):

1. Implement authentication + authorization (JWT, guards, password hashing) — **C3, C4**
2. Fix quotation totals recalculation — **C1** (isolated, high-impact, low-effort fix)
3. Add `executionOwnerId` assignment command/endpoint — **C2** (isolated, low-effort fix)
4. Fix tenant seed/hardcoded-ID mismatch — **C12** (isolated, low-effort fix)
5. Wire `createEventFromApprovedQuotation` to an endpoint or event — **C11** (isolated, low-effort fix)
6. Fix the two DELETE silent-failure bugs — **H16** (trivial, two-line fix)
7. Add CI/CD pipeline (lint/test/build gate) — **C9**
8. Add Dockerfile — **C8**
9. Build the Suggestion/Administration subsystem (ADR-017) — **C5, C6, H17**
10. Build missing Phase 1 master data (StaffMember, InventoryItem, Attachment, TimelineEntry, IssueNote, ReviewRequest, Contact) — **C10, C13**
11. Refactor `RepositoriesModule` into per-module read ports — **H1, H2, H3** (single coordinated refactor resolves ~15 findings)
12. Add transaction wrapping to all multi-table writes — **H5, M3**, three number-allocation races — **H18**
13. Standardize `If-Match` enforcement across all controllers — **H6**
14. Add integration/e2e test layer with real test DB, including 403 and 409 HTTP-level tests — **C7**
15. Add Sentry, audit logging, rate limiting, graceful shutdown, readiness-status-code fix — **H9, H10, H11, M18, M20**
16. Add pagination to tenant-wide list endpoints (leads, vendors, pending-payments) — **H15**
17. Reconcile all documentation (API design, domain model, data model) with actual implementation — **H12, H13, §10 items**

---

*This report is read-only. No source code, schema, or configuration was modified during this review.*
