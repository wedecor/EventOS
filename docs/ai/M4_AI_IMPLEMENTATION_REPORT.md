# M4-AI.1 — Lead Intelligence Implementation Report

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 (continued validation) |
| **Branch** | `release/m0-m1-core-workflows` |
| **HEAD (unchanged)** | `787e081063273a352351cea08152f5a7ca2c1301` |
| **M3 ancestor** | `35cc002` (merge-base = `35cc002`) |
| **Feature** | Read-only Lead Intelligence |
| **Endpoint** | `POST /api/v1/leads/:id/ai/intelligence` |
| **Permissions** | `leads:read` **and** `ai:use` |

## What shipped

### Backend
- `shared/llm` port with `test` / `openai` / `none` providers (no LangChain).
- Env: `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, `AI_TIMEOUT_MS`, `AI_MAX_RETRIES`, optional pricing.
- `LeadIntelligenceContextBuilder` — tenant-scoped lead + minimized customer + bounded communications (limit **20**).
- Structured Zod output with evidence (`explicit` \| `inferred` \| `unknown`).
- Audit action `lead.ai_intelligence` (usage metadata; no full prompt dump).
- Metadata-only `AiExecution` / `ai_executions` persistence (migration `20261112070000_m4_ai_executions` — applied to isolated `eventos_e2e` only).
- Read-only: does **not** update leads, send mail, create quotes, or touch finance.
- Persistence of audit / `ai_executions` is **fail-open** relative to the intelligence response.

### Frontend
- Lead detail **AI Intelligence** panel: generate / regenerate, loading, error, empty states.
- Does not write suggestions into lead fields.

## Environment preserved for continued validation

| Check | Result |
|-------|--------|
| API `:3100/health` | `200` (`node dist/src/main`) — left running |
| Web `:3101` | `200` via `serve out -l 3101` — **not** `next start` |
| Baked client API URL | `http://localhost:3100` |
| Playwright config | `E2E_BASE_URL` default `http://localhost:3101`; `E2E_API_BASE_URL` → `:3100`; screenshots on failure; `E2E_TRACE=1` → full traces |

Healthy processes were not killed for Playwright. Web build later coordinated: stop `serve` → static export → `serve out -l 3101` → re-verified.

## Unit / package builds (separate from static-export E2E)

| Check | Result |
|-------|--------|
| API unit tests | **779 passed** (104 suites) |
| API build (`nest build`) | **passed** |
| Web unit tests | **122 passed** |
| Web typecheck | **passed** |
| Web static export build (`next build` → `out/`) | **passed** (serve restarted afterward; baked URL reconfirmed) |

## Static-export Playwright E2E

| Check | Result |
|-------|--------|
| M2 `core-workflow` | **passed** |
| M3 `m3-integration-workflow` | **passed** |
| M4 unauthorized (no token → `401`; viewer role → `403`) | **passed** |
| M4 generate + regenerate; honest missing budget/venue; no lead/quote/payment mutation; `ai_executions` ≥ 2 | **passed** |
| M4 Admin UI structured output + gaps + Regenerate | **passed** |
| `verify-e2e-db.ts` after M2 only | **passed** (`ok: true`) |
| `verify-e2e-db.ts` after M3 | **Expected fail** (M3 draft invoices on completed booking) |

Artifacts: Playwright list reporter; `E2E_TRACE=1` traces; screenshots/video only on failure (none this run).

### Regression Checkpoint — 2026-11-21

| Item | Status |
|------|--------|
| API `:3100` | HTTP 200 (`dist/src/main`) |
| Frontend `:3101` | HTTP 200 (static export `serve out`) |
| M2 core workflow | **PASS** |
| M3 integration workflow | **PASS** |
| M4 unauthorized access | **PASS** |
| M4 generate/regenerate no-mutation | **PASS** |
| M4 Admin UI | **PASS** |
| Aggregate | **5 passed, 0 failed** (12.4s) |
| Post-test stack health | **PASS** |

Evidence class: **test-adapter / isolated static-export E2E** (not live OpenAI).

## Live OpenAI

| Mode | Status |
|------|--------|
| Test adapter (`AI_PROVIDER=test`) | **Pass** — unit, golden, API smoke, Playwright M4 |
| Live OpenAI (`AI_PROVIDER=openai` + `AI_API_KEY`) | **Blocked** — key/provider not configured in `.env.e2e` / `.env`. Not substituted with test-adapter evidence. |

## AI execution persistence (before M4-AI.2)

**Recommendation: keep / require the dedicated `ai_executions` table before M4-AI.2.**  
Rationale: cost, failure category, and correlation visibility without storing prompts/PII; already needed once more than one AI feature exists.

| Field | In schema |
|-------|-----------|
| Execution ID, user, lead, feature, provider/model, prompt version, status | Yes |
| Token usage, estimated cost, duration, correlation ID, failure category, timestamp | Yes |
| Raw prompts / response bodies / message PII | **No** (by design) |

Status: **already implemented** (metadata-only, indexed, fail-open). No further platform work required for M4-AI.1.

## OpenAPI synchronization

| Artifact | Status |
|----------|--------|
| `apps/api/openapi/openapi.v1.json` | Regenerated — `POST /api/v1/leads/{id}/ai/intelligence` present |
| `apps/web/src/types/api.generated.ts` | Regenerated via `pnpm openapi:generate` |

## Market-gap fixes (2026-11-21)

| Gap | Fix |
|-----|-----|
| AI cost abuse | Redis `AiUsageThrottleService` — defaults 30/user/hr, 200/tenant/hr; returns `RATE_LIMITED` (429) |
| UX clarity | Lead Intelligence panel copy emphasizes advisory / not written back |
| Live smoke tooling | `apps/api/scripts/ai-live-smoke.ts` (requires real key; refuses otherwise) |
| Launch tracking | `docs/ai/M4_MARKET_LAUNCH_CHECKLIST.md` |

## Remaining blockers

1. **Live OpenAI smoke** — needs configured `AI_PROVIDER=openai` and `AI_API_KEY` (never commit keys). Run `scripts/ai-live-smoke.ts`.
2. **Production LLM readiness** — do not claim until (1) passes; test-adapter E2E alone is insufficient.
3. **Release commit / prod migrate / hosting** — human ops; see market checklist. No production migrations from this agent pass.
4. **`verify-e2e-db.ts` vs M3** — M2-oriented script; draft invoices after M3 are expected, not an M4 defect.

## Git

- No commit / push / merge / rebase / reset.
- No production migrations.
- Uncommitted M4-AI.1 + foundation + OpenAPI/types work preserved.
