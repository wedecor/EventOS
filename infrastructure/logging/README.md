# Event OS — Structured Log Shipping (Repository Preparation)

> **R2-07 scope:** repository-side preparation only.
> This directory does **not** provision a log aggregator, install a shipper agent,
> create cloud logging resources, or forward logs to a real backend.
> It documents the JSON contract the API already emits and how an operator can
> attach an external aggregator later (ops work; dashboards/alerts prep is R2-08).

Authoritative references:

- [docs/16-deployment-strategy.md](../../docs/16-deployment-strategy.md) — §Monitoring and Alerting → Logging
- [docs/10-implementation-specification.md](../../docs/10-implementation-specification.md) — §Logging Strategy
- [docs/08-coding-standards.md](../../docs/08-coding-standards.md) — §Logging / log levels
- [apps/api/src/config/logging.config.ts](../../apps/api/src/config/logging.config.ts) — pino-http options (source of truth in code)

Related prior work:

- **R1-03** — secret redaction (`Authorization`, `Cookie`, `Set-Cookie`)
- **R2-05** — staging env preparation (`LOG_LEVEL`)
- **R2-06** — Sentry (errors); logs remain the primary request trail
- **R2-08** — [monitoring dashboards & alert preparation](../monitoring/README.md)

---

## Recommended aggregation architecture (deployment-agnostic)

```
API container (NODE_ENV=staging|production)
        │
        │  stdout / stderr — newline-delimited JSON (pino)
        ▼
Host / orchestrator log driver  (platform-specific; out of repo scope)
        │
        ▼
Log shipper / collector agent   (operator-chosen; not configured here)
        │
        ▼
Log aggregator + index          (query by requestId, service, level, time)
        │
        ├── Hot retention:  30 days   (docs/16)
        └── Cold retention: 1 year    (docs/16)
```

**Contract for operators:** scrape **container stdout**. Do not require an
in-process shipping SDK in the Nest app. The application must stay shipper-agnostic.

---

## JSON log format

Staging and production **do not** use `pino-pretty`. Each log line is one JSON object.

Typical request-completion shape (fields may vary; `requestId` and `service` are guaranteed on pino-http request logs):

```json
{
  "level": 30,
  "time": 1710000000000,
  "pid": 1,
  "hostname": "api-1",
  "req": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "method": "GET",
    "url": "/api/v1/leads",
    "headers": {
      "authorization": "[Redacted]"
    }
  },
  "res": { "statusCode": 200 },
  "responseTime": 12,
  "service": "event-os-api",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "msg": "request completed"
}
```

| Field | Meaning |
|-------|---------|
| `service` | Constant `event-os-api` |
| `requestId` | Correlation id (top-level; same as `req.id`) |
| `level` | pino numeric level (`30` = info, `40` = warn, `50` = error) |
| `time` | Epoch millis |
| `req` / `res` | pino-http request/response serializers (secrets redacted) |

Local `development` / `test` may use `pino-pretty` for humans; treat that as non-shipping format.

See [stdout-json.fields.example.json](./stdout-json.fields.example.json) for a minimal field checklist operators can map into an index.

---

## Correlation / request IDs

| Source | Behavior |
|--------|----------|
| Inbound `x-request-id` | Reused when non-empty |
| Otherwise | UUID generated per request |
| Response header | `x-request-id` echoed |
| Error JSON envelope | `error.requestId` matches the same id when pino-http ran |
| Log query key | Filter aggregator on `requestId` (or `req.id`) |

**Backlog AC intent:** given one `requestId`, an operator can retrieve that request’s log trail once an aggregator is attached.

Health probes (`/health`, `/health/ready`) are excluded from auto request logging to reduce noise.

---

## Recommended log levels

| Environment | Recommended `LOG_LEVEL` | Notes |
|-------------|-------------------------|--------|
| `development` | `debug` or `info` | Pretty transport allowed |
| `test` | `silent` / `info` as needed | CI |
| `staging` | `info` (or `warn`) | JSON on stdout |
| `production` | `info` or `warn` | JSON on stdout |

**Documentation note:** docs/16 says production should use `error` and `warn` only; docs/08 allows `info` for business events. The running API defaults to `info` and leaves the final tier choice to operators via `LOG_LEVEL`. Prefer aligning ops runbooks with docs/08 business-event logging unless a stricter production policy is adopted later.

Never log passwords, tokens, or payment proof contents (R1-03 + docs/08 §Never Log).

---

## Recommended retention

Per docs/16 §Logging:

| Tier | Retention |
|------|-----------|
| Hot (searchable in aggregator) | 30 days |
| Cold (archive) | 1 year |

Exact storage classes are provider-specific and out of this repo task.

---

## Repository templates (not live shipping)

| File | Purpose |
|------|---------|
| [log-shipping.example.env](./log-shipping.example.env) | Placeholder env vars an operator might use when wiring a shipper **outside** this repo |
| [stdout-json.fields.example.json](./stdout-json.fields.example.json) | Field contract for index mapping |

Do **not** commit real aggregator credentials. Do **not** treat these templates as a deployed stack.

---

## Operator checklist (later — outside R2-07)

1. [ ] Confirm staging/production containers emit JSON (no pretty transport)
2. [ ] Attach platform log driver → shipper → aggregator
3. [ ] Index / parse JSON; map `requestId`, `service`, `level`, `time`
4. [ ] Verify one known request’s trail is queryable by `requestId`
5. [ ] Apply 30-day hot / 1-year cold retention
6. [ ] Confirm redacted fields never appear as plaintext in the aggregator

This repository does **not** automate steps 2–6.
