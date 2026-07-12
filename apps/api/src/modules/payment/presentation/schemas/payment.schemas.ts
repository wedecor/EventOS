import { z } from 'zod';

export const recordPaymentSchema = z.object({
  leadId: z.string().uuid().optional(),
  quotationId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  method: z.enum(['upi', 'cash', 'bank_transfer', 'card', 'cheque', 'other']),
  receivedAt: z.string().datetime(),
  attachmentId: z.string().uuid().optional(),
  missingProofReason: z.string().optional(),
  notes: z.string().optional(),
});

export const voidPaymentSchema = z.object({});

export type RecordPaymentBody = z.infer<typeof recordPaymentSchema>;
export type VoidPaymentBody = z.infer<typeof voidPaymentSchema>;
