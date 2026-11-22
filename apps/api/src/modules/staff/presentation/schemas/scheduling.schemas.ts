import { z } from 'zod';

export const schedulingCalendarQuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
  staffMemberId: z.string().uuid().optional(),
  view: z.enum(['day', 'week', 'month']).optional(),
});

export const schedulingWorkloadQuerySchema = z.object({
  staffMemberId: z.string().uuid().optional(),
});

export const schedulingConflictsQuerySchema = z.object({
  staffMemberId: z.string().uuid(),
  bookingId: z.string().uuid(),
  excludeAssignmentId: z.string().uuid().optional(),
});

export const schedulingRecommendationsQuerySchema = z.object({
  bookingId: z.string().uuid(),
});

export type SchedulingCalendarQuery = z.infer<
  typeof schedulingCalendarQuerySchema
>;
export type SchedulingWorkloadQuery = z.infer<
  typeof schedulingWorkloadQuerySchema
>;
export type SchedulingConflictsQuery = z.infer<
  typeof schedulingConflictsQuerySchema
>;
export type SchedulingRecommendationsQuery = z.infer<
  typeof schedulingRecommendationsQuerySchema
>;
