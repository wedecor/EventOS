# Event OS — Developer Onboarding Guide

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Founding Engineering |
| **Status** | Active |
| **Version** | 1.0 |
| **Created Date** | 2026-07-08 |
| **Last Updated** | 2026-07-08 |
| **Purpose** | Single source of truth for setting up a new development machine and continuing Event OS development |

---

## 1. Project Overview

### What Event OS is

**Event OS** is an AI-powered business operating system for event management companies. It unifies the full lifecycle—from first lead inquiry through quotation, booking, event execution, and finance—into one platform.

Phase 1 is being built for **We Decor Events** (single tenant). The business baseline is frozen in [`docs/business/19-event-os-phase1-requirements.md`](./business/19-event-os-phase1-requirements.md) (approved 2026-07-08 by Ilyas + Zakir).

One-line definition (from [`docs/02-product-vision.md`](./02-product-vision.md)):

> Event OS is an AI-powered business operating system that helps event management companies acquire clients, deliver events, and grow profitably—from first inquiry to final invoice.

### Current project status

| Area | Status |
|------|--------|
| Business requirements (EP1) | **Approved and frozen** |
| Domain model | **Frozen** — [`docs/07-domain-model.md`](./07-domain-model.md) |
| Data model | **Frozen** — [`docs/08-data-model.md`](./08-data-model.md) |
| API design | **Frozen** — [`docs/09-api-design.md`](./09-api-design.md) |
| Implementation specification | **Frozen** — [`docs/10-implementation-specification.md`](./10-implementation-specification.md) |
| Backend application code | **In progress** — NestJS API in `apps/api/` |
| Frontend application | **Started** — `apps/web/` W5 UI (+ clients, line items, toasts) |
| Production deployment | **Not started** |

### Current implementation phase

**Phase 1 — We Decor single tenant**

Engineering sprints follow workflow order **W5 → W1 → W2 → W3 → W4 → Dashboard** (see [`docs/10-implementation-specification.md`](./10-implementation-specification.md)).

**Active sprint:** **Sprint 1 — W5 Lead → Booking**

Goal: implement the end-to-end lead capture and conversion chain up to an **Approved Event**, with suggestion(s) for Event Workspace activation queued.

### Architecture status

**Frozen.** Do not change:

- Business rules (EP1 IDs in Doc 19)
- Domain aggregates, invariants, and domain event names
- REST API contracts in Doc 09
- Module boundaries in Doc 06
- ADR-001 through ADR-017 decisions

Implementation technology was selected in **ADR-018** (NestJS). That ADR changes *how* we build, not *what* we build.

### Approved technology stack (ADR-018)

| Component | Technology |
|-----------|------------|
| Backend framework | **NestJS** |
| Language | **TypeScript** (strict mode) |
| Database | **PostgreSQL 16** |
| ORM | **Prisma 7** |
| Migrations | **Prisma Migrate** |
| Cache / queue broker | **Redis 7** |
| Job queue | **BullMQ** (wired, not yet used for business jobs) |
| Authentication | **JWT access tokens** (ADR-008 — login + Bearer; refresh deferred) |
| Request validation | **Zod** (ADR-013) |
| API documentation | **Swagger / OpenAPI** |
| Logging | **Pino** (ADR-015) |
| Containerization | **Docker** |
| Package manager | **pnpm** |
| Testing | **Jest 30** with **@swc/jest** transformer (SWC ~20× faster than tsc) |

Full ADR: [`docs/12-architecture-decisions.md`](./12-architecture-decisions.md) — section **ADR-018**.

---

## 2. Repository Structure

```
EventOS/
├── apps/                          # Application code (active development)
│   └── api/                       # NestJS backend (modular monolith) — START HERE
│       ├── prisma/                # Schema, migrations, seed
│       ├── src/                   # Application source
│       │   ├── modules/           # Business modules (lead, customer, quotation, booking)
│       │   ├── shared/            # Result types, domain events, shared ports
│       │   ├── common/            # Health checks, filters, pipes
│       │   ├── config/            # Environment validation (Zod)
│       │   ├── database/          # PrismaModule, PrismaService, Redis provider
│       │   └── auth/              # Auth placeholder (Passport JWT — Sprint 1+)
│       ├── test/                  # E2E tests
│       ├── .env.example           # Environment template (copy to .env)
│       └── README.md              # API-specific quick start
│
├── docs/                          # Engineering documentation (this folder)
│   ├── business/                  # Business Bible + Phase 1 requirements (Doc 01–19)
│   ├── 01-company.md … 20-definition-of-done.md
│   └── 22-developer-onboarding.md  ← you are here
│
├── infrastructure/                # Local and deployment infrastructure
│   └── docker/
│       └── docker-compose.yml     # PostgreSQL + Redis for local dev
│
├── assets/                        # Diagrams, screenshots, exports (non-code)
│   ├── diagrams/
│   ├── exports/
│   └── screenshots/
│
├── current-systems/               # We Decor's existing apps (reference only — do not modify)
│   ├── lead-management-app/
│   ├── quotation-billing-app/
│   └── wedecor-website/
│
├── reference-systems/             # Third-party code samples (reference only — do not modify)
│   ├── crm-system/
│   ├── inventory-system/
│   └── autoparts-erp-django/
│
└── event-os-platform/             # Reserved placeholder for future platform layout
    ├── backend/
    ├── frontend/
    └── mobile/
```

### Where to work

| Goal | Location |
|------|----------|
| Backend implementation | `apps/api/` |
| Architecture / requirements | `docs/` and `docs/business/` |
| Local database & Redis | `infrastructure/docker/docker-compose.yml` |
| Understanding existing We Decor tools | `current-systems/` (read-only reference) |

**Note:** The full monorepo layout (`apps/web/`, `packages/`, root `pnpm-workspace.yaml`) is defined in [`docs/10-folder-structure.md`](./10-folder-structure.md) but not yet scaffolded. All active backend work lives in `apps/api/` today.

---

## 3. Prerequisites

Install the following on **Ubuntu** or **macOS** before cloning.

### Required software

| Tool | Version | Purpose |
|------|---------|---------|
| **Git** | Latest stable | Version control |
| **Node.js** | **22 LTS** (`>=22.12 <23`) | Runtime — use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm). Node 23+ is unsupported. |
| **pnpm** | **10.13+** | Package manager — `corepack enable && corepack prepare pnpm@10.13.1 --activate` |
| **Docker** | Latest | Local PostgreSQL and Redis |
| **Cursor** | Latest | Recommended IDE (AI-assisted development) |
| **VS Code** | Latest | Optional alternative to Cursor |

### Docker options

| OS | Recommendation |
|----|----------------|
| **Ubuntu** | [Docker Engine](https://docs.docker.com/engine/install/ubuntu/) + [Docker Compose plugin](https://docs.docker.com/compose/install/linux/) |
| **macOS** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |

### Optional (if not using Docker for databases)

| Tool | Version | Notes |
|------|---------|-------|
| PostgreSQL | 16 | Must match Docker credentials in `.env.example` |
| Redis | 7 | Must listen on port 6379 |

Using Docker for PostgreSQL and Redis is **strongly recommended** — it matches all team members and CI.

### Verify prerequisites

```bash
git --version
node --version    # expect v22.12.x or higher within Node 22 LTS
pnpm --version    # expect 10.13.x or higher
docker --version
docker compose version
```

---

## 4. First-time Setup

All backend commands run from `apps/api/` unless stated otherwise.

### Step 1 — Clone the repository

```bash
git clone <repository-url> EventOS
cd EventOS
```

### Step 2 — Install Node.js 22 and pnpm

```bash
# Example with nvm
nvm install 22
nvm use

corepack enable
corepack prepare pnpm@10.13.1 --activate
```

### Step 3 — Install dependencies

```bash
cd apps/api
pnpm install
```

### Step 4 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your local ports or credentials differ. Defaults work with the Docker Compose file provided.

### Step 5 — Start Docker (PostgreSQL + Redis)

From the **repository root**:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Wait until both containers are healthy:

```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
```

Expected containers:

| Container | Port | Credentials |
|-----------|------|-------------|
| `eventos-postgres` | 5432 | user / password / db: `eventos` |
| `eventos-redis` | 6379 | no password (local dev) |

### Step 6 — Generate Prisma client

```bash
cd apps/api
pnpm prisma:generate
```

### Step 7 — Run database migrations

```bash
pnpm prisma:migrate
```

When prompted for a migration name on first run, accept the existing migration (`sprint1_w5_lead_to_booking`) if already present in the repo.

### Step 8 — Seed the database

```bash
pnpm prisma:seed
```

This creates:

- Tenant: **We Decor Events** (`we-decor`)
- Admin placeholder: `admin@wedecor.events` (no password yet — auth not implemented)

### Step 9 — Start the backend

```bash
pnpm start:dev
```

The API listens on **http://localhost:3000** by default.

---

## 5. Verification Checklist

Run through this checklist after first-time setup (and after any environment change).

### Infrastructure

- [ ] `docker compose -f infrastructure/docker/docker-compose.yml ps` shows `postgres` and `redis` as **healthy**
- [ ] `docker compose -f infrastructure/docker/docker-compose.yml logs postgres` shows no fatal errors

### API health

- [ ] Liveness: `curl http://localhost:3000/health` returns `{ "status": "ok" }` (or equivalent)
- [ ] Readiness: `curl http://localhost:3000/health/ready` returns success (PostgreSQL + Redis connected)

### Swagger

- [ ] Open **http://localhost:3000/docs** in a browser — Swagger UI loads
- [ ] Open **http://localhost:3000/docs/json** — OpenAPI JSON is returned

### Prisma Studio

```bash
cd apps/api
pnpm prisma:studio
```

- [ ] Opens at **http://localhost:5555**
- [ ] Tables visible: `Tenant`, `User`, `Customer`, `Lead`, `FollowUp`, `Quotation`, `Event`, etc.
- [ ] Seed data present: tenant `we-decor`, user `admin@wedecor.events`

### Build and tests

```bash
cd apps/api
pnpm build        # compiles TypeScript; runs prisma generate via prebuild
pnpm lint         # ESLint passes
pnpm test         # unit tests pass
pnpm test:e2e     # e2e health tests pass
pnpm test:cov     # coverage report generated
```

All commands should exit with code **0**.

---

## 6. Development Workflow

### Recommended daily workflow

```bash
# 1. Sync with main
git checkout main
git pull origin main

# 2. Create or switch to feature branch
git checkout -b feature/your-task-name

# 3. Install dependencies if package.json changed
cd apps/api
pnpm install

# 4. Apply any new migrations
pnpm prisma:generate
pnpm prisma:migrate

# 5. Start infrastructure (if not already running)
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 6. Start backend in watch mode
pnpm start:dev

# 7. Before committing — verify quality
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
```

### Implementation order (inside-out)

Always build from domain outward (see [`docs/19-development-workflow.md`](./19-development-workflow.md)):

```
Domain rules → Application services → Repository implementations → REST controllers → Frontend
```

Do not skip layers. Do not implement controllers before application services exist.

### Scope discipline

- Implement **one sprint task at a time**
- Do not expand Phase 1 scope beyond Doc 19
- Do not add models, endpoints, or workflows not in the current sprint spec
- Read [`docs/10-implementation-specification.md`](./10-implementation-specification.md) before starting any task

---

## 7. Git Workflow

### Branch strategy

| Branch type | Pattern | Merges to |
|-------------|---------|-----------|
| Main | `main` | — (protected) |
| Feature | `feature/{short-description}` | `main` via PR |
| Bug fix | `fix/{short-description}` | `main` via PR |
| Chore | `chore/{short-description}` | `main` via PR |
| Docs | `docs/{short-description}` | `main` via PR |

**Rules:**

1. `main` is always deployable
2. No direct commits to `main` — all changes via pull request
3. Feature branches should be short-lived (< 1 week)
4. Rebase on `main` (or merge `main` into your branch) before opening a PR
5. Delete the branch after merge

**Examples:**

```
feature/sprint1-lead-controllers
feature/quotation-approve-endpoint
fix/lead-stage-transition-validation
docs/developer-onboarding-update
```

### Commit message format

Follow **Conventional Commits** (see [`docs/08-coding-standards.md`](./08-coding-standards.md)):

```
type(scope): description
```

| Type | Use for |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Tests only |
| `refactor` | Code change, no behaviour change |
| `chore` | Tooling, dependencies |
| `ci` | CI/CD changes |

**Examples:**

```
feat(lead): add POST /api/v1/leads controller
fix(quotation): enforce expired validUntil on approve
test(booking): add activate booking service coverage
docs: add developer onboarding guide
chore(api): upgrade prisma to 7.8
```

### Pull before push

Always sync before pushing:

```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main          # or: git rebase main
# resolve conflicts if any
git push -u origin your-branch
```

### Resolve conflicts

1. Pull latest `main`
2. Merge or rebase into your branch
3. Resolve conflicts in your editor — **never** blindly accept one side for business logic files
4. Re-run `pnpm build && pnpm test` in `apps/api/`
5. Push and update the PR

### Never commit secrets

**Do not commit:**

- `.env` files (only `.env.example` with placeholder values)
- Database passwords, JWT secrets, API keys
- Private keys or certificates

`.env` is gitignored in `apps/api/.gitignore`. If a secret is accidentally committed, rotate it immediately and notify the team.

---

## 8. Environment Variables

All variables are defined in `apps/api/.env.example` and validated at startup by Zod in `apps/api/src/config/env.schema.ts`.

Copy `.env.example` to `.env` and adjust for your machine. **Never commit `.env`.**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment: `development`, `test`, or `production` |
| `PORT` | No | `3000` | HTTP port the NestJS API listens on |
| `LOG_LEVEL` | No | `info` | Pino log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` |
| `CORS_ORIGIN` | No | `*` (example: `http://localhost:5173`) | Allowed browser origins (comma-separated). Use `*` only in local dev |
| `DATABASE_URL` | **Yes** | `postgresql://eventos:eventos@localhost:5432/eventos?schema=public` | PostgreSQL connection string for Prisma |
| `REDIS_HOST` | No | `localhost` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | (empty) | Redis password — leave empty for local Docker Redis |
| `JWT_SECRET` | No* | placeholder in example | JWT signing secret — min 32 characters. *Required once auth is implemented |

**Local development defaults** match `infrastructure/docker/docker-compose.yml`:

- PostgreSQL: `eventos` / `eventos` @ `localhost:5432` / database `eventos`
- Redis: `localhost:6379` (no auth)

---

## 9. Documentation Order

Read documents in this order before writing code. **Do not implement from memory.**

### Phase A — Business context (Business Bible)

Read [`docs/business/`](./business/) in numeric order:

1. [`01-business-vision.md`](./business/01-business-vision.md)
2. [`02-business-model.md`](./business/02-business-model.md)
3. [`03-customer-journey.md`](./business/03-customer-journey.md)
4. [`04-sales-process.md`](./business/04-sales-process.md)
5. [`05-event-execution.md`](./business/05-event-execution.md)
6. [`06-staff-management.md`](./business/06-staff-management.md)
7. [`07-vendor-management.md`](./business/07-vendor-management.md)
8. [`08-inventory-workflow.md`](./business/08-inventory-workflow.md)
9. [`09-finance-workflow.md`](./business/09-finance-workflow.md)
10. [`10-marketing-workflow.md`](./business/10-marketing-workflow.md)
11. [`11-social-media-workflow.md`](./business/11-social-media-workflow.md)
12. [`12-customer-support.md`](./business/12-customer-support.md)
13. [`13-standard-operating-procedures.md`](./business/13-standard-operating-procedures.md)
14. [`14-business-rules.md`](./business/14-business-rules.md) — **hard blocks (EP1-BR-*)**
15. [`15-kpis.md`](./business/15-kpis.md)
16. [`16-pain-points.md`](./business/16-pain-points.md)
17. [`17-automation-opportunities.md`](./business/17-automation-opportunities.md)
18. [`18-technology-systems-landscape.md`](./business/18-technology-systems-landscape.md)
19. [`19-event-os-phase1-requirements.md`](./business/19-event-os-phase1-requirements.md) — **★ Phase 1 authoritative baseline**

### Phase B — Engineering handoff (read before Sprint 1 coding)

1. [`02-product-vision.md`](./02-product-vision.md)
2. [`03-product-principles.md`](./03-product-principles.md)
3. [`04-business-domain.md`](./04-business-domain.md)
4. [`05-system-architecture.md`](./05-system-architecture.md)
5. [`06-module-design.md`](./06-module-design.md)
6. [`07-domain-model.md`](./07-domain-model.md) — **★ aggregates, events, invariants**
7. [`08-data-model.md`](./08-data-model.md)
8. [`09-api-design.md`](./09-api-design.md) — **★ REST contracts**
9. [`10-implementation-specification.md`](./10-implementation-specification.md) — **★ sprint plan**
10. [`10-folder-structure.md`](./10-folder-structure.md)
11. [`14-security-principles.md`](./14-security-principles.md)
12. [`15-testing-strategy.md`](./15-testing-strategy.md)
13. [`18-api-standards.md`](./18-api-standards.md)
14. [`19-development-workflow.md`](./19-development-workflow.md)
15. [`20-definition-of-done.md`](./20-definition-of-done.md)
16. [`22-developer-onboarding.md`](./22-developer-onboarding.md) — this guide

### Phase C — Architecture Decision Records (ADRs)

Read [`12-architecture-decisions.md`](./12-architecture-decisions.md), focusing on:

| ADR | Topic |
|-----|-------|
| ADR-001 | Modular monolith |
| ADR-004 | Row-level multi-tenancy |
| ADR-008 | JWT authentication |
| ADR-012 | In-process domain events |
| ADR-013 | Zod validation |
| ADR-016 | Single-tenant Phase 1 |
| ADR-017 | Suggestion-only handlers (no auto-execution) |
| **ADR-018** | **NestJS + Prisma stack (approved)** |

---

## 10. Current Progress

*Last verified: 2026-09-12*

### Completed

| Layer | Status | Location |
|-------|--------|----------|
| Business requirements (EP1) | ✓ Approved & frozen | `docs/business/19-event-os-phase1-requirements.md` |
| Architecture docs | ✓ Complete & frozen | `docs/05` – `docs/10`, ADRs |
| NestJS backend scaffold | ✓ Done | `apps/api/` |
| Docker Compose (PostgreSQL + Redis) | ✓ Done | `infrastructure/docker/docker-compose.yml` |
| Prisma configured | ✓ Done | `apps/api/prisma/`, `PrismaService` |
| Sprint 1 schema (W5 subset) | ✓ Done | Migration `20260708144526_sprint1_w5_lead_to_booking` |
| Database seed (tenant + admin) | ✓ Done | `apps/api/prisma/seed.ts` |
| Health endpoints | ✓ Done | `GET /health`, `GET /health/ready` |
| Swagger scaffold | ✓ Done | `GET /docs` |
| Repository layer | ✓ Done | Lead, Customer, Quotation, Event, FollowUp |
| Application services | ✓ Done | Lead, Customer, Quotation, Booking |
| Domain events (publish only) | ✓ Done | `src/shared/events/sprint1-domain.events.ts` |
| Unit tests (services + repos) | ✓ Done | 81+ tests, >90% service coverage |

### Sprint 1 schema scope (what exists in Prisma today)

**Included:** `Tenant`, `User`, `Customer`, `Lead`, `LeadStageHistory`, `FollowUp`, `Quotation`, `Event` (Booking)

**Intentionally deferred** (required later in Sprint 1 or subsequent sprints):

- `EventWorkspace`
- `QuotationLineItem`
- `Payment` (advance gating — stub port exists)
- `Contact` (implemented)
- `Suggestion` (implemented)
- Staff, Tasks, Inventory, Vendors, Finance, Attachments

### Not yet implemented

| Item | Status |
|------|--------|
| REST controllers (`/api/v1/*`) | ✓ Sprint 1 W5 surface |
| Dev tenant guard (`X-Tenant-Slug`) | ✓ Non-production fallback alongside JWT |
| Zod request DTOs at API boundary | ✓ Sprint 1 controllers |
| Domain event handlers | ✓ `EventCreated` → workspace suggestion (ADR-017) |
| Payment persistence | ✓ Done + EP1-BR-001 query |
| Quotation line items | ✓ Done |
| Suggestion model | ✓ Done (`accept` / `dismiss` for `workspace.create`) |
| GitHub Actions CI | ✓ `.github/workflows/ci.yml` |
| Frontend (`apps/web/`) | ✓ W5 UI + follow-ups, assign, `?include=customer`, loading panels, PDF header/footer |
| Production JWT (ADR-008) | ✓ Access + refresh (HTTP-only cookie, rotation on `/auth/refresh`) |
| Contact aggregate / client contacts API | ✓ Done |
| Quotation PDF | ✓ GST subtotal/tax/total layout (minimal PDF engine) |
| Lead approval conversion gate (EP1-AUT-006) | ✓ `LeadConversionQuery` before `approved` stage |
| HTTP integration tests | ✓ Auth + W5 happy path (`pnpm test:integration`) |

### Current next task

**Harden Sprint 1 for UAT and production readiness:**

1. **Task / inventory modules** — full checklist and packing workflows (beyond Sprint 1 booking flags)
2. **Web polish** — assignee names (user list API), lost-reason display, dashboard/home
3. **Branded quotation PDF** — logo, fonts, print layout (replace text-only PDF stub)
4. **Single DB transaction orchestration** — optional atomic multi-aggregate conversion (if UAT requires rollback)

---

## 11. Working with Cursor

Event OS is designed for AI-assisted development. Follow this workflow in Cursor:

### Before writing code

1. **Read docs first** — start with Doc 19 (business), then Doc 07 (domain), Doc 09 (API), Doc 10 (implementation spec)
2. **Never bypass the Business Bible** — if a requirement is unclear, read the source business doc; do not invent behaviour
3. **Follow EP1 requirements only** — every feature maps to an EP1 ID in Doc 19
4. **One implementation task at a time** — e.g. "Lead REST controllers only", not "entire Sprint 1"
5. **Keep architecture frozen** — stack changes require ADR; business rule changes require founder approval

### Prompting guidelines

When asking Cursor to implement:

```
Task: [specific layer and scope]
Context: Sprint 1 / W5 Lead → Booking
Read first: docs/09-api-design.md, docs/10-implementation-specification.md
Constraints:
- Do NOT modify domain model or business rules
- Do NOT import Prisma outside repositories
- Depend on application services, not repositories, in controllers
- Return typed Result objects; map to HTTP in controllers
- Publish domain events; do not implement handlers
```

### What Cursor should not do

- Add endpoints not in Doc 09 / Sprint spec
- Change EP1 business rules without explicit approval
- Introduce new aggregates or tables not in the sprint schema
- Auto-execute side effects (ADR-017 — suggestions only)
- Skip tests

Use the **AI Handoff Prompt** in Section 14 when starting a fresh Cursor session on a new machine.

---

## 12. Common Commands

All commands assume `cd apps/api` unless noted.

### pnpm — application

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm start:dev` | Start API with hot reload |
| `pnpm start:debug` | Start with debugger attached |
| `pnpm build` | Compile TypeScript (runs `prisma generate` first) |
| `pnpm start:prod` | Run compiled production build |
| `pnpm lint` | ESLint with auto-fix |
| `pnpm format` | Prettier format |
| `pnpm test` | Unit tests |
| `pnpm test:watch` | Unit tests in watch mode |
| `pnpm test:cov` | Unit tests with coverage report |
| `pnpm test:e2e` | End-to-end tests |

### Docker — from repository root

| Command | Description |
|---------|-------------|
| `docker compose -f infrastructure/docker/docker-compose.yml up -d` | Start PostgreSQL + Redis |
| `docker compose -f infrastructure/docker/docker-compose.yml ps` | Check container status |
| `docker compose -f infrastructure/docker/docker-compose.yml logs -f postgres` | Tail PostgreSQL logs |
| `docker compose -f infrastructure/docker/docker-compose.yml logs -f redis` | Tail Redis logs |
| `docker compose -f infrastructure/docker/docker-compose.yml down` | Stop containers |
| `docker compose -f infrastructure/docker/docker-compose.yml down -v` | Stop and **delete volumes** (wipes DB) |

### Prisma

| Command | Description |
|---------|-------------|
| `pnpm prisma:generate` | Regenerate Prisma Client after schema changes |
| `pnpm prisma:migrate` | Create/apply migrations (`prisma migrate dev`) |
| `pnpm prisma:studio` | Open Prisma Studio GUI |
| `pnpm prisma:seed` | Run seed script |
| `pnpm prisma:reset` | Reset DB, re-apply migrations, re-seed |

### Quick verification

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
open http://localhost:3000/docs        # macOS
xdg-open http://localhost:3000/docs    # Ubuntu
```

---

## 13. Troubleshooting

### Docker not starting

**Symptoms:** `Cannot connect to the Docker daemon` or containers exit immediately.

**Fixes:**

- Ensure Docker Desktop (macOS) or Docker Engine (Ubuntu) is running
- Linux: `sudo systemctl start docker` and add your user to the `docker` group
- Check port conflicts: `sudo lsof -i :5432` and `sudo lsof -i :6379`
- Reset containers: `docker compose -f infrastructure/docker/docker-compose.yml down -v && ... up -d`

### Prisma client out of date

**Symptoms:** Type errors referencing missing Prisma models; `@prisma/client did not initialize yet`.

**Fixes:**

```bash
cd apps/api
pnpm prisma:generate
```

`pnpm build` also runs generate via the `prebuild` hook. After pulling schema changes, always run `pnpm prisma:generate && pnpm prisma:migrate`.

### Migration conflicts

**Symptoms:** `prisma migrate dev` fails; migration history diverged.

**Fixes:**

1. Ensure you pulled latest `main`
2. Check `apps/api/prisma/migrations/` for new folders
3. Local-only experimental migrations: `pnpm prisma:reset` (⚠ destroys local data) then `pnpm prisma:migrate && pnpm prisma:seed`
4. Never edit applied migration SQL — create a new migration instead
5. Coordinate with the team before resetting a shared/staging database

### Port conflicts

**Symptoms:** `EADDRINUSE` on 3000, 5432, or 6379.

**Fixes:**

```bash
# Find process on port (example: 3000)
lsof -i :3000
kill -9 <PID>

# Or change PORT in .env (API) / docker-compose ports (database)
```

### pnpm issues

**Symptoms:** `pnpm: command not found`, lockfile errors, wrong package versions.

**Fixes:**

```bash
corepack enable
corepack prepare pnpm@latest --activate
cd apps/api
rm -rf node_modules
pnpm install
```

Use Node 22 LTS (`>=22.12 <23`). Node 23+ is unsupported for this project.

### Environment validation failed at startup

**Symptoms:** API crashes on boot with `Environment validation failed`.

**Fixes:**

- Ensure `.env` exists (`cp .env.example .env`)
- `DATABASE_URL` must be non-empty
- `JWT_SECRET` must be ≥ 32 characters if set

### `/health/ready` fails but `/health` works

**Symptoms:** Readiness check returns error.

**Fixes:**

- PostgreSQL not running — start Docker Compose
- Wrong `DATABASE_URL` — verify credentials match Docker Compose
- Redis not running — check `eventos-redis` container
- Wrong `REDIS_HOST` / `REDIS_PORT` in `.env`

### SWC / Jest transformer issues

**Symptoms:** Tests fail with transform errors, decorator metadata missing at runtime, or `Cannot use import statement outside a module`.

**Context:** This project uses **@swc/jest** (not ts-jest) as the Jest transformer. SWC is configured in `apps/api/.swcrc` with `legacyDecorator` and `decoratorMetadata` enabled for NestJS compatibility.

**Fixes:**

- Ensure `.swcrc` exists in `apps/api/` with `legacyDecorator: true` and `decoratorMetadata: true`
- Ensure `package.json` jest transform is `["@swc/jest"]` (not `"ts-jest"`)
- Ensure `test/jest-e2e.json` also uses `["@swc/jest"]`
- Do NOT install ts-jest — it is incompatible with Jest 30

### Tests fail after pulling changes

```bash
cd apps/api
pnpm install
pnpm prisma:generate
pnpm test
```

If integration tests need a fresh DB: `pnpm prisma:reset` then re-run tests.

---

## 14. AI Handoff Prompt

Copy everything inside the block below into a **new Cursor chat** on any machine to restore full project context:

---

```
You are working on Event OS — a greenfield NestJS backend for We Decor Events (Phase 1, single tenant).

## Architecture status: FROZEN
Do NOT change business rules, domain model, API contracts, or module boundaries without explicit founder approval.
Technology stack is fixed by ADR-018: NestJS + TypeScript + PostgreSQL + Prisma + Redis + BullMQ + Zod + Passport JWT + pnpm. Testing uses Jest 30 with @swc/jest (not ts-jest).

## Authoritative documents (read before coding)
- Business: docs/business/19-event-os-phase1-requirements.md (EP1 IDs, W1–W5 UAT)
- Domain: docs/07-domain-model.md (aggregates, invariants, domain event names)
- API: docs/09-api-design.md (REST contracts)
- Implementation: docs/10-implementation-specification.md (sprint plan)
- Onboarding: docs/22-developer-onboarding.md

## Current sprint
Sprint 1 — W5 Lead → Booking
Goal: lead capture through to Approved Event (Booking), with workspace activation suggestion queued (ADR-017).

## Completed work (do NOT redo)
✓ NestJS scaffold in apps/api/
✓ Docker Compose: PostgreSQL 16 + Redis 7 (infrastructure/docker/docker-compose.yml)
✓ Prisma 7 configured with PrismaService, migrations, seed (tenant we-decor, admin@wedecor.events)
✓ Sprint 1 Prisma schema: Tenant, User, Customer, Lead, LeadStageHistory, FollowUp, Quotation, Event
✓ Repository layer: Lead, FollowUp, Customer, Quotation, Event (tenant-scoped, optimistic concurrency)
✓ Application services: LeadApplicationService, CustomerApplicationService, QuotationApplicationService, BookingApplicationService
✓ Domain events published (not handled): LeadCreated, LeadStageChanged, LeadAssigned, FollowUpCreated, ClientCreated, QuotationCreated, QuotationSuperseded, QuotationApproved, EventCreated, BookingStatusChanged
✓ Result<T> pattern, unit tests (>90% service coverage), health + Swagger scaffold
✓ EP1-BR-001 enforced via AdvancePaymentQuery port (stub returns false until Payment model exists)

## NOT implemented (do NOT assume these exist)
✗ REST controllers (/api/v1/* business routes)
✗ JWT authentication / tenant context from auth
✗ Payment, QuotationLineItem, Contact, Suggestion, EventWorkspace models
✗ Domain event handlers
✗ Frontend (apps/web/)

## Implementation rules
1. Services depend ONLY on repository interfaces — no Prisma outside infrastructure/persistence
2. Controllers depend on application services — map Result<T> to HTTP error envelope (docs/18-api-standards.md)
3. Validate API input with Zod (ADR-013)
4. Publish domain events with canonical names from docs/07-domain-model.md — do not implement handlers
5. No auto-execution (ADR-017) — suggestions/alerts only
6. One task at a time; minimal diff; match existing code conventions
7. Run: cd apps/api && pnpm build && pnpm lint && pnpm test && pnpm test:e2e

## Dev environment
- Node.js 22 LTS (>=22.12 <23), pnpm 10.13+
- cd apps/api && cp .env.example .env
- docker compose -f infrastructure/docker/docker-compose.yml up -d
- pnpm install && pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed
- pnpm start:dev → http://localhost:3000 (Swagger at /docs)

## Current next task
Implement Sprint 1 REST controllers for W5 Lead → Booking:
Wire NestJS controllers to existing application services per docs/09-api-design.md and docs/10-implementation-specification.md Sprint 1 API list.
Priority: Lead, Customer, Quotation, Booking endpoints listed in docs/22-developer-onboarding.md §10.
Do NOT implement auth module unless explicitly requested — stub tenant context for local dev if needed.
```

---

## Related Documents

| Document | Topic |
|----------|-------|
| [`apps/api/README.md`](../apps/api/README.md) | API quick start (may lag this guide — prefer this doc) |
| [`19-development-workflow.md`](./19-development-workflow.md) | Branching, PRs, code review |
| [`20-definition-of-done.md`](./20-definition-of-done.md) | Completion criteria per sprint |
| [`09-ai-development-guide.md`](./09-ai-development-guide.md) | AI-specific development patterns |

---

*Last updated: 2026-07-10*
*Owner: Founding Engineering*
