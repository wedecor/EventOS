import { z } from 'zod';

const availabilityKindSchema = z.enum([
  'available',
  'unavailable',
  'partial_day',
  'holiday',
]);

const timeHHmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm.');

export const createStaffAvailabilitySchema = z
  .object({
    staffMemberId: z.string().uuid(),
    date: z.string().date().nullable().optional(),
    weekday: z.number().int().min(0).max(6).nullable().optional(),
    startTime: timeHHmm.nullable().optional(),
    endTime: timeHHmm.nullable().optional(),
    kind: availabilityKindSchema,
    reason: z.string().max(500).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine(
    (body) =>
      (body.date != null && body.date !== '') !==
      (body.weekday !== undefined && body.weekday !== null),
    { message: 'Provide either date or weekday, not both or neither.' },
  );

export const updateStaffAvailabilitySchema = z.object({
  date: z.string().date().nullable().optional(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  startTime: timeHHmm.nullable().optional(),
  endTime: timeHHmm.nullable().optional(),
  kind: availabilityKindSchema.optional(),
  reason: z.string().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const listStaffAvailabilityQuerySchema = z.object({
  staffMemberId: z.string().uuid(),
});

export type CreateStaffAvailabilityBody = z.infer<
  typeof createStaffAvailabilitySchema
>;
export type UpdateStaffAvailabilityBody = z.infer<
  typeof updateStaffAvailabilitySchema
>;
export type ListStaffAvailabilityQuery = z.infer<
  typeof listStaffAvailabilityQuerySchema
>;
