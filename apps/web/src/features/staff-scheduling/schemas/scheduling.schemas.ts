import { z } from 'zod';

const envelope = <T extends z.ZodType>(data: T) => z.object({ data });

const dateLike = z.union([z.string(), z.date()]);

export const staffAvailabilitySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  staffMemberId: z.string().min(1),
  date: dateLike.nullable(),
  weekday: z.number().int().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  kind: z.enum(['available', 'unavailable', 'partial_day', 'holiday']),
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int(),
});

export const staffLeaveSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  staffMemberId: z.string().min(1),
  leaveType: z.enum(['casual', 'sick', 'vacation', 'emergency', 'other']),
  status: z.enum(['requested', 'approved', 'rejected', 'cancelled']),
  startDate: dateLike,
  endDate: dateLike,
  reason: z.string().nullable(),
  notes: z.string().nullable(),
  reviewedByUserId: z.string().nullable(),
  reviewedAt: dateLike.nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int(),
});

export const schedulingConflictSchema = z.object({
  code: z.enum([
    'overlapping_assignment',
    'approved_leave',
    'unavailable',
    'staff_inactive',
  ]),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const staffWorkloadSchema = z.object({
  staffMemberId: z.string().min(1),
  name: z.string(),
  employmentType: z.string(),
  status: z.string(),
  eventsToday: z.number(),
  eventsThisWeek: z.number(),
  eventsThisMonth: z.number(),
  upcomingConfirmed: z.number(),
});

export const schedulingCalendarEntrySchema = z.object({
  type: z.enum(['assignment', 'leave', 'availability']),
  staffMemberId: z.string().min(1),
  staffName: z.string(),
  date: z.string(),
  endDate: z.string().optional(),
  label: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const staffRecommendationSchema = z.object({
  staffMemberId: z.string().min(1),
  name: z.string(),
  employmentType: z.string(),
  operationalRole: z.string(),
  score: z.number(),
  reasons: z.array(z.string()),
  conflicts: z.array(schedulingConflictSchema),
});

export type StaffAvailability = z.infer<typeof staffAvailabilitySchema>;
export type StaffLeave = z.infer<typeof staffLeaveSchema>;
export type SchedulingConflict = z.infer<typeof schedulingConflictSchema>;
export type StaffWorkload = z.infer<typeof staffWorkloadSchema>;
export type SchedulingCalendarEntry = z.infer<
  typeof schedulingCalendarEntrySchema
>;
export type StaffRecommendation = z.infer<typeof staffRecommendationSchema>;

export type CreateAvailabilityRequest = {
  staffMemberId: string;
  date?: string | null;
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  kind: StaffAvailability['kind'];
  reason?: string | null;
  notes?: string | null;
};

export type CreateLeaveRequest = {
  staffMemberId: string;
  leaveType: StaffLeave['leaveType'];
  startDate: string;
  endDate: string;
  reason?: string | null;
  notes?: string | null;
};

export function parseAvailabilityList(body: unknown): StaffAvailability[] {
  return envelope(z.array(staffAvailabilitySchema)).parse(body).data;
}

export function parseAvailability(body: unknown): StaffAvailability {
  return envelope(staffAvailabilitySchema).parse(body).data;
}

export function parseLeaveList(body: unknown): StaffLeave[] {
  return envelope(z.array(staffLeaveSchema)).parse(body).data;
}

export function parseLeave(body: unknown): StaffLeave {
  return envelope(staffLeaveSchema).parse(body).data;
}

export function parseConflicts(body: unknown): SchedulingConflict[] {
  return envelope(z.array(schedulingConflictSchema)).parse(body).data;
}

export function parseWorkload(body: unknown): StaffWorkload[] {
  return envelope(z.array(staffWorkloadSchema)).parse(body).data;
}

export function parseCalendar(body: unknown): SchedulingCalendarEntry[] {
  return envelope(z.array(schedulingCalendarEntrySchema)).parse(body).data;
}

export function parseRecommendations(body: unknown): StaffRecommendation[] {
  return envelope(z.array(staffRecommendationSchema)).parse(body).data;
}

export function formatDateLike(value: string | Date | null | undefined): string {
  if (!value) return '—';
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}
