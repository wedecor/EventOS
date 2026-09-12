import { z } from 'zod';

export const recordExpenseSchema = z.object({
  vendorId: z.string().uuid(),
  procurementLineId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  method: z.enum(['upi', 'cash', 'bank_transfer', 'card', 'cheque', 'other']),
  paidAt: z.string().datetime(),
  attachmentId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const voidExpenseSchema = z.object({});

export type RecordExpenseBody = z.infer<typeof recordExpenseSchema>;
export type VoidExpenseBody = z.infer<typeof voidExpenseSchema>;
