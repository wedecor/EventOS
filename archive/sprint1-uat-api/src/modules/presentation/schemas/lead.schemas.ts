import { z } from 'zod';

const leadSource = z.enum([
  'website',
  'instagram',
  'whatsapp',
  'referral',
  'walk_in',
  'phone',
  'manual',
  'other',
]);

const leadStage = z.enum([
  'new',
  'in_talks',
  'approved',
  'completed',
  'lost',
  'cancelled',
]);

export const createLeadBodySchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  source: leadSource,
  sourceDetail: z.string().nullable().optional(),
  eventType: z.string().nullable().optional(),
  eventStartDate: z.coerce.date().nullable().optional(),
  eventEndDate: z.coerce.date().nullable().optional(),
  venue: z.string().nullable().optional(),
  estimatedBudgetAmount: z.number().nullable().optional(),
  estimatedBudgetCurrency: z.string().optional(),
  guestCount: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateLeadBodySchema = createLeadBodySchema
  .omit({ source: true })
  .partial()
  .extend({ source: leadSource.optional() });

export const changeLeadStageBodySchema = z.object({
  stage: leadStage,
  version: z.number().int().positive(),
  lostReason: z.string().nullable().optional(),
  changedById: z.string().uuid().nullable().optional(),
  reason: z.string().nullable().optional(),
});

export const assignLeadBodySchema = z.object({
  assigneeId: z.string().uuid(),
  version: z.number().int().positive(),
});

export const scheduleFollowUpBodySchema = z.object({
  dueAt: z.coerce.date(),
  notes: z.string().nullable().optional(),
});
