import { z } from 'zod';

export const STAFF_STATUSES = ['active', 'inactive', 'on_leave'] as const;
export const STAFF_EMPLOYMENT_TYPES = ['permanent', 'temporary'] as const;

export type StaffStatus = (typeof STAFF_STATUSES)[number];
export type StaffEmploymentType = (typeof STAFF_EMPLOYMENT_TYPES)[number];

export const staffStatusSchema = z.enum(STAFF_STATUSES);
export const staffEmploymentTypeSchema = z.enum(STAFF_EMPLOYMENT_TYPES);

/** Runtime staff member (mirrors StaffMemberDto — phone is a flattened string). */
export const staffMemberSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().nullable().optional().default(null),
  name: z.string().min(1),
  role: z.string().min(1),
  operationalRole: z.string().min(1).optional(),
  department: z.string().nullable(),
  phone: z.string().min(1),
  email: z.string().nullable(),
  employmentType: staffEmploymentTypeSchema.default('temporary'),
  status: staffStatusSchema,
  active: z.boolean().optional(),
  joinedAt: z.union([z.string(), z.date()]).nullable().optional().default(null),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const staffListEnvelopeSchema = z.object({
  data: z.array(staffMemberSchema),
});

export const staffEnvelopeSchema = z.object({
  data: staffMemberSchema,
});

export type StaffMember = z.infer<typeof staffMemberSchema>;

export type ListStaffQuery = {
  status?: StaffStatus;
};

export type CreateStaffRequest = {
  name: string;
  role: string;
  department?: string;
  phone: { countryCode: string; number: string };
  email?: { value: string };
  status?: StaffStatus;
  userId?: string | null;
  employmentType?: StaffEmploymentType;
  joinedAt?: string | null;
};

export type UpdateStaffRequest = {
  name?: string;
  role?: string;
  department?: string | null;
  phone?: { countryCode: string; number: string };
  email?: { value: string } | null;
  status?: StaffStatus;
  userId?: string | null;
  employmentType?: StaffEmploymentType;
  joinedAt?: string | null;
};

export const staffFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    role: z.string().trim().min(1, 'Role is required'),
    department: z.string(),
    phoneCountryCode: z.string().trim().min(1, 'Country code is required'),
    phoneNumber: z.string().trim().min(1, 'Phone number is required'),
    email: z.string(),
    status: staffStatusSchema,
    employmentType: staffEmploymentTypeSchema,
  })
  .superRefine((value, ctx) => {
    const email = value.email.trim();
    if (email) {
      const check = z.string().email().safeParse(email);
      if (!check.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid email',
          path: ['email'],
        });
      }
    }
  });

export type StaffFormValues = z.infer<typeof staffFormSchema>;

export function parseStaffMember(body: unknown): StaffMember {
  return staffEnvelopeSchema.parse(body).data;
}

export function parseStaffList(body: unknown): StaffMember[] {
  return staffListEnvelopeSchema.parse(body).data;
}

/** Split flattened DTO phone into OpenAPI phone parts for forms. */
export function splitPhone(phone: string): {
  countryCode: string;
  number: string;
} {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+91')) {
    return { countryCode: '+91', number: trimmed.slice(3) };
  }
  const match = trimmed.match(/^(\+\d{1,3})(.*)$/);
  if (match?.[1] && match[2] !== undefined) {
    return { countryCode: match[1], number: match[2] };
  }
  return { countryCode: '+91', number: trimmed };
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toCreateStaffRequest(
  values: StaffFormValues,
): CreateStaffRequest {
  const email = optionalText(values.email);
  const department = optionalText(values.department);
  return {
    name: values.name.trim(),
    role: values.role.trim(),
    phone: {
      countryCode: values.phoneCountryCode.trim(),
      number: values.phoneNumber.trim(),
    },
    status: values.status,
    employmentType: values.employmentType,
    ...(department !== undefined ? { department } : {}),
    ...(email ? { email: { value: email } } : {}),
  };
}

export function toUpdateStaffRequest(
  values: StaffFormValues,
): UpdateStaffRequest {
  const email = values.email.trim();
  return {
    name: values.name.trim(),
    role: values.role.trim(),
    department: values.department.trim() ? values.department.trim() : null,
    phone: {
      countryCode: values.phoneCountryCode.trim(),
      number: values.phoneNumber.trim(),
    },
    email: email ? { value: email } : null,
    status: values.status,
    employmentType: values.employmentType,
  };
}

export function staffToFormValues(staff: StaffMember): StaffFormValues {
  const phone = splitPhone(staff.phone);
  return {
    name: staff.name,
    role: staff.role,
    department: staff.department ?? '',
    phoneCountryCode: phone.countryCode,
    phoneNumber: phone.number,
    email: staff.email ?? '',
    status: staff.status,
    employmentType: staff.employmentType,
  };
}
