import { z } from 'zod';

// EP1-STF-001 — Staff member status (`docs/07-domain-model.md` §StaffMember lifecycle,
// `docs/09-api-design.md` §Module: Staff Management).
const staffMemberStatusSchema = z.enum(['active', 'inactive', 'on_leave']);
const staffEmploymentTypeSchema = z.enum(['permanent', 'temporary']);

const phoneSchema = z.object({
  countryCode: z.string().min(1, 'Phone country code is required.'),
  number: z.string().min(1, 'Phone number is required.'),
});

const emailSchema = z.object({
  value: z.string().email('Email must be a valid email address.'),
});

export const createStaffMemberSchema = z.object({
  name: z.string().min(1, 'Staff member name is required.'),
  role: z.string().min(1, 'Staff member role is required.'),
  department: z.string().nullable().optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  status: staffMemberStatusSchema.optional(),
  userId: z.string().uuid().nullable().optional(),
  employmentType: staffEmploymentTypeSchema.optional(),
  joinedAt: z.string().datetime().nullable().optional(),
});

export const updateStaffMemberSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  department: z.string().nullable().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.nullable().optional(),
  status: staffMemberStatusSchema.optional(),
  userId: z.string().uuid().nullable().optional(),
  employmentType: staffEmploymentTypeSchema.optional(),
  joinedAt: z.string().datetime().nullable().optional(),
});

export const listStaffMembersQuerySchema = z.object({
  status: staffMemberStatusSchema.optional(),
});

export type CreateStaffMemberBody = z.infer<typeof createStaffMemberSchema>;
export type UpdateStaffMemberBody = z.infer<typeof updateStaffMemberSchema>;
export type ListStaffMembersQuery = z.infer<typeof listStaffMembersQuerySchema>;

export { toPhoneString } from '../../../../shared/presentation/phone-email';
