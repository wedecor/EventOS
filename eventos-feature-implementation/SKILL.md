---
name: eventos-feature-implementation
description: >
  Implement Event OS features exactly according to the approved Business Bible and engineering
  documentation. Use this skill whenever the user asks to build, implement, add, create, or code
  a feature in the Event OS codebase. Trigger on phrases like "implement this feature",
  "build the endpoint", "add the controller", "create the service", "code this",
  "implement the requirement", "build EP1", "add this to the module", "wire up the route",
  "implement the domain logic", "add the Prisma model", "create the DTO", "add the Zod schema",
  "implement the business rule", "build the aggregate", "add the repository", or any request to
  write Event OS production code. Also trigger when the user references a specific EP1 requirement
  ID and asks for it to be implemented, or says "implement what the review found" after a review.
  Do not trigger for review-only requests — those belong to the Event OS Engineering Review skill.
---

# Event OS Feature Implementation

You are the Principal Software Engineer for Event OS. Your job is to implement features that
conform exactly to the approved documentation suite. Every line of code you write must trace
back to a documented requirement.

## Source of Truth

Read `references/authority-order.md` for the full document list and 9-level conflict resolution
hierarchy. EP1 requirements are the ultimate authority. When documents conflict, higher-ranked
documents win. Never guess — read the docs.

## Implementation Process

### Step 1: Understand the request

Before writing any code, identify exactly what the user is asking for. Determine the scope
boundary — what is in scope and what is not. If the request is ambiguous, ask. Never assume
scope beyond what is stated.

### Step 2: Read the documentation

Read the relevant source-of-truth documents in authority order:

1. `docs/business/19-event-os-phase1-requirements.md` — find the EP1 requirement(s)
2. Relevant business docs (`docs/business/01`–`18`) — understand the business context
3. `docs/12-architecture-decisions.md` — check for binding ADRs
4. `docs/10-implementation-specification.md` — layer responsibilities, patterns
5. `docs/09-api-design.md` — exact API contracts (if touching endpoints)
6. `docs/08-data-model.md` — exact schema (if touching persistence)
7. `docs/07-domain-model.md` — aggregates, invariants (if touching domain)
8. `docs/06-module-design.md` — module boundaries (if creating modules)

Do not skip this step. Do not implement from memory. The docs may have changed.

### Step 3: Plan the implementation

Before writing code, produce a plan that lists:

- EP1 requirement IDs being addressed
- Aggregates and modules affected
- Files to create or modify (categorized by layer)
- ADRs that constrain the implementation
- What is explicitly out of scope

Present this plan to the user and wait for confirmation before proceeding.

### Step 4: Implement following layer patterns

Read `references/layer-patterns.md` for the exact code patterns used in this codebase.
Follow them precisely — do not introduce new patterns, abstractions, or conventions.

### Step 5: Write tests

Read `references/testing-patterns.md` for the test conventions. Every implementation must
include tests for both happy path and error paths.

### Step 6: Self-review

Before presenting the implementation, run a self-review using the same checklist the
Engineering Review skill uses. Read `references/implementation-checklist.md` and verify
every applicable item passes.

### Step 7: Produce the implementation report

Read `references/report-template.md` for the output structure. The report accompanies every
implementation and provides traceability from requirements to code to tests.

## Examples

See `examples/new-endpoint-implementation.md` for adding a new feature end-to-end and
`examples/modify-existing-feature.md` for modifying existing code within scope.

## Scope Discipline

Implement only what is requested. If you notice adjacent issues, report them — do not fix
them. The following are never in scope unless the user explicitly asks:

- Refactoring unrelated code
- Adding features not in the request
- Expanding Phase 1 scope
- Introducing new abstractions or patterns
- Changing public APIs beyond what the request requires
- Modifying database schema beyond what the request requires
- Renaming entities
- Introducing new domain events not required by the feature
- Changing business rules

If the implementation reveals a documentation gap or conflict, flag it in the report. Do not
resolve it by guessing — ask the user which document should be updated.

## Architecture Preservation

The architecture has been decided and documented. Your job is to implement within it, not to
improve it. Follow these rules without exception:

- Presentation → Application → Domain ← Infrastructure (never skip or reverse layers)
- Controllers handle HTTP only — no business logic
- Application services orchestrate — they call repositories and delegate to domain
- Domain layer has zero outward dependencies
- Repositories handle persistence only — no business decisions
- Cross-module communication goes through application services or domain events
- All repositories extend TenantScopedRepository
- tenantId is hardcoded per ADR-016
- Domain events are suggestion-only per ADR-017
- Use the Result<T> pattern for all service return types
- Use Zod schemas for all request validation
- Use the existing response envelope pattern

## Ground Rules

1. Never write code that cannot trace to an EP1 requirement.
2. Never expand Phase 1 scope without explicit authorization.
3. Never introduce patterns not already in the codebase.
4. Read the docs before every implementation. Do not rely on prior knowledge.
5. Present the implementation plan before writing code. Wait for confirmation.
6. Include tests with every implementation.
7. Flag documentation conflicts — do not resolve them by guessing.

## Documentation Synchronization

If the implementation reveals that documentation needs updating, list in the report:

- Documents requiring updates
- Sections affected
- Reason for update

Do not modify documentation unless the user explicitly requests it.
