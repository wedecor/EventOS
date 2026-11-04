#!/usr/bin/env bash
# R2-05 — print reproducible staging deploy *preparation* steps.
# Does NOT create cloud resources, publish images, or start remote services.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cat <<EOF
Event OS — staging deploy preparation (repository-side only)

Working tree: $ROOT

1. Secrets
   - Copy template:
       cp infrastructure/staging/.env.staging.example infrastructure/staging/.env.staging
   - Fill values from the secret manager (never commit .env.staging).
   - Validate boot keys:
       ./infrastructure/staging/validate-staging-env.sh

2. Quality gates (same as CI)
   - cd apps/api && pnpm install --frozen-lockfile
   - pnpm prisma:generate && pnpm lint && pnpm build && pnpm test && pnpm test:cov

3. Image (local build only — no registry push in R2-05)
   - docker build -t eventos-api:staging apps/api

4. Database (against the *staging* DATABASE_URL from .env.staging)
   - Load staging secrets into the shell carefully (do not naively xargs URLs with '&').
     Example: use your secret manager's CLI, or `set -a; source <(grep -v '^#' .env.staging | sed 's/^/export /'); set +a`
     only if values are properly quoted.
   - cd apps/api && pnpm exec prisma migrate deploy
   - Never use prisma migrate-dev / migrate-reset / db-push on staging

5. Runtime smoke (after an operator starts the container on staging host)
   - GET /health
   - GET /health/ready
   - Confirm NODE_ENV=staging, Secure refresh cookies, non-wildcard CORS

Out of scope here: cloud provisioning, DNS, TLS, image publish, orchestrator config.
See infrastructure/staging/README.md for the full checklist.
EOF
