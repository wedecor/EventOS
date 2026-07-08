# Architecture Decision Records (ADRs)

## Purpose of This Document

This document records significant architectural and technical decisions for Event OS. Each decision includes context, options considered, the decision made, and rationale. ADRs are immutable once accepted—supersede with a new ADR rather than editing.

---

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-001 | Modular Monolith Architecture | Accepted | 2026-07-06 |
| ADR-002 | TypeScript as Primary Language | Accepted | 2026-07-06 |
| ADR-003 | PostgreSQL as Primary Database | Accepted | 2026-07-06 |
| ADR-004 | Row-Level Multi-Tenancy | Accepted | 2026-07-06 |
| ADR-005 | Domain-Driven Design with Bounded Contexts | Accepted | 2026-07-06 |
| ADR-006 | REST API over GraphQL | Accepted | 2026-07-06 |
| ADR-007 | React SPA Frontend | Accepted | 2026-07-06 |
| ADR-008 | JWT Authentication with Refresh Tokens | Accepted | 2026-07-06 |
| ADR-009 | Monorepo with pnpm Workspaces | Accepted | 2026-07-06 |
| ADR-010 | AI Provider Abstraction Layer | Accepted | 2026-07-06 |
| ADR-011 | UUID Primary Keys | Accepted | 2026-07-06 |
| ADR-012 | In-Process Domain Events (Phase 1) | Accepted | 2026-07-06 |
| ADR-013 | Zod for Runtime Validation | Accepted | 2026-07-06 |
| ADR-014 | TanStack Query for Server State | Accepted | 2026-07-06 |
| ADR-015 | Structured Logging with Pino | Accepted | 2026-07-06 |
| ADR-016 | Phase 1 Single-Tenant Mode (We Decor) | Accepted | 2026-07-08 |
| ADR-017 | Phase 1 Domain Event Handlers (Suggestion-Only) | Accepted | 2026-07-08 |
| ADR-018 | Backend Technology Stack (NestJS) | Accepted | 2026-07-08 |

---

## ADR-001: Modular Monolith Architecture

**Status:** Accepted
**Date:** 2026-07-06
**Deciders:** Founding Engineering

### Context

Event OS will eventually have 15+ modules spanning CRM, operations, finance, marketing, and AI. We need to decide between microservices, a traditional monolith, and a modular monolith.

### Options Considered

1. **Microservices** — Each module as independent service
2. **Traditional monolith** — Single codebase without module boundaries
3. **Modular monolith** — Single deployable with strict module boundaries

### Decision

Modular monolith with strict module boundaries, clear public interfaces, and domain-driven module organization.

### Rationale

- Team size (< 10 engineers for 2+ years) cannot support microservices operational overhead
- Event management workflows are deeply interconnected (lead → quote → booking → task)
- Module boundaries enable future extraction without current distributed systems complexity
- Single deployment simplifies CI/CD, debugging, and local development
- See [03-product-principles.md](./03-product-principles.md) Principle 3

### Consequences

- **Positive:** Fast development, simple operations, atomic deployments
- **Positive:** Module boundaries enforced by code structure, not network
- **Negative:** All modules scale together (mitigated by horizontal scaling of the monolith)
- **Negative:** Risk of boundary erosion without discipline (mitigated by code review and linting)

---

## ADR-002: TypeScript as Primary Language

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose the primary language for backend and frontend development.

### Options Considered

1. **TypeScript** — Typed JavaScript for full stack
2. **Python (backend) + TypeScript (frontend)** — Common split
3. **Go (backend) + TypeScript (frontend)** — Performance-focused

### Decision

TypeScript for backend, frontend, and shared packages.

### Rationale

- Single language reduces context switching and enables shared types
- Type safety catches errors at compile time, critical for financial data
- AI coding agents produce more consistent TypeScript than multi-language projects
- Largest ecosystem for web development
- We Decor's engineering team can be trained on one language

### Consequences

- **Positive:** Shared types between frontend and backend via monorepo packages
- **Positive:** Consistent tooling (ESLint, Prettier, Jest)
- **Negative:** Node.js performance ceiling (acceptable for current scale)
- **Negative:** TypeScript complexity for junior developers (mitigated by strict config and standards)

---

## ADR-003: PostgreSQL as Primary Database

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose the primary data store for all business data.

### Options Considered

1. **PostgreSQL** — Relational, ACID, feature-rich
2. **MySQL** — Relational, widely deployed
3. **MongoDB** — Document store, flexible schema
4. **CockroachDB** — Distributed PostgreSQL-compatible

### Decision

PostgreSQL 16+ as the sole system of record.

### Rationale

- ACID transactions essential for financial and booking data
- JSONB for flexible tenant configuration without schema-less chaos
- Row-Level Security for multi-tenant isolation (defense-in-depth)
- Full-text search eliminates need for separate search engine initially
- Mature, well-understood, excellent managed hosting options
- See [07-database-philosophy.md](./07-database-philosophy.md)

### Consequences

- **Positive:** One database to manage, backup, and monitor
- **Positive:** Rich feature set (enums, ranges, window functions, CTEs)
- **Negative:** Vertical scaling limits (mitigated by read replicas, connection pooling)
- **Negative:** Schema migrations required for structural changes (mitigated by migration tooling)

---

## ADR-004: Row-Level Multi-Tenancy

**Status:** Accepted
**Date:** 2026-07-06

### Context

Event OS starts with one tenant (We Decor) but must architect for thousands. Choose the multi-tenancy isolation strategy.

### Options Considered

1. **Database per tenant** — Separate PostgreSQL database per customer
2. **Schema per tenant** — Separate schema within one database
3. **Shared schema, row-level** — `tenant_id` column on all tables
4. **Shared schema with RLS** — Row-level + PostgreSQL Row-Level Security policies

### Decision

Shared schema with `tenant_id` on all tenant-scoped tables. PostgreSQL RLS added in Phase 2 as defense-in-depth.

### Rationale

- Database-per-tenant: operationally expensive at scale (1000 tenants = 1000 databases)
- Schema-per-tenant: migration complexity multiplied by tenant count
- Row-level: simple, proven pattern used by Linear, Notion, and most SaaS companies
- `tenant_id` marginal cost is near zero; retrofit cost is months of engineering
- Application-level enforcement in Phase 1; RLS in Phase 2 for defense-in-depth

### Consequences

- **Positive:** Simple operations, single migration path, easy cross-tenant analytics (anonymized)
- **Positive:** Connection pooling shared across tenants
- **Negative:** Noisy neighbor risk (mitigated by query timeouts, rate limiting)
- **Negative:** Requires discipline on every query (mitigated by base repository pattern)

---

## ADR-005: Domain-Driven Design with Bounded Contexts

**Status:** Accepted
**Date:** 2026-07-06

### Context

Event OS has significant domain complexity. Choose the architectural pattern for organizing business logic.

### Options Considered

1. **Transaction Script** — Procedural code organized by function
2. **Active Record** — Database-centric with logic on models
3. **Domain-Driven Design** — Rich domain model with bounded contexts
4. **CQRS + Event Sourcing** — Separate read/write models with event store

### Decision

Domain-Driven Design with bounded contexts, aggregates, domain events, and layered architecture. CQRS for read models only where justified (dashboards, reports).

### Rationale

- Event management has real domain complexity (pricing, state machines, allocation rules)
- DDD bounded contexts map directly to module boundaries
- Rich domain models make business rules testable without infrastructure
- Full CQRS + Event Sourcing is over-engineered for current scale
- See [03-product-principles.md](./03-product-principles.md) Principles 6 and 7

### Consequences

- **Positive:** Business rules are explicit, testable, and localized
- **Positive:** Module boundaries are clear and enforceable
- **Negative:** More code than transaction script (entities, value objects, mappers)
- **Negative:** Learning curve for developers unfamiliar with DDD

---

## ADR-006: REST API over GraphQL

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose the API style for client-server communication.

### Options Considered

1. **REST** — Resource-oriented HTTP API
2. **GraphQL** — Query language with flexible data fetching
3. **tRPC** — End-to-end typesafe RPC

### Decision

REST API with OpenAPI 3.1 specification. Versioned (`/api/v1/`).

### Rationale

- REST is universally understood by AI agents, frontend developers, and integration partners
- OpenAPI spec enables auto-generated client SDKs and documentation
- Event OS CRUD operations map naturally to REST resources
- GraphQL adds complexity (schema, resolvers, N+1, caching) without clear benefit at current scale
- tRPC couples frontend and backend too tightly for future public API

### Consequences

- **Positive:** Simple, cacheable, well-tooled (OpenAPI generators, Postman, curl)
- **Positive:** Easy to expose as public API in multi-tenant phase
- **Negative:** Over-fetching on complex views (mitigated by dedicated query endpoints)
- **Negative:** Multiple round trips for complex pages (mitigated by aggregate endpoints)

### Revisit When

- Mobile app with bandwidth constraints needs field-level control
- Third-party developers need flexible querying

---

## ADR-007: React SPA Frontend

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose the frontend framework and rendering strategy.

### Options Considered

1. **React SPA** — Client-side rendered single page application
2. **Next.js SSR** — Server-side rendered React with SEO
3. **Vue/Nuxt** — Alternative framework
4. **HTMX + server templates** — Minimal JavaScript

### Decision

React SPA with TypeScript, served as static assets. PWA capabilities for mobile.

### Rationale

- Event OS is a business application, not a content site — SEO is irrelevant for the admin app
- SPA provides the responsive, app-like experience users expect
- React has the largest ecosystem and hiring pool
- CMS module (Phase 4) handles public-facing SEO separately
- PWA provides mobile installability without native app investment

### Consequences

- **Positive:** Rich interactive UI (pipeline drag-and-drop, real-time updates)
- **Positive:** Frontend deploys independently as static assets
- **Negative:** Initial load time (mitigated by code splitting, lazy loading)
- **Negative:** No SSR for admin pages (not needed)

---

## ADR-008: JWT Authentication with Refresh Tokens

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose the authentication mechanism for the API.

### Options Considered

1. **Session cookies** — Server-side sessions with cookie
2. **JWT access + refresh tokens** — Stateless access, refresh rotation
3. **OAuth only** — Delegate to Google/Microsoft

### Decision

JWT access tokens (15-minute expiry) + HTTP-only refresh token cookies (7-day expiry) with rotation.

### Rationale

- Stateless access tokens simplify API scaling (no session store lookup per request)
- Short-lived access tokens limit exposure if compromised
- Refresh token rotation detects token theft
- HTTP-only cookies prevent XSS token theft for refresh tokens
- Email/password auth for Phase 1; OAuth added in Phase 4

### Consequences

- **Positive:** Scales horizontally without shared session store
- **Positive:** Works with SPA, mobile, and future API clients
- **Negative:** Token revocation requires blocklist (mitigated by short access token expiry)
- **Negative:** JWT size adds to request headers (acceptable)

---

## ADR-009: Monorepo with pnpm Workspaces

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose repository structure for backend, frontend, and shared code.

### Options Considered

1. **Monorepo** — Single repository, multiple packages
2. **Polyrepo** — Separate repositories per app
3. **Monorepo with Nx/Turborepo** — Monorepo with build orchestration

### Decision

Monorepo with pnpm workspaces. Turborepo added when build times warrant it.

### Rationale

- Shared types between frontend and backend require synchronized changes
- Single PR can update API and UI together
- pnpm is fast and disk-efficient
- Small team benefits from single repository visibility
- See [10-folder-structure.md](./10-folder-structure.md)

### Consequences

- **Positive:** Atomic cross-package changes, shared CI, unified versioning
- **Positive:** AI agents see full codebase context
- **Negative:** Repository size grows (manageable for years)
- **Negative:** CI must be smart about what to rebuild (path filtering)

---

## ADR-010: AI Provider Abstraction Layer

**Status:** Accepted
**Date:** 2026-07-06

### Context

Event OS is AI-first. Choose how to integrate LLM providers.

### Options Considered

1. **Direct API calls** — Call OpenAI/Anthropic directly in each module
2. **Abstraction layer** — Provider-agnostic interface with adapter pattern
3. **Framework (LangChain, etc.)** — Use an AI orchestration framework

### Decision

Custom abstraction layer with provider adapters. No heavy framework dependency.

### Rationale

- Direct coupling to one provider creates lock-in risk
- LangChain adds complexity and dependency weight disproportionate to our needs
- Custom layer gives control over prompt management, cost tracking, and guardrails
- Simple interface: `complete()` and `stream()` with prompt templates
- See [09-ai-development-guide.md](./09-ai-development-guide.md)

### Consequences

- **Positive:** Provider-agnostic, testable (mock provider), cost-trackable
- **Positive:** Prompt versioning and management centralized
- **Negative:** Custom code to maintain (mitigated by simple interface)
- **Negative:** May miss framework features (evaluate LangChain for complex agent workflows in Phase 5)

---

## ADR-011: UUID Primary Keys

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose primary key strategy for database tables.

### Options Considered

1. **Auto-increment integers** — Sequential, compact
2. **UUID v4** — Random, globally unique
3. **UUID v7** — Time-ordered, globally unique
4. **ULID** — Time-ordered, URL-safe

### Decision

UUID v4 (PostgreSQL `gen_random_uuid()`) for all primary keys. Human-readable sequential numbers as separate columns where needed.

### Rationale

- No sequential ID leakage across tenants (security)
- Safe to generate client-side for optimistic UI
- No coordination needed for ID generation
- Human-readable numbers (quotation number, invoice number) are separate display fields with tenant-scoped sequences
- UUID v7 considered but v4 is sufficient with proper indexing

### Consequences

- **Positive:** Secure, distributed-safe, merge-friendly
- **Negative:** 16 bytes vs 4/8 bytes (negligible at current scale)
- **Negative:** Less human-readable in logs (mitigated by display numbers)

---

## ADR-012: In-Process Domain Events (Phase 1)

**Status:** Accepted
**Date:** 2026-07-06

### Context

Modules need to communicate side effects (booking confirmed → create tasks, send notification). Choose the event delivery mechanism.

### Options Considered

1. **In-process event bus** — Synchronous/asynchronous handlers in same process
2. **Message queue (Redis/RabbitMQ)** — External message broker
3. **Transactional outbox** — DB-backed event queue with worker
4. **Event sourcing** — Events as source of truth

### Decision

Phase 1: In-process event bus with after-commit async handlers. Phase 2: Transactional outbox pattern with background worker.

### Rationale

- In-process is simplest for single-server deployment
- After-commit handlers prevent events firing before transaction commits
- Outbox pattern added when reliability requirements increase (multi-tenant, multiple workers)
- Event sourcing is over-engineered for current needs

### Consequences

- **Positive:** Simple, no external dependencies for events in Phase 1
- **Positive:** Easy to test (inject mock event bus)
- **Negative:** Events lost if process crashes before handler runs (acceptable Phase 1; outbox fixes in Phase 2)
- **Negative:** Cannot distribute event processing across servers (acceptable until horizontal scaling)

---

## ADR-013: Zod for Runtime Validation

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose the runtime validation library for API request validation and AI output validation.

### Options Considered

1. **class-validator** — Decorator-based, NestJS native
2. **Zod** — Schema-first, TypeScript-native
3. **Joi** — Mature, widely used
4. **io-ts** — Functional, fp-ts ecosystem

### Decision

Zod for all runtime validation: API requests, configuration, AI output schemas.

### Rationale

- Schema-first approach: define once, infer TypeScript types
- Same library for API validation and AI response validation
- Excellent TypeScript integration (type inference from schemas)
- Composable schemas for complex domain objects
- Lighter than class-validator decorators on every field

### Consequences

- **Positive:** Single validation approach across the codebase
- **Positive:** Types derived from schemas (no duplication)
- **Negative:** Different from NestJS default (class-validator) — requires custom pipe

---

## ADR-014: TanStack Query for Server State

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose the frontend server state management library.

### Options Considered

1. **TanStack Query (React Query)** — Server state caching and synchronization
2. **Redux Toolkit + RTK Query** — Global state with API caching
3. **SWR** — Stale-while-revalidate data fetching
4. **Apollo Client** — GraphQL client with caching

### Decision

TanStack Query v5 for all server state management.

### Rationale

- Purpose-built for server state (caching, invalidation, optimistic updates)
- No global store needed for data that lives on the server
- Excellent DevTools for debugging
- Works with REST API (no GraphQL dependency)
- Industry standard for React server state (used by Linear, etc.)

### Consequences

- **Positive:** Automatic caching, background refetching, optimistic updates
- **Positive:** Reduces boilerplate vs. manual fetch + useState
- **Negative:** Learning curve for query key management and invalidation patterns

---

## ADR-015: Structured Logging with Pino

**Status:** Accepted
**Date:** 2026-07-06

### Context

Choose the logging library for production observability.

### Options Considered

1. **Pino** — Fast, structured JSON logging
2. **Winston** — Flexible, widely used
3. **Bunyan** — Structured JSON logging

### Decision

Pino with JSON structured logging in production, pretty-print in development.

### Rationale

- Fastest Node.js logger (low overhead in production)
- JSON output integrates with log aggregation services
- Child loggers for request context (requestId, tenantId)
- NestJS integration available

### Consequences

- **Positive:** Low performance overhead, structured and searchable
- **Positive:** Consistent log format across all modules
- **Negative:** JSON logs less readable in terminal (mitigated by pino-pretty in dev)

---

## ADR-016: Phase 1 Single-Tenant Mode (We Decor)

**Status:** Accepted  
**Date:** 2026-07-08  
**Deciders:** Founding Engineering  
**Resolves:** Architecture review **A10** ([`05-system-architecture.md`](./05-system-architecture.md))

### Context

Phase 1 business scope ([`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md)) is **single We Decor tenant** only. Multi-tenant SaaS onboarding, isolation, and billing are deferred to Phase 6 / Doc `20`.

ADR-004 already commits to shared-schema row-level multi-tenancy (`tenant_id` on tenant-scoped tables). Engineering must decide whether Phase 1 implements:

1. **Minimal fixed-tenant middleware** — hardcoded org context, optional omission of tenant tables
2. **Full tenant-resolution plumbing** — normal `tenants` / `tenant_settings` schema and `OrgContext` middleware, with **one seeded We Decor tenant**

### Options Considered

1. **Minimal fixed-tenant middleware** — No `tenants` table; `OrgContext` returns constants; queries may omit `tenant_id` in Phase 1
2. **Full plumbing, single seeded tenant** — Tenant module minimal; database seeded with We Decor; all queries scoped via `tenant_id`; no onboarding UI
3. **Defer `tenant_id` entirely until SaaS** — Single-tenant schema without tenant columns (rejected — conflicts with ADR-004)

### Decision

**Option 2: Full tenant-resolution plumbing with a single seeded We Decor tenant.**

Phase 1 implementation:

| Area | Phase 1 behaviour |
|------|-------------------|
| **Database** | `tenants` + `tenant_settings` tables exist; **one** seeded row (We Decor) |
| **Middleware** | Standard `OrgContext` resolution from authenticated user → tenant association |
| **Queries** | All tenant-scoped tables filtered by `tenant_id` via base repository / ORM middleware |
| **Tenant module** | Minimal — settings read/update only; **no** self-service signup, provisioning, or billing |
| **RLS policies** | **Deferred** until multi-tenant SaaS (Phase 6) — application-layer scoping only in Phase 1 |
| **Tests** | Permission and module-access tests; **cross-tenant isolation tests deferred** to Phase 6 |
| **API** | `tenantId` never accepted from request body; always from `OrgContext` |

### Rationale

- **Consistent with ADR-004** — `tenant_id` columns and repository scoping from day one; no retrofit before SaaS
- **Avoids throwaway work** — Minimal fixed-tenant middleware would require schema and query rewrites for Phase 6
- **Matches business Phase 1** — Doc `19` defers multi-tenant SaaS, not data-model preparation
- **Low Phase 1 cost** — One seed migration + fixed association for We Decor users is simpler than maintaining a parallel non-tenant code path
- **DoD alignment** — [`20-definition-of-done.md`](./20-definition-of-done.md) expects org scoping; cross-tenant tests explicitly Phase 6

### Consequences

- **Positive:** Phase 6 SaaS adds tenants without redesigning persistence or `OrgContext`
- **Positive:** Local/staging/prod all use the same scoping code path as future SaaS
- **Negative:** Slightly more setup than hardcoding (one seed script, user–tenant association)
- **Negative:** Engineers must still scope every query — discipline required (same as ADR-004)
- **Mitigation:** Base repository enforces `tenant_id`; integration tests assert scoping for We Decor tenant

### Phase 1 seed contract (implementation note)

```typescript
// Seeded once per environment — not user-configurable in Phase 1
const WE_DECOR_TENANT = {
  slug: 'we-decor',
  name: 'We Decor Events',
  // settings: branding, tax, numbering — via tenant_settings JSONB
};
```

All Phase 1 users belong to this tenant. Founders (Ilyas, Zakir) and staff accounts are associated at provisioning time.

---

## ADR-017: Phase 1 Domain Event Handlers (Suggestion-Only)

**Status:** Accepted  
**Date:** 2026-07-08  
**Deciders:** Founding Engineering  
**Resolves:** Architecture review **A11** ([`05-system-architecture.md`](./05-system-architecture.md))  
**Business authority:** EP1-AUT-001, EP1-AUT-005 ([`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md))

### Context

Domain events coordinate cross-module side effects (e.g. `QuotationApproved` → workspace checklist draft). ADR-012 accepts an in-process event bus for Phase 1.

Business Phase 1 requires **recommendation-only automation** — nothing auto-executes. Human approval is mandatory before customer comms, vendor actions, staff assignment, pricing changes, and execution decisions.

Pre-alignment architecture examples implied handlers could auto-create calendar entries, tasks, and notifications. Engineering needs a **handler contract** that satisfies business guardrails without blocking useful assistance.

### Options Considered

1. **Auto-execute handlers** — Handlers mutate aggregates and send notifications directly (rejected — violates EP1-AUT-001)
2. **Suggestion-only handlers** — Handlers persist proposals and in-app alerts; user confirms via explicit API action
3. **No domain event handlers in Phase 1** — All cross-module work synchronous in application services (rejected — loses decoupling and audit trail for recommendations)
4. **Deferred event bus** — No events until approval UX exists (rejected — delays W1 workspace automation)

### Decision

**Option 2: Suggestion-only handlers with explicit human confirmation.**

#### Handler rules (Phase 1)

| Handler may | Handler must not |
|-------------|------------------|
| Persist a **Suggestion** record linked to aggregate + event type | Mutate business aggregates (booking, task, assignment, payment, etc.) |
| Create **in-app Alert** for relevant users (badge, notification centre) | Send customer/vendor WhatsApp, email, or SMS |
| Enqueue **background job** that only writes suggestions/alerts | Auto-assign staff, advance execution stages, confirm procurement |
| Log audit metadata (source event, handler, timestamp) | Mark items approved/completed without user action |

#### Suggestion lifecycle

```
Domain event emitted (after commit)
    → Handler evaluates rules / templates
    → Suggestion created (status: pending)
    → In-app Alert created for approver(s)
    → User reviews in UI (workspace, inbox, or contextual panel)
    → User accepts or dismisses
    → On accept: Application service executes the business action (single code path)
    → Suggestion status: accepted | dismissed | expired
```

**Business actions always go through application services** — never through event handlers directly. Accepting a suggestion calls the same use case as a manual user action (e.g. `BookingService.activateWorkspace()`, `TaskService.generateFromTemplate()`).

#### Suggestion aggregate (platform-owned)

Owned by shared kernel / platform policy layer (not a business module):

| Field | Purpose |
|-------|---------|
| `id` | UUID |
| `tenantId` | Org scope |
| `type` | e.g. `workspace.create`, `checklist.generate`, `staff.assign`, `calendar.milestone` |
| `status` | `pending`, `accepted`, `dismissed`, `expired` |
| `sourceEventId` | Originating domain event |
| `aggregateType` / `aggregateId` | Target entity (e.g. Booking) |
| `payload` | JSON — proposed action parameters (template id, staff ids, etc.) |
| `createdAt` / `resolvedAt` / `resolvedBy` | Audit trail |

Table name: `suggestions` (or equivalent). Expiry policy: configurable per type; default **no auto-expiry** in Phase 1.

#### Approval gates (EP1-AUT-005)

These action categories **require** either manual initiation or **accepted suggestion** — handlers alone cannot complete them:

| Category | Examples |
|----------|----------|
| Customer communications | Review request, timeline note implying outbound message |
| Vendor actions | Procurement confirmation, vendor assignment |
| Staff assignment | Crew assignment to event |
| Pricing | Quotation revision, on-site add |
| Execution | Workspace activation, execution stage advance, inventory movement confirm |

**Hard blocks** (EP1-BR-001–003) are enforced in application services **before** the action runs — independent of suggestions.

#### In-app alerts vs outbound notifications

| Type | Phase 1 |
|------|---------|
| **In-app alert** | Allowed from handlers — "Review packing checklist draft" |
| **Push (FCM)** | Allowed only for **informational** in-app mirror; not a substitute for approval |
| **Email / WhatsApp to customer or vendor** | **Requires** explicit user action after review — not from handlers |

Reuse LM FCM patterns for assignment-style alerts where the **business action already occurred** via user gesture (e.g. user clicked Assign → then notify). Pattern: **user action first → optional notification**, not **event → auto notify**.

#### Relationship to ADR-012

ADR-012 stands: in-process bus, after-commit handlers. ADR-017 constrains **handler behaviour** in Phase 1. Phase 2+ may introduce transactional outbox; suggestion-only policy remains until business approves auto-execution (not Phase 1).

### Rationale

- **Business compliance** — Implements EP1-AUT-001 and EP1-AUT-005 without removing event-driven decoupling
- **Single execution path** — Accept suggestion → same application service as manual action; no duplicate business logic
- **Auditability** — Suggestions record what the system recommended and what humans accepted
- **UX clarity** — Zakir/Ilyas see proposals in workspace context (EP1-AUT-002–004) rather than silent auto-changes
- **Reference-system guardrail** — Does not copy AC Platform auto-orchestration (Doc `18` audit)

### Consequences

- **Positive:** Clear implementation rule for all Phase 1 event handlers
- **Positive:** Workspace automation (EP1-AUT-002–004) has a concrete persistence model
- **Negative:** Extra UI for suggestion review (inbox or inline prompts)
- **Negative:** Two-step flow (suggest → accept) vs one-click automation
- **Mitigation:** High-value suggestions surfaced on event workspace; bulk dismiss for low-priority drafts

### Implementation checklist

- [ ] `Suggestion` entity + repository in shared kernel
- [ ] `ISuggestionService.accept()` / `.dismiss()` delegating to target module application services
- [ ] Event handler base class or lint rule: handlers cannot inject write repositories of other modules
- [ ] Notification module distinguishes in-app alert vs outbound send (outbound requires user-triggered command)
- [ ] Integration tests: handler creates suggestion only; aggregate unchanged until accept

---

## ADR-018: Backend Technology Stack (NestJS)

**Status:** Accepted  
**Date:** 2026-07-08  
**Deciders:** Founding Engineering

### Context

Event OS Phase 1 is a **greenfield** implementation. No application code has been written. Business architecture, domain model, API contracts, EP1 requirements, and workflow definitions remain unchanged — only the **implementation technology** for the backend has been selected.

The previously considered Java/Spring Boot stack (Spring Boot, Spring Data JPA, Hibernate, Maven, Flyway, Bean Validation, Spring Security) is **not** adopted for Phase 1.

The approved backend must support:

- **AI-assisted development** — consistent, type-safe code generation across the stack
- **Small engineering team** — high productivity with minimal operational overhead
- **Modular monolith architecture** (ADR-001) — strict module boundaries within a single deployable
- **Future SaaS roadmap** (ADR-004, ADR-016) — tenant-ready schema without premature microservices
- **Strong type safety** end-to-end (ADR-002)
- **Modern ecosystem** — testing, validation, API documentation, and containerized deployment

### Options Considered

1. **Spring Boot (Java)** — Spring MVC, Spring Data JPA, Hibernate, Maven, Flyway, Bean Validation, Spring Security
2. **ASP.NET Core (C#)** — Mature enterprise framework with strong typing
3. **FastAPI (Python)** — Fast async API development with Pydantic validation
4. **Go (stdlib / Gin / Echo)** — High performance, compiled binaries, minimal runtime
5. **NestJS (TypeScript)** — Structured Node.js framework with DI, modules, and decorators

### Decision

**Option 5: NestJS (TypeScript)** is the approved backend technology stack for Event OS Phase 1.

| Component | Technology |
|-----------|------------|
| **Backend framework** | NestJS |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma ORM |
| **Migrations** | Prisma Migrate |
| **Cache / queue broker** | Redis |
| **Job queue** | BullMQ |
| **Authentication** | Passport JWT (ADR-008) |
| **Request validation** | Zod (ADR-013) |
| **API documentation** | Swagger / OpenAPI |
| **Containerization** | Docker |
| **Package manager / monorepo** | pnpm (ADR-009) |

Spring Boot, ASP.NET Core, FastAPI, and Go are **rejected for Phase 1** in favour of NestJS.

This decision **does not modify** business rules, domain model, data model, API contracts, EP1 mappings, W1–W5 workflows, permissions, or any prior ADR (ADR-001–ADR-017). It codifies the implementation stack only.

### Rationale

- **Greenfield alignment** — no legacy Spring Boot codebase to migrate; stack choice is unconstrained by existing Java investment
- **Single language** — TypeScript across backend and frontend (ADR-002) enables shared types via pnpm monorepo (ADR-009)
- **Modular monolith fit** — NestJS modules, dependency injection, and decorators map directly to Event OS bounded contexts (ADR-001, ADR-005)
- **AI-assisted development** — TypeScript + NestJS patterns produce consistent, reviewable output from AI coding tools
- **Small team productivity** — one runtime, one language, integrated tooling (Prisma, Zod, Swagger) reduces context switching
- **Type safety** — Prisma generates typed database access; Zod validates API boundaries (ADR-013); TypeScript strict mode catches errors at compile time
- **Testing support** — Jest/Vitest integration, NestJS testing utilities, and Prisma test databases support the testing strategy in `15-testing-strategy.md`
- **Future SaaS readiness** — PostgreSQL + Prisma + tenant-scoped repositories align with ADR-004 and ADR-016 without requiring microservices
- **Deployment simplicity** — Docker containerization, single Node.js process, Redis + BullMQ for async work — suitable for initial single-server deployment
- **Future microservice compatibility** — modular monolith boundaries (ADR-001) allow module extraction later without rewriting business logic

### Consequences

#### Positive

- **Fast development** — mature npm ecosystem, NestJS scaffolding, Prisma schema-first workflow
- **Strong typing** — end-to-end TypeScript from API to database queries
- **Excellent AI code generation** — consistent patterns (controllers, services, modules) improve AI-assisted implementation quality
- **Clean modular architecture** — NestJS module system enforces boundaries aligned with `06-module-design.md`
- **Simple deployment** — Docker + single Node.js process; horizontal scaling when needed
- **Future microservice compatibility** — bounded contexts can be extracted without domain redesign

#### Negative

- **Team must standardize on TypeScript** — all backend engineers need TypeScript/NestJS proficiency (mitigated by ADR-002 and `08-coding-standards.md`)
- **Prisma schema changes drive migrations** — schema is the migration source of truth via Prisma Migrate; discipline required on migration review (mitigated by DoD migration criteria in `20-definition-of-done.md`)
- **Node.js runtime considerations** — single-threaded event loop limits CPU-bound workloads (acceptable for Phase 1 scale; BullMQ offloads async jobs; horizontal scaling available)

### Relationship to Prior ADRs

| ADR | Relationship |
|-----|--------------|
| ADR-001 | Modular monolith — NestJS modules implement bounded contexts |
| ADR-002 | TypeScript — language decision unchanged |
| ADR-003 | PostgreSQL — database decision unchanged |
| ADR-004 | Row-level multi-tenancy — Prisma middleware / repository scoping implements `tenant_id` filtering |
| ADR-006 | REST + OpenAPI — Swagger documents the REST API |
| ADR-008 | JWT auth — Passport JWT implements access + refresh token flow |
| ADR-009 | pnpm monorepo — package manager unchanged |
| ADR-012 | In-process domain events — NestJS EventEmitter or equivalent in-process bus |
| ADR-013 | Zod validation — request validation at API boundary |
| ADR-015 | Pino logging — structured JSON logging in NestJS |
| ADR-016 | Single-tenant Phase 1 — Prisma seed + tenant-scoped queries unchanged |
| ADR-017 | Suggestion-only handlers — handler constraints unchanged; NestJS event handlers follow same rules |

### Implementation References

| Document | Role |
|----------|------|
| [`05-system-architecture.md`](./05-system-architecture.md) | Technology stack table |
| [`08-data-model.md`](./08-data-model.md) | Logical persistence model (Prisma Migrate out of scope in data model doc) |
| [`09-api-design.md`](./09-api-design.md) | REST API contract — NestJS controllers and application services |
| [`10-implementation-specification.md`](./10-implementation-specification.md) | NestJS module structure and sprint playbook |
| [`10-folder-structure.md`](./10-folder-structure.md) | Code organization |

---

## ADR Template

Use this template for future decisions:

```markdown
## ADR-{NNN}: {Title}

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-{NNN}
**Date:** YYYY-MM-DD
**Deciders:** {who}

### Context
{What is the issue that we're seeing that is motivating this decision?}

### Options Considered
1. **{Option A}** — {brief description}
2. **{Option B}** — {brief description}

### Decision
{What is the change that we're proposing and/or doing?}

### Rationale
{Why this option over the others?}

### Consequences
- **Positive:** {benefits}
- **Negative:** {drawbacks and mitigations}
```

---

## Related Documents

| Document | Topic |
|----------|-------|
| [03-product-principles.md](./03-product-principles.md) | Principles behind decisions |
| [05-system-architecture.md](./05-system-architecture.md) | Architecture implementing ADRs |
| [07-database-philosophy.md](./07-database-philosophy.md) | Database ADRs in practice |

---

*Last updated: 2026-07-08 (ADR-018 added)*
*Owner: Founding Engineering*
