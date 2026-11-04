# Event OS API

NestJS Phase 1 backend for Event OS (We Decor). Prisma persistence, JWT auth + RBAC,
and business modules under `/api/v1` are implemented. See
[docs/09-api-design.md](../../docs/09-api-design.md) and
[docs/12-architecture-decisions.md](../../docs/12-architecture-decisions.md) (ADR-016 / ADR-017 / ADR-018).

## Prerequisites

- Node.js 22 LTS (`22.12+`) — matches `package.json` engines and `apps/api/Dockerfile` (R2-01)
- [pnpm](https://pnpm.io/) 10.13+
- Docker and Docker Compose (for local PostgreSQL and Redis)

## Quick start

### 1. Install dependencies

```bash
pnpm install
pnpm prisma:generate
```

### 2. Start infrastructure

From the repository root:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

This starts:

- **PostgreSQL** on `localhost:5432` (user/password/db: `eventos`)
- **Redis** on `localhost:6379`

Compose also defines an optional **API** service image build (R2-02); for local `pnpm start:dev`, only Postgres/Redis are required.

### 3. Configure environment

```bash
cp .env.example .env
```

Variables are validated at startup via `src/config/env.schema.ts` (see `.env.example`). `JWT_SECRET` must be at least 32 characters. Optional `SENTRY_DSN` enables Sentry (R2-06).

### 4. Migrate & seed (local)

```bash
pnpm prisma:migrate
pnpm prisma:seed
```

### 5. Run the API

```bash
# Development (watch mode)
pnpm start:dev

# Production build
pnpm build
pnpm start:prod
```

The API listens on `http://localhost:3000` by default (`PORT`).

## Endpoints

| Method | Path            | Description |
| ------ | --------------- | ----------- |
| GET    | `/health`       | Liveness probe |
| GET    | `/health/ready` | Readiness — PostgreSQL + Redis |
| GET    | `/docs`         | Swagger UI |
| GET    | `/docs/json`    | OpenAPI JSON (runtime) |
| *      | `/api/v1/...`   | Authenticated business API (Bearer JWT; see Swagger) |

Public routes (no Bearer): `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /health`, `GET /health/ready`.  
`POST /api/v1/auth/logout` and `POST /api/v1/auth/change-password` require JWT.

**Phase 1 contract freeze (R3-13):** committed snapshot `openapi/openapi.v1.json`. Regenerate with `pnpm openapi:export` after any intentional API change (requires approval for breaking changes).

## Project structure

```
prisma/
├── schema.prisma      # Domain + platform models
├── migrations/        # Applied migration history
└── seed.ts            # Phase 1 tenant + admin user seed

src/
├── modules/           # Business + auth modules (lead, booking, finance, …)
│   └── auth/          # JWT auth, sessions, RBAC (`rbac.ts`), guards
├── common/            # Filters, Zod pipe, health
├── config/            # Zod env validation + logging (R2-07)
├── database/          # PrismaModule, PrismaService, Redis
├── shared/            # Result type, audit, tenant helpers, events
├── instrument.ts      # Sentry bootstrap (R2-06)
└── main.ts            # Nest bootstrap, Swagger, global filters
```

## Prisma scripts

| Command                | Description |
| ---------------------- | ----------- |
| `pnpm prisma:generate` | Generate Prisma Client |
| `pnpm prisma:migrate`  | Create/apply migrations (`migrate dev`) |
| `pnpm prisma:studio`   | Open Prisma Studio |
| `pnpm prisma:seed`     | Run seed script |
| `pnpm prisma:reset`    | Reset DB and re-apply migrations |

`pnpm build` runs `prisma generate` via the `prebuild` hook.

## Development scripts

| Command          | Description |
| ---------------- | ----------- |
| `pnpm start:dev` | Hot reload |
| `pnpm build`     | Compile TypeScript |
| `pnpm lint`      | ESLint |
| `pnpm format`    | Prettier |
| `pnpm test`      | Unit tests |
| `pnpm test:cov`  | Unit tests + coverage thresholds |
| `pnpm test:e2e`  | End-to-end tests |
| `pnpm openapi:export` | Build + write frozen `openapi/openapi.v1.json` |

## Ops references (repo prep)

| Topic | Path |
|-------|------|
| Docker image | `apps/api/Dockerfile` (R2-01) |
| Local compose | `infrastructure/docker/docker-compose.yml` (R2-02) |
| Staging env | `infrastructure/staging/` (R2-05) |
| Logging | `infrastructure/logging/` (R2-07) |
| Monitoring | `infrastructure/monitoring/` (R2-08) |
| Object storage | `infrastructure/storage/` (R2-09) |
| Disaster recovery | `infrastructure/disaster-recovery/` (R2-10) |
| RBAC matrix | `docs/09-api-design.md` §Phase 1 Role × Permission Matrix (R3-09) |

## Stopping infrastructure

```bash
docker compose -f infrastructure/docker/docker-compose.yml down
```

Add `-v` to remove persisted volumes.
