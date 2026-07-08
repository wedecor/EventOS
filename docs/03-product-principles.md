# Product & Engineering Principles

## Purpose of This Document

This document defines the ten governing principles for Event OS engineering. Each principle includes its rationale, practical implications, and anti-patterns to avoid. When trade-offs arise, these principles are the tiebreaker.

---

## Principle 1: Build for One Customer

### Statement

Ship features that solve real problems for We Decor Events today. Do not build speculative features for hypothetical future customers.

### Why

- **Validated learning** — Real usage reveals what works; assumptions do not.
- **Speed** — One customer's feedback loop is fast; designing for everyone is slow.
- **Focus** — Constraints breed creativity; infinite optionality breeds paralysis.

### In Practice

- Prioritize the roadmap based on We Decor's operational pain ([11-roadmap.md](./11-roadmap.md)).
- Demo to We Decor staff weekly during active development.
- Measure adoption: a feature unused by We Decor is deprioritized regardless of how "marketable" it seems.

### Anti-Patterns

- Building a feature because a competitor has it, without We Decor validation.
- Delaying shipping to add configurability no one has requested.
- "Platform thinking" that prevents shipping anything.

---

## Principle 2: Architect for Many Customers

### Statement

Every design decision must assume Event OS will eventually serve thousands of tenants with isolated data, configurable workflows, and independent branding.

### Why

- **Rewrite cost** — Multi-tenant retrofits are among the most expensive engineering projects in SaaS history.
- **Investor and market credibility** — Architecture that only works for one customer is not a product; it is custom software.
- **Marginal cost is low** — `tenant_id`, configuration objects, and feature flags cost little upfront and save months later.

### In Practice

- All tenant-scoped entities include `tenant_id` from the first migration.
- Business rules live in configuration (tenant settings, workflow definitions), not `if (tenant === 'we-decor')` branches.
- Authentication resolves tenant context on every request.
- See [05-system-architecture.md](./05-system-architecture.md) for tenancy model.

### Anti-Patterns

- Hard-coded We Decor business rules in application code.
- Separate database or codebase per customer.
- Skipping `tenant_id` "because we only have one customer."

---

## Principle 3: Prefer Modular Monolith over Microservices

### Statement

Event OS is a single deployable application composed of well-bounded modules. We do not split into microservices until scale and team size demand it.

### Why

- **Team size** — Microservices require DevOps, observability, and coordination overhead disproportionate to a small team.
- **Domain cohesion** — Event management workflows cross module boundaries constantly (lead → quote → booking → task). Distributed transactions add complexity without benefit at current scale.
- **Development velocity** — A monolith enables atomic refactors, single-deployment rollbacks, and simpler local development.
- **Reversibility** — Modules with clear boundaries can be extracted to services later if needed.

### In Practice

- Code organized by domain module, not by technical layer only.
- Modules communicate via defined interfaces (application services, domain events), not direct database access across boundaries.
- Single PostgreSQL database with schema separation by module where beneficial.
- See [06-module-design.md](./06-module-design.md) and [10-folder-structure.md](./10-folder-structure.md).

### Anti-Patterns

- Separate repositories per module.
- Network calls between modules that share a database.
- Premature Kubernetes/service mesh adoption.

### When to Revisit

Extract a module to a separate service when **all** of the following are true:

1. The module has fundamentally different scaling requirements (e.g., AI inference GPU workloads).
2. An independent team owns the module full-time.
3. The module's interface is stable and well-defined.
4. Operational cost of the service is justified by measured bottlenecks.

---

## Principle 4: AI-First Development

### Statement

AI is not a feature bolted onto Event OS. It is a core capability that shapes data models, APIs, and user experience from the beginning.

### Why

- **Competitive differentiation** — AI-native workflows (quote generation, lead scoring, communication drafting) are harder to replicate than CRUD screens.
- **User productivity** — Event staff are operators, not data entry clerks. AI reduces repetitive work.
- **Data advantage** — Structured event data + AI creates compounding value over time.

### In Practice

- Design APIs and data models to be AI-consumable (structured, well-typed, with context metadata).
- Every major workflow asks: "Where can AI assist without removing human control?"
- AI outputs are always **reviewable, editable, and attributable**—never silently applied.
- Prompt templates and AI configuration are version-controlled and tenant-configurable.
- See [09-ai-development-guide.md](./09-ai-development-guide.md).

### Anti-Patterns

- AI features that auto-commit changes without user review.
- Unstructured text blobs where structured data would enable AI.
- Vendor lock-in to a single LLM provider without abstraction layer.
- AI-generated code merged without human review.

---

## Principle 5: Documentation-First Development

### Statement

Significant work begins with documentation. Code implements documented designs. Undocumented code is incomplete.

### Why

- **AI agent consistency** — Future AI agents build from docs, not from inferring intent from code.
- **Onboarding speed** — New engineers are productive in days, not months.
- **Decision preservation** — Rationale survives team changes.
- **Review quality** — Designs reviewed in prose are cheaper to change than implemented code.

### In Practice

- New modules: update [06-module-design.md](./06-module-design.md) and domain docs before coding.
- Architecture changes: add ADR to [12-architecture-decisions.md](./12-architecture-decisions.md).
- API changes: update [18-api-standards.md](./18-api-standards.md) and OpenAPI spec.
- Every PR description references the doc it implements or updates.

### Anti-Patterns

- "We'll document it later."
- Docs that contradict implemented behavior.
- README-only documentation outside the `/docs` system.

---

## Principle 6: Business-First Architecture

### Statement

Technical architecture follows business domain structure, not framework conventions or database table convenience.

### Why

- **Ubiquitous language** — Code uses the same terms as event managers (booking, quotation, package), reducing translation errors.
- **Evolvability** — Business changes map to module changes, not scattered refactors.
- **Communication** — Engineers and business stakeholders discuss the same concepts.

### In Practice

- Domain-Driven Design with bounded contexts per module.
- Aggregates, entities, and value objects named in business language ([04-business-domain.md](./04-business-domain.md)).
- Technical concerns (logging, auth, caching) are infrastructure, not domain.
- See [04-business-domain.md](./04-business-domain.md) and [06-module-design.md](./06-module-design.md).

### Anti-Patterns

- `UserData`, `Record`, `Item` as domain entity names.
- Anemic domain models with all logic in service classes.
- Database schema driving domain design instead of domain driving schema.

---

## Principle 7: Clean Domain-Driven Design

### Statement

Apply DDD tactical and strategic patterns consistently: bounded contexts, aggregates, domain events, repositories, and application services.

### Why

- **Complexity management** — Event management has genuine domain complexity (pricing rules, booking states, inventory allocation). DDD provides proven patterns.
- **Testability** — Pure domain logic is unit-testable without database or HTTP.
- **Module boundaries** — Bounded contexts map directly to module boundaries.

### In Practice

| DDD Pattern | Event OS Application |
|-------------|---------------------|
| **Bounded Context** | Each module (CRM, Quotation, Booking, etc.) |
| **Aggregate** | Client, Lead, Quotation, Booking, Event, Invoice |
| **Domain Event** | `LeadQualified`, `QuotationApproved`, `BookingConfirmed` |
| **Repository** | Persistence abstraction per aggregate |
| **Application Service** | Orchestrates use cases, manages transactions |
| **Value Object** | Money, DateRange, Address, PhoneNumber, Email |

### Layer Rules

```
┌─────────────────────────────────────┐
│  Presentation (API, UI)           │  ← Translates HTTP/UI to commands
├─────────────────────────────────────┤
│  Application (Use Cases)            │  ← Orchestrates, no business rules
├─────────────────────────────────────┤
│  Domain (Entities, Value Objects)   │  ← Business rules live here
├─────────────────────────────────────┤
│  Infrastructure (DB, External APIs)  │  ← Implements repository interfaces
└─────────────────────────────────────┘
```

Dependencies point inward. Domain layer has zero infrastructure dependencies.

### Anti-Patterns

- Domain entities importing ORM decorators as core identity (use persistence mapping layer).
- Cross-module aggregate references by ID only, never by direct object reference.
- Business logic in controllers or API route handlers.

---

## Principle 8: Strong Module Boundaries

### Statement

Modules are independent units with explicit public interfaces. Internal implementation is private.

### Why

- **Parallel development** — Teams (or AI agents) work on modules without merge conflicts in core logic.
- **Testing isolation** — Modules tested independently with mocked interfaces.
- **Future extraction** — Clean boundaries enable microservice extraction if ever needed.

### In Practice

- Each module exposes an **application service interface** (e.g., `IBookingService.createBooking()`).
- Modules do not import internal classes from other modules.
- Cross-module communication via:
  1. **Application service calls** (synchronous, same transaction when needed)
  2. **Domain events** (asynchronous side effects)
- Shared kernel limited to: common value objects, auth context, tenant context, base types.

### Anti-Patterns

- Importing another module's repository directly.
- Shared database tables accessed by multiple modules without an interface.
- "Util" packages that become dumping grounds for cross-module logic.

---

## Principle 9: Production-Ready from Day One

### Statement

Every line of code merged to main is deployable to production. No "prototype quality" escapes to the main branch.

### Why

- **We Decor runs production** — Their business depends on Event OS reliability from the first deployed feature.
- **Habit formation** — Quality standards set early persist; retrofitting quality is expensive.
- **Operational confidence** — Team deploys frequently because deployments are safe.

### In Practice

- CI pipeline runs on every PR: lint, type-check, test, build.
- Database migrations are backward-compatible and reversible.
- Feature flags for incomplete features, not long-lived feature branches.
- Structured logging, error tracking, and health checks from first deployment.
- See [16-deployment-strategy.md](./16-deployment-strategy.md) and [20-definition-of-done.md](./20-definition-of-done.md).

### Anti-Patterns

- `// TODO: fix before production` in merged code.
- Manual deployment steps not captured in automation.
- Missing error handling "because it's MVP."

---

## Principle 10: Enterprise Coding Standards

### Statement

Code quality, security, and maintainability meet enterprise standards regardless of team size.

### Why

- **Longevity** — Event OS will be maintained for 10+ years. Code is read 10x more than written.
- **Trust** — Event companies trust us with client data and financial information.
- **AI consistency** — Standards enable AI agents to generate code that matches human-written code.

### In Practice

- Typed languages with strict mode (TypeScript strict, no `any` without justification).
- Consistent formatting enforced by tooling (Prettier, ESLint).
- Mandatory code review for all changes.
- Security standards in [14-security-principles.md](./14-security-principles.md).
- Coding standards in [08-coding-standards.md](./08-coding-standards.md).

### Anti-Patterns

- "Startup code" with inconsistent patterns.
- Disabled lint rules without documented justification.
- Secrets in source code or unencrypted configuration.

---

## Principle Interaction Matrix

When principles conflict, resolve in this order:

1. **Production-Ready** and **Enterprise Standards** — Safety and quality are non-negotiable.
2. **Business-First** and **Clean DDD** — Domain correctness over technical convenience.
3. **Build for One Customer** vs **Architect for Many** — Ship for We Decor using multi-tenant patterns.
4. **Modular Monolith** — Prefer simplicity unless a specific principle (e.g., AI inference scaling) demands distribution.

---

## Related Documents

| Document | Topic |
|----------|-------|
| [05-system-architecture.md](./05-system-architecture.md) | Architecture implementing these principles |
| [08-coding-standards.md](./08-coding-standards.md) | Code-level standards |
| [12-architecture-decisions.md](./12-architecture-decisions.md) | Recorded decisions |
| [20-definition-of-done.md](./20-definition-of-done.md) | Quality gates |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
