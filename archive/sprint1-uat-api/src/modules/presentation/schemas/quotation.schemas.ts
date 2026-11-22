import { z } from 'zod';

export const createQuotationBodySchema = z.object({
  customerId: z.string().uuid(),
  leadId: z.string().uuid().nullable().optional(),
  eventType: z.string().nullable().optional(),
  eventStartDate: z.coerce.date().nullable().optional(),
  eventEndDate: z.coerce.date().nullable().optional(),
  venue: z.string().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateQuotationBodySchema = z.object({
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  version: z.number().int().positive(),
});

export const lineItemBodySchema = z.object({
  description: z.string().min(1),
  packageId: z.string().uuid().nullable().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  sortOrder: z.number().int().optional(),
});

export const updateLineItemBodySchema = lineItemBodySchema.partial().extend({
  version: z.number().int().positive(),
});

export const versionBodySchema = z.object({
  version: z.number().int().positive(),
});
