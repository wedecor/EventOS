# M2 live E2E artifacts (local only)

This directory is gitignored for generated binaries (traces, HTML reports, screenshots).

Regenerate after a live run:

```bash
cd apps/web
set -a; source ../api/.env.e2e; set +a
E2E_BASE_URL=http://localhost:3101 \
E2E_API_BASE_URL=http://localhost:3100 \
E2E_ADMIN_EMAIL=admin@wedecor.events \
E2E_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
E2E_TRACE=1 \
pnpm exec playwright test
```

See `docs/release/M2_LIVE_E2E_VALIDATION_REPORT.md` for the validation narrative.
