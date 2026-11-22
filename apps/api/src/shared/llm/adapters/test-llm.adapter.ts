import type {
  LlmPort,
  LlmStructuredRequest,
  LlmStructuredResult,
} from '../llm.port';
import { LlmProviderError } from '../llm.port';

export type TestLlmBehavior =
  | { mode: 'echo-context' }
  | { mode: 'invalid-json' }
  | { mode: 'timeout' }
  | { mode: 'failure' }
  | { mode: 'fixed'; content: string };

/**
 * Deterministic in-process adapter for CI and local development.
 * Distinct from live OpenAI verification — never calls the network.
 */
export class TestLlmAdapter implements LlmPort {
  readonly providerName = 'test';
  readonly model: string;

  behavior: TestLlmBehavior = { mode: 'echo-context' };
  lastRequest: LlmStructuredRequest | null = null;
  callCount = 0;

  constructor(model = 'test-model') {
    this.model = model;
  }

  reset(): void {
    this.behavior = { mode: 'echo-context' };
    this.lastRequest = null;
    this.callCount = 0;
  }

  completeStructured(
    request: LlmStructuredRequest,
  ): Promise<LlmStructuredResult> {
    this.callCount += 1;
    this.lastRequest = request;

    if (this.behavior.mode === 'timeout') {
      return Promise.reject(
        new LlmProviderError('Test LLM timed out.', 'TIMEOUT'),
      );
    }
    if (this.behavior.mode === 'failure') {
      return Promise.reject(
        new LlmProviderError('Test LLM provider failure.', 'PROVIDER_ERROR'),
      );
    }
    if (this.behavior.mode === 'invalid-json') {
      return Promise.resolve({
        provider: this.providerName,
        model: this.model,
        content: 'not-json{{{',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
        estimatedCostUsd: null,
      });
    }
    if (this.behavior.mode === 'fixed') {
      return Promise.resolve({
        provider: this.providerName,
        model: this.model,
        content: this.behavior.content,
        usage: {
          promptTokens: 20,
          completionTokens: 40,
          totalTokens: 60,
        },
        estimatedCostUsd: null,
      });
    }

    const userMessage =
      [...request.messages].reverse().find((m) => m.role === 'user')?.content ??
      '';
    const content = buildDeterministicLeadIntelligence(userMessage);
    return Promise.resolve({
      provider: this.providerName,
      model: this.model,
      content: JSON.stringify(content),
      usage: {
        promptTokens: 50,
        completionTokens: 120,
        totalTokens: 170,
      },
      estimatedCostUsd: null,
    });
  }
}

/** Shared singleton used when AI_PROVIDER=test so specs can configure behavior. */
export const sharedTestLlmAdapter = new TestLlmAdapter();

/**
 * Builds evidence-aware intelligence from authorized context JSON embedded in
 * the user message. Never invents dates/budgets/venues — only mirrors present fields.
 */
export function buildDeterministicLeadIntelligence(
  userMessage: string,
): Record<string, unknown> {
  let context: {
    lead?: Record<string, unknown>;
    customer?: Record<string, unknown> | null;
    communications?: unknown[];
  } = {};

  const match = userMessage.match(
    /<authorized_lead_context>\s*([\s\S]*?)\s*<\/authorized_lead_context>/,
  );
  if (match?.[1]) {
    try {
      context = JSON.parse(match[1]) as typeof context;
    } catch {
      context = {};
    }
  }

  const lead = context.lead ?? {};
  const field = (
    value: unknown,
    formatter?: (v: unknown) => unknown,
  ): { value: unknown; evidence: 'explicit' | 'unknown' } => {
    if (value === null || value === undefined || value === '') {
      return { value: null, evidence: 'unknown' };
    }
    return {
      value: formatter ? formatter(value) : value,
      evidence: 'explicit',
    };
  };

  const eventType = field(lead.eventType);
  const eventStart = field(lead.eventStartDate);
  const eventEnd = field(lead.eventEndDate);
  const venue = field(lead.venue);
  const budget = field(
    lead.estimatedBudgetAmount != null
      ? {
          amount: lead.estimatedBudgetAmount,
          currency: lead.estimatedBudgetCurrency ?? 'INR',
        }
      : null,
  );
  const guestCount = field(lead.guestCount);

  const missing: string[] = [];
  if (eventType.evidence === 'unknown') missing.push('eventType');
  if (eventStart.evidence === 'unknown') missing.push('eventDate');
  if (venue.evidence === 'unknown') missing.push('venue');
  if (budget.evidence === 'unknown') missing.push('budget');
  if (guestCount.evidence === 'unknown') missing.push('guestCount');

  const requirements: string[] = [];
  if (typeof lead.notes === 'string' && lead.notes.trim().length > 0) {
    requirements.push('See lead notes (untrusted customer/staff text).');
  }

  const questions: string[] = [];
  if (missing.includes('eventDate')) {
    questions.push('What is the preferred event date (or date range)?');
  }
  if (missing.includes('venue')) {
    questions.push('Is the venue confirmed, and what is the location?');
  }
  if (missing.includes('budget')) {
    questions.push('What is the approximate décor budget?');
  }
  if (missing.includes('guestCount')) {
    questions.push('How many guests are expected?');
  }
  if (questions.length === 0) {
    questions.push('Are there any special décor themes or must-have items?');
  }

  const priority =
    missing.length >= 3 ? 'high' : missing.length >= 1 ? 'medium' : 'low';

  const customerName =
    context.customer &&
    typeof (context.customer as { displayName?: string }).displayName ===
      'string'
      ? (context.customer as { displayName: string }).displayName
      : null;

  const asText = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  };
  const eventTypeText = asText(eventType.value);
  const eventStartText = asText(eventStart.value);

  const summaryParts = [
    customerName ? `Lead for ${customerName}` : 'Lead enquiry',
    eventTypeText ? `(${eventTypeText})` : '(event type unknown)',
    eventStartText ? `starting ${eventStartText.slice(0, 10)}` : 'date unknown',
  ];

  return {
    summary: summaryParts.join(' '),
    eventType,
    eventDate: {
      start: eventStart,
      end: eventEnd,
    },
    venue,
    budget,
    guestCount,
    knownRequirements: requirements,
    missingInformation: missing,
    suggestedQualificationQuestions: questions,
    suggestedFollowUpPriority: priority,
    confidenceNotes:
      'Test adapter: values mirrored from authorized structured fields only; untrusted message text was not used to invent facts.',
  };
}
