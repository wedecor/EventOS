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

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD calendar date.')
  .refine(
    (value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()),
    'Not a valid calendar date.',
  );

// M5-01 — edit booking details. Synced bookings reject real changes (409 SOURCE_OWNED).
export const updateBookingDetailsSchema = z
  .object({
    eventType: z.string().min(1).max(100).nullable().optional(),
    eventStartDate: calendarDateSchema.nullable().optional(),
    eventEndDate: calendarDateSchema.nullable().optional(),
    venueName: z.string().max(500).nullable().optional(),
    guestCount: z
      .number()
      .int()
      .nonnegative()
      .max(1_000_000)
      .nullable()
      .optional(),
    requirementsNotes: z.string().max(8000).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required.',
  });

export type UpdateBookingDetailsBody = z.infer<
  typeof updateBookingDetailsSchema
>;
