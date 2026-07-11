import { z } from 'zod';

export const createQuotationSchema = z.object({
  leadId: z.string().uuid(),
  customerId: z.string().uuid(),
  validUntil: z.string().date().optional(),
  notes: z.string().optional(),
});

export const updateQuotationSchema = z.object({
  validUntil: z.string().date().optional(),
  notes: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
});

export const rejectQuotationSchema = z.object({
  reason: z.string().optional(),
});

export const addLineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.object({
    amount: z.number().min(0),
    currency: z.string().default('INR'),
  }),
  sortOrder: z.number().int().optional(),
});

export const updateLineItemSchema = z.object({
  description: z.string().optional(),
  quantity: z.number().min(1).optional(),
  unitPrice: z
    .object({
      amount: z.number().min(0),
      currency: z.string().default('INR'),
    })
    .optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateQuotationBody = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationBody = z.infer<typeof updateQuotationSchema>;
export type RejectQuotationBody = z.infer<typeof rejectQuotationSchema>;
export type AddLineItemBody = z.infer<typeof addLineItemSchema>;
export type UpdateLineItemBody = z.infer<typeof updateLineItemSchema>;
