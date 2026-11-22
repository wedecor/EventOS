export const LLM_PORT = Symbol('LLM_PORT');

export type LlmChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmUsage = {
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
};

export type LlmStructuredRequest = {
  messages: LlmChatMessage[];
  /** OpenAI-style JSON Schema name for structured outputs. */
  schemaName: string;
  /** JSON Schema object (draft compatible with OpenAI response_format). */
  jsonSchema: Record<string, unknown>;
  temperature?: number;
};

export type LlmStructuredResult = {
  provider: string;
  model: string;
  /** Raw model text (JSON string). */
  content: string;
  usage: LlmUsage;
  estimatedCostUsd: number | null;
};

export class LlmProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'TIMEOUT'
      | 'PROVIDER_ERROR'
      | 'DISABLED'
      | 'INVALID_RESPONSE'
      | 'RATE_LIMITED',
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'LlmProviderError';
  }
}

export interface LlmPort {
  readonly providerName: string;
  readonly model: string;
  completeStructured(
    request: LlmStructuredRequest,
  ): Promise<LlmStructuredResult>;
}
