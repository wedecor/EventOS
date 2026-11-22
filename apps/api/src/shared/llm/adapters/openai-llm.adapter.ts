import { estimateLlmCostUsd, type LlmPricingConfig } from '../cost-estimator';
import {
  LlmProviderError,
  type LlmPort,
  type LlmStructuredRequest,
  type LlmStructuredResult,
} from '../llm.port';

export type OpenAiLlmAdapterOptions = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  pricing?: LlmPricingConfig;
  /** Override for tests. */
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

export class OpenAiLlmAdapter implements LlmPort {
  readonly providerName = 'openai';
  readonly model: string;

  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly pricing: LlmPricingConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;

  constructor(options: OpenAiLlmAdapterOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.timeoutMs = options.timeoutMs;
    this.maxRetries = options.maxRetries;
    this.pricing = options.pricing ?? {};
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
  }

  async completeStructured(
    request: LlmStructuredRequest,
  ): Promise<LlmStructuredResult> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.invokeOnce(request);
      } catch (error: unknown) {
        lastError = error;
        if (
          error instanceof LlmProviderError &&
          (error.code === 'TIMEOUT' || error.code === 'RATE_LIMITED') &&
          attempt < this.maxRetries
        ) {
          continue;
        }
        throw error;
      }
    }

    throw lastError instanceof LlmProviderError
      ? lastError
      : new LlmProviderError(
          'OpenAI request failed after retries.',
          'PROVIDER_ERROR',
          lastError,
        );
  }

  private async invokeOnce(
    request: LlmStructuredRequest,
  ): Promise<LlmStructuredResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(
        `${this.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.model,
            temperature: request.temperature ?? 0,
            messages: request.messages,
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: request.schemaName,
                strict: true,
                schema: request.jsonSchema,
              },
            },
          }),
        },
      );

      if (response.status === 429) {
        throw new LlmProviderError('OpenAI rate limited.', 'RATE_LIMITED');
      }

      if (!response.ok) {
        throw new LlmProviderError(
          `OpenAI HTTP ${response.status}`,
          'PROVIDER_ERROR',
        );
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
        model?: string;
      };

      const content = payload.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new LlmProviderError(
          'OpenAI returned empty content.',
          'INVALID_RESPONSE',
        );
      }

      const usage = {
        promptTokens: payload.usage?.prompt_tokens ?? null,
        completionTokens: payload.usage?.completion_tokens ?? null,
        totalTokens: payload.usage?.total_tokens ?? null,
      };

      return {
        provider: this.providerName,
        model: payload.model ?? this.model,
        content,
        usage,
        estimatedCostUsd: estimateLlmCostUsd(usage, this.pricing),
      };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.message.includes('aborted'))
      ) {
        throw new LlmProviderError('OpenAI request timed out.', 'TIMEOUT', error);
      }
      if (error instanceof LlmProviderError) {
        throw error;
      }
      throw new LlmProviderError(
        'OpenAI request failed.',
        'PROVIDER_ERROR',
        error,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
