# Event OS — Monitoring Dashboards & Alerts (Repository Preparation)

> **R2-08 scope:** repository-side preparation only.
> This directory does **not** create Grafana/Prometheus/Datadog/CloudWatch dashboards,
> wire AlertManager/PagerDuty, provision cloud monitors, or fire real alerts.
> It specifies what operators should monitor and which thresholds (docs/16) to use
> when attaching a platform later.

Authoritative references:

- [docs/16-deployment-strategy.md](../../docs/16-deployment-strategy.md) — §Monitoring and Alerting
- Engineering Backlog **R2-08** — alert thresholds aligned to docs/16
- [infrastructure/staging/README.md](../staging/README.md) — staging topology / health URLs
- [infrastructure/logging/README.md](../logging/README.md) — JSON logs + `requestId` (R2-07)
- [apps/api/src/instrument.ts](../../apps/api/src/instrument.ts) — Sentry (R2-06)
- [apps/api/src/common/health/](../../apps/api/src/common/health/) — liveness / readiness implementation

Related prior work: **R2-05** staging prep · **R2-06** Sentry · **R2-07** log shipping prep.

---

## What “done” means in this repo vs ops

| Layer | R2-08 (this directory) | Later operator work (out of scope here) |
|-------|------------------------|------------------------------------------|
| Specs | Dashboards, alerts, probes documented | Create real dashboards / alert rules |
| Thresholds | Copied from docs/16 + backlog AC | Test-fire each rule in staging (backlog DoD) |
| Code | **Unchanged** health / Sentry / logging | Optional future: readiness HTTP status mapping |

---

## Recommended monitoring architecture (deployment-agnostic)

```
                    ┌─────────────────────────┐
  Synthetic / LB ──▶│ GET /health (liveness)  │──▶ Availability signal
  probes (30s)      │ GET /health/ready       │──▶ Dependency signal
                    └───────────┬─────────────┘
                                │
API container ──stdout JSON─────┼──▶ Log aggregator (R2-07) ──▶ error rate, latency, volume
             └──Sentry (R2-06)──┘──▶ exception / error tracking

Host / orchestrator ──▶ container health, disk, SSL (edge), DB pool metrics (provider)
```

No single vendor is required. Map the **signals** below into whichever monitor you use.

---

## Health monitoring specification

### Endpoints (already implemented)

| Probe | Method / path | Purpose | Suggested interval |
|-------|---------------|---------|--------------------|
| Liveness | `GET /health` | Process up | Every **30s** (docs/16) |
| Readiness | `GET /health/ready` | PostgreSQL + Redis reachable | Every **30s** (docs/16) |

Both routes are `@Public()` (no JWT), excluded from the `/api/v1` prefix, and skipped by pino auto-request logging.

### Liveness — `GET /health`

| Aspect | Spec |
|--------|------|
| Success body | `{ "status": "ok" }` |
| Success HTTP | `200` |
| Failure | Connection failure / non-2xx / timeout → treat as down |

### Readiness — `GET /health/ready`

| Aspect | Spec |
|--------|------|
| Success body (healthy) | `{ "status": "ok", "checks": { "postgres": { "status": "up", "latencyMs": … }, "redis": { "status": "up", "latencyMs": … } } }` |
| Degraded body | `{ "status": "degraded", "checks": { … one or both `"down"` } }` |
| **Current HTTP behavior** | Nest returns **HTTP 200** for both `ok` and `degraded` today. Probes **must** assert JSON `status === "ok"` (and optionally `checks.*.status === "up"`), not HTTP status alone. |
| Timeout | Recommend ≤ 5s client timeout |

### Docker / compose container health (local reference)

`infrastructure/docker/docker-compose.yml` already defines:

| Service | Healthcheck basis |
|---------|-------------------|
| `api` | `GET http://127.0.0.1:4000/health` |
| `postgres` | `pg_isready` |
| `redis` | `redis-cli ping` |

Staging/production orchestrators should mirror the **same intent** (liveness vs dependency checks), not necessarily this exact compose file.

---

## Signals to monitor

| Signal | Primary source | Notes |
|--------|----------------|-------|
| **API availability** | Liveness probe success rate | Edge / synthetic check against public staging URL |
| **Health endpoint** | `GET /health` | Process alive |
| **Readiness endpoint** | `GET /health/ready` + JSON `status` | DB + Redis |
| **Database availability** | Readiness `checks.postgres` + provider metrics | Pool utilization when exposed by managed Postgres |
| **Redis availability** | Readiness `checks.redis` + provider metrics | |
| **Error rate** | Access logs (`res.statusCode` ≥ 500) and/or Sentry event rate | Correlate with `requestId` (R2-07) |
| **Request latency** | Access logs `responseTime` (pino-http) | Use **p95** for alerts (docs/16) |
| **Request volume** | Count of request-completion log lines / `service=event-os-api` | Dashboards; usually no P0 alert |
| **Docker container health** | Orchestrator health status | Restart / replace unhealthy tasks |
| **Sentry errors** | Sentry project (when `SENTRY_DSN` set) | Complements logs; not a substitute for probes |

---

## Alert thresholds (docs/16 + backlog R2-08)

Use these **exactly** where listed in docs/16. Additional signals below are recommended companions, not replacements.

| Condition | Severity | Action (docs/16) | Implementation hint |
|-----------|----------|------------------|---------------------|
| Health check fails for **> 2 minutes** | **Critical** | Page on-call, auto-restart | Fail if liveness **or** readiness (JSON `status != ok`) fails continuously for > 2 min at 30s interval |
| Error rate **> 5% for 5 minutes** | **High** | Notify team | `(5xx / total requests) > 0.05` over 5m rolling window from access logs; optionally Sentry error spike |
| API **p95 latency > 2s for 10 minutes** | **Medium** | Investigate | p95 of `responseTime` over 10m |
| Database connection pool **> 80%** | **Medium** | Investigate | Managed Postgres / PgBouncer metrics (not exposed by API today) |
| Disk usage **> 80%** | **Medium** | Plan expansion | Host / volume metrics |
| SSL certificate expiring **< 14 days** | **Medium** | Renew | Edge / TLS terminator |
| Backup failure | **High** | Investigate immediately | Backup job / provider alerts (R2-10 territory) |

Template encoding: [alerts.example.yaml](./alerts.example.yaml).

---

## Dashboard specification

Minimum panels for staging/production (platform-agnostic). Detailed panel list: [dashboards.example.yaml](./dashboards.example.yaml).

| Panel | Visualization | Data |
|-------|---------------|------|
| API availability | Uptime % / success ratio | Liveness probe |
| Readiness status | Status timeline / binary | Readiness JSON `status` |
| Postgres / Redis up | Two status series | Readiness `checks.*` |
| Request volume | Requests / min | Access logs |
| Error rate | % 5xx | Access logs (+ Sentry count overlay optional) |
| Latency p50 / p95 / p99 | Line | Access log `responseTime` |
| Sentry issues | Count / new issues | Sentry API or webhook feed |
| Container health | Healthy replicas | Orchestrator |
| Disk / SSL / pool | Gauges | Infra metrics (when available) |

---

## Sentry monitoring integration (documentation)

| Topic | Guidance |
|-------|----------|
| Enablement | Set valid `SENTRY_DSN` (R2-06); placeholders with `REPLACE` are ignored |
| What Sentry covers | Unhandled exceptions, 5xx captured from `AllExceptionsFilter`, process-level failures when enabled |
| What Sentry does **not** replace | Liveness/readiness probes, latency SLOs, disk/SSL/pool alerts |
| Correlation | Prefer matching time windows + `requestId` from logs; do not expect Sentry to be the request-volume source |
| Out of scope for R2-08 | Alert rules inside Sentry UI, release health, performance tracing |

See also staging env notes in [infrastructure/staging/.env.staging.example](../staging/.env.staging.example).

---

## Repository templates

| File | Purpose |
|------|---------|
| [alerts.example.yaml](./alerts.example.yaml) | Alert rule catalog (docs/16 thresholds) |
| [dashboards.example.yaml](./dashboards.example.yaml) | Dashboard panel catalog |
| [health-probes.example.yaml](./health-probes.example.yaml) | Probe definitions for operators |
| [monitoring.example.env](./monitoring.example.env) | Placeholder env for external monitors (not read by `apps/api`) |

These are **specifications**, not deployable monitor stacks.

---

## Operator checklist (later — outside R2-08)

1. [ ] Point synthetic checks at staging `/health` and `/health/ready` (30s)
2. [ ] Assert readiness **JSON** `status == ok` (do not rely on HTTP alone)
3. [ ] Create dashboards from [dashboards.example.yaml](./dashboards.example.yaml)
4. [ ] Create alert rules from [alerts.example.yaml](./alerts.example.yaml)
5. [ ] Confirm Sentry project receives exceptions when DSN is set
6. [ ] Test-fire each Critical/High alert once in staging (backlog DoD)
7. [ ] Wire on-call / notification channel (PagerDuty etc. — out of repo)

This repository does **not** automate steps 1–7.
