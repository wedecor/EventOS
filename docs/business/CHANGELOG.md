# Business Bible — Master Changelog

This changelog is the authoritative audit log for **Business Bible** document revisions
and a concise record of **Phase 1 Event OS delivery milestones** that realize that bible
in engineering. It records **what changed**, **why**, and **status**. It does not replace
per-document Version History sections.

**Scope**

| Layer | What belongs here |
|-------|-------------------|
| Business Bible (`docs/business/01`–`19`) | Document create/approve/sync revisions |
| Engineering design (`docs/05`–`16`, ADRs) | Baseline specs that bind implementation |
| Phase 1 delivery | Shipped backend capabilities (modules, auth, hardening, DevOps prep, doc sync) |

**Out of scope for this file:** per-commit git history; Phase 2+ product work; unfinished Business Bible draft→Approved transitions for `07`–`18`.

---

## Phase 1 delivery milestones (semantic)

Product/platform milestone tags below are **documentation labels** for chronological
delivery waves. They are not npm package versions of `@event-os/api`.

### 0.1.0 — Business Bible & engineering baseline (2026-07-06 → 2026-07-08)

| Area | Summary | Status |
|------|---------|--------|
| Initial Business Bible | Vision (`01`), model (`02`); interview capture wave for ops domains | Approved / Draft mix — see document-revision tables |
| Customer Journey | `03-customer-journey.md` v1.0 | **Approved** |
| Sales Process | `04-sales-process.md` v1.0 | **Approved** (tactical Zakir validation noted in doc) |
| Event Execution | `05-event-execution.md` v1.0→1.1 | **Approved** (staffing sync with `06`) |
| Staff Management | `06-staff-management.md` v1.0 frozen | **Approved** |
| Vendor / Inventory / Finance (+ related) | `07`–`18` interview drafts; `19` Phase 1 requirements | `19` **Approved** for handoff; several domain docs remain Draft |
| Domain Model | `docs/07-domain-model.md` v1.0 | Published |
| Data Model | `docs/08-data-model.md` v1.0→1.1 (Prisma wording) | Published |
| API Design | `docs/09-api-design.md` v1.0→1.1 (NestJS wording) | Published |
| Implementation Specification | `docs/10-implementation-specification.md` v1.0→1.1 | Published |
| ADR decisions | **ADR-016** single-tenant; **ADR-017** suggestion-only handlers; **ADR-018** NestJS stack | **Accepted** (2026-07-08) |

### 0.2.0 — Phase 1 backend modules (repository delivery)

Business capabilities implemented in `apps/api` under `/api/v1` (JWT + permissions), including:

| Module / surface | Notes |
|------------------|--------|
| Lead / CRM | Leads, follow-ups, clients |
| Quotation | Quotes, line items, send/approve/reject/revise |
| Booking / workspace | Event hub, workspace activate/read, execution stage advances |
| Tasks | Task + checklist CRUD/status |
| Staff | Staff Master CRUD (`/staff`) + staff assignments (confirm/release/cancel) |
| Vendor / procurement | Vendors, procurements, line transitions / notes |
| Inventory | Inventory Item Master (`/inventory/items`) + movements + damage notes |
| Payments / Finance | Payments, invoices, expenses, profitability |
| Dashboard | Founder + Phase 1 summary dashboards |
| Health | `/health`, `/health/ready` |

### 0.3.0 — Authentication & authorization (C3–C4)

| Item | Summary | Status |
|------|---------|--------|
| Authentication (C3) | Login, refresh cookie, logout, password change; JWT access + session refresh | **Complete** |
| Authorization (C4) | Global JWT + permissions guards; `rbac.ts` / `PermissionService` | **Complete** |

### 0.4.0 — Production hardening (R1)

| Item | Summary | Status |
|------|---------|--------|
| R1 Production Hardening | Log redaction, mandatory JWT_SECRET, login rate limit, CORS, refresh-cookie hardening, audit logging, password policy/history/HIBP, coverage thresholds | **Complete** |

### 0.5.0 — DevOps & infrastructure preparation (R2)

| Item | Summary | Status |
|------|---------|--------|
| R2-01–R2-04 | Multi-stage Dockerfile, Compose, PR CI, main-branch CI | **Complete** (repo) |
| R2-05–R2-10 | Staging, Sentry, log-shipping, monitoring, object-storage, and DR **preparation** (docs/templates; no cloud resources required in-repo) | **Complete** (repo prep) |

### 0.6.0 — Documentation synchronization (R3-08–R3-10)

| Item | Summary | Status |
|------|---------|--------|
| R3-08 | docs/05 ↔ docs/09 admin/RBAC wording reconciled | **Complete** |
| R3-09 | Canonical role × permission matrix in `docs/09` (mirrors `rbac.ts`) | **Complete** |
| R3-10 | API README / Swagger / `.env.example` / stale scaffold comments cleaned | **Complete** |

### 0.7.0 — Phase 1 masters, CRM adjuncts & final doc sync (R3-01–R3-07, R3-11–R3-12)

| Item | Summary | Status |
|------|---------|--------|
| R3-01 | Staff Master CRUD (`/api/v1/staff`) | **Complete** |
| R3-02 | Inventory Item Master (`/api/v1/inventory/items`) | **Complete** |
| R3-03 | Suggestions accept/dismiss (`/api/v1/suggestions`) | **Complete** |
| R3-04 | Tenant Settings (`GET/PATCH /api/v1/settings`) | **Complete** |
| R3-05 | Timeline / client interactions | **Complete** |
| R3-06 | Contacts (create-only) | **Complete** |
| R3-07 | Issue Notes + Review Requests | **Complete** |
| R3-11 | CHANGELOG expanded with delivery milestones | **Complete** |
| R3-12 | Final documentation synchronization & architecture review | **Complete** |
| R3-13 | OpenAPI / Swagger Phase 1 contract freeze (`openapi/openapi.v1.json`) | **Complete** |
| R3-14 | Production Readiness Review | **Complete** |
| R3-15 | Backend v1.0 Release Candidate (`1.0.0-rc1`) | **Complete** |

### 0.8.0 — Admin Portal F1-01–F1-13 & frontend documentation sync (R4-01)

| Item | Summary | Status |
|------|---------|--------|
| F1-01–F1-13 | Admin Portal modules against frozen OpenAPI (auth, shell, dashboard, customers, leads, quotations, bookings, workspace, vendors, staff, inventory, finance) | **Complete** |
| R4-01 | Frontend documentation synchronization (engineering docs ↔ OpenAPI ↔ Admin Portal); Business Bible policy unchanged | **Complete** |
| F1-14 Reports / F1-15 Settings | Admin Portal UI placeholders; settings API unused in UI | **Pending** |

---

## Business Bible document revisions

### 2026-07-06

| Date | Document | Version | Change Type | Summary | Approval Status |
|------|----------|---------|------------|---------|----------------|
| 2026-07-06 | `01-business-vision.md` | 0.1→1.0 | Business + Editorial | Initial Business Bible vision from founder interview through editorial approval. | **Approved** |

### 2026-07-07

| Date | Document | Version | Change Type | Summary | Approval Status |
|------|----------|---------|------------|---------|----------------|
| 2026-07-07 | `02-business-model.md` | 1.0→1.2 | Business + sync | Business model approved; later staffing sync with `06` v1.0. | **Approved (Controlled revision)** |
| 2026-07-07 | `03-customer-journey.md` | 1.0 | Business + Editorial | Customer Journey completion — journey rules, software implications, consistency review. | **Approved** |
| 2026-07-07 | `04-sales-process.md` | 1.0 | Business + Editorial | Sales Process — sales rules registry; tactical execution flagged for Zakir. | **Approved** |
| 2026-07-07 | `05-event-execution.md` | 1.0→1.1 | Business + sync | Event Execution approved; staffing references aligned to `06` v1.0. | **Approved** |
| 2026-07-07 | `06-staff-management.md` | 1.0 | Business + Editorial | Approved and frozen as authoritative Staff Management specification (2 permanent decorators + trusted temporary decorator pool). | **Approved (Founder + Operations)** |
| 2026-07-07 | `01-business-vision.md` | 1.1 | Business (Factual synchronization) | Corrected staffing references from “5 fixed staff” to “2 permanent decorators + trusted temporary decorator pool”; no policy changes. | **Approved (Controlled revision)** |
| 2026-07-07 | `07-vendor-management.md` | 0.1 | Business (Interview capture) | Created initial Vendor Management draft: vendor taxonomy, selection, no-credit policy, procurement/payment attachments, confirmation timeline. | **Draft (In interview)** |
| 2026-07-07 | `08-inventory-workflow.md` | 0.1 | Business (Interview capture) | Created initial Inventory Workflow draft skeleton. | **Draft (In interview)** |
| 2026-07-07 | `09-finance-workflow.md` | 0.1 | Business (Interview capture) | Created Finance Workflow draft: payments, expenses, profitability, proofs, permissions. | **Draft (Paused at v0.1 core)** |
| 2026-07-07 | `10-marketing-workflow.md` | 0.1 | Business (Interview capture) | Created Marketing Workflow draft: channels, lead source, content library priorities. | **Draft (Paused at v0.1 core)** |
| 2026-07-07 | `11-social-media-workflow.md` | 0.1 | Business (Interview capture) | Created Social Media Workflow draft: Instagram/Facebook, decor-only content, Drive storage. | **Draft (Paused at v0.1 core)** |
| 2026-07-07 | `12-customer-support.md` | 0.1 | Business (Interview capture) | Created Customer Support draft: channels, escalation, issue notes, review tracking. | **Draft (Paused at v0.1 core)** |
| 2026-07-07 | `13-standard-operating-procedures.md` | 0.1 | Business (Interview capture) | Created SOP framework draft: Phase 1 library + event checklists. | **Draft (Paused at v0.1 core)** |
| 2026-07-07 | `14-business-rules.md` | 0.1 | Business (Interview capture) | Created master Business Rules framework and Phase 1 hard blocks. | **Draft (Paused at v0.1 framework)** |
| 2026-07-07 | `15-kpis.md` | 0.1 | Business (Interview capture) | Created master KPI framework and Phase 1 founder dashboard priorities. | **Draft (Paused at v0.1 core)** |
| 2026-07-07 | `16-pain-points.md` | 0.1 | Business (Interview capture) | Created master Pain Points registry and Phase 1 #1 priority (Zakir dependency). | **Draft (Paused at v0.1 core)** |

### 2026-07-08

| Date | Document | Version | Change Type | Summary | Approval Status |
|------|----------|---------|------------|---------|----------------|
| 2026-07-08 | `17-automation-opportunities.md` | 0.1 | Business (Interview capture) | Created Automation Opportunities draft: suggestion-only / human-approval policy. | **Draft (Paused at v0.1 core)** |
| 2026-07-08 | `18-technology-systems-landscape.md` | 0.1 | Business + code audit | Systems landscape + capability audits of current/reference apps. | **Draft (Interview + audit)** |
| 2026-07-08 | `19-event-os-phase1-requirements.md` | 0.1 | Engineering handoff | EP1 IDs, scope freeze, UAT criteria; founder sign-off for development handoff. | **Approved (Handoff documented)** |
| 2026-07-08 | `docs/07-domain-model.md` | 1.0 | Engineering design | Phase 1 domain model (aggregates, events, ADR-016/017 alignment). | **Published** |
| 2026-07-08 | `docs/08-data-model.md` | 1.0→1.1 | Engineering design | Logical persistence model; Prisma Migrate wording sync. | **Published** |
| 2026-07-08 | `docs/09-api-design.md` | 1.0→1.1 | Engineering design | REST/application contracts; NestJS terminology. | **Published** |
| 2026-07-08 | `docs/10-implementation-specification.md` | 1.0→1.1 | Engineering design | Implementation playbook / sprint-oriented specs. | **Published** |
| 2026-07-08 | `docs/12-architecture-decisions.md` | — | ADR | ADR-016, ADR-017, ADR-018 accepted. | **Accepted** |

### 2026-07-13

| Date | Document | Version | Change Type | Summary | Approval Status |
|------|----------|---------|------------|---------|----------------|
| 2026-07-13 | `docs/09-api-design.md` | 1.2 | Documentation sync (R3-09) | Canonical Phase 1 role × permission matrix mirroring `rbac.ts`. | **Published** |
| 2026-07-13 | `docs/05`, `docs/14`, `docs/10` | — | Documentation sync (R3-08) | RBAC/admin wording reconciled to docs/09 + implementation. | **Published** |
| 2026-07-13 | `apps/api` README / Swagger / `.env.example` | — | Documentation cleanup (R3-10) | Removed scaffold-era stale comments; aligned to shipped API. | **Complete** |
| 2026-07-13 | `docs/business/CHANGELOG.md` | — | Documentation sync (R3-11) | Expanded with Phase 1 delivery milestones and missing bible entries. | **Complete** |
| 2026-07-13 | `docs/05`, `08`, `09` (v1.3), `10`, `12`, `14`, `15-quality-standards`, `16`, `22`, CHANGELOG | — | Documentation sync (R3-12) | Final Phase 1 documentation synchronization against shipped `apps/api`. | **Complete** |
| 2026-07-13 | `docs/09` (v1.4), `apps/api` OpenAPI/Swagger | 1.4 | Contract freeze (R3-13) | Swagger enriched from Zod; frozen `openapi/openapi.v1.json`; freeze rules published. | **Complete** |
| 2026-07-13 | Production readiness (R3-14) | — | Engineering audit | Swagger gated in production; password-change session revoke; invoice create atomic; OpenAPI/e2e CI gates. | **Complete** |
| 2026-07-13 | Backend v1.0 RC1 (R3-15) | `1.0.0-rc1` | Release candidate | Quality gates green; OpenAPI freeze verified (no drift); package version set to `1.0.0-rc1`; backend freeze ready. | **Complete** |
| 2026-07-13 | Admin Portal F1-01–F1-13 | — | Frontend delivery | Narrowed Phase 1 UI against frozen OpenAPI (hub-when-no-list; booking-scoped finance/inventory). | **Complete** |
| 2026-07-13 | `docs/05`, `07`, `08`, `09` (v1.5), `10`, `12` (ADR-007 note), `14`, `15`, `16`, `22`, `19` (realization note), CHANGELOG | — | Documentation sync (R4-01) | Align engineering docs to OpenAPI + Admin Portal; no Business Bible policy changes. | **Complete** |

---

## Not yet completed (explicitly excluded from “done” above)

| Backlog / gap | Note |
|---------------|------|
| Cloud staging / live Sentry sink / aggregator / real DR drills | R2 items delivered as **repository preparation** only |
| Full Business Bible draft→Approved for `07`–`18` | Several domain docs remain Draft at v0.1 |
| Admin Portal F1-14 Reports / F1-15 Settings | Placeholders only; settings API unused in UI |
| Unused shipped APIs in Admin Portal | Tasks, procurements, staff-assignments, change-password, some dashboard summaries — deferred by F1 scope |
| Phase 2+ product features | Explicitly deferred — do not start without backlog authorization |

When those land, add a new dated section — do not backdate them into completed milestone tables.
