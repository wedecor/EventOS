# M4-AI.1 — Lead Intelligence Evaluation

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 (continued validation) |
| **Harness** | Jest unit + golden fixtures + isolated Playwright against static `out/` |
| **Default provider under test** | `AI_PROVIDER=test` (deterministic) |

## Principles under test

1. Never invent date / budget / venue / guest count when structured fields are null.
2. Prompt-injection text in notes must not force fabricated explicit values.
3. Output always validates against `leadIntelligenceResultSchema`.
4. Missing fields appear in `missingInformation` with evidence `unknown`.
5. Endpoint is read-only — lead / customer / quotation / finance rows unchanged.
6. Unauthorized callers cannot invoke the endpoint.
7. Regeneration returns structured output again without mutating records.

## Golden cases (test adapter)

| Case | Expectation | Result |
|------|-------------|--------|
| Complete wedding enquiry | Explicit eventType/venue/budget/guestCount | Covered in CI |
| Sparse walk-in + injection | All core fields unknown; no invented budget | Covered in CI |
| Reception with date + budget only | venue/guestCount missing | Covered in CI |

## Isolated E2E (Playwright — continued validation)

| Check | Evidence class | Result |
|-------|----------------|--------|
| M2 core workflow | Test-adapter stack | Pass |
| M3 integration workflow | Test-adapter stack | Pass |
| Unauthenticated → `401` | Test-adapter stack | Pass |
| Authenticated viewer (no `ai:use`) → `403` | Test-adapter stack | Pass |
| Generate + regenerate; missing budget/venue honest | Test-adapter stack | Pass |
| No lead/quotation/payment mutation | Test-adapter stack | Pass |
| `ai_executions` rows for lead (≥ 2 after regenerate) | Test-adapter / DB | Pass |
| Admin UI: structured fields, gaps, Regenerate | Test-adapter UI | Pass |
| `verify-e2e-db` post-M2 | DB | Pass |

### Regression Checkpoint — 2026-11-21

Re-confirmed against replacement static server (`serve out` on `:3101`, API `:3100`): **5 passed, 0 failed** in 12.4s (M2, M3, M4×3). Post-test stack health **PASS**. Test-adapter evidence only — live OpenAI still blocked.

## Live provider

| Check | Status |
|-------|--------|
| OpenAI adapter unit (mocked fetch) | Covered in CI (test-adapter / mocked) |
| Live call with real `AI_API_KEY` | **Blocked** — credentials unavailable |
| Live timeout / provider failure | **Not run** against live OpenAI; unit maps sanitized `EXTERNAL_SERVICE_ERROR` / `INVALID_STATE` |

**Do not treat test-adapter results as live-provider verification.**

When live verification is available, assert structured response, evidence tags, token usage, cost estimate (if pricing configured), sanitized failures, and no invented budget when `estimatedBudgetAmount` is null.

## Authorization / failure matrix

| Scenario | Expected | Observed |
|----------|----------|----------|
| Unauthenticated | `401` | Pass (Playwright M4) |
| Viewer without `ai:use` | `403` | Pass (Playwright M4) |
| Missing lead in tenant | `NOT_FOUND` | Pass (prior HTTP smoke) |
| Tenant override header/body | Ignored | Pass (prior HTTP smoke) |
| Invalid JSON / schema | `VALIDATION_ERROR` | Unit |
| Timeout / provider failure | Sanitized `EXTERNAL_SERVICE_ERROR` | Unit |
| Provider disabled | `INVALID_STATE` | Unit |
| `AiExecution` persistence failure | Intelligence still returned | Unit |
