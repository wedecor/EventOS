import { z } from 'zod';
import type { operations } from '@/types/api.generated';

export type CreateQuotationRequest =
  operations['QuotationController_createQuotation']['requestBody']['content']['application/json'];

export type UpdateQuotationRequest =
  operations['QuotationController_updateQuotation']['requestBody']['content']['application/json'];

export type RejectQuotationRequest =
  operations['QuotationController_rejectQuotation']['requestBody']['content']['application/json'];

const quotationStatusSchema = z.enum([
  'draft',
  'sent',
  'approved',
  'rejected',
  'expired',
  'superseded',
]);

export type AddLineItemRequest =
  operations['QuotationController_addLineItem']['requestBody']['content']['application/json'];

export type UpdateLineItemRequest =
  operations['QuotationController_updateLineItem']['requestBody']['content']['application/json'];

/** Runtime quotation (mirrors QuotationDto JSON). */
export const quotationSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  customerId: z.string().min(1),
  leadId: z.string().nullable(),
  quotationNumber: z.number().int(),
  revisionNumber: z.number().int(),
  status: quotationStatusSchema,
  eventType: z.string().nullable(),
  eventStartDate: z.union([z.string(), z.date()]).nullable(),
  eventEndDate: z.union([z.string(), z.date()]).nullable(),
  venue: z.string().nullable(),
  validUntil: z.union([z.string(), z.date()]).nullable(),
  terms: z.string().nullable(),
  notes: z.string().nullable(),
  subtotalAmount: z.number(),
  discountAmount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  currency: z.string().min(1),
  supersededById: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

/** Approve may include linked event id (null when conversion deferred). */
export const approveQuotationSchema = quotationSchema.extend({
  eventId: z.string().nullable().optional(),
});

export const quotationEnvelopeSchema = z.object({
  data: quotationSchema,
});

export const approveQuotationEnvelopeSchema = z.object({
  data: approveQuotationSchema,
});

export const quotationPageEnvelopeSchema = z.object({
  data: z.array(quotationSchema),
  meta: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type Quotation = z.infer<typeof quotationSchema>;
export type ApproveQuotationResult = z.infer<typeof approveQuotationSchema>;
export type QuotationPage = z.infer<typeof quotationPageEnvelopeSchema>;

const uuidField = z
  .string()
  .trim()
  .min(1, 'Required')
  .uuid('Enter a valid UUID');

export const createQuotationFormSchema = z.object({
  leadId: uuidField,
  customerId: uuidField,
  validUntil: z.string(),
  notes: z.string(),
});

export type CreateQuotationFormValues = z.infer<typeof createQuotationFormSchema>;

const amountStringSchema = z
  .string()
  .refine(
    (value) => {
      const trimmed = value.trim();
      if (!trimmed) return true;
      const amount = Number(trimmed);
      return Number.isFinite(amount) && amount >= 0;
    },
    { message: 'Enter a non-negative number' },
  );

export const updateQuotationFormSchema = z.object({
  validUntil: z.string(),
  notes: z.string(),
  discountAmount: amountStringSchema,
  taxAmount: amountStringSchema,
});

export type UpdateQuotationFormValues = z.infer<typeof updateQuotationFormSchema>;

export const rejectQuotationFormSchema = z.object({
  reason: z.string(),
});

export type RejectQuotationFormValues = z.infer<typeof rejectQuotationFormSchema>;

export function parseQuotation(body: unknown): Quotation {
  return quotationEnvelopeSchema.parse(body).data;
}

export function parseQuotationPage(body: unknown): QuotationPage {
  return quotationPageEnvelopeSchema.parse(body);
}

export function parseApproveQuotation(body: unknown): ApproveQuotationResult {
  return approveQuotationEnvelopeSchema.parse(body).data;
}

export const quotationLineItemSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  quotationId: z.string().min(1),
  description: z.string(),
  quantity: z.number(),
  unitPriceAmount: z.number(),
  currency: z.string().min(1),
  sortOrder: z.number().int(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const quotationLineItemListEnvelopeSchema = z.object({
  data: z.array(quotationLineItemSchema),
});

export const quotationLineItemEnvelopeSchema = z.object({
  data: quotationLineItemSchema,
});

export type QuotationLineItem = z.infer<typeof quotationLineItemSchema>;

export function parseQuotationLineItems(body: unknown): QuotationLineItem[] {
  return quotationLineItemListEnvelopeSchema.parse(body).data;
}

export function parseQuotationLineItem(body: unknown): QuotationLineItem {
  return quotationLineItemEnvelopeSchema.parse(body).data;
}

export const lineItemFormSchema = z.object({
  description: z.string().trim().min(1, 'Description is required'),
  quantity: z
    .string()
    .trim()
    .min(1, 'Quantity is required')
    .refine((value) => {
      const quantity = Number(value);
      return Number.isInteger(quantity) && quantity >= 1;
    }, 'Enter a whole number ≥ 1'),
  unitPriceAmount: z
    .string()
    .trim()
    .min(1, 'Unit price is required')
    .refine((value) => {
      const amount = Number(value);
      return Number.isFinite(amount) && amount >= 0;
    }, 'Enter a non-negative number'),
});

export type LineItemFormValues = z.infer<typeof lineItemFormSchema>;

export function toAddLineItemRequest(
  values: LineItemFormValues,
  currency = 'INR',
): AddLineItemRequest {
  return {
    description: values.description.trim(),
    quantity: Number(values.quantity),
    unitPrice: {
      amount: Number(values.unitPriceAmount),
      currency,
    },
  };
}

export function toUpdateLineItemRequest(
  values: LineItemFormValues,
  currency = 'INR',
): UpdateLineItemRequest {
  return {
    description: values.description.trim(),
    quantity: Number(values.quantity),
    unitPrice: {
      amount: Number(values.unitPriceAmount),
      currency,
    },
  };
}

export function lineItemToFormValues(
  item: QuotationLineItem,
): LineItemFormValues {
  return {
    description: item.description,
    quantity: String(item.quantity),
    unitPriceAmount: String(item.unitPriceAmount),
  };
}

function optionalDate(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNotes(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseOptionalAmount(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return Number(trimmed);
}

export function toCreateQuotationRequest(
  values: CreateQuotationFormValues,
): CreateQuotationRequest {
  return {
    leadId: values.leadId.trim(),
    customerId: values.customerId.trim(),
    ...(optionalDate(values.validUntil)
      ? { validUntil: optionalDate(values.validUntil) }
      : {}),
    ...(optionalNotes(values.notes) ? { notes: optionalNotes(values.notes) } : {}),
  };
}

export function toUpdateQuotationRequest(
  values: UpdateQuotationFormValues,
): UpdateQuotationRequest {
  const discountAmount = parseOptionalAmount(values.discountAmount) ?? 0;
  const taxAmount = parseOptionalAmount(values.taxAmount) ?? 0;
  const validUntil = optionalDate(values.validUntil);

  return {
    ...(validUntil ? { validUntil } : {}),
    notes: values.notes.trim(),
    discountAmount,
    taxAmount,
  };
}

function toDateInputValue(value: string | Date | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    // Already YYYY-MM-DD from API
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function quotationToUpdateFormValues(
  quotation: Quotation,
): UpdateQuotationFormValues {
  return {
    validUntil: toDateInputValue(quotation.validUntil),
    notes: quotation.notes ?? '',
    discountAmount: String(quotation.discountAmount),
    taxAmount: String(quotation.taxAmount),
  };
}
