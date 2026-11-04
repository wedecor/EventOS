#!/usr/bin/env bash
# R5-02 — print reproducible production deploy *preparation* steps.
# Does NOT create cloud resources, publish images, or start remote services.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cat <<EOF
Event OS — production deploy preparation (repository-side only)

Working tree: $ROOT

0. Gate (docs/16)
   - Staging must mirror production config and pass smoke before production.
   - Founder live UAT (R5-04) may run on staging or production; joint sign-off (R5-05)
     is required before declaring Phase 1 v1.0.0 go-live.

1. Secrets
   - cp infrastructure/production/.env.production.example infrastructure/production/.env.production
   - Fill from secret manager (never commit).
   - ./infrastructure/production/validate-production-env.sh

2. Quality gates
   - Backend: cd apps/api && pnpm install --frozen-lockfile && pnpm build && pnpm test
   - Frontend: cd apps/web && NEXT_PUBLIC_API_BASE_URL=https://api.eventos.app pnpm validate
   - Main CI on release commit must be green

3. Images / artifacts
   - docker build -t eventos-api:1.0.0-rc1 apps/api
   - Tag for registry when operator is ready (R5-03): eventos-api:1.0.0-rc1
   - Frontend: static export out/ (no Docker required)

4. Database (production DATABASE_URL only)
   - Backup managed Postgres first
   - cd apps/api && pnpm exec prisma migrate deploy
   - NEVER migrate-dev / migrate-reset / db-push / seed with demo passwords on production

5. Runtime smoke (after operator starts services)
   - GET https://api…/health
   - GET https://api…/health/ready  → body status === "ok"
   - Confirm Swagger /docs returns 404/disabled
   - Confirm Secure refresh cookies + CORS + HTTPS portal login

6. Rollback
   - Redeploy previous API image tag
   - Restore DB from managed backup only if migration/data corruption (DR runbook)
   - Redeploy previous web out/ artifact / CDN invalidation

Full checklist: infrastructure/production/production-deployment-checklist.md
EOF
