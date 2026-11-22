# Review Checklist

For each changed file, check every applicable dimension below. Not every dimension applies to
every file — a Prisma schema change doesn't need a Swagger check, and a controller doesn't need
a transaction check.

## Architecture Compliance

- Does the code respect the layered architecture (Presentation → Application → Domain ← Infrastructure)?
- Controllers must not import repositories or domain services directly.
- Application services must not import Prisma or infrastructure details.
- Domain layer has zero outward dependencies.
- No module directly queries another module's persistence tables.
- Cross-module communication goes through application services or domain events.

## Layer Responsibilities

- **Controllers**: HTTP concern only — parse request, call service, map response. No business
  logic, no conditional branching on domain state, no direct repository calls.
- **Application services**: Orchestrate workflows — validate inputs, call repositories, enforce
  business rules by delegating to domain, publish domain events, manage transactions.
- **Repositories**: Persistence only — CRUD operations, query building, tenant scoping. No
  business decisions.

## API Contract (docs/09-api-design.md)

- Do request/response shapes match the spec exactly?
- Are all required fields present in Zod schemas?
- Are field names correct (the spec uses specific casing and naming)?
- Do HTTP methods and status codes match?
- Is the response envelope correct (`{ data: ... }` for success, `{ error: { code, message, details } }` for errors)?
- Are path parameters and query parameters per spec?

## Data Model (docs/08-data-model.md)

- Do Prisma schema changes match the documented data model?
- Are relations, indexes, and constraints correct?
- Are enum values aligned with the spec?
- Is tenant scoping present on all tenant-scoped entities?

## ADR-016: Single-Tenant Phase 1

- tenantId is hardcoded as `00000000-0000-0000-0000-000000000001` in Phase 1.
- All repositories extend TenantScopedRepository.
- All queries include tenant filtering.

## ADR-017: Suggestion-Only Domain Events

- Domain event handlers are suggestion-only — they queue suggestions, they do not auto-execute.
- All mutations require explicit human command via endpoint invocation.
- Events follow the DomainEvent base class pattern with correct payload types.

## EP1 Traceability

- Can every implemented feature trace back to an EP1 business requirement?
- Are business rule IDs (EP1-BR-xxx, EP1-SAL-xxx, etc.) referenced where enforced?
- No invented requirements — if it's not in the docs, it doesn't belong in the code.

## Phase 1 Scope

- Does the change stay within Sprint 1/Phase 1 boundaries per `docs/11-roadmap.md`?
- No Sprint 2+ features sneaking in (multi-tenant, RBAC, audit logging, etc.).
- No speculative abstractions for future phases.

## Definition of Done (docs/20-definition-of-done.md)

- Does the implementation satisfy the merge criteria defined in the DoD?
- Check each criterion systematically.

## General Quality

- Null safety: are nullable fields handled correctly?
- Optimistic concurrency: is the version/If-Match pattern applied for mutations?
- Error handling: does the Result pattern propagate correctly?
- Transaction boundaries: are multi-step mutations wrapped in transactions?
- Test coverage: are happy path and error paths tested?
