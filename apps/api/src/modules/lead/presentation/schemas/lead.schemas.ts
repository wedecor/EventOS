import { z } from 'zod';

export const createLeadSchema = z.object({
  source: z.enum([
    'website',
    'instagram',
    'whatsapp',
    'referral',
    'walk_in',
    'phone',
    'manual',
    'other',
  ]),
  sourceDetail: z.string().nullish(),
  eventType: z.string().nullish(),
  eventDate: z
    .object({
      start: z.string().date(),
      end: z.string().date(),
    })
    .nullish(),
  venue: z.string().nullish(),
  estimatedBudget: z
    .object({
      amount: z.number().min(0),
      currency: z.string().default('INR'),
    })
    .nullish(),
  guestCount: z.number().int().min(0).nullish(),
  notes: z.string().nullish(),
});

export const changeLeadStageSchema = z.object({
  stage: z.enum(['in_talks', 'approved', 'completed', 'lost', 'cancelled']),
  lostReason: z.string().nullish(),
  reason: z.string().nullish(),
});

export const assignLeadSchema = z.object({
  staffId: z.string().uuid(),
});

export const createFollowUpSchema = z.object({
  dueAt: z.string().datetime(),
  notes: z.string().nullish(),
});

export const updateFollowUpSchema = z.object({
  status: z.enum(['pending', 'done', 'cancelled']).optional(),
  dueAt: z.string().datetime().nullish(),
  comment: z.string().nullish(),
});

export type CreateLeadBody = z.infer<typeof createLeadSchema>;
export type ChangeLeadStageBody = z.infer<typeof changeLeadStageSchema>;
export type AssignLeadBody = z.infer<typeof assignLeadSchema>;
export type CreateFollowUpBody = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpBody = z.infer<typeof updateFollowUpSchema>;
