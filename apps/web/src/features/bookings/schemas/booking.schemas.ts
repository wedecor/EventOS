import { z } from 'zod';
import type { operations } from '@/types/api.generated';

export type UpdateBookingStatusRequest =
  operations['BookingController_updateBookingStatus']['requestBody']['content']['application/json'];

export type CancelBookingRequest =
  operations['BookingController_cancelBooking']['requestBody']['content']['application/json'];

export type AssignExecutionOwnerRequest =
  operations['BookingController_assignExecutionOwner']['requestBody']['content']['application/json'];

export type AdvanceExecutionStageRequest =
  operations['BookingController_advanceExecutionStage']['requestBody']['content']['application/json'];

const bookingStatusSchema = z.enum([
  'approved',
  'in_preparation',
  'in_execution',
  'completed',
  'cancelled',
]);

const preparationStatusSchema = z.enum([
  'pending',
  'ready',
  'needs_attention',
]);

const workspaceStatusSchema = z.enum(['inactive', 'active', 'archived']);

/** Runtime booking (mirrors BookingDto / Event JSON). */
export const bookingSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  customerId: z.string().min(1),
  leadId: z.string().nullable(),
  quotationId: z.string().min(1),
  bookingNumber: z.number().int(),
  status: bookingStatusSchema,
  eventType: z.string().nullable(),
  eventStartDate: z.union([z.string(), z.date()]).nullable(),
  eventEndDate: z.union([z.string(), z.date()]).nullable(),
  venueName: z.string().nullable(),
  guestCount: z.number().nullable(),
  requirementsNotes: z.string().nullable(),
  workspaceStatus: workspaceStatusSchema,
  preparationStatus: preparationStatusSchema,
  operationalMilestone: z.string().nullable(),
  executionOwnerId: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  completedAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

/**
 * Owner / stage advance responses return WorkspaceDto (not full booking).
 * Refetch booking after these mutations for version + full fields.
 */
export const workspaceSchema = z.object({
  eventId: z.string().min(1),
  workspaceStatus: workspaceStatusSchema,
  preparationStatus: preparationStatusSchema,
  operationalMilestone: z.string().nullable(),
  executionOwnerId: z.string().nullable(),
});

export const bookingEnvelopeSchema = z.object({
  data: bookingSchema,
});

export const workspaceEnvelopeSchema = z.object({
  data: workspaceSchema,
});

export type Booking = z.infer<typeof bookingSchema>;
export type WorkspaceView = z.infer<typeof workspaceSchema>;

export const cancelBookingFormSchema = z.object({
  reason: z.string().trim().min(1, 'Cancellation reason is required'),
});

export type CancelBookingFormValues = z.infer<typeof cancelBookingFormSchema>;

export const assignOwnerFormSchema = z.object({
  executionOwnerId: z
    .string()
    .trim()
    .min(1, 'Required')
    .uuid('Enter a valid staff UUID'),
});

export type AssignOwnerFormValues = z.infer<typeof assignOwnerFormSchema>;

export const advanceStageFormSchema = z.object({
  milestoneKey: z.string().trim().min(1, 'Milestone key is required'),
  preparationStatus: z.union([
    z.literal(''),
    preparationStatusSchema,
  ]),
});

export type AdvanceStageFormValues = z.infer<typeof advanceStageFormSchema>;

export function parseBooking(body: unknown): Booking {
  return bookingEnvelopeSchema.parse(body).data;
}

export function parseWorkspace(body: unknown): WorkspaceView {
  return workspaceEnvelopeSchema.parse(body).data;
}

export function toAdvanceStageRequest(
  values: AdvanceStageFormValues,
): AdvanceExecutionStageRequest {
  return {
    milestoneKey: values.milestoneKey.trim(),
    ...(values.preparationStatus
      ? { preparationStatus: values.preparationStatus }
      : {}),
  };
}
