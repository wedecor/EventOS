import { z } from 'zod';

export const activateWorkspaceSchema = z.object({});

export type ActivateWorkspaceBody = z.infer<typeof activateWorkspaceSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required.'),
});

export type CancelBookingBody = z.infer<typeof cancelBookingSchema>;

export const completeBookingSchema = z.object({});

export type CompleteBookingBody = z.infer<typeof completeBookingSchema>;

export const assignExecutionOwnerSchema = z.object({
  executionOwnerId: z.string().uuid('executionOwnerId must be a valid UUID.'),
});

export type AssignExecutionOwnerBody = z.infer<
  typeof assignExecutionOwnerSchema
>;

export const advanceExecutionStageSchema = z.object({
  milestoneKey: z.string().min(1, 'Milestone key is required.'),
  preparationStatus: z.enum(['pending', 'ready', 'needs_attention']).optional(),
});

export type AdvanceExecutionStageBody = z.infer<
  typeof advanceExecutionStageSchema
>;

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    'approved',
    'in_preparation',
    'in_execution',
    'completed',
    'cancelled',
  ]),
});

export type UpdateBookingStatusBody = z.infer<typeof updateBookingStatusSchema>;

export const createEventNoteSchema = z.object({
  body: z.string().min(1, 'Note body is required.'),
});

export type CreateEventNoteBody = z.infer<typeof createEventNoteSchema>;
