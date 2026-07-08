# AI Development Guide

## Purpose of This Document

This document defines how AI is integrated into Event OS development and product capabilities. AI is a first-class concern—not an afterthought. This guide covers both AI features in the product and AI-assisted engineering workflows.

---

## AI Philosophy

### AI Assists, Humans Decide

Every AI output in Event OS is:

1. **Suggested**, never silently applied
2. **Reviewable** — displayed in an editable form before confirmation
3. **Attributable** — logged with model, prompt version, and user who accepted/rejected
4. **Overridable** — user can always ignore or modify AI suggestions

**Why:** Event businesses handle money and client relationships. An AI-generated quote sent without review can cost thousands. Trust requires control.

### AI as Infrastructure, Not Decoration

AI capabilities are built on a shared platform layer, not sprinkled across modules as one-off API calls. Every module uses the same AI service interface, prompt management, and observability.

---

## AI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI PLATFORM LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Prompt       │  │ Context      │  │ Provider     │      │
│  │ Management   │  │ Assembly     │  │ Abstraction  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Response     │  │ Guardrails   │  │ Observability│      │
│  │ Validation   │  │ & Safety     │  │ & Logging    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │ Quotation   │  │ Lead        │  │ Communication│
   │ AI Features │  │ AI Features │  │ AI Features  │
   └─────────────┘  └─────────────┘  └─────────────┘
```

### Provider Abstraction

```typescript
interface AiProvider {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncIterable<CompletionChunk>;
}

interface CompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  tools?: ToolDefinition[];
}
```

**Why abstraction:**
- Switch providers without changing business logic
- A/B test models per feature
- Fallback if primary provider is down
- Cost optimization (smaller models for simple tasks)

**Supported providers (initial):**
- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude) — via same interface

Provider selection per feature via configuration, not hard-coded.

---

## Prompt Management

### Prompt Templates

Prompts are version-controlled templates, not inline strings:

```typescript
// prompts/quotation-generate.v1.ts
export const quotationGeneratePrompt: PromptTemplate = {
  id: 'quotation-generate',
  version: 1,
  model: 'gpt-4o',
  temperature: 0.3,
  system: `You are an expert event management quotation assistant for {{tenantName}}.
You generate detailed quotation line items based on event requirements.
Always use the tenant's currency ({{currency}}) and pricing style.
Return JSON matching the QuotationSuggestion schema.`,
  user: `Generate quotation line items for:
Event Type: {{eventType}}
Event Date: {{eventDate}}
Venue: {{venue}}
Guest Count: {{guestCount}}
Requirements: {{requirements}}
Budget Range: {{budgetRange}}

Available Packages:
{{packages}}`,
  responseSchema: QuotationSuggestionSchema,
};
```

### Prompt Versioning Rules

1. Prompts are immutable once deployed — create a new version to change.
2. Version format: `{prompt-id}.v{number}`
3. Active version configured per tenant (allows per-tenant prompt tuning).
4. All prompt executions log the prompt ID and version used.
5. Prompts stored in database (`prompt_templates` table) and synced from code on deploy.

### Context Assembly

The AI platform assembles context from domain data before calling the LLM:

```typescript
interface AiContext {
  tenant: {
    name: string;
    currency: string;
    eventTypes: string[];
    packages: PackageSummary[];
  };
  entity?: Record<string, unknown>;  // Lead, quotation, etc.
  user?: {
    name: string;
    role: string;
  };
  conversationHistory?: Message[];
}
```

**Rules:**
- Only include data the user has permission to see
- Truncate long fields (notes, descriptions) to token budget
- Never include other tenants' data
- Never include authentication tokens or secrets

---

## Product AI Features

### Phase 1: Foundation AI Features

| Feature | Module | Description | User Interaction |
|---------|--------|-------------|------------------|
| **Quote line item suggestion** | Quotation | AI suggests line items based on event type, requirements, and tenant packages | User reviews, edits, accepts into quotation |
| **Lead summary** | Lead | AI summarizes lead notes and interaction history | Displayed on lead detail view |
| **Message drafting** | CRM / Lead | AI drafts follow-up messages (email, WhatsApp) based on lead context | User edits and sends |
| **General assistant** | Platform | Chat interface for questions about the system and business data | Conversational, read-only data access |

### Phase 2: Intelligence AI Features

| Feature | Module | Description |
|---------|--------|-------------|
| **Lead scoring** | Lead | AI scores leads by conversion probability |
| **Schedule optimization** | Calendar | AI suggests optimal staff scheduling |
| **Margin analysis** | Finance | AI identifies events with margin risk |
| **Demand forecasting** | BI | AI predicts booking volume by season |
| **Auto-categorization** | Lead | AI categorizes inbound leads by event type and urgency |
| **Content generation** | CMS | AI drafts website content, social posts |

### Phase 3: Automation AI Features

| Feature | Module | Description |
|---------|--------|-------------|
| **WhatsApp auto-response** | WhatsApp | AI handles initial client inquiries with human handoff |
| **Smart follow-up** | Lead | AI determines optimal follow-up timing and content |
| **Anomaly detection** | BI | AI flags unusual patterns (spending, cancellations) |

---

## AI Feature Implementation Pattern

Every AI feature follows this flow:

```
1. User triggers AI action (button click, auto-suggest)
2. Application service gathers context (AiContext)
3. AI Platform selects prompt template and provider
4. AI Platform assembles prompt with context
5. Provider returns response
6. AI Platform validates response against schema (Guardrails)
7. Response stored as AiSuggestion (status: 'pending')
8. UI displays suggestion for user review
9. User accepts → applied to domain / rejects → logged
10. Feedback stored for quality improvement
```

### AiSuggestion Entity

```typescript
interface AiSuggestion {
  id: string;
  tenantId: string;
  userId: string;           // Who triggered
  feature: string;           // 'quotation-generate', 'message-draft'
  promptId: string;
  promptVersion: number;
  model: string;
  input: Record<string, unknown>;   // Context sent (sanitized)
  output: Record<string, unknown>;  // AI response
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  acceptedOutput?: Record<string, unknown>;  // If user modified before accepting
  entityType?: string;       // 'quotation', 'lead'
  entityId?: string;         // Linked entity
  createdAt: string;
  resolvedAt?: string;
}
```

**Why track suggestions:** Quality measurement, audit trail, training data for prompt improvement, cost tracking.

---

## Guardrails and Safety

### Output Validation

All structured AI outputs are validated against Zod schemas before presentation:

```typescript
const QuotationSuggestionSchema = z.object({
  lineItems: z.array(z.object({
    description: z.string().min(1).max(500),
    quantity: z.number().positive(),
    unitPrice: z.object({
      amount: z.number().nonnegative(),
      currency: z.string().length(3),
    }),
    reasoning: z.string().optional(),
  })),
  notes: z.string().max(2000).optional(),
});
```

If validation fails: log the failure, show a user-friendly error ("AI suggestion could not be generated, please try again"), never show raw invalid output.

### Content Safety

- No AI-generated content is sent to clients without human review (Phase 1-2)
- AI responses filtered for inappropriate content before display
- PII in AI inputs is minimized (send client ID, not full client record, when possible)
- AI conversations are tenant-scoped and access-controlled

### Cost Controls

| Control | Implementation |
|---------|---------------|
| Per-tenant monthly budget | Configurable token/cost limit in tenant settings |
| Model selection by feature | Simple tasks use cheaper models (GPT-4o-mini) |
| Token counting | Log input/output tokens per request |
| Rate limiting | Max AI requests per user per minute |
| Caching | Cache identical context + prompt combinations (short TTL) |

---

## AI Observability

### Logging

Every AI request logs:

```json
{
  "type": "ai_request",
  "tenantId": "...",
  "userId": "...",
  "feature": "quotation-generate",
  "promptId": "quotation-generate",
  "promptVersion": 1,
  "model": "gpt-4o",
  "inputTokens": 1250,
  "outputTokens": 380,
  "latencyMs": 2300,
  "status": "success",
  "suggestionId": "..."
}
```

### Metrics

| Metric | Purpose |
|--------|---------|
| Requests per feature per tenant | Usage tracking |
| Acceptance rate per feature | Quality measurement |
| Latency p50/p95/p99 | Performance monitoring |
| Cost per tenant per month | Billing and budget |
| Error rate | Reliability |
| Token usage | Cost optimization |

### Quality Improvement Loop

```
Deploy prompt v1 → Measure acceptance rate →
  If < 70%: analyze rejected suggestions → iterate prompt → deploy v2 →
  If ≥ 70%: stable, monitor
```

---

## AI-Assisted Engineering

### Using AI to Build Event OS

AI agents (Cursor, Copilot, etc.) are primary development tools. Standards for AI-generated code:

1. **AI agents must read `/docs` before implementing** — Documentation is the source of truth.
2. **AI-generated code follows [08-coding-standards.md](./08-coding-standards.md)** — No exceptions.
3. **AI agents implement one module at a time** — Respecting module boundaries.
4. **AI agents write tests alongside implementation** — Per [15-testing-strategy.md](./15-testing-strategy.md).
5. **Human review required for all AI-generated code** — No direct merge of AI output without review.

### Prompting AI Agents

When instructing AI agents to build features, provide:

```
Module: Lead
Feature: Pipeline stage transition
Reference docs: 04-business-domain.md, 06-module-design.md, 08-coding-standards.md
Acceptance criteria: [from user story]
Do NOT: import from other modules' internals, skip tenant scoping, use 'any' type
```

### Code Generation Guidelines for AI

- Generate domain entity first, then application service, then infrastructure, then presentation
- Include unit tests for domain logic
- Include integration test for the API endpoint
- Use existing module patterns (read a neighboring module as reference)
- Never generate placeholder implementations — generate complete, working code

---

## Data Model for AI

### Tables

| Table | Purpose |
|-------|---------|
| `ai_conversations` | Chat history for general assistant |
| `ai_suggestions` | All AI suggestions with accept/reject status |
| `prompt_templates` | Versioned prompt definitions |
| `ai_usage_logs` | Token usage and cost tracking per request |

### Data Retention

- AI conversations: 1 year, then archived
- AI suggestions: 2 years (valuable for quality analysis)
- Usage logs: 1 year
- Prompt templates: Indefinite (versioned)

---

## AI Feature Flags

AI features are gated by tenant feature flags:

```typescript
// Tenant settings
{
  "ai": {
    "enabled": true,
    "features": {
      "quotationGenerate": true,
      "messageDraft": true,
      "leadScoring": false,  // Not yet available
      "generalAssistant": true
    },
    "monthlyBudgetCents": 50000,  // $500/month
    "preferredModel": "gpt-4o"
  }
}
```

This allows:
- Gradual rollout of AI features
- Per-tenant AI budget control
- Disabling AI for tenants who prefer manual workflows

---

## Related Documents

| Document | Topic |
|----------|-------|
| [03-product-principles.md](./03-product-principles.md) | AI-first principle |
| [06-module-design.md](./06-module-design.md) | AI Assistant module |
| [08-coding-standards.md](./08-coding-standards.md) | Code standards for AI-generated code |
| [14-security-principles.md](./14-security-principles.md) | AI data security |
| [20-definition-of-done.md](./20-definition-of-done.md) | AI feature completion criteria |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
