# M3 — Gap Analysis (post-validation)

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Compared to** | M3 master prompt DoD + completion/validation phases |
| **Branch** | `release/m0-m1-core-workflows` (M3 work **uncommitted**; M2 `d8ed43c` preserved) |

---

## Closed vs prior gaps

| Gap | Outcome |
|-----|---------|
| PDF libraries / quotation-invoice PDFs | **Closed** |
| Object storage upload pipeline | **Closed for local**; S3 adapter untested live |
| Email send providers | **Closed for test adapter**; SMTP adapter untested live |
| Communication records on outbound email | **Closed** (provider acceptance recorded; no delivery webhooks) |
| IntegrationSettings placeholder | **Closed** — CRUD + masked secrets + connection tests + audit |
| Migration not applied | **Closed on isolated e2e DB only**; production untouched |
| Playwright M3 journey | **Closed** (pass + DB assertions) |
| Playwright M2 regression after Mark sent rename | **Closed** (spec updated; pass) |

---

## Explicit verification matrix

| Check | Status |
|-------|--------|
| Migration applied to `eventos_e2e` | **Yes** |
| Migration applied to production `eventos` | **No** (intentional) |
| IntegrationSettings CRUD | **Yes** |
| Connection tests (test mail / local storage) | **Yes** |
| SMTP live verification | **No** |
| S3 live verification | **No** |
| M2 Playwright | **Pass** |
| M3 Playwright | **Pass** |

---

## Remaining gaps / deployment follow-ups

1. Live SMTP smoke with real credentials (separate from test-adapter green).
2. Live S3 (or compatible) smoke with real credentials.
3. Apply M3 migrations to staging/production under operator change control.
4. Optional: Redis/shared idempotency for duplicate email prevention across instances.
5. Optional: delivery webhooks if bounce/delivered tracking becomes required.
6. Regenerate OpenAPI + web generated types when packaging a release commit.
7. Authorize commit/push when product review accepts uncommitted M3 tree.

---

## Intentional non-goals (still out)

WhatsApp, Razorpay, SMS, AI, multi-tenant SaaS, public portal, Kafka, Kubernetes, microservices.

---

## Declaration

Automated M3 workflows pass on the **test mail adapter** and **local storage** path. M3 must **not** be described as live-SMTP or live-S3 complete until those provider verifications are executed and recorded.

---

*End of M3 gap analysis.*
