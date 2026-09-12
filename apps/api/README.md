# Event OS API

Production-ready NestJS backend for Event OS (We Decor Phase 1). Prisma persistence is configured; business models and modules are added in Sprint 1 per [ADR-018](../../docs/12-architecture-decisions.md).

## Prerequisites

- Node.js 22 LTS (`22.12+`)
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

### 3. Configure environment

```bash
cp .env.example .env
```

`DATABASE_URL` is loaded from `.env` and validated at startup. The default matches the Docker Compose services above.

### 4. Run the API

```bash
# Development (watch mode)
pnpm start:dev

# Production build
pnpm build
pnpm start:prod
```

The API listens on `http://localhost:3000` by default.

## Endpoints

| Method | Path            | Description                                   |
| ------ | --------------- | --------------------------------------------- |
| GET    | `/health`       | Liveness probe — application is running       |
| GET    | `/health/ready` | Readiness probe — Prisma (PostgreSQL) + Redis |
| GET    | `/docs`         | Swagger UI                                    |
| GET    | `/docs/json`    | OpenAPI JSON document                         |

Business routes are mounted under `/api/v1` when modules are added in Sprint 1.

## Project structure

```
prisma/
├── schema.prisma      # Generator + datasource only (no models yet)
├── migrations/        # Migration history (Sprint 1+)
└── seed.ts            # Seed entry point (empty until models exist)

src/
├── auth/              # Authentication placeholder (Passport JWT in Sprint 1)
├── common/            # Filters, pipes, health checks
├── config/            # Environment validation (Zod) and configuration
├── database/          # PrismaModule, PrismaService, Redis provider
├── modules/           # Business modules (empty — added per sprint)
└── shared/            # Cross-cutting shared kernel (empty)
```

## Prisma scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `pnpm prisma:generate` | Generate Prisma Client from schema             |
| `pnpm prisma:migrate`  | Create and apply migrations (`migrate dev`)    |
| `pnpm prisma:studio`   | Open Prisma Studio                             |
| `pnpm prisma:seed`     | Run seed script (`prisma db seed`)             |
| `pnpm prisma:reset`    | Reset database and re-apply migrations         |

`pnpm build` runs `prisma generate` automatically via the `prebuild` hook.

## Development scripts

| Command           | Description           |
| ----------------- | --------------------- |
| `pnpm start:dev`  | Start with hot reload |
| `pnpm build`      | Compile TypeScript    |
| `pnpm lint`       | Run ESLint            |
| `pnpm format`     | Format with Prettier  |
| `pnpm test`       | Run unit tests        |
| `pnpm test:e2e`   | Run end-to-end tests  |

## Persistence foundation

- **Prisma 7** with PostgreSQL via `DATABASE_URL` in `prisma.config.ts`
- **PrismaService** — global provider with connection lifecycle, graceful shutdown, and development query logging
- **Health check** — `/health/ready` runs `SELECT 1` through Prisma to verify PostgreSQL connectivity

## What is intentionally not included

- Prisma models, migrations with tables, or seed data
- Business modules or domain controllers
- JWT authentication strategy or guards
- Background job processors

See [docs/10-implementation-specification.md](../../docs/10-implementation-specification.md) for the Sprint 1 backlog.

## Stopping infrastructure

```bash
docker compose -f infrastructure/docker/docker-compose.yml down
```

Add `-v` to remove persisted volumes.
