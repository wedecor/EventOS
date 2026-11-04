import { z } from 'zod';

// docs/09 §Customer POST /clients/:id/contacts — nested phone/email (decision 4A).
const phoneSchema = z.object({
  countryCode: z.string().min(1, 'Phone country code is required.'),
  number: z.string().min(1, 'Phone number is required.'),
});

const emailSchema = z.object({
  value: z.string().email('Email must be a valid email address.'),
});

export const addContactSchema = z
  .object({
    name: z.string().min(1, 'Contact name is required.'),
    role: z.string().min(1, 'Contact role is required.'),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
  })
  .refine((body) => body.phone !== undefined || body.email !== undefined, {
    message: 'Contact must have at least one phone or email.',
  });

export type AddContactBody = z.infer<typeof addContactSchema>;
