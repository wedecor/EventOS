# Authority Order

When documents conflict with each other, resolve the conflict using this precedence (highest
authority first). A higher-ranked document always overrides a lower-ranked one.

## Precedence (highest to lowest)

1. `docs/business/19-event-os-phase1-requirements.md` — EP1 requirements are the ultimate authority
2. Business documents (`docs/business/01` through `docs/business/18`)
3. ADRs (`docs/12-architecture-decisions.md`)
4. `docs/10-implementation-specification.md`
5. `docs/09-api-design.md`
6. `docs/08-data-model.md`
7. `docs/07-domain-model.md`
8. `docs/06-module-design.md`
9. `docs/05-system-architecture.md`

## How to apply

Never reverse this order. If the API design spec says one thing but the EP1 requirements say
another, EP1 requirements win. If the data model conflicts with the implementation spec, the
implementation spec wins.

## Business Documents

Read from `docs/business/` (files 01 through 19). These define the product requirements,
business rules, and Epic/Phase scope. Key documents include the Business Bible, EP1 requirements,
and business rule catalog.

## Engineering Documents

| Document | Purpose | When to reference |
|---|---|---|
| `docs/05-system-architecture.md` | System-level architecture, tech stack, deployment | Layer violations, infrastructure changes |
| `docs/06-module-design.md` | Module boundaries, dependency rules | Cross-module imports, new module creation |
| `docs/07-domain-model.md` | Domain entities, aggregates, invariants | Entity changes, new domain logic |
| `docs/08-data-model.md` | Database schema, relations, indexes | Prisma schema changes, migrations |
| `docs/09-api-design.md` | REST API contracts, request/response shapes | Controller changes, new endpoints |
| `docs/10-implementation-specification.md` | Layer responsibilities, patterns, Sprint scope | Any implementation work |
| `docs/11-roadmap.md` | Phase/Sprint boundaries, what ships when | Scope questions, feature additions |
| `docs/12-architecture-decisions.md` | ADRs — binding decisions with rationale | Pattern questions, "should we do X" |
| `docs/20-definition-of-done.md` | Merge criteria checklist | Pre-merge review |
