import { estimateLlmCostUsd } from './cost-estimator';

describe('estimateLlmCostUsd', () => {
  it('returns null when pricing is incomplete', () => {
    expect(
      estimateLlmCostUsd(
        { promptTokens: 1000, completionTokens: 500 },
        { inputPricePer1M: 0.15 },
      ),
    ).toBeNull();
  });

  it('estimates cost from token usage when pricing is configured', () => {
    const cost = estimateLlmCostUsd(
      { promptTokens: 1_000_000, completionTokens: 1_000_000 },
      { inputPricePer1M: 0.15, outputPricePer1M: 0.6 },
    );
    expect(cost).toBe(0.75);
  });
});
