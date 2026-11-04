import { z } from 'zod';

export const createVendorProcurementSchema = z.object({
  vendorId: z.string().uuid(),
  notes: z.string().optional(),
  serviceCategory: z.string().optional(),
  requiredDate: z.string().date().optional(),
  estimatedCost: z.number().nonnegative().optional(),
});

export const transitionProcurementWorkflowSchema = z.object({
  toStatus: z.enum([
    'draft',
    'quotation_requested',
    'quotation_received',
    'approved',
    'purchase_ordered',
    'vendor_confirmed',
    'materials_delivered',
    'completed',
    'cancelled',
  ]),
  notes: z.string().nullable().optional(),
});

export const updateProcurementDeliverySchema = z.object({
  deliveryStatus: z.enum(['pending', 'partial', 'delivered', 'cancelled']),
  deliveryNotes: z.string().nullable().optional(),
  actualCost: z.number().nonnegative().nullable().optional(),
});

export const createProcurementQuoteSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().optional(),
  validUntil: z.string().date().nullable().optional(),
  notes: z.string().nullable().optional(),
  attachmentName: z.string().nullable().optional(),
  attachmentMimeType: z.string().nullable().optional(),
  attachmentSizeBytes: z.number().int().nonnegative().nullable().optional(),
});

export const createPurchaseOrderSchema = z.object({
  poNumber: z.string().optional(),
  issueDate: z.string().date().optional(),
  totalAmount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  notes: z.string().nullable().optional(),
  issue: z.boolean().optional(),
});

export type CreateVendorProcurementBody = z.infer<
  typeof createVendorProcurementSchema
>;
export type TransitionProcurementWorkflowBody = z.infer<
  typeof transitionProcurementWorkflowSchema
>;
export type UpdateProcurementDeliveryBody = z.infer<
  typeof updateProcurementDeliverySchema
>;
export type CreateProcurementQuoteBody = z.infer<
  typeof createProcurementQuoteSchema
>;
export type CreatePurchaseOrderBody = z.infer<typeof createPurchaseOrderSchema>;
