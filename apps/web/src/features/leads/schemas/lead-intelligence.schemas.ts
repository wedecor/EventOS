import { z } from 'zod';

const evidenceStatusSchema = z.enum(['explicit', 'inferred', 'unknown']);

const evidencedStringSchema = z.object({
  value: z.string().nullable(),
  evidence: evidenceStatusSchema,
});

const evidencedNumberSchema = z.object({
  value: z.number().nullable(),
  evidence: evidenceStatusSchema,
});

const evidencedBudgetSchema = z.object({
  value: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .nullable(),
  evidence: evidenceStatusSchema,
});

export const leadIntelligenceResultSchema = z.object({
  summary: z.string(),
  eventType: evidencedStringSchema,
  eventDate: z.object({
    start: evidencedStringSchema,
    end: evidencedStringSchema,
  }),
  venue: evidencedStringSchema,
  budget: evidencedBudgetSchema,
  guestCount: evidencedNumberSchema,
  knownRequirements: z.array(z.string()),
  missingInformation: z.array(z.string()),
  suggestedQualificationQuestions: z.array(z.string()),
  suggestedFollowUpPriority: z.enum(['low', 'medium', 'high']),
  confidenceNotes: z.string().nullable(),
});

export const leadIntelligenceResponseSchema = z.object({
  leadId: z.string(),
  generatedAt: z.string(),
  promptVersion: z.string(),
  provider: z.string(),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number().nullable(),
    completionTokens: z.number().nullable(),
    totalTokens: z.number().nullable(),
    estimatedCostUsd: z.number().nullable(),
  }),
  intelligence: leadIntelligenceResultSchema,
  readOnly: z.literal(true),
});

export const leadIntelligenceEnvelopeSchema = z.object({
  data: leadIntelligenceResponseSchema,
});

export type LeadIntelligenceResponse = z.infer<
  typeof leadIntelligenceResponseSchema
>;

export function parseLeadIntelligence(payload: unknown): LeadIntelligenceResponse {
  return leadIntelligenceEnvelopeSchema.parse(payload).data;
}
