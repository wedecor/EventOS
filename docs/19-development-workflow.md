# Development Workflow

## Purpose of This Document

This document defines the day-to-day engineering workflow for Event OS: environment setup, branching, development process, code review, and collaboration practices. Consistency in workflow enables any engineer or AI agent to contribute effectively.

---

## Environment Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22 LTS | Runtime |
| pnpm | 10.13+ | Package manager |
| Docker | Latest | Local PostgreSQL and Redis |
| Git | Latest | Version control |
| VS Code or Cursor | Latest | IDE |

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd event-os

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with local values

# Start infrastructure
docker compose up -d

# Run database migrations
pnpm --filter api db:migrate

# Seed development data
pnpm --filter api db:seed

# Start development servers
pnpm dev
# API: http://localhost:4000
# Web: http://localhost:3000
```

### Verify Setup

```bash
# API health check
curl http://localhost:4000/health

# Login with seed user
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@test.com", "password": "password123"}'
```

---

## Branching Strategy

### Branch Types

| Branch | Pattern | Created From | Merges To |
|--------|---------|--------------|-----------|
| **Main** | `main` | — | — (protected) |
| **Feature** | `feature/{short-description}` | `main` | `main` (via PR) |
| **Bug fix** | `fix/{short-description}` | `main` | `main` (via PR) |
| **Chore** | `chore/{short-description}` | `main` | `main` (via PR) |
| **Docs** | `docs/{short-description}` | `main` | `main` (via PR) |
| **Release** | `release/v{version}` | `main` | `main` + tag |

### Branch Rules

1. `main` is always deployable
2. No direct commits to `main` — all changes via pull request
3. Feature branches are short-lived (< 1 week ideal)
4. Rebase on `main` before creating PR (or merge main into branch)
5. Delete branch after merge

### Branch Naming Examples

```
feature/lead-pipeline-view
feature/quotation-pdf-generation
fix/quotation-total-calculation
fix/tenant-isolation-leak
chore/upgrade-prisma-5
docs/finance-module-design
```

---

## Development Process

### Feature Development Flow

```
1. Read relevant docs (/docs)
   ├── Domain model (04-business-domain.md)
   ├── Module design (06-module-design.md)
   └── API standards (18-api-standards.md)

2. Create feature branch from main
   git checkout main && git pull
   git checkout -b feature/lead-pipeline-view

3. Update documentation if needed
   ├── Module design (if new module or significant change)
   ├── API standards (if new endpoints)
   └── ADR (if architectural decision)

4. Implement (inside-out):
   a. Domain layer (entities, value objects, business rules)
   b. Application layer (services, commands, DTOs)
   c. Infrastructure layer (repository, event handlers)
   d. Presentation layer (controller, request/response)
   e. Frontend (components, hooks, pages)
   f. Tests (unit → integration)

5. Verify locally
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build

6. Create pull request
7. Code review
8. Address review feedback
9. Merge to main
10. Verify staging deployment
```

### Implementation Order (Per Module)

Always implement from the inside out:

```
Domain Entity → Domain Tests
    ↓
Application Service → Application Tests
    ↓
Repository Implementation
    ↓
Controller + Integration Tests
    ↓
Frontend Components + Component Tests
```

**Why inside-out:** Domain logic is the most valuable and testable code. Building from domain outward ensures business rules are correct before infrastructure and UI are built on top.

---

## Pull Request Process

### PR Creation

Every PR includes:

```markdown
## Summary
Brief description of what this PR does and why.

## Module
Lead Module

## Changes
- Add lead pipeline stage transition validation
- Add PATCH /api/v1/leads/:id/stage endpoint
- Add LeadPipeline frontend component

## Docs
- Updated 06-module-design.md (Lead module events)

## Test Plan
- [ ] Unit tests for stage transition rules
- [ ] Integration test for stage endpoint (happy + error paths)
- [ ] Integration test for cross-tenant isolation
- [ ] Manual: advance lead through pipeline in UI

## Screenshots
(if UI changes)
```

### PR Size Guidelines

| Size | Lines Changed | Review Time | Guidance |
|------|---------------|-------------|----------|
| **Small** | < 200 | < 30 min | Ideal. One feature or fix. |
| **Medium** | 200-500 | < 1 hour | Acceptable. May be one module. |
| **Large** | 500-1000 | 1-2 hours | Split if possible. |
| **Too Large** | > 1000 | > 2 hours | Must be split. Exception: initial module scaffold. |

### Review Requirements

| Change Type | Required Reviewers | Required Checks |
|-------------|-------------------|-----------------|
| Any code change | 1 engineer | CI pass |
| New module | 1 engineer + domain review | CI pass + integration tests |
| API changes | 1 engineer | CI pass + API integration tests |
| Database migration | 1 engineer | CI pass + migration review |
| Architecture change | 1 engineer + ADR | CI pass + ADR documented |
| Security-sensitive | 1 engineer + security checklist | CI pass + security tests |

### Review Focus Areas

Reviewers check:

1. **Correctness** — Does it work? Are business rules enforced?
2. **Architecture** — Does it follow module boundaries and layer rules?
3. **Security** — Tenant isolation, auth, input validation, no secrets
4. **Tests** — Adequate coverage, meaningful assertions
5. **Documentation** — Docs updated if behavior changed
6. **Standards** — Follows coding standards and API conventions

### Review Etiquette

- Review within 24 hours (4 hours for urgent fixes)
- Approve, request changes, or comment — never silent
- Suggest, don't demand (except security and architecture violations)
- Nitpicks marked as optional (`nit:` prefix)
- Author resolves all comments before merge

---

## Local Development Practices

### Running Services

```bash
# All services
pnpm dev

# API only
pnpm --filter api dev

# Web only
pnpm --filter web dev

# Database UI (Prisma Studio)
pnpm --filter api db:studio
```

### Database Operations

```bash
# Create migration after schema change
pnpm --filter api db:migrate:dev --name create_leads_table

# Reset database (development only)
pnpm --filter api db:reset

# Seed data
pnpm --filter api db:seed
```

### Testing

```bash
# All tests
pnpm test

# Unit tests only
pnpm --filter api test:unit

# Integration tests (requires test database)
pnpm --filter api test:integration

# Watch mode
pnpm --filter api test:watch

# Coverage
pnpm --filter api test:coverage
```

### Linting and Formatting

```bash
# Lint
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format
pnpm format

# Type check
pnpm typecheck
```

Pre-commit hooks run lint and format automatically.

---

## Documentation Workflow

### When to Update Docs

| Trigger | Documents to Update |
|---------|-------------------|
| New module | 06-module-design.md, 04-business-domain.md, 10-folder-structure.md |
| New API endpoints | 18-api-standards.md |
| Architecture decision | 12-architecture-decisions.md (new ADR) |
| New domain term | 13-glossary.md, 04-business-domain.md |
| Phase completion | 11-roadmap.md (check off deliverables) |
| Security change | 14-security-principles.md |
| UI pattern change | 17-ui-design-system.md |

### Documentation in PRs

- Docs changes are part of the feature PR, not a separate PR
- AI agents: read docs before implementing, update docs as part of the same PR

---

## AI Agent Development Guidelines

When AI agents (Cursor, Copilot, etc.) implement features:

### Before Coding

1. Read the relevant `/docs` files listed in the PR template
2. Read an existing module's implementation as a reference pattern
3. Understand the module's public interface from 06-module-design.md

### During Coding

1. Implement domain layer first with tests
2. Follow exact folder structure from 10-folder-structure.md
3. Use shared value objects from `@shared/value-objects`
4. Never import from another module's internals
5. Include `tenantId` scoping on all data operations
6. Write tests alongside implementation

### After Coding

1. Run lint, typecheck, and tests locally
2. Update relevant documentation
3. Write PR description with test plan

### What AI Agents Must NOT Do

- Skip tests ("I'll add them later")
- Use `any` type without justification
- Hard-code tenant-specific logic
- Import domain entities from other modules
- Create files outside the defined folder structure
- Modify unrelated code ("drive-by refactoring")
- Skip documentation updates

---

## Communication

### Async Communication (Default)

- **GitHub Issues** — Bug reports, feature requests, technical debt
- **PR Comments** — Code review, implementation discussion
- **Documentation** — Design decisions, architecture

### Sync Communication (When Needed)

- **Demo** — Weekly demo to We Decor during active development
- **Planning** — Sprint planning at phase start
- **Incident** — Immediate sync for production issues

### Issue Tracking

GitHub Issues with labels:

| Label | Usage |
|-------|-------|
| `bug` | Something broken |
| `feature` | New capability |
| `enhancement` | Improvement to existing feature |
| `tech-debt` | Code quality improvement |
| `docs` | Documentation update |
| `security` | Security concern |
| `P0` / `P1` / `P2` | Priority level |

---

## Release Workflow

See [16-deployment-strategy.md](./16-deployment-strategy.md) for full deployment process.

```
Feature branches → PR → main → Staging (auto) → UAT → Release tag → Production
```

### Staging UAT

Before production release:
1. Deploy to staging (automatic on merge to main)
2. We Decor team tests on staging for 2-3 days
3. Issues found → fix on main → re-deploy staging
4. UAT passed → create release tag → production deploy

---

## Onboarding Checklist (New Engineer / AI Agent)

- [ ] Read 01-company.md (company context)
- [ ] Read 02-product-vision.md (product vision)
- [ ] Read 03-product-principles.md (engineering principles)
- [ ] Read 04-business-domain.md (domain model)
- [ ] Read 05-system-architecture.md (architecture)
- [ ] Read 08-coding-standards.md (coding standards)
- [ ] Read 10-folder-structure.md (code organization)
- [ ] Set up local development environment
- [ ] Run the app locally and log in with seed user
- [ ] Run the test suite
- [ ] Review an existing module's code (Lead recommended)
- [ ] Make a small change (docs or test) and submit a PR

Estimated onboarding time: 1-2 days for experienced engineers.

---

## Related Documents

| Document | Topic |
|----------|-------|
| [08-coding-standards.md](./08-coding-standards.md) | Code standards |
| [10-folder-structure.md](./10-folder-structure.md) | Code organization |
| [15-testing-strategy.md](./15-testing-strategy.md) | Testing practices |
| [16-deployment-strategy.md](./16-deployment-strategy.md) | Deployment pipeline |
| [20-definition-of-done.md](./20-definition-of-done.md) | Completion criteria |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
