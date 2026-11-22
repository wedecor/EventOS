export type LlmPricingConfig = {
  inputPricePer1M?: number;
  outputPricePer1M?: number;
};

export function estimateLlmCostUsd(
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
  },
  pricing: LlmPricingConfig,
): number | null {
  if (
    pricing.inputPricePer1M == null ||
    pricing.outputPricePer1M == null ||
    usage.promptTokens == null ||
    usage.completionTokens == null
  ) {
    return null;
  }

  const input =
    (usage.promptTokens / 1_000_000) * pricing.inputPricePer1M;
  const output =
    (usage.completionTokens / 1_000_000) * pricing.outputPricePer1M;
  return Math.round((input + output) * 1_000_000) / 1_000_000;
}
