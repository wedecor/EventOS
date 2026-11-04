# Event OS — R5-02 Production Deployment Preparation Report

| Field | Value |
|-------|-------|
| **Task** | R5-02 — Production Deployment Preparation |
| **Date** | 2026-07-13 |
| **Backend** | `1.0.0-rc1` |
| **Frontend** | `1.0.0-rc1` |
| **Scope** | Infrastructure / environment / go-live readiness — **no business features** |
| **Authority** | docs/16, docs/14, R2-* infrastructure prep, F1-16/F1-17 RC |

---

## 1. Executive Summary

Event OS Phase 1 is **repository-ready for production deployment preparation**. The API has a multi-stage production Dockerfile, validated env schema (strict CORS + JWT), liveness/readiness probes, Secure refresh cookies on staging/production, Prisma migrations, structured JSON logging with redaction, and optional Sentry. The Admin Portal builds as a static export with bake-time `NEXT_PUBLIC_API_BASE_URL`.

**Cloud provisioning, DNS/TLS, registry push, and live deploy are operator work (R5-03)** — not automated in-repo. Staging must precede production (docs/16). Founder live UAT / sign-off remain separate gates (R5-04 / R5-05).

**This milestone added:** `infrastructure/production/` (env template, validate/prepare scripts, full deployment checklist) and a Dockerfile HEALTHCHECK fix (alpine has no `wget`).

**Verdict: READY WITH MINOR ACTIONS** — confidence **78%**.

---

## 2. Deployment Readiness Assessment

| Area | Status | Evidence |
|------|--------|----------|
| Backend image | **Ready** | `apps/api/Dockerfile` multi-stage Node 22; `docker build -t eventos-api:r5-02-check apps/api` **passed** |
| Frontend artifact | **Ready** | `NEXT_PUBLIC_API_BASE_URL=https://api.eventos.app pnpm build` **passed** (static `out/`) |
| Env contract | **Ready** | `env.schema.ts` + production template + validator |
| Local compose | **Dev only** | Must not be used for production (default passwords, published DB ports) |
| Health probes | **Ready** | `GET /health`, `GET /health/ready` (assert body `status === "ok"`) |
| Migrations | **Ready** | `prisma migrate deploy` (CI validates on main) |
| Seed | **Ops caution** | Never demo-seed production |
| CI | **Partial** | Main CI builds image; **no** registry push / cloud deploy |
| Staging gate | **Operator** | `infrastructure/staging/` prep exists; live staging not verified here |
| Production secrets/host | **Operator** | Required before R5-03 |
| HTTPS / CDN | **Operator** | Documented; not provisioned in-repo |
| Backups / DR | **Prep ready** | Runbooks under `infrastructure/disaster-recovery/` |
| Monitoring / logs | **Prep ready** | Specs under `infrastructure/monitoring` + `logging` |
| Founder UAT | **Pending** | R5-01 blocked; not a code blocker for deploy prep |

---

## 3. Infrastructure Review

### Topology (docs/16 Phase 1)

```
Cloudflare (DNS + CDN + TLS)
    → Static Admin Portal (apps/web out/) @ app.eventos.app
    → API container PORT 4000 @ api.eventos.app
         → Managed PostgreSQL
         → Managed Redis
         → Object storage (prep only)
```

### What exists in-repo

| Asset | Role |
|-------|------|
| `apps/api/Dockerfile` | Production API image |
| `infrastructure/docker/docker-compose.yml` | **Local** Postgres 16 + Redis 7 + API |
| `infrastructure/staging/` | Staging env prep (R2-05) |
| `infrastructure/production/` | **New (R5-02)** production env + checklist |
| `infrastructure/logging/` | JSON log shipping prep |
| `infrastructure/monitoring/` | Probe/alert specs |
| `infrastructure/disaster-recovery/` | Backup / restore / DR runbooks |
| `infrastructure/storage/` | Object-storage prep |
| `.github/workflows/main-branch.yml` | Lint/test/e2e/migrate/docker build |

### Gaps (expected / operator)

- No production docker-compose (intentional — managed services)
- No web Dockerfile (intentional — static export)
- No automated production CD / registry publish
- No live Cloudflare / managed DB / Redis in this task
- Readiness returns HTTP 200 even when `status: "degraded"` — probes must check JSON body (docs/16 R3-14)

---

## 4. Environment Variables Review

### API — required (`apps/api` `env.schema.ts`)

| Variable | Production rule |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `PORT` | Prefer `4000` |
| `LOG_LEVEL` | `info` / `warn` |
| `CORS_ORIGIN` | Explicit HTTPS portal origin(s); **no `*`** |
| `DATABASE_URL` | Managed Postgres; prefer `sslmode=require` |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Managed Redis |
| `JWT_SECRET` | ≥ 32 chars; unique to production |

### API — optional

| Variable | Notes |
|----------|-------|
| `SENTRY_DSN` | Wired (R2-06); enable when project exists |
| `STORAGE_*` / `EMAIL_*` / `AI_*` / `APP_URL` | Documented; not boot-validated |

### Frontend — build-time (`apps/web`)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Absolute HTTPS API URL; **baked into static bundle** |
| `NEXT_PUBLIC_APP_NAME` | Optional |

### Templates

| File | Purpose |
|------|---------|
| `apps/api/.env.example` | Local development |
| `apps/web/.env.example` | Local web (defaults `localhost:3000`) |
| `infrastructure/staging/.env.staging.example` | Staging |
| `infrastructure/production/.env.production.example` | **Production (R5-02)** |

**Port note:** Local API default `PORT=3000`; compose/container use `4000`. Production should use `4000` behind TLS terminator. Web must point `NEXT_PUBLIC_API_BASE_URL` at the **public** API HTTPS origin.

---

## 5. Docker Review

### Dockerfile (`apps/api/Dockerfile`)

| Check | Result |
|-------|--------|
| Multi-stage build | Pass |
| Node 22 Alpine | Pass |
| Non-root user `eventos` | Pass |
| Prisma client in image | Pass |
| `NODE_ENV=production` default | Pass |
| Entrypoint `node dist/src/main.js` | Pass |
| HEALTHCHECK | **Fixed in R5-02** — was `wget` (missing on alpine); now Node `fetch` (matches compose) |
| Image build | **Validated** this session |

### Compose (`infrastructure/docker/docker-compose.yml`)

| Check | Result |
|-------|--------|
| Postgres 16 + Redis 7 + healthchecks | Pass (local) |
| API depends_on healthy deps | Pass |
| Default passwords / published ports | **Dev only — forbid in production** |
| CORS / JWT via env | Present; production must override from secrets |

---

## 6. Security Review

| Control | Status |
|---------|--------|
| Helmet + compression | Enabled in `main.ts` |
| CORS credentials + explicit origins in prod | Enforced by `env.schema` |
| Swagger disabled in production | Pass |
| JWT_SECRET min 32 | Pass |
| Refresh cookie HttpOnly | Always |
| Refresh cookie Secure + SameSite=Strict | Staging + production |
| Cookie path `/api/v1/auth` | Pass |
| Frontend `withCredentials` | Pass |
| Log redaction (Authorization, Cookie, Set-Cookie) | Pass |
| Secrets not baked into images | Pass (runtime env) |
| Compose JWT default | Weak placeholder — override via `${JWT_SECRET}` |

**Production must verify over HTTPS:** login → cookie flags → refresh → logout.

---

## 7. Production Checklist

Canonical operator checklist:

**[`infrastructure/production/production-deployment-checklist.md`](infrastructure/production/production-deployment-checklist.md)**

Summary:

1. Preconditions (RC approved, staging smoke, on-call)
2. Secrets + `validate-production-env.sh`
3. Managed Postgres backup → `prisma migrate deploy` (no demo seed)
4. Managed Redis
5. Deploy API image + health/ready gates
6. Build & deploy static `out/` with production `NEXT_PUBLIC_API_BASE_URL`
7. TLS / CORS / cookie verification
8. Monitoring + backup alerts
9. Smoke tests
10. Documented rollback (previous image / CDN / DB restore)

Helper scripts:

- `./infrastructure/production/validate-production-env.sh`
- `./infrastructure/production/prepare-production-deploy.sh`

---

## 8. Risks

### Critical

None in repository artifacts after HEALTHCHECK fix.

### High

| ID | Risk | Mitigation |
|----|------|------------|
| R-H1 | Production cloud stack not provisioned | Operator completes R5-03 using checklist |
| R-H2 | Deploying without staging smoke (docs/16 violation) | Require staging pass before prod |
| R-H3 | Demo `prisma db seed` on production | Checklist forbids; controlled admin bootstrap only |

### Medium

| ID | Risk | Mitigation |
|----|------|------------|
| R-M1 | `/health/ready` HTTP 200 when degraded | Probe asserts JSON `status === "ok"` |
| R-M2 | Wrong `NEXT_PUBLIC_API_BASE_URL` baked into static site | Rebuild portal; CDN invalidate |
| R-M3 | No automated CD / registry push | Manual R5-03; keep previous image tagged |
| R-M4 | Cross-origin cookie/CORS misconfig (portal ≠ API host) | Same registrable domain + exact CORS + HTTPS |
| R-M5 | Founder UAT incomplete | Hold v1.0.0 tag until R5-04/R5-05 |

### Low

| ID | Risk | Mitigation |
|----|------|------------|
| R-L1 | Local `.env.example` ports differ from compose | Documented; production uses 4000 + HTTPS URLs |
| R-L2 | STORAGE/EMAIL/AI placeholders unused | Phase 1 OK; provision when features need them |
| R-L3 | Sentry optional | Enable when DSN ready |

---

## 9. Deployment Verdict

### **READY WITH MINOR ACTIONS**

**Confidence: 78%**

| Ready now | Minor actions before/during R5-03 |
|-----------|-----------------------------------|
| API Docker image builds | Provision managed Postgres/Redis + secrets |
| Frontend static export builds | Set production CORS + JWT + HTTPS domains |
| Env validation tooling | Run staging smoke first |
| Migrations + health probes | Deploy API + web per checklist |
| Security controls in code | Verify cookies/CORS live; enable backups/monitoring |
| Production checklist & templates | Do not seed production with demo passwords |

Not **READY FOR DEPLOYMENT** (absolute) because cloud/DNS/TLS/secrets are outside the repository and must be completed by an operator. Not **NOT READY** because no Critical product/infra code blockers remain for a prepared operator.

---

## 10. Next Steps

If this report is accepted:

1. **R5-03 — Production Deployment** (execute checklist; provision + deploy)
2. **R5-04 — Live Founder Acceptance Testing**
3. **R5-05 — Founder Sign-off**
4. **R5-06 — Event OS v1.0.0 Production Release** (tag + go-live)

Immediate operator actions:

1. Copy and fill `infrastructure/production/.env.production` from secret manager  
2. Validate with `./infrastructure/production/validate-production-env.sh`  
3. Confirm staging mirror exists and passes smoke  
4. Schedule R5-03 deploy window (business hours)

---

## Appendix A — Changes in this milestone

| Path | Change |
|------|--------|
| `apps/api/Dockerfile` | HEALTHCHECK: `wget` → Node `fetch` |
| `infrastructure/production/.env.production.example` | New |
| `infrastructure/production/README.md` | New |
| `infrastructure/production/validate-production-env.sh` | New |
| `infrastructure/production/prepare-production-deploy.sh` | New |
| `infrastructure/production/production-deployment-checklist.md` | New |
| `EventOS-R5-02-Production-Deployment-Preparation-Report.md` | This report |

**No business features, API expansions, or business-rule changes.**

---

## Appendix B — Validation executed (2026-07-13)

| Check | Result |
|-------|--------|
| Frontend `pnpm build` with production API URL | Pass |
| `docker build -t eventos-api:r5-02-check apps/api` | Pass |
| `validate-production-env.sh` on unfilled example | Fail as expected (placeholders) |
| `prepare-production-deploy.sh` | Prints steps |

---

*Report owner: Founding Engineering*  
*2026-07-13*
