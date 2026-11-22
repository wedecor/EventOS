import { OpenAiLlmAdapter } from './adapters/openai-llm.adapter';
import { sharedTestLlmAdapter } from './adapters/test-llm.adapter';
import { LlmProviderError, type LlmPort } from './llm.port';

export type LlmEnv = {
  AI_PROVIDER?: string;
  AI_MODEL?: string;
  AI_API_KEY?: string;
  AI_TIMEOUT_MS?: string | number;
  AI_MAX_RETRIES?: string | number;
  AI_INPUT_PRICE_PER_1M?: string | number;
  AI_OUTPUT_PRICE_PER_1M?: string | number;
};

export function createLlmPort(env: LlmEnv = process.env): LlmPort {
  const provider = (env.AI_PROVIDER ?? 'test').toLowerCase();
  const model = env.AI_MODEL ?? 'gpt-4o-mini';

  if (provider === 'openai') {
    const apiKey = env.AI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('AI_PROVIDER=openai requires AI_API_KEY');
    }
    return new OpenAiLlmAdapter({
      apiKey,
      model,
      timeoutMs: Number(env.AI_TIMEOUT_MS ?? 30_000),
      maxRetries: Number(env.AI_MAX_RETRIES ?? 1),
      pricing: {
        inputPricePer1M:
          env.AI_INPUT_PRICE_PER_1M != null
            ? Number(env.AI_INPUT_PRICE_PER_1M)
            : undefined,
        outputPricePer1M:
          env.AI_OUTPUT_PRICE_PER_1M != null
            ? Number(env.AI_OUTPUT_PRICE_PER_1M)
            : undefined,
      },
    });
  }

  if (provider === 'none') {
    return {
      providerName: 'none',
      model,
      completeStructured() {
        return Promise.reject(
          new LlmProviderError(
            'LLM provider is disabled (AI_PROVIDER=none).',
            'DISABLED',
          ),
        );
      },
    };
  }

  return sharedTestLlmAdapter;
}
