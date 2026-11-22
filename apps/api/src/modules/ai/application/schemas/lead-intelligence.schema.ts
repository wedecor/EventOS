import { z } from 'zod';

/**
 * M4-AI.1 — validated Lead Intelligence structured output.
 * Every extracted scalar distinguishes explicit | inferred | unknown.
 * Models must not invent dates, budgets, venues, or commitments.
 */

export const evidenceStatusSchema = z.enum(['explicit', 'inferred', 'unknown']);

export const evidencedStringSchema = z.object({
  value: z.string().nullable(),
  evidence: evidenceStatusSchema,
});

export const evidencedNumberSchema = z.object({
  value: z.number().nullable(),
  evidence: evidenceStatusSchema,
});

export const evidencedBudgetSchema = z.object({
  value: z
    .object({
      amount: z.number(),
      currency: z.string(),
    })
    .nullable(),
  evidence: evidenceStatusSchema,
});

export const evidencedDateRangeSchema = z.object({
  start: evidencedStringSchema,
  end: evidencedStringSchema,
});

export const followUpPrioritySchema = z.enum(['low', 'medium', 'high']);

export const leadIntelligenceResultSchema = z.object({
  summary: z.string().min(1),
  eventType: evidencedStringSchema,
  eventDate: evidencedDateRangeSchema,
  venue: evidencedStringSchema,
  budget: evidencedBudgetSchema,
  guestCount: evidencedNumberSchema,
  knownRequirements: z.array(z.string()),
  missingInformation: z.array(z.string()),
  suggestedQualificationQuestions: z.array(z.string()).min(1),
  suggestedFollowUpPriority: followUpPrioritySchema,
  confidenceNotes: z.string().nullable(),
});

export type LeadIntelligenceResult = z.infer<
  typeof leadIntelligenceResultSchema
>;
export type EvidenceStatus = z.infer<typeof evidenceStatusSchema>;

/** JSON Schema for OpenAI strict structured outputs. */
export const leadIntelligenceJsonSchema: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: [
    'summary',
    'eventType',
    'eventDate',
    'venue',
    'budget',
    'guestCount',
    'knownRequirements',
    'missingInformation',
    'suggestedQualificationQuestions',
    'suggestedFollowUpPriority',
    'confidenceNotes',
  ],
  properties: {
    summary: { type: 'string' },
    eventType: {
      type: 'object',
      additionalProperties: false,
      required: ['value', 'evidence'],
      properties: {
        value: { type: ['string', 'null'] },
        evidence: { type: 'string', enum: ['explicit', 'inferred', 'unknown'] },
      },
    },
    eventDate: {
      type: 'object',
      additionalProperties: false,
      required: ['start', 'end'],
      properties: {
        start: {
          type: 'object',
          additionalProperties: false,
          required: ['value', 'evidence'],
          properties: {
            value: { type: ['string', 'null'] },
            evidence: {
              type: 'string',
              enum: ['explicit', 'inferred', 'unknown'],
            },
          },
        },
        end: {
          type: 'object',
          additionalProperties: false,
          required: ['value', 'evidence'],
          properties: {
            value: { type: ['string', 'null'] },
            evidence: {
              type: 'string',
              enum: ['explicit', 'inferred', 'unknown'],
            },
          },
        },
      },
    },
    venue: {
      type: 'object',
      additionalProperties: false,
      required: ['value', 'evidence'],
      properties: {
        value: { type: ['string', 'null'] },
        evidence: { type: 'string', enum: ['explicit', 'inferred', 'unknown'] },
      },
    },
    budget: {
      type: 'object',
      additionalProperties: false,
      required: ['value', 'evidence'],
      properties: {
        value: {
          anyOf: [
            {
              type: 'object',
              additionalProperties: false,
              required: ['amount', 'currency'],
              properties: {
                amount: { type: 'number' },
                currency: { type: 'string' },
              },
            },
            { type: 'null' },
          ],
        },
        evidence: { type: 'string', enum: ['explicit', 'inferred', 'unknown'] },
      },
    },
    guestCount: {
      type: 'object',
      additionalProperties: false,
      required: ['value', 'evidence'],
      properties: {
        value: { type: ['number', 'null'] },
        evidence: { type: 'string', enum: ['explicit', 'inferred', 'unknown'] },
      },
    },
    knownRequirements: {
      type: 'array',
      items: { type: 'string' },
    },
    missingInformation: {
      type: 'array',
      items: { type: 'string' },
    },
    suggestedQualificationQuestions: {
      type: 'array',
      items: { type: 'string' },
    },
    suggestedFollowUpPriority: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
    },
    confidenceNotes: { type: ['string', 'null'] },
  },
};
