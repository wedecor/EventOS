# Event OS API

NestJS modular monolith for We Decor Phase 1 (Sprint 1: W5 Lead → Booking).

## Prerequisites

- Node.js **20 LTS**
- pnpm **9+**
- Docker Compose (PostgreSQL 16 + Redis 7)

## Quick start

```bash
pnpm install
cp .env.example .env
docker compose -f ../../infrastructure/docker/docker-compose.yml up -d
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm start:dev
```

Default URL: http://localhost:3000  
Swagger: http://localhost:3000/docs

## Authentication (ADR-008)

**Production:** `Authorization: Bearer <access_token>` (tenant is taken from the JWT).

**Login:**

```http
POST /api/v1/auth/login
{ "email": "admin@wedecor.events", "password": "<see seed.ts default>" }
```

**Development fallback** (when `NODE_ENV` is not `production`): you may still use `X-Tenant-Slug: we-decor` without a token.

Set `JWT_SECRET` (32+ chars) in production. Optional: `JWT_EXPIRES_IN` (default `15m`), `REFRESH_TOKEN_DAYS` (default `7`). Login sets an HTTP-only `refresh_token` cookie on `/api/v1/auth/*`.

Integration tests (PostgreSQL): `RUN_INTEGRATION_TESTS=true pnpm test:integration` (CI runs migrate + seed first).

## Sprint 1 REST surface

Business routes are under `/api/v1` (health excluded):

| Area | Endpoints |
|------|-----------|
| Leads | `GET/POST /leads`, `GET/PATCH /leads/:id`, `PATCH /leads/:id/stage`, `POST .../assign`, `POST .../follow-ups` |
| Auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Clients | `GET/POST /clients`, `PATCH /clients/:id`, `POST /clients/:id/contacts` |
| Quotations | CRUD-ish + line items, `send`, `approve`, `reject`, `revise`, `GET .../pdf` |
| Bookings | `GET /bookings/:id`, `POST /bookings/from-quotation/:quotationId`, `POST .../activate` |
| Payments | `POST /payments` |
| Suggestions | `GET /suggestions?status=pending`, `POST .../accept`, `POST .../dismiss` |
| Follow-ups | `PATCH /follow-ups/:id` |

Optimistic concurrency: send `If-Match: "<version>"` on PATCH endpoints that require it.

## Layers

```
presentation/ (controllers, Zod schemas)
application/  (services, Result<T>, domain events)
domain/       (repository interfaces, rules)
infrastructure/ (Prisma repositories)
```

Prisma is **only** imported under `infrastructure/persistence/`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start:dev` | API with hot reload |
| `pnpm build` | Compile (runs `prisma generate`) |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | Health e2e |
| `pnpm prisma:migrate` | Apply migrations |
| `pnpm prisma:seed` | Seed We Decor tenant |

## Migrations

1. `20260708144526_sprint1_w5_lead_to_booking` — core W5 aggregates
2. `20260912133000_sprint1_w5_payments_line_items_suggestions` — Payment, line items, Suggestion
3. `20260912143000_contacts` — Contact
4. `20260912150000_auth_sessions` — refresh token sessions

See [`docs/22-developer-onboarding.md`](../../docs/22-developer-onboarding.md) for full setup and AI handoff.
