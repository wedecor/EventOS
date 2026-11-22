# EventOS — Implementation Roadmap (Post-Audit)

| Field | Value |
|-------|-------|
| **Audit date** | 2026-11-12 |
| **Basis** | Source-verified gaps in `EVENTOS_GAP_ANALYSIS.md` |
| **Effort unit** | Engineer-weeks (1 senior full-stack ≈ 1.0). Ranges assume existing architecture reuse, not greenfield |
| **Rule** | Fix workflow truth before adding AI or multi-tenant SaaS |

---

## 0. Guiding sequence

```
Stabilize mainline + CI
  → Unblock E2E conversion (line items, advance, in_execution)
    → Staging deploy + Founder UAT → v1.0.0
      → Integrations (files, PDF, email/SMS)
        → WhatsApp + Razorpay
          → AI assists (human-approved)
            → Multi-tenant SaaS
```

Do **not** start décor catalogue or LLM work while Complete/Send/Advance paths are broken.

---

## Milestone M0 — Engineering hygiene (1–2 weeks)

| Work item | Effort | Outcome |
|-----------|-------:|---------|
| Reconcile `snapshot/2026-11-04-wip` ↔ `origin/main` | 0.5–1.5 | Single releasable branch |
| Fix time-coupled quotation fixtures / freeze clocks in tests | 0.2 | API unit suite green |
| Remove or quarantine unused BullMQ dep | 0.1 | Honest dependency graph |
| Dual Security nav cleanup | 0.1 | IA polish |

**Exit criteria:** green unit suites on CI; one agreed release branch.

---

## Milestone M1 — Unblock core workflows (2–4 weeks)

| Work item | Effort | Modules |
|-----------|-------:|---------|
| Quotation line-item GET + Admin line editor | 1–1.5 | `quotation`, web quotations |
| Lead/quotation payment capture UI (advance before booking) | 0.5–1 | `payment`, finance UI |
| Explicit booking transition `in_preparation` → `in_execution` (+ permissions/OpenAPI) | 0.5 | `booking` |
| Follow-up list (or embed on lead) + complete UI | 0.5 | `lead`, web |
| Minimal list endpoints: quotations, bookings (and preferably clients) with pagination | 1–2 | respective modules + hubs |

**Exit criteria:** Doc 19 path W5→W1→W4 demonstrable in Admin Portal without raw API calls; Complete reachable.

**Critical bugs closed:** line items, advance chicken-and-egg, `in_execution`.

---

## Milestone M2 — We Decor production go-live (2–3 weeks, parallelizable with ops)

| Work item | Effort | Notes |
|-----------|-------:|-------|
| Staging deploy (API + static web + managed Postgres/Redis) | 1–2 | Use existing production scripts |
| Global API rate limiting (Nest throttler or edge WAF) | 0.5 | P2-13 High |
| Sentry web + alert smoke | 0.3 | |
| Execute production checklist A–K | 1 (ops) | Operator time |
| Live Founder UAT (R5) on real events | 1 (founders+eng) | Doc 19 W1–W5 |
| Tag `v1.0.0` after sign-off | 0.1 | |

**Exit criteria:** HTTPS portal + API; `/health/ready` 200; founder sign-off; tagged release.

**Commercial note:** This yields a **production single-tenant product**, not a sellable multi-tenant SaaS.

---

## Milestone M3 — Platform integrations foundation (4–6 weeks)

| Work item | Effort | Unlocks |
|-----------|-------:|---------|
| FileService + S3/R2 + upload APIs + web uploader | 2–3 | Proofs, photos, finance docs |
| PDF service (quotation + invoice) | 1.5–2 | Customer-facing proposals |
| Email provider + queue worker (actually use BullMQ) | 1.5–2 | Outbound send |
| SMS provider (optional parallel) | 1 | India ops |
| Wire Communication Center send adapters | 1 | Records → delivery |
| Settings → Integrations configuration UI | 1 | Replace placeholder |

**Exit criteria:** Upload proof on payment; generate quote PDF; send email from template/record with audit.

---

## Milestone M4 — Channel + payments (4–6 weeks)

| Work item | Effort | Unlocks |
|-----------|-------:|---------|
| WhatsApp Business API (templates + webhooks → CommunicationRecord/Lead) | 2.5–4 | Table-stakes India channel |
| Razorpay payment links + webhooks → Payment confirm | 2–3 | Online advances/balances |
| Payment security (webhook signatures, idempotency) | included | |
| Notification center (in-app) + optional Web Push | 1.5–2 | Replace “coming soon” |

**Exit criteria:** Quote/invoice link via WhatsApp; customer pays; payment auto-recorded; staff see in-app alert.

---

## Milestone M5 — Décor catalogue (optional product expansion) (3–5 weeks)

Only if product strategy requires catalogue-led selling (currently **absent**).

| Work item | Effort |
|-----------|-------:|
| Décor item/package/theme domain + migrations | 1.5–2 |
| Pricing rules + attach lines to quotation | 1–1.5 |
| Gallery via FileService | 1 |
| Admin catalogue UI | 1–1.5 |

**Exit criteria:** Build quotation from package; images stored; custom request notes supported.

---

## Milestone M6 — AI assists (human-approved) (4–8 weeks)

Prerequisite: M1 workflows stable; preferably M3 files/comms for grounded context.

| Work item | Effort | Notes |
|-----------|-------:|-------|
| Provider port (OpenAI/Anthropic) + secrets in env schema | 0.5 | |
| Prompt registry + structured output (Zod) | 1 | |
| Suggestion **creators** (lead next-step, draft message, staff hint) | 2–3 | Reuse accept/dismiss |
| Quotation draft-from-notes (not auto-send) | 1.5–2 | |
| Cost/token logging + rate limits + redaction | 1 | |
| Eval harness (golden prompts) | 1–2 | |
| Décor/vendor recs | 1–2 | Needs M5 for décor |

**Exit criteria:** AI never auto-executes customer/vendor money actions; accept path audited; eval suite in CI.

**Honesty check:** Without M6, do not market EventOS as AI-powered.

---

## Milestone M7 — Multi-tenant commercial SaaS (8–14 weeks)

Prerequisite: M2 production maturity + M3 integrations.

| Work item | Effort |
|-----------|-------:|
| Tenant provisioning / signup / slug routing | 2–3 |
| Data isolation audit + automated cross-tenant tests | 1–2 |
| Plans, subscriptions, metering (Razorpay subscriptions) | 3–4 |
| Onboarding wizard + demo seed | 1.5–2 |
| Super-admin console | 2–3 |
| Mobile nav / PWA hardening | 1.5–2 |

**Exit criteria:** Second company can self-serve trial; billed; isolated data; basic admin ops.

---

## Parallel hardening backlog (pull forward anytime)

| Item | Effort | Priority |
|------|-------:|----------|
| API↔Web RBAC sync CI | 0.3 | High |
| Calendar/Analytics query batching | 1–2 | High (pre-scale) |
| Customer/quote/booking search filters | 1–2 | Product |
| E2E Playwright smoke (login + W5 + finance) | 1–1.5 | Quality |
| InventoryMovement↔Item relation / indexes | 0.5 | Medium |
| `legacyUserId` cleanup | 0.3 | Low |

---

## Suggested 90-day plan (pragmatic)

| Weeks | Focus | Milestone |
|------:|-------|-----------|
| 1–2 | Mainline + CI + line items + `in_execution` + advance UI | M0–M1 start |
| 3–4 | Lists + follow-ups + staging | M1–M2 |
| 5–6 | Founder UAT + prod cutover + rate limit | M2 |
| 7–10 | Files + PDF + email | M3 |
| 11–13 | WhatsApp **or** Razorpay (pick based on revenue pain) | M4 start |

AI (M6) and multi-tenant (M7) intentionally **after** a working production We Decor system.

---

## Effort rollup (order-of-magnitude)

| Milestone | Engineer-weeks |
|-----------|---------------:|
| M0 Hygiene | 1–2 |
| M1 Workflow unblock | 2–4 |
| M2 Go-live | 2–3 (+ founder time) |
| M3 Integrations | 4–6 |
| M4 WhatsApp + Razorpay | 4–6 |
| M5 Décor (optional) | 3–5 |
| M6 AI | 4–8 |
| M7 SaaS | 8–14 |
| **To honest We Decor production (M0–M2)** | **~5–9** |
| **To integrated ops platform (through M4)** | **~15–25** |
| **To AI + multi-tenant SaaS narrative** | **~30–50+** |

---

## Priority principles (for PMs)

1. **Truth over theater** — fix Complete/Send/Advance before demos of AI.
2. **Ports over SDKs** — File/Mail/WhatsApp/Pay adapters behind interfaces.
3. **Human approval remains mandatory** for outbound/AI money actions (Doc 19 guardrails).
4. **Do not expand Business Bible** casually — scope changes need founder rule.
5. **Measure with live UAT**, not report checkboxes alone.

---

## Mapping to existing roadmaps

| Existing doc | Relationship |
|--------------|--------------|
| `docs/11-roadmap.md` Phase 2–5 | Historical product phases; engineering already shipped ops enhancements as P2-01…P2-13 |
| `docs/saas-transformation-roadmap.md` Phases 0–4 | Aligns with M2–M7; treat as commercial track |
| P2-13 “Phase 3 Platform Integrations” | ≈ M3–M4 (+ AI later) |
| Doc 19 Phase 1 UAT | Gate for M2 exit — still pending live execution |

---

*End of implementation roadmap.*
