import { z } from 'zod';
import {
  STAFF_EMPLOYMENT_TYPES,
  staffEmploymentTypeSchema,
  staffStatusSchema,
} from '@/features/staff/schemas/staff.schemas';

export const STAFF_ASSIGNMENT_STATUSES = [
  'proposed',
  'confirmed',
  'released',
  'cancelled',
] as const;

export const STAFF_ROLE_PRESETS = [
  'Primary Decorator',
  'Secondary Decorator',
  'Helpers',
  'Coordinator',
  'Lead Decorator',
  'Vendor Liaison',
] as const;

export { STAFF_EMPLOYMENT_TYPES };

export const staffAssignmentMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  operationalRole: z.string().min(1),
  employmentType: staffEmploymentTypeSchema,
  status: staffStatusSchema,
});

export const staffAssignmentSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  staffMemberId: z.string().min(1),
  legacyUserId: z.string().nullable().optional().default(null),
  role: z.string().nullable(),
  isOnSiteLead: z.boolean(),
  reportingAt: z.union([z.string(), z.date()]).nullable(),
  note: z.string().nullable(),
  status: z.enum(STAFF_ASSIGNMENT_STATUSES),
  confirmedAt: z.union([z.string(), z.date()]).nullable(),
  releasedAt: z.union([z.string(), z.date()]).nullable(),
  cancelledAt: z.union([z.string(), z.date()]).nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
  staffMember: staffAssignmentMemberSchema.nullable().optional().default(null),
});

export const staffAssignmentListEnvelopeSchema = z.object({
  data: z.array(staffAssignmentSchema),
});

export const staffAssignmentEnvelopeSchema = z.object({
  data: staffAssignmentSchema,
});

export type StaffAssignment = z.infer<typeof staffAssignmentSchema>;

export type CreateStaffAssignmentRequest = {
  bookingId: string;
  staffMemberId: string;
  role?: string;
  isOnSiteLead?: boolean;
  reportingAt?: string;
  note?: string;
};

export function parseStaffAssignmentList(body: unknown): StaffAssignment[] {
  return staffAssignmentListEnvelopeSchema.parse(body).data;
}

export function parseStaffAssignment(body: unknown): StaffAssignment {
  return staffAssignmentEnvelopeSchema.parse(body).data;
}
