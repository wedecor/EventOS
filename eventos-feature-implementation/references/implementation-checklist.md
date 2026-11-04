# Implementation Self-Review Checklist

Before presenting your implementation to the user, verify every applicable item below. This is
the same checklist the Engineering Review skill uses — passing this self-review means the code
should survive a formal review.

## EP1 Traceability

- [ ] Every new file traces to at least one EP1 requirement
- [ ] Business rule IDs (EP1-BR-xxx, EP1-SAL-xxx, etc.) are referenced in comments where enforced
- [ ] No code exists that cannot be justified by a documented requirement
- [ ] No Sprint 2+ requirements have been implemented

## Architecture Compliance

- [ ] Layered architecture respected: Presentation → Application → Domain ← Infrastructure
- [ ] Controllers do not import repositories or domain services directly
- [ ] Application services do not import Prisma or infrastructure details
- [ ] Domain layer has zero outward dependencies
- [ ] No module directly queries another module's persistence tables
- [ ] Cross-module communication uses application services or domain events

## API Contract (docs/09-api-design.md)

- [ ] Request/response shapes match the spec exactly
- [ ] All required fields present in Zod schemas
- [ ] Field names match spec casing and naming
- [ ] HTTP methods and status codes match
- [ ] Response envelope is correct (`{ data }` for success, `{ error: { code, message, details } }` for errors)
- [ ] Path parameters and query parameters match spec

## Data Model (docs/08-data-model.md)

- [ ] Prisma schema changes match documented data model
- [ ] Relations, indexes, and constraints are correct
- [ ] Enum values align with spec
- [ ] Tenant scoping present on all tenant-scoped entities

## ADR Compliance

- [ ] ADR-016: tenantId hardcoded as `00000000-0000-0000-0000-000000000001`
- [ ] ADR-016: All repositories extend TenantScopedRepository
- [ ] ADR-016: All queries include tenant filtering
- [ ] ADR-017: Domain event handlers are suggestion-only
- [ ] ADR-017: All mutations require explicit human command via endpoint
- [ ] ADR-017: Events follow DomainEvent base class pattern

## Layer Responsibilities

- [ ] Controllers: HTTP only — parse, call service, map response. No business logic.
- [ ] Application services: orchestrate — validate, call repos, delegate to domain, publish events
- [ ] Repositories: persistence only — CRUD, query building, tenant scoping. No business decisions.

## Code Patterns

- [ ] Service methods return `Result<T>` — never throw for business errors
- [ ] Zod schemas used for all request validation
- [ ] `resultToResponse()` used for all controller responses
- [ ] `@TenantId()` decorator used on all controller methods
- [ ] `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation` on all controllers
- [ ] DTOs exclude tenantId and version
- [ ] Date fields in DTOs are ISO strings

## Tests

- [ ] Unit tests exist for every new application service method
- [ ] Happy path tested
- [ ] Validation/error paths tested
- [ ] Domain event publication verified
- [ ] Repository arguments verified
- [ ] Empty/null results handled

## General Quality

- [ ] Nullable fields handled correctly
- [ ] Optimistic concurrency (version/If-Match) applied for mutations
- [ ] Error handling with Result pattern propagates correctly
- [ ] Multi-step mutations wrapped in transactions
- [ ] No unrelated changes included

## Module Wiring

- [ ] New repositories provided in ApplicationServicesModule
- [ ] New modules added to AppModule imports
- [ ] New domain events added to sprint1-domain.events.ts
