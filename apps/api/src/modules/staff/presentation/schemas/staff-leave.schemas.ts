import { z } from 'zod';

const leaveTypeSchema = z.enum([
  'casual',
  'sick',
  'vacation',
  'emergency',
  'other',
]);

const leaveStatusSchema = z.enum([
  'requested',
  'approved',
  'rejected',
  'cancelled',
]);

export const createStaffLeaveSchema = z.object({
  staffMemberId: z.string().uuid(),
  leaveType: leaveTypeSchema,
  startDate: z.string().date(),
  endDate: z.string().date(),
  reason: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const reviewStaffLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
  notes: z.string().max(2000).nullable().optional(),
});

export const listStaffLeaveQuerySchema = z.object({
  staffMemberId: z.string().uuid(),
  status: leaveStatusSchema.optional(),
});

export type CreateStaffLeaveBody = z.infer<typeof createStaffLeaveSchema>;
export type ReviewStaffLeaveBody = z.infer<typeof reviewStaffLeaveSchema>;
export type ListStaffLeaveQuery = z.infer<typeof listStaffLeaveQuerySchema>;
