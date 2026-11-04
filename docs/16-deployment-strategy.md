# Deployment Strategy

## Purpose of This Document

This document defines how Event OS is built, deployed, and operated across environments. Production-ready from day one means a reliable deployment pipeline from the first release.

---

## Environments

| Environment | Purpose | URL Pattern | Data |
|-------------|---------|-------------|------|
| **Development** | Local developer machines | `localhost:3000` (API default `PORT`; web when present). Docker Compose maps API container to host **4000** | Docker Compose local DB, seed data |
| **Staging** | Pre-production testing, UAT | `staging.eventos.app` (target; see `infrastructure/staging/` prep) | Production-like, anonymized or test data |
| **Production** | Live system for We Decor (then tenants) | `app.eventos.app` | Real business data |

### Environment Rules

1. **No production data in development** — Ever. Use seed data.
2. **Staging mirrors production** — Same infrastructure, same configuration pattern, smaller resources.
3. **Production changes go through staging** — No direct-to-production deploys.
4. **Environment variables for all configuration** — No hard-coded environment-specific values.

---

## Infrastructure Architecture

### Phase 1: Single Server (Launch)

```
                    ┌──────────────┐
                    │   Cloudflare  │
                    │   (DNS + CDN) │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │   App Server  │
                    │   (Node.js)   │
                    │               │
                    │  ┌──────────┐ │
                    │  │ API      │ │
                    │  │ (port    │ │
                    │  │  4000)   │ │
                    │  └──────────┘ │
                    │  ┌──────────┐ │
                    │  │ Static   │ │
                    │  │ (web)    │ │
                    │  └──────────┘ │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──────┐ ┌──┴───┐ ┌─────┴─────┐
       │ PostgreSQL  │ │Redis │ │ S3/R2     │
       │ (Managed)   │ │(Mgmt)│ │ (Storage) │
       └─────────────┘ └──────┘ └───────────┘
```

**Why single server:** Simplicity. We Decor is one tenant with < 50 users. A single well-provisioned server handles this with significant headroom.

**Admin Portal (Phase 1):** `apps/web` is a **static export** (Next.js). Deploy as static files behind CDN/object storage (or any static host). It talks only to the NestJS API (`/api/v1`). There is no Next.js SSR/server runtime in Phase 1 Admin Portal deploys.

### Phase 2: Separated Services (Growth)

- API server and background worker as separate processes
- PostgreSQL read replica for reporting queries
- Redis for caching and job queue
- CDN for static assets

### Phase 3: Horizontal Scaling (Multi-Tenant)

- Multiple API server instances behind load balancer
- Dedicated background worker instances
- Connection pooling (PgBouncer)
- Multi-AZ database deployment

---

## Containerization

### Docker

All applications run in Docker containers for consistency between environments.

**API Dockerfile:**

```dockerfile
# Multi-stage build — repository Dockerfile is authoritative (Node 22, entry `dist/src/main`)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/src/main"]
```

*Canonical file:* `apps/api/Dockerfile` (R2-01). Local `pnpm start:dev` defaults to **PORT=3000**; container/compose commonly exposes **4000**.
**Local Development (Docker Compose):**

```yaml
services:
  api:
    build: ./apps/api
    ports: ['4000:4000']
    depends_on: [postgres, redis]
    env_file: .env

  web:
    build: ./apps/web
    ports: ['3000:3000']

  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
```

---

## CI/CD Pipeline

### Pull Request Pipeline

```
PR opened/updated
    │
    ├── Lint (ESLint + Prettier check)
    ├── Type check (tsc --noEmit)
    ├── Unit tests (Jest)
    ├── Integration tests (Jest + test DB)
    ├── Build (verify compilation)
    └── Coverage report
    │
    ▼
All checks pass → Ready for review
```

### Main Branch Pipeline (current repo — R2-04)

```
Merge to main
    │
    ├── Quality gates (lint, build, unit tests, coverage)
    ├── prisma migrate deploy against disposable CI Postgres
    └── Docker image build (no registry push / no cloud deploy)
    │
    ▼
Main CI complete — staging deploy is not automated in-repo yet
```

> **R3-12:** Target future pipeline may add image push, staging deploy, and smoke tests. Today’s workflows are `.github/workflows/pull-request.yml` and `main-branch.yml` only. Staging/monitoring/logging/DR/storage/Sentry live cloud wiring is **repository preparation** under `infrastructure/*` (see CHANGELOG 0.5.0).

### Production Deploy (target)

```
Release tag created (v1.2.0)
    │
    ├── All main branch checks
    ├── Build production Docker images (tagged with version)
    ├── Push to production registry
    ├── Run database migrations (production)
    ├── Deploy to production (rolling update)
    ├── Smoke tests
    └── Notify team (Slack/email)
    │
    ▼
Production deployment complete
```

*Not automated in the current repository.*
### Deployment Rules

1. **Database migrations run before new code deploys** — Backward-compatible migrations only
2. **Zero-downtime deploys** — Rolling update; old version serves traffic until new version is healthy
3. **Health check gate** — New version must pass `/health/ready` before receiving traffic
4. **Rollback plan** — Previous Docker image tagged and available; database migrations must be reversible
5. **Deploy during business hours** — Initially, when team is available to monitor (We Decor operates daytime)

---

## Database Migration Strategy

### Migration Workflow

```
1. Developer creates migration locally (prisma migrate dev)
2. Migration SQL reviewed in PR
3. CI runs migration against test database
4. On staging deploy: migration runs automatically before app start
5. On production deploy: migration runs automatically before app start
6. App starts only after migration succeeds
```

### Migration Safety Rules

| Rule | Rationale |
|------|-----------|
| Add columns as nullable or with defaults | Old code must work with new schema during rolling deploy |
| Never rename columns in one step | Add new → migrate data → remove old (two deployments) |
| Never drop columns in the same deploy as code change | Drop column only after code no longer references it |
| Test migrations against production-size data | Catch lock timeouts and performance issues |
| Backup before production migration | Recovery point if migration fails |

### Rollback

- **Application rollback:** Deploy previous Docker image (instant)
- **Migration rollback:** Only if migration has a documented `down` migration; otherwise, forward-fix with new migration
- **Data rollback:** Restore from backup (last resort; RPO < 1 hour)

---

## Environment Variables

### Required Variables

| Variable | Environment | Description |
|----------|-------------|-------------|
| `NODE_ENV` | All | `development`, `test`, `staging`, `production` |
| `PORT` | All | API listen port (default **3000** locally; container often **4000**) |
| `LOG_LEVEL` | All | Pino level (`info` default) |
| `DATABASE_URL` | All | PostgreSQL connection string |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | All | Redis connection (login throttle, cache, queue broker) |
| `JWT_SECRET` | All | JWT access-token signing key (min 32 characters / 256 bits) |
| `CORS_ORIGIN` | All | Allowed CORS origin(s). `*` OK in development; required and non-wildcard in staging/production |
| `SENTRY_DSN` | Optional | Error tracking DSN — SDK wired in `apps/api/src/instrument.ts`; absent/blank = no-op |
| `SEED_ADMIN_PASSWORD` | Dev/seed | Optional; sets seeded admin password when running `prisma:seed` |
| `STORAGE_*` / `AI_*` / `EMAIL_*` | Staging, Prod (future) | Object storage / AI / email — prepared in docs/`infrastructure`; not required by current `env.schema.ts` |

### Variable Management

- Development: `.env` file (gitignored)
- Staging/Production: Secret manager or encrypted environment variables
- `.env.example` committed with placeholder values
- Secrets never in Docker images, git, or logs

---

## Monitoring and Alerting

### Health Checks

| Endpoint | Check | Frequency |
|----------|-------|-----------|
| `GET /health` | App process running | Every 30s |
| `GET /health/ready` | Database connected, Redis connected | Every 30s |

> **R3-14 probe note:** `/health/ready` currently returns **HTTP 200** with JSON `status: "ok" | "degraded"`. Orchestrators must assert `status === "ok"` in the body (see `infrastructure/monitoring/README.md`). Do not rely on non-2xx alone.

### Alerts

| Condition | Severity | Action |
|-----------|----------|--------|
| Health check fails for > 2 minutes | Critical | Page on-call, auto-restart |
| Error rate > 5% for 5 minutes | High | Notify team |
| API p95 latency > 2s for 10 minutes | Medium | Investigate |
| Database connection pool > 80% | Medium | Investigate |
| Disk usage > 80% | Medium | Plan expansion |
| SSL certificate expiring < 14 days | Medium | Renew |
| Backup failure | High | Investigate immediately |

### Logging

- Structured JSON logs via **Pino** (ADR-015); request-scoped logging in Nest
- Sensitive fields redacted (R1 hardening)
- Log retention / shipping to an aggregator: **prep** under `infrastructure/logging/` — not a live cloud sink in-repo
- Request ID in every log entry for correlation when configured
- Log levels: `error` and `warn` in production; `debug` in development only

### Sentry

- `@sentry/node` initialized from `SENTRY_DSN` when set
- Errors only in Phase 1 (no performance tracing required)
- Local development typically leaves `SENTRY_DSN` unset
---

## Backup Strategy

> **R3-12:** Targets for when cloud staging/production are provisioned. Repository prep lives under `infrastructure/` (DR docs/templates). No automated cloud backup/DR drills are run from this monorepo today.

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| PostgreSQL | Automated managed backup + WAL archiving | Continuous WAL, daily full | 30 days daily, 12 months monthly |
| Redis | RDB snapshots (cache data, acceptable loss) | Daily | 7 days |
| Object storage | Provider-native replication | Continuous | Indefinite (lifecycle policies) |
| Configuration | Version-controlled in git | Every change | Indefinite |

### Recovery Testing

- Monthly: Restore database backup to staging environment (when staging exists)
- Quarterly: Full disaster recovery drill (restore DB, deploy app, verify data integrity)
- Document recovery time in post-drill report

---

## SSL/TLS

> **R3-12:** Target controls for deployed environments. Local Docker Compose uses HTTP.

- All deployed environments use HTTPS (TLS 1.2+)
- Certificates managed by Cloudflare (DNS proxy) or Let's Encrypt (origin)
- HSTS enabled with `max-age=31536000; includeSubDomains`
- Certificate auto-renewal configured
---

## Domain and DNS

| Domain | Purpose |
|--------|---------|
| `app.eventos.app` | Production web application |
| `api.eventos.app` | Production API (or same origin with `/api` path) |
| `staging.eventos.app` | Staging environment |
| `*.eventos.app` | Future tenant subdomains (Phase 6) |

---

## Release Process

### Versioning

Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Breaking API change | MAJOR | 2.0.0 |
| New feature/module | MINOR | 1.3.0 |
| Bug fix | PATCH | 1.3.1 |

### Release Checklist

- [ ] All tests pass on main
- [ ] Staging UAT completed (for feature releases)
- [ ] Database migrations tested on staging
- [ ] CHANGELOG updated
- [ ] Release tag created (`v1.3.0`)
- [ ] Production deployment triggered
- [ ] Smoke tests pass
- [ ] Monitoring dashboards checked (15 minutes post-deploy)
- [ ] We Decor notified of significant changes

---

## Related Documents

| Document | Topic |
|----------|-------|
| [05-system-architecture.md](./05-system-architecture.md) | System components deployed |
| [07-database-philosophy.md](./07-database-philosophy.md) | Migration strategy |
| [14-security-principles.md](./14-security-principles.md) | Infrastructure security |
| [19-development-workflow.md](./19-development-workflow.md) | Development to deployment flow |
| [20-definition-of-done.md](./20-definition-of-done.md) | Deployment in DoD |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
