import { z } from 'zod';

// ── Create Customer ─────────────────────────────────────────────────
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateCustomerBody = z.infer<typeof createCustomerSchema>;

// ── Update Customer ─────────────────────────────────────────────────
export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateCustomerBody = z.infer<typeof updateCustomerSchema>;
