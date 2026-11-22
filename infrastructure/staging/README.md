# Event OS — Staging Environment (Repository Preparation)

> **R2-05 scope:** repository-side staging preparation only.
> This directory does **not** create cloud resources, configure a provider, publish
> images, or deploy anything. It documents what staging must look like and how to
> prepare configuration reproducibly before a human/operator provisions infrastructure
> (later backlog tasks).

Authoritative references:

- [docs/16-deployment-strategy.md](../../docs/16-deployment-strategy.md) — environments, env vars, health checks, migration rules
- [docs/14-security-principles.md](../../docs/14-security-principles.md) — secrets, CORS, session cookies
- [apps/api/Dockerfile](../../apps/api/Dockerfile) — R2-01 production image
- [infrastructure/docker/docker-compose.yml](../docker/docker-compose.yml) — local stack (dev only; not staging)
- [infrastructure/logging/README.md](../logging/README.md) — R2-07 structured JSON log shipping preparation
- [infrastructure/monitoring/README.md](../monitoring/README.md) — R2-08 dashboards & alert preparation
- [infrastructure/storage/README.md](../storage/README.md) — R2-09 object storage preparation
- [infrastructure/disaster-recovery/README.md](../disaster-recovery/README.md) — R2-10 backup & DR preparation

---

## Target staging topology (docs/16)

```
Internet → TLS terminator / CDN (e.g. Cloudflare)
                ↓
         App host (Node.js 22) — API container on port 4000
                ↓
   ┌────────────┼────────────┐
   ▼            ▼            ▼
Managed      Managed      S3-compatible
PostgreSQL    Redis       object storage
```

| Component | Staging requirement | Notes |
|-----------|---------------------|-------|
| **API** | Container from `apps/api/Dockerfile` | `NODE_ENV=staging`, listen `PORT=4000` |
| **PostgreSQL** | Managed instance | Migrations via `pnpm exec prisma migrate deploy` **before** traffic |
| **Redis** | Managed instance | Login throttle, cache, BullMQ |
| **Object storage** | S3-compatible bucket | Receipts/proofs — **prep documented in R2-09**; app SDK/upload wiring later |
| **Secrets** | Secret manager / encrypted env | Never commit real values; never bake into images |
| **DNS** | `staging.eventos.app` (docs/16) | Provider-specific; out of scope here |
| **TLS** | HTTPS terminated at edge | Out of scope here |

---

## Monitoring endpoints (already implemented)

| Endpoint | Purpose | Staging probe |
|----------|---------|---------------|
| `GET /health` | Liveness — process up | Every ~30s (docs/16) |
| `GET /health/ready` | Readiness — PostgreSQL + Redis | Every ~30s (docs/16) |
| `GET /docs` | Swagger UI | Optional; restrict in locked-down staging if desired |

A staging host is considered **ready for UAT smoke** only when `/health/ready` returns success after migrations.

---

## Environment variables

Copy the template (never commit the filled file):

```bash
cp infrastructure/staging/.env.staging.example infrastructure/staging/.env.staging
# Fill values from the secret manager / operator vault.
```

### Currently required to boot the API

These are validated by `apps/api` `env.schema` when `NODE_ENV=staging`:

| Variable | Rules |
|----------|--------|
| `NODE_ENV` | Must be `staging` |
| `PORT` | Prefer `4000` (docs/16) |
| `DATABASE_URL` | Managed Postgres connection string |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Managed Redis (app does **not** use `REDIS_URL` today) |
| `JWT_SECRET` | ≥ 32 characters |
| `CORS_ORIGIN` | Explicit non-wildcard origin(s), e.g. `https://staging.eventos.app` (app uses `CORS_ORIGIN`, not `CORS_ORIGINS`) |
| `LOG_LEVEL` | Prefer `info` or `warn` |

### Optional / partially wired

| Variable | Purpose | Status |
|----------|---------|--------|
| `SENTRY_DSN` | Error tracking (R2-06) | Optional in `env.schema`; Sentry initializes only when a valid HTTPS DSN is set (staging template placeholders with `REPLACE` are ignored) |
| `STORAGE_ENDPOINT` / `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` / `STORAGE_BUCKET` | Object storage (R2-09) | Documented in [`infrastructure/storage`](../storage/README.md); **not** validated by `env.schema` yet (no SDK/upload in app) |

### Documented for staging readiness (docs/16) — not yet consumed by bootstrap

Keep placeholders in `.env.staging.example` so operators provision secrets early. Remaining wiring lands in later backlog items:

| Variable | Purpose |
|----------|---------|
| `APP_URL` | Public staging URL (email links, redirects) |
| `AI_PROVIDER_API_KEY` | AI provider |
| `EMAIL_API_KEY` | Transactional email |
| `JWT_REFRESH_SECRET` | Documented in docs/16; Phase 1 refresh tokens use hashed cookies + `JWT_SECRET` for access tokens — do not invent a second signer until an ADR says so |

---

## Operator checklist (manual provisioning — later)

When an operator provisions real staging (outside this repo task):

1. [ ] Create managed PostgreSQL + Redis + object-storage bucket
2. [ ] Store secrets in a secret manager (not git)
3. [ ] Fill `.env.staging` from the example template (local operator machine only)
4. [ ] Build image: `docker build -t eventos-api:staging apps/api`
5. [ ] Run migrations against **staging** DB: `pnpm exec prisma migrate deploy` (with staging `DATABASE_URL`)
6. [ ] Start API container with staging env (compose override or orchestrator — provider-specific)
7. [ ] Verify `GET https://staging…/health` and `/health/ready`
8. [ ] Confirm CORS allows only the staging web origin
9. [ ] Confirm refresh cookies are `Secure` + `SameSite=Strict` (R1-07)
10. [ ] Attach log shipping (R2-07) and monitoring probes/alerts (R2-08) per `infrastructure/logging` and `infrastructure/monitoring`
11. [ ] Provision private S3-compatible bucket + secrets per `infrastructure/storage` (R2-09 prep)
12. [ ] Confirm managed Postgres/Redis backup posture and schedule DR drills per `infrastructure/disaster-recovery` (R2-10 prep)

This repository does **not** automate steps 1–2 or 6–9.

---

## Local validation helpers

Validate that a filled env file contains the **currently required** boot keys (no network calls):

```bash
./infrastructure/staging/validate-staging-env.sh infrastructure/staging/.env.staging
```

Print the non-destructive deploy preparation steps:

```bash
./infrastructure/staging/prepare-staging-deploy.sh
```

---

## Documentation drift (intentional)

| docs/16 name | Current API | Staging template |
|--------------|-------------|------------------|
| `CORS_ORIGINS` | `CORS_ORIGIN` | Uses `CORS_ORIGIN` |
| `REDIS_URL` | `REDIS_HOST` + `REDIS_PORT` (+ optional password) | Uses host/port/password |
| `JWT_REFRESH_SECRET` | Not used | Listed as future / docs-only |
| Node 20 in Dockerfile snippet | Node 22 image (R2-01) | Node 22 |

Do not “fix” docs/16 in this task; report drift and keep the running app’s names authoritative for boot.
