# Event OS — Production Environment (Repository Preparation)

> **R5-02 scope:** repository-side production deployment preparation.
> This directory does **not** provision cloud resources, publish images, configure
> DNS/TLS, or deploy traffic. It documents topology, env contracts, and operator
> checklists so a human can execute **R5-03 Production Deployment** safely.

Authoritative references:

- [docs/16-deployment-strategy.md](../../docs/16-deployment-strategy.md)
- [docs/14-security-principles.md](../../docs/14-security-principles.md)
- [apps/api/Dockerfile](../../apps/api/Dockerfile)
- [infrastructure/docker/docker-compose.yml](../docker/docker-compose.yml) — **local only**; not production
- [infrastructure/staging/README.md](../staging/README.md) — staging mirror; production must go through staging first
- [infrastructure/logging/README.md](../logging/README.md)
- [infrastructure/monitoring/README.md](../monitoring/README.md)
- [infrastructure/disaster-recovery/README.md](../disaster-recovery/README.md)

---

## Target production topology (docs/16 Phase 1)

```
Internet → Cloudflare (DNS + CDN + TLS)
                ↓
   ┌────────────┴────────────┐
   ▼                         ▼
Static Admin Portal      API container
(apps/web `out/`)        (PORT 4000)
app.eventos.app          api.eventos.app
   │                         │
   │         ┌───────────────┼───────────────┐
   │         ▼               ▼               ▼
   │   Managed Postgres  Managed Redis   Object storage (prep)
   └──────── CORS + cookie credentials (HTTPS)
```

| Component | Production requirement | Notes |
|-----------|------------------------|-------|
| **API** | Image from `apps/api/Dockerfile` | `NODE_ENV=production`, `PORT=4000` |
| **Admin Portal** | Static files from `apps/web` `pnpm build` → `out/` | Bake `NEXT_PUBLIC_API_BASE_URL` at build time |
| **PostgreSQL** | Managed + automated backups | `prisma migrate deploy` **before** traffic |
| **Redis** | Managed | Login throttle, cache, BullMQ |
| **Object storage** | Private bucket | Prep only; upload SDK later |
| **Secrets** | Secret manager | Never commit; never bake into images |
| **TLS** | Edge HTTPS (Cloudflare / LE) | Refresh cookies require Secure tier |
| **Compose** | Do **not** use local compose in prod | Weak default passwords; published DB ports |

---

## Environment variables

```bash
cp infrastructure/production/.env.production.example infrastructure/production/.env.production
# Fill from secret manager — never commit .env.production
./infrastructure/production/validate-production-env.sh
```

### Required for API boot (`env.schema`, `NODE_ENV=production`)

| Variable | Rules |
|----------|--------|
| `NODE_ENV` | Must be `production` |
| `PORT` | Prefer `4000` |
| `DATABASE_URL` | Managed Postgres; prefer `sslmode=require` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Managed Redis |
| `JWT_SECRET` | ≥ 32 characters; unique to production |
| `CORS_ORIGIN` | Explicit HTTPS Admin Portal origin(s); **no `*`** |
| `LOG_LEVEL` | Prefer `info` or `warn` |

### Frontend (build-time)

| Variable | Rules |
|----------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | Absolute HTTPS API origin (no trailing slash), e.g. `https://api.eventos.app` |
| `NEXT_PUBLIC_APP_NAME` | Optional display name |

These are **inlined into the static bundle**. Rebuild the portal after any API URL change.

### Optional

| Variable | Status |
|----------|--------|
| `SENTRY_DSN` | Wired; enable when project exists |
| `STORAGE_*` / `EMAIL_*` / `AI_*` / `APP_URL` | Documented; not required by current schema |

---

## Migrations & seed

| Action | Production rule |
|--------|-----------------|
| `pnpm exec prisma migrate deploy` | **Required** before new API traffic |
| `prisma migrate dev` / `db push` / `migrate reset` | **Forbidden** |
| `prisma db seed` | **Do not** run against production with demo passwords. Create the We Decor tenant/admin via controlled ops procedure only |

---

## Health probes

| Endpoint | Purpose | Gate |
|----------|---------|------|
| `GET /health` | Liveness | Process up |
| `GET /health/ready` | Postgres + Redis | Assert JSON `status === "ok"` (HTTP may still be 200 when degraded — docs/16 R3-14) |

Swagger (`/docs`) is **disabled** when `NODE_ENV=production`.

---

## Security gates (must verify after deploy)

1. HTTPS on Admin Portal and API
2. `CORS_ORIGIN` matches portal origin only
3. Refresh cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, path `/api/v1/auth`
4. Login → refresh → logout over HTTPS with `withCredentials`
5. No Swagger UI on production API
6. Logs are JSON; secrets redacted
7. Managed Postgres/Redis backups enabled; DR runbook known

---

## Related scripts

```bash
./infrastructure/production/validate-production-env.sh
./infrastructure/production/prepare-production-deploy.sh
```

Full operator checklist: [production-deployment-checklist.md](./production-deployment-checklist.md)
