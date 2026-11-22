import { z } from 'zod';

export const PROCUREMENT_LEGACY_STATUSES = [
  'planned',
  'requested',
  'confirmed',
  'delivered',
  'completed',
  'cancelled',
] as const;

export const PROCUREMENT_WORKFLOW_STATUSES = [
  'draft',
  'quotation_requested',
  'quotation_received',
  'approved',
  'purchase_ordered',
  'vendor_confirmed',
  'materials_delivered',
  'completed',
  'cancelled',
] as const;

export const PROCUREMENT_DELIVERY_STATUSES = [
  'pending',
  'partial',
  'delivered',
  'cancelled',
] as const;

const dateLike = z.union([z.string(), z.date()]);

export const procurementLineSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  vendorProcurementId: z.string().min(1),
  bookingId: z.string().min(1),
  quotationLineItemId: z.string().nullable(),
  description: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int(),
  budgetedAmount: z.number().nullable(),
  actualAmount: z.number().nullable(),
  currency: z.string().min(1),
  status: z.enum(PROCUREMENT_LEGACY_STATUSES),
  requestedAt: dateLike.nullable(),
  confirmedAt: dateLike.nullable(),
  deliveredAt: dateLike.nullable(),
  completedAt: dateLike.nullable(),
  costVarianceAmount: z.number().nullable(),
  costVarianceReason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int().nonnegative(),
});

export const procurementQuoteSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  vendorProcurementId: z.string().min(1),
  vendorId: z.string().min(1),
  amount: z.number(),
  currency: z.string(),
  validUntil: dateLike.nullable(),
  notes: z.string().nullable(),
  attachmentName: z.string().nullable(),
  attachmentMimeType: z.string().nullable(),
  attachmentSizeBytes: z.number().nullable(),
  status: z.enum(['submitted', 'approved', 'rejected', 'expired']),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int(),
});

export const purchaseOrderSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  vendorProcurementId: z.string().min(1),
  vendorId: z.string().min(1),
  poNumber: z.string(),
  issueDate: dateLike,
  totalAmount: z.number(),
  currency: z.string(),
  notes: z.string().nullable(),
  status: z.enum(['draft', 'issued', 'cancelled']),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int(),
});

export const procurementTimelineSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  vendorProcurementId: z.string().min(1),
  bookingId: z.string().min(1),
  eventType: z.string(),
  message: z.string(),
  occurredAt: dateLike,
  createdAt: dateLike,
});

export const procurementCostSummarySchema = z.object({
  estimatedCost: z.number().nullable(),
  approvedCost: z.number().nullable(),
  actualCost: z.number().nullable(),
  variance: z.number().nullable(),
  currency: z.string(),
});

export const vendorProcurementSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  vendorId: z.string().min(1),
  status: z.enum(PROCUREMENT_LEGACY_STATUSES),
  workflowStatus: z.enum(PROCUREMENT_WORKFLOW_STATUSES).default('draft'),
  serviceCategory: z.string().nullable().optional().default(null),
  requiredDate: dateLike.nullable().optional().default(null),
  estimatedCost: z.number().nullable().optional().default(null),
  approvedCost: z.number().nullable().optional().default(null),
  actualCost: z.number().nullable().optional().default(null),
  deliveryStatus: z
    .enum(PROCUREMENT_DELIVERY_STATUSES)
    .optional()
    .default('pending'),
  deliveryNotes: z.string().nullable().optional().default(null),
  notes: z.string().nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int().nonnegative(),
  lines: z.array(procurementLineSchema).default([]),
  quotes: z.array(procurementQuoteSchema).optional().default([]),
  purchaseOrders: z.array(purchaseOrderSchema).optional().default([]),
  timeline: z.array(procurementTimelineSchema).optional().default([]),
  costSummary: procurementCostSummarySchema.optional(),
  outstandingActions: z.array(z.string()).optional().default([]),
});

export const vendorProcurementListEnvelopeSchema = z.object({
  data: z.array(vendorProcurementSchema),
});

export const vendorProcurementEnvelopeSchema = z.object({
  data: vendorProcurementSchema,
});

export type VendorProcurement = z.infer<typeof vendorProcurementSchema>;
export type ProcurementQuote = z.infer<typeof procurementQuoteSchema>;
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

export type CreateVendorProcurementRequest = {
  vendorId: string;
  notes?: string;
  serviceCategory?: string;
  requiredDate?: string;
  estimatedCost?: number;
};

export function parseVendorProcurementList(
  body: unknown,
): VendorProcurement[] {
  return vendorProcurementListEnvelopeSchema.parse(body).data;
}

export function parseVendorProcurement(body: unknown): VendorProcurement {
  return vendorProcurementEnvelopeSchema.parse(body).data;
}

export function parseProcurementQuote(body: unknown): ProcurementQuote {
  return z.object({ data: procurementQuoteSchema }).parse(body).data;
}

export function parsePurchaseOrder(body: unknown): PurchaseOrder {
  return z.object({ data: purchaseOrderSchema }).parse(body).data;
}

export function formatWorkflowStatus(status: string): string {
  return status.replace(/_/g, ' ');
}
