import { z } from 'zod';

export const createStaffAssignmentSchema = z.object({
  bookingId: z.string().uuid(),
  staffMemberId: z.string().uuid(),
  role: z.string().min(1).optional(),
  isOnSiteLead: z.boolean().optional(),
  reportingAt: z.string().datetime().optional(),
  note: z.string().optional(),
});

export const confirmStaffAssignmentSchema = z.object({});

export const releaseStaffAssignmentSchema = z.object({});

export const cancelStaffAssignmentSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required.'),
});

export type CreateStaffAssignmentBody = z.infer<
  typeof createStaffAssignmentSchema
>;
export type ConfirmStaffAssignmentBody = z.infer<
  typeof confirmStaffAssignmentSchema
>;
export type ReleaseStaffAssignmentBody = z.infer<
  typeof releaseStaffAssignmentSchema
>;
export type CancelStaffAssignmentBody = z.infer<
  typeof cancelStaffAssignmentSchema
>;
