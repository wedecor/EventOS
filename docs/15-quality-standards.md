# Quality Standards

## Purpose

This document is the **index** for Event OS engineering quality expectations. Detailed rules live in the specialized documents below — do not duplicate conflicting checklists here.

| Topic | Authoritative document |
|-------|------------------------|
| Testing strategy, coverage, CI expectations | [`docs/15-testing-strategy.md`](./15-testing-strategy.md) |
| Coding conventions, naming, Result pattern | [`docs/08-coding-standards.md`](./08-coding-standards.md) |
| Definition of Done | [`docs/20-definition-of-done.md`](./20-definition-of-done.md) |
| Security controls | [`docs/14-security-principles.md`](./14-security-principles.md) |
| Deployment / CI pipelines | [`docs/16-deployment-strategy.md`](./16-deployment-strategy.md) |

## Phase 1 quality gates (API)

From `apps/api`, the required local gates before merge are:

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
```

PR CI (`.github/workflows/pull-request.yml`) runs lint, build, unit tests, and coverage. Main CI additionally applies migrations to a disposable database and builds the Docker image (no cloud deploy).

## Phase 1 quality gates (Admin Portal)

From `apps/web`, the local gate used by F1 modules is:

```bash
pnpm validate
```

(typically typecheck + lint + unit tests + static export build). Do not invent Admin Portal APIs or permission keys outside frozen OpenAPI / `rbac.ts`.

## Notes (R3-12 / R4-01)

- CI workflow comments historically referred to “docs/15” for testing strategy — that content is in **`15-testing-strategy.md`**. This file exists so the quality-standards path resolves and points to the correct sources.
- Do not invent additional quality gates beyond what the testing strategy and DoD already require.
- R4-01: documentation synchronized to Admin Portal F1-01–F1-13 patterns (static export, hub-when-no-list); no new product gates.

---

*Last updated: 2026-07-13 (R4-01)*
*Owner: Founding Engineering*
