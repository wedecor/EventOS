import { z } from 'zod';

const preparationStatusSchema = z.enum([
  'pending',
  'ready',
  'needs_attention',
]);

const workspaceStatusSchema = z.enum(['inactive', 'active', 'archived']);

/**
 * Runtime workspace view (mirrors WorkspaceDto).
 * GET /bookings/:id/workspace — no embedded tasks/staff/finance.
 */
export const workspaceViewSchema = z.object({
  eventId: z.string().min(1),
  workspaceStatus: workspaceStatusSchema,
  preparationStatus: preparationStatusSchema,
  operationalMilestone: z.string().nullable(),
  executionOwnerId: z.string().nullable(),
});

export const workspaceViewEnvelopeSchema = z.object({
  data: workspaceViewSchema,
});

export type WorkspaceView = z.infer<typeof workspaceViewSchema>;

export function parseWorkspaceView(body: unknown): WorkspaceView {
  return workspaceViewEnvelopeSchema.parse(body).data;
}

export const workspaceProgressSchema = z.object({
  eventId: z.string().min(1),
  overallCompletionPercent: z.number().int().nonnegative(),
  tasksComplete: z.number().int().nonnegative(),
  tasksTotal: z.number().int().nonnegative(),
  checklistComplete: z.number().int().nonnegative(),
  checklistTotal: z.number().int().nonnegative(),
  pendingActions: z.number().int().nonnegative(),
  inventory: z.object({
    reserved: z.number().int().nonnegative(),
    packed: z.number().int().nonnegative(),
    loaded: z.number().int().nonnegative(),
    returned: z.number().int().nonnegative(),
    damaged: z.number().int().nonnegative(),
    outstandingActions: z.number().int().nonnegative().optional(),
  }),
  financeDocuments: z
    .object({
      total: z.number().int().nonnegative(),
      pendingVerification: z.number().int().nonnegative(),
      verified: z.number().int().nonnegative(),
      rejected: z.number().int().nonnegative(),
      missingPaymentProofs: z.number().int().nonnegative(),
      outstandingActions: z.number().int().nonnegative(),
    })
    .optional(),
  communications: z
    .object({
      total: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
      pendingReminders: z.number().int().nonnegative(),
      overdueReminders: z.number().int().nonnegative(),
      outstandingActions: z.number().int().nonnegative(),
    })
    .optional(),
});

export const workspaceProgressEnvelopeSchema = z.object({
  data: workspaceProgressSchema,
});

export type WorkspaceProgress = z.infer<typeof workspaceProgressSchema>;

export function parseWorkspaceProgress(body: unknown): WorkspaceProgress {
  return workspaceProgressEnvelopeSchema.parse(body).data;
}

export const workspaceActivityItemSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  occurredAt: z.union([z.string(), z.date()]),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export const workspaceActivityEnvelopeSchema = z.object({
  data: z.array(workspaceActivityItemSchema),
});

export type WorkspaceActivityItem = z.infer<typeof workspaceActivityItemSchema>;

export function parseWorkspaceActivity(body: unknown): WorkspaceActivityItem[] {
  return workspaceActivityEnvelopeSchema.parse(body).data;
}

export const eventNoteSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  body: z.string().min(1),
  createdByUserId: z.string().min(1),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const eventNoteListEnvelopeSchema = z.object({
  data: z.array(eventNoteSchema),
});

export const eventNoteEnvelopeSchema = z.object({
  data: eventNoteSchema,
});

export type EventNote = z.infer<typeof eventNoteSchema>;

export function parseEventNoteList(body: unknown): EventNote[] {
  return eventNoteListEnvelopeSchema.parse(body).data;
}

export function parseEventNote(body: unknown): EventNote {
  return eventNoteEnvelopeSchema.parse(body).data;
}

export type CreateEventNoteRequest = {
  body: string;
};
