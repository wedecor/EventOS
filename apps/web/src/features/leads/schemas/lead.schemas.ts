import { z } from 'zod';
import type { operations } from '@/types/api.generated';

export type CreateLeadRequest =
  operations['LeadController_createLead']['requestBody']['content']['application/json'];

export type ChangeLeadStageRequest =
  operations['LeadController_changeLeadStage']['requestBody']['content']['application/json'];

export type AssignLeadRequest =
  operations['LeadController_assignLead']['requestBody']['content']['application/json'];

export type CreateFollowUpRequest =
  operations['LeadController_scheduleFollowUp']['requestBody']['content']['application/json'];

export const LEAD_SOURCES = [
  'website',
  'instagram',
  'whatsapp',
  'referral',
  'walk_in',
  'phone',
  'manual',
  'other',
] as const;

export const LEAD_STAGES = [
  'new',
  'in_talks',
  'approved',
  'completed',
  'lost',
  'cancelled',
] as const;

/** Allowed next stages (mirrors backend lead-stage.rules — UI only disables invalid picks). */
export const LEAD_STAGE_TRANSITIONS: Record<
  (typeof LEAD_STAGES)[number],
  readonly (typeof LEAD_STAGES)[number][]
> = {
  new: ['in_talks', 'lost', 'cancelled'],
  in_talks: ['approved', 'lost', 'cancelled'],
  approved: ['completed', 'cancelled'],
  completed: [],
  lost: [],
  cancelled: [],
};

export const leadSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  customerId: z.string().nullable(),
  assignedToId: z.string().nullable(),
  source: z.string().min(1),
  sourceDetail: z.string().nullable(),
  stage: z.enum(LEAD_STAGES),
  lostReason: z.string().nullable(),
  eventType: z.string().nullable(),
  eventStartDate: z.union([z.string(), z.null()]),
  eventEndDate: z.union([z.string(), z.null()]),
  venue: z.string().nullable(),
  estimatedBudgetAmount: z.number().nullable(),
  estimatedBudgetCurrency: z.string().min(1),
  guestCount: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const leadListEnvelopeSchema = z.object({
  data: z.array(leadSchema),
});

export const leadEnvelopeSchema = z.object({
  data: leadSchema,
});

export const followUpSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  leadId: z.string().min(1),
  dueAt: z.union([z.string(), z.date()]),
  notes: z.string().nullable(),
  status: z.string().min(1),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const followUpEnvelopeSchema = z.object({
  data: followUpSchema,
});

export type Lead = z.infer<typeof leadSchema>;
export type FollowUp = z.infer<typeof followUpSchema>;

export const createLeadFormSchema = z.object({
  source: z.enum(LEAD_SOURCES),
  sourceDetail: z.string().optional(),
  eventType: z.string().optional(),
  eventStart: z.string().optional(),
  eventEnd: z.string().optional(),
  venue: z.string().optional(),
  estimatedBudgetAmount: z.string().optional(),
  guestCount: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateLeadFormValues = z.infer<typeof createLeadFormSchema>;

export const changeStageFormSchema = z.object({
  stage: z.enum(['in_talks', 'approved', 'completed', 'lost', 'cancelled']),
  lostReason: z.string().optional(),
  reason: z.string().optional(),
});

export type ChangeStageFormValues = z.infer<typeof changeStageFormSchema>;

export const assignLeadFormSchema = z.object({
  staffId: z.string().uuid('Enter a valid staff UUID'),
});

export type AssignLeadFormValues = z.infer<typeof assignLeadFormSchema>;

export const scheduleFollowUpFormSchema = z.object({
  dueAt: z.string().min(1, 'Due date/time is required'),
  notes: z.string().optional(),
});

export type ScheduleFollowUpFormValues = z.infer<typeof scheduleFollowUpFormSchema>;

export function parseLeadList(body: unknown): Lead[] {
  return leadListEnvelopeSchema.parse(body).data;
}

export function parseLead(body: unknown): Lead {
  return leadEnvelopeSchema.parse(body).data;
}

export function parseFollowUp(body: unknown): FollowUp {
  return followUpEnvelopeSchema.parse(body).data;
}

export function toCreateLeadRequest(values: CreateLeadFormValues): CreateLeadRequest {
  const amountRaw = values.estimatedBudgetAmount?.trim();
  const guestRaw = values.guestCount?.trim();
  const start = values.eventStart?.trim();
  const end = values.eventEnd?.trim();

  return {
    source: values.source,
    ...(values.sourceDetail?.trim()
      ? { sourceDetail: values.sourceDetail.trim() }
      : {}),
    ...(values.eventType?.trim() ? { eventType: values.eventType.trim() } : {}),
    ...(start && end ? { eventDate: { start, end } } : {}),
    ...(values.venue?.trim() ? { venue: values.venue.trim() } : {}),
    ...(amountRaw
      ? {
          estimatedBudget: {
            amount: Number(amountRaw),
            currency: 'INR',
          },
        }
      : {}),
    ...(guestRaw ? { guestCount: Number(guestRaw) } : {}),
    ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
  };
}

export function allowedStagesFrom(
  current: Lead['stage'],
): readonly ChangeStageFormValues['stage'][] {
  return LEAD_STAGE_TRANSITIONS[current] as readonly ChangeStageFormValues['stage'][];
}
