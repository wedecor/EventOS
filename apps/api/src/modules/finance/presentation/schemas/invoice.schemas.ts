import { z } from 'zod';

export const createInvoiceLineItemSchema = z.object({
  description: z.string().min(1, 'Invoice line item description is required.'),
  quantity: z.number().int().positive().optional(),
  unitPriceAmount: z.number().nonnegative(),
  currency: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  bookingId: z.string().uuid(),
  customerId: z.string().uuid(),
  lineItems: z.array(createInvoiceLineItemSchema).min(1),
  notes: z.string().optional(),
});

export const sendInvoiceSchema = z.object({
  channel: z.enum(['email', 'other']).optional(),
  recipient: z.string().optional(),
});

export const voidInvoiceSchema = z.object({});

export type CreateInvoiceLineItemBody = z.infer<
  typeof createInvoiceLineItemSchema
>;
export type CreateInvoiceBody = z.infer<typeof createInvoiceSchema>;
export type SendInvoiceBody = z.infer<typeof sendInvoiceSchema>;
export type VoidInvoiceBody = z.infer<typeof voidInvoiceSchema>;
