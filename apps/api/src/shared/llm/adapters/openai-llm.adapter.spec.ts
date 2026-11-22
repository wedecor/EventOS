import { OpenAiLlmAdapter } from './openai-llm.adapter';

describe('OpenAiLlmAdapter', () => {
  it('posts chat completions with structured schema and captures usage', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          model: 'gpt-4o-mini',
          choices: [{ message: { content: '{"ok":true}' } }],
          usage: {
            prompt_tokens: 11,
            completion_tokens: 7,
            total_tokens: 18,
          },
        }),
    });

    const adapter = new OpenAiLlmAdapter({
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
      timeoutMs: 5_000,
      maxRetries: 0,
      pricing: { inputPricePer1M: 0.15, outputPricePer1M: 0.6 },
      fetchImpl: fetchImpl as never,
      baseUrl: 'https://example.test/v1',
    });

    const result = await adapter.completeStructured({
      messages: [{ role: 'user', content: 'hi' }],
      schemaName: 'lead_intelligence',
      jsonSchema: { type: 'object' },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );
    expect(result.content).toBe('{"ok":true}');
    expect(result.usage.totalTokens).toBe(18);
    expect(result.estimatedCostUsd).not.toBeNull();
  });

  it('maps HTTP failures to PROVIDER_ERROR', async () => {
    const adapter = new OpenAiLlmAdapter({
      apiKey: 'sk-test',
      model: 'gpt-4o-mini',
      timeoutMs: 5_000,
      maxRetries: 0,
      fetchImpl: jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }) as never,
    });

    await expect(
      adapter.completeStructured({
        messages: [{ role: 'user', content: 'hi' }],
        schemaName: 'x',
        jsonSchema: {},
      }),
    ).rejects.toMatchObject({ code: 'PROVIDER_ERROR' });
  });
});
