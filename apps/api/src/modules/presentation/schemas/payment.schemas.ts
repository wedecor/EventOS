import { z } from 'zod';

export const recordPaymentBodySchema = z.object({
  bookingId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  quotationId: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  currency: z.string().optional(),
  method: z.enum(['upi', 'cash', 'bank_transfer', 'card', 'cheque', 'other']),
  receivedAt: z.coerce.date(),
  paymentType: z.enum(['advance', 'balance', 'other']).optional(),
  missingProofReason: z.string().nullable().optional(),
});
