import type { LeadIntelligenceResult } from '../schemas/lead-intelligence.schema';

export type LeadIntelligenceResponseDto = {
  leadId: string;
  generatedAt: string;
  promptVersion: string;
  provider: string;
  model: string;
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    estimatedCostUsd: number | null;
  };
  intelligence: LeadIntelligenceResult;
  /** Read-only — never applied to the lead automatically. */
  readOnly: true;
};
