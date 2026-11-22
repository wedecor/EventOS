# Event OS — Production Deployment Checklist (R5-02)

Use this checklist during **R5-03 Production Deployment**.  
Repository preparation only — checkboxes are for the operator executing the deploy.

---

## A. Preconditions

- [ ] Backend `1.0.0-rc1` approved; Frontend `1.0.0-rc1` approved
- [ ] OpenAPI freeze intact (`openapi.v1.json` matches export)
- [ ] Staging environment smoke passed (docs/16: no direct-to-prod without staging)
- [ ] Founders aware of intentional Phase 1 UI gaps (R5-01)
- [ ] On-call / founder contact available during deploy window (business hours)

---

## B. Secrets & environment

- [ ] Production secrets stored in secret manager (not git)
- [ ] `infrastructure/production/.env.production` filled locally for validation only (gitignored)
- [ ] `./infrastructure/production/validate-production-env.sh` passes
- [ ] `JWT_SECRET` unique to production (≥ 32 chars); not reused from staging/dev
- [ ] `CORS_ORIGIN` = exact HTTPS Admin Portal origin(s)
- [ ] `DATABASE_URL` uses TLS (`sslmode=require` or provider equivalent)
- [ ] Redis password set on managed Redis
- [ ] `SENTRY_DSN` set **or** explicitly deferred with founder acknowledgement

### Frontend build env

- [ ] `NEXT_PUBLIC_API_BASE_URL=https://api.<prod-domain>` (no trailing slash)
- [ ] No `localhost` values baked into static export

---

## C. Database setup

- [ ] Managed PostgreSQL provisioned (production size / AZ as agreed)
- [ ] Automated backups + WAL / PITR enabled (RPO target &lt; 1h)
- [ ] Pre-migration backup verified restorable (or snapshot taken)
- [ ] From `apps/api` with production `DATABASE_URL`:  
      `pnpm exec prisma migrate deploy`
- [ ] Confirm migration history applied (no pending migrations)
- [ ] **Do not** run `prisma db seed` with demo `SEED_ADMIN_PASSWORD` on production
- [ ] Bootstrap We Decor tenant + owner accounts via controlled ops procedure

---

## D. Redis

- [ ] Managed Redis provisioned
- [ ] `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` wired to API
- [ ] Network access restricted to API host / VPC

---

## E. Backend deployment

- [ ] Build image: `docker build -t eventos-api:<version> apps/api`
- [ ] Push to registry (operator) and pull on production host
- [ ] Inject production env from secret manager (not compose defaults)
- [ ] Do **not** use `infrastructure/docker/docker-compose.yml` for production
- [ ] Start API (`NODE_ENV=production`, `PORT=4000`)
- [ ] `GET /health` → `{ "status": "ok" }` (or equivalent envelope)
- [ ] `GET /health/ready` → HTTP **200** with JSON `status === "ok"` for postgres + redis
- [ ] Confirm `GET /health/ready` returns HTTP **503** when a dependency is down (orchestrator fail-closed)
- [ ] Confirm `/docs` is **not** exposed
- [ ] Confirm structured JSON logs on stdout; log shipping attached (R2-07)

---

## F. Frontend deployment

- [ ] `cd apps/web && NEXT_PUBLIC_API_BASE_URL=https://api… pnpm build`
- [ ] Deploy `apps/web/out/` to static host / object storage + CDN
- [ ] Configure SPA fallback (`404.html` / rewrite to index as required by host)
- [ ] HTTPS on `app.eventos.app` (or chosen domain)
- [ ] CDN cache policy: HTML short TTL / immutable `_next/static` long TTL

---

## G. Networking / TLS / CORS / cookies

- [ ] Cloudflare (or equivalent) DNS + TLS for portal and API
- [ ] Origin firewall: only edge → API; DB/Redis not public
- [ ] CORS allows portal origin with `credentials: true`
- [ ] Browser login sets `refresh_token` cookie: HttpOnly, Secure, SameSite=Strict, path `/api/v1/auth`
- [ ] Refresh and logout clear/rotate cookie successfully
- [ ] HSTS enabled at edge (docs/16)

---

## H. Monitoring & backups

- [ ] Liveness probe every ~30s on `/health`
- [ ] Readiness probe every ~30s on `/health/ready` asserting body `status === "ok"`
- [ ] Error-rate / latency alerts configured (or documented deferral)
- [ ] Sentry receiving events (if DSN set)
- [ ] Postgres backup failure alert enabled
- [ ] DR runbook reviewed: `infrastructure/disaster-recovery/disaster-recovery-runbook.md`

---

## I. Smoke tests (post-deploy)

- [ ] Portal loads over HTTPS
- [ ] Login as owner succeeds
- [ ] Dashboard KPIs load
- [ ] Create/read one lead (or known seed-safe fixture)
- [ ] Refresh browser session (cookie refresh) without re-login prompt storm
- [ ] Logout clears session
- [ ] Role without permission receives 403 on a protected API call
- [ ] `/health/ready` still `ok` after smoke

---

## J. Rollback procedure

| Failure | Action |
|---------|--------|
| Bad API image / crash loop | Redeploy previous image tag; keep DB as-is if migrations compatible |
| Failed migration mid-deploy | Stop traffic; restore Postgres from pre-migration backup; redeploy previous API |
| Bad frontend bake (wrong API URL) | Rebuild `out/` with correct `NEXT_PUBLIC_*`; redeploy static; invalidate CDN |
| Auth/CORS cookie failure | Fix `CORS_ORIGIN` / HTTPS / cookie path; no DB rollback needed |
| Data corruption | Follow DR runbook; founder approval required |

Rollback smoke: `/health` + `/health/ready` + login.

---

## K. Sign-off gates (after successful deploy)

- [ ] R5-03 deploy complete
- [ ] R5-04 Live Founder UAT executed
- [ ] R5-05 Founder sign-off obtained
- [ ] R5-06 Tag `v1.0.0` and declare production go-live

Until K is complete, treat the environment as **deployed RC**, not Phase 1 v1.0.0.
