import { z } from 'zod';

export const createClientBodySchema = z.object({
  displayName: z.string().min(1),
  type: z.enum(['individual', 'organization']).optional(),
  primaryPhone: z.string().optional(),
  primaryEmail: z.string().email().optional(),
  notes: z.string().nullable().optional(),
});

export const updateClientBodySchema = createClientBodySchema.partial();

export const addContactBodySchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  phone: z
    .object({
      countryCode: z.string().min(1),
      number: z.string().min(1),
    })
    .optional(),
  email: z.object({ value: z.string().email() }).optional(),
});
