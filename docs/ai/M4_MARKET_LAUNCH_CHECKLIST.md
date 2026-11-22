# M4 — Market Launch Checklist

| Field | Value |
|-------|-------|
| **Date** | 2026-11-21 |
| **Scope** | Ship EventOS with optional Lead Intelligence (read-only) |
| **Not in scope** | Multi-tenant SaaS, Quotation Assistant, full LLMOps |

## A. Product already validated (test-adapter)

| Item | Status |
|------|--------|
| M2 core workflow E2E | Pass (checkpoint 2026-11-21) |
| M3 integration E2E | Pass |
| M4 authz / mutate-safety / Admin UI | Pass (5/5) |
| `ai_executions` metadata persistence | Implemented (E2E DB only so far) |
| AI usage rate limits (Redis) | Implemented — defaults 30/user/hr, 200/tenant/hr |
| Read-only UX copy | Hardened on Lead Intelligence panel |

## B. Must complete before AI-featured market launch

| # | Item | Owner action | Status |
|---|------|--------------|--------|
| 1 | **Live OpenAI smoke** | Set `AI_PROVIDER=openai` + `AI_API_KEY` (server only). Run `pnpm exec tsx scripts/ai-live-smoke.ts` against non-prod. | **Blocked** until key available |
| 2 | **Commit & tag release** | Review dirty tree; commit M4-AI.1 + foundation; tag RC | Pending explicit commit request |
| 3 | **Production migrations** | Apply `ai_executions` (+ foundation) to prod with backup/rollback plan — **not** from agent without approval | Pending human ops |
| 4 | **Prod secrets** | Configure `AI_*`, Redis, JWT, CORS (no wildcard), SMTP/storage as needed | Pending ops |
| 5 | **Host static `out/` + API** | HTTPS, health checks, CORS to real Admin origin, bake `NEXT_PUBLIC_API_BASE_URL` at build | Pending ops |
| 6 | **Pricing env (optional)** | Set `AI_INPUT_PRICE_PER_1M` / `AI_OUTPUT_PRICE_PER_1M` for cost estimates | Optional |
| 7 | **Monitor spend** | Query `ai_executions` by day/feature; alert on failure spikes / cost | Ops runbook below |

## C. Safe market positioning until B is green

Ship as **operations software** with **AI preview / advisory** (permission `ai:use`):

- Lead Intelligence does **not** write lead, quotation, email, or payment records.
- Unknown fields stay blank; staff must confirm before acting.
- Disable AI in prod with `AI_PROVIDER=none` if live smoke is not done.

## D. Ops: AI execution visibility (no LLMOps platform)

```sql
-- Daily success/failure and rough token spend (tenant-scoped)
SELECT date_trunc('day', created_at) AS day,
       feature,
       status,
       COUNT(*) AS runs,
       SUM(total_tokens) AS tokens,
       SUM(estimated_cost_usd) AS est_usd
FROM ai_executions
WHERE tenant_id = $1
  AND created_at > now() - interval '14 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2, 3;
```

Tune caps via env (no redeploy of policy code required for values):

- `AI_RATE_LIMIT_PER_USER_PER_HOUR` (default `30`)
- `AI_RATE_LIMIT_PER_TENANT_PER_HOUR` (default `200`)
- `AI_RATE_LIMIT_WINDOW_SECONDS` (default `3600`)
- Set a dimension to `0` to disable it.

## E. Explicitly deferred

- Multi-tenant JWT tenant override
- Per-user spend dashboards in Admin UI
- Quotation / planning AI features
- Live SMTP/S3 delivery proof beyond M3 test adapters
