# M4 — Target Architecture (AI Business Copilot)

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Style** | Application-owned orchestration inside existing NestJS modular monolith |
| **Non-goals** | Microservices, Kafka, LangChain/LangGraph, multi-agent runtime, vector DB (unless later evidence demands) |

---

## 1. Design principles

1. **PostgreSQL + existing services remain the source of truth.**
2. **LLM proposes; application decides and persists.**
3. **Tools call application services**, never unrestricted Prisma/SQL.
4. **Authorization is identical** to human API callers (same permissions + `tenantId`).
5. **Financial numbers are deterministic** (`calculateQuotationTotals`, analytics/dashboard/profitability services).
6. **Customer-facing sends require human approval.**
7. Prefer **direct provider SDK** + small internal orchestration over frameworks.

---

## 2. Proposed module structure

Fits current patterns (`presentation` / `application` / `domain` / `infrastructure`):

```
apps/api/src/
  shared/llm/
    llm.port.ts              # sendChat / structuredOutput interfaces
    llm.factory.ts           # provider selection from config
    openai.adapter.ts        # optional; only when dependency added later
    anthropic.adapter.ts     # optional
    prompt-registry.ts       # versioned prompt ids → templates
  modules/ai/
    ai.module.ts
    presentation/
      ai.controller.ts       # /api/v1/ai/...
      schemas/
    application/
      services/
        ai-copilot.application.service.ts
        ai-tool-dispatcher.ts
      dtos/
      tools/                 # thin adapters → existing app services
        analytics.tools.ts
        lead.tools.ts
        booking.tools.ts
        quotation.tools.ts   # read + propose only
        communication.tools.ts
    domain/
      repositories/
        ai-execution.repository.ts
    infrastructure/
      persistence/
```

**Frontend (later):** `apps/web/src/features/ai/` — copilot panel, draft review, citation of tool results. No LLM keys in the browser.

**Why not LangChain:** EventOS already has Result-typed services, Zod validation, and RBAC. A thin tool dispatcher + provider port is enough until proven otherwise.

---

## 3. Request flow

```
User (Admin Portal)
  → POST /api/v1/ai/copilot/query  (or feature-specific routes)
       Authorization: Bearer access JWT
       Body: { feature, message, contextRefs[] }
  → JwtAuthGuard + PermissionsGuard (e.g. ai:use + domain read perms)
  → AiCopilotApplicationService
       1. Load authorized context via tools (tenant-scoped services)
       2. Build messages: system (versioned) + sanitized context + user text
       3. Call LlmPort (timeouts, retries bounded)
       4. If tool_calls → dispatch only allowlisted tools → re-enter model or finalize
       5. Validate structured output (Zod)
       6. Persist AiExecution log (no secrets; minimize PII)
       7. Return proposal DTO (never auto-mutate money/state unless explicit approve API)
```

### Human approval flow (communications / quote applies)

```
AI returns DraftProposal { id, channel, body, relatedIds }
  → stored as Suggestion (type=ai.communication.draft) OR AiDraft table
User clicks Approve
  → SuggestionApplicationService.accept / dedicated approve endpoint
  → only then may call OutboundEmailApplicationService.send*
```

Reuses the existing **Suggestion accept/dismiss** pattern (`modules/admin`) where it fits; otherwise a dedicated `AiDraft` with the same semantics.

---

## 4. Provider integration

| Topic | Approach |
|-------|----------|
| Config | `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY` (encrypted via IntegrationSettings or env); validate in `env.schema` when implemented |
| Port | `LlmPort.complete({ messages, tools?, responseSchema? })` |
| Defaults | Start with one cloud provider SDK; keep factory switchable |
| Timeouts | Hard request timeout (e.g. 30–60s) at adapter |
| Retries | Idempotent GETs only; no unbounded retry on spend |
| Failures | Map to `Result` failures; user-visible safe messages |

**IntegrationSettings:** suitable later for per-tenant key storage using existing `secret-box` + masked DTO pattern (`modules/integrations`). Phase-1 single tenant can start with env-only keys.

---

## 5. Application-owned tools

### Allowlist examples

| Tool | Calls | Permission gate |
|------|-------|-----------------|
| `get_analytics_dashboard` | `AnalyticsApplicationService.getDashboard` | `analytics:read` |
| `get_founder_kpis` | `FounderKpiQueryService.getFounderKpis` | `dashboards:read` |
| `get_booking_profitability` | `ProfitabilityApplicationService.getProfitability` | `profitability:read` |
| `get_lead` | Lead application service | `leads:read` |
| `list_lead_followups` | Lead follow-up APIs | `leads:read` |
| `get_quotation` | Quotation service + line items | `quotations:read` |
| `get_booking` | Booking/workspace read | `bookings:read` / `workspace:read` |
| `list_communications` | Communication services | `communications:read` |
| `propose_quotation_lines` | **Returns draft DTO only** | `quotations:write` to *apply* later |

### Forbidden tools

- Raw SQL / Prisma client exposure
- `approveQuotation`, `recordPayment`, `voidPayment`, `sendQuotationEmail` without human approve step
- Decrypting integration secrets for prompt inclusion
- Cross-tenant fetches

---

## 6. Authorization boundaries

```
AuthenticatedUser { userId, tenantId, role }
  → PermissionService.has(permission)
  → every tool re-checks required permission
  → every repository call passes tenantId from TenantId decorator (never from model output)
```

Admin/owner bypass already exists in `PermissionsGuard` for full permission set — preserve; do not add a separate “AI superuser.”

New permission suggestion (implementation later): `ai:use` (and optionally `ai:admin` for prompt/config). Domain reads still required.

---

## 7. Logging, evaluation, failure handling

### AiExecution record (recommended fields)

- `id`, `tenantId`, `actorUserId`, `feature`, `promptVersion`
- `provider`, `model`
- `toolCalls[]` (name, latency, ok/fail) — **not** full tool payloads if sensitive
- `outcome` (`completed` / `refused` / `failed`)
- `inputTokens`, `outputTokens`, `estimatedCost`
- `requestId`
- `errorCode` (sanitized)

Avoid storing full customer conversation transcripts by default; store hashes or truncated redacted excerpts if needed for eval.

### Failure handling

| Failure | Behavior |
|---------|----------|
| Provider timeout | Fail closed with retry hint; no partial money writes |
| Tool authz deny | Skip tool; model must say insufficient access |
| Schema validation fail | Retry once with repair prompt or return error |
| Unsupported BI question | Explicit refusal (no hallucinated numbers) |

### Evaluation

Golden fixtures per feature (see roadmap). Contract tests: tool input/output Zod. Authorization tests: user without `analytics:read` cannot obtain finance tool data via AI route.

---

## 8. Data flow (BI example)

```
User: "What was revenue this month?"
  → tool get_founder_kpis / analytics finance (from=monthStart, to=now)
  → deterministic MoneyAmountDto
  → LLM narrates figures + states definition (e.g. confirmed payments)
  → UI shows answer + “Source: dashboards/founder” citation
```

### Data flow (quotation — post-catalogue)

```
User requirements text
  → tool search_catalogue (future)
  → propose lines { catalogueId, qty, unitPriceFromCatalogue }
  → human edits → POST line items API
  → calculateQuotationTotals persists authoritative total
```

Without catalogue, stop at free-text proposal labeled **non-authoritative**.

---

## 9. Frontend composition

- Copilot drawer on Lead / Quotation / Booking / Reports pages.
- Always show: model disclaimer, source citations, Approve/Reject for actions.
- Never embed provider API keys in Next static export.

---

## 10. Open architectural decisions

1. Provider choice (OpenAI vs Anthropic vs both).
2. Persist drafts via `Suggestion` vs dedicated `AiDraft` table.
3. Whether `ai:use` is enough or per-feature permissions.
4. When (if ever) to add embeddings for catalogue search — **only after catalogue exists**.
5. Env-only keys vs IntegrationSettings encrypted keys for single-tenant We Decor.
6. Which outstanding-balance definition BI tools expose (dashboard vs customer 360 vs analytics).
7. When to bind `@TenantId()` to JWT `tenantId` (required before any multi-tenant AI deployment).

---

*End of M4 target architecture.*
