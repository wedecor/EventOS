import { z } from 'zod';
import type { operations } from '@/types/api.generated';

export type RecordPaymentRequest =
  operations['PaymentController_recordPayment']['requestBody']['content']['application/json'];

export type CreateInvoiceRequest =
  operations['InvoiceController_createInvoice']['requestBody']['content']['application/json'];

export type SendInvoiceRequest =
  operations['InvoiceController_sendInvoice']['requestBody']['content']['application/json'];

export type RecordExpenseRequest =
  operations['BookingController_recordExpense']['requestBody']['content']['application/json'];

export const PAYMENT_METHODS = [
  'upi',
  'cash',
  'bank_transfer',
  'card',
  'cheque',
  'other',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const moneySchema = z.object({
  amount: z.number(),
  currency: z.string().min(1),
});

export const paymentSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().nullable(),
  leadId: z.string().nullable(),
  quotationId: z.string().nullable(),
  invoiceId: z.string().nullable(),
  amount: z.number(),
  currency: z.string().min(1),
  method: z.string().min(1),
  status: z.string().min(1),
  receivedAt: z.union([z.string(), z.date()]),
  attachmentId: z.string().nullable(),
  missingProofReason: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const paymentListEnvelopeSchema = z.object({
  data: z.array(paymentSchema),
});

export const paymentEnvelopeSchema = z.object({
  data: paymentSchema,
});

export const invoiceLineItemSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  invoiceId: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceAmount: z.number().nonnegative(),
  currency: z.string().min(1),
  sortOrder: z.number().int(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const invoiceSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  customerId: z.string().min(1),
  invoiceNumber: z.number().int(),
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'void']),
  subtotalAmount: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  currency: z.string().min(1),
  notes: z.string().nullable(),
  sentAt: z.union([z.string(), z.date()]).nullable(),
  voidedAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
  lineItems: z.array(invoiceLineItemSchema),
});

export const invoiceListEnvelopeSchema = z.object({
  data: z.array(invoiceSchema),
});

export const invoiceEnvelopeSchema = z.object({
  data: invoiceSchema,
});

export const expenseSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  vendorId: z.string().min(1),
  procurementLineId: z.string().nullable(),
  amount: z.number(),
  currency: z.string().min(1),
  method: paymentMethodSchema,
  status: z.string().min(1),
  paidAt: z.union([z.string(), z.date()]),
  attachmentId: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const expenseListEnvelopeSchema = z.object({
  data: z.array(expenseSchema),
});

export const expenseEnvelopeSchema = z.object({
  data: expenseSchema,
});

export const profitabilitySchema = z.object({
  eventId: z.string().min(1),
  revenue: moneySchema,
  vendorExpenses: moneySchema,
  grossMargin: moneySchema,
});

export const profitabilityEnvelopeSchema = z.object({
  data: profitabilitySchema,
});

export type Payment = z.infer<typeof paymentSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;
export type Expense = z.infer<typeof expenseSchema>;
export type Profitability = z.infer<typeof profitabilitySchema>;

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalUuid(value: string): string | undefined {
  return optionalText(value);
}

function parsePositiveAmount(raw: string, path: string, ctx: z.RefinementCtx) {
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Amount must be greater than 0',
      path: [path],
    });
    return null;
  }
  return amount;
}

export const recordPaymentFormSchema = z
  .object({
    bookingId: z.string(),
    leadId: z.string(),
    quotationId: z.string(),
    invoiceId: z.string(),
    amount: z.string().trim().min(1, 'Amount is required'),
    currency: z.string().trim().min(1, 'Currency is required'),
    method: paymentMethodSchema,
    receivedAt: z.string().trim().min(1, 'Received at is required'),
    missingProofReason: z.string(),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    parsePositiveAmount(value.amount, 'amount', ctx);
    const hasAnchor =
      Boolean(optionalText(value.bookingId)) ||
      Boolean(optionalText(value.leadId)) ||
      Boolean(optionalText(value.quotationId)) ||
      Boolean(optionalText(value.invoiceId));
    if (!hasAnchor) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide at least one of booking, lead, quotation, or invoice id',
        path: ['bookingId'],
      });
    }
  });

export type RecordPaymentFormValues = z.infer<typeof recordPaymentFormSchema>;

export const createInvoiceFormSchema = z
  .object({
    bookingId: z.string().trim().uuid('Valid booking UUID required'),
    customerId: z.string().trim().uuid('Valid customer UUID required'),
    description: z.string().trim().min(1, 'Line description is required'),
    quantity: z.string().trim().min(1, 'Quantity is required'),
    unitPriceAmount: z.string().trim().min(1, 'Unit price is required'),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    const qty = Number(value.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Quantity must be an integer ≥ 1',
        path: ['quantity'],
      });
    }
    const price = Number(value.unitPriceAmount);
    if (!Number.isFinite(price) || price < 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Unit price must be ≥ 0',
        path: ['unitPriceAmount'],
      });
    }
  });

export type CreateInvoiceFormValues = z.infer<typeof createInvoiceFormSchema>;

export const sendInvoiceFormSchema = z.object({
  channel: z.enum(['email', 'other']),
  recipient: z.string(),
});

export type SendInvoiceFormValues = z.infer<typeof sendInvoiceFormSchema>;

export const recordExpenseFormSchema = z
  .object({
    vendorId: z.string().trim().uuid('Valid vendor UUID required'),
    procurementLineId: z.string(),
    amount: z.string().trim().min(1, 'Amount is required'),
    currency: z.string().trim().min(1, 'Currency is required'),
    method: paymentMethodSchema,
    paidAt: z.string().trim().min(1, 'Paid at is required'),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    parsePositiveAmount(value.amount, 'amount', ctx);
  });

export type RecordExpenseFormValues = z.infer<typeof recordExpenseFormSchema>;

export function parsePaymentList(body: unknown): Payment[] {
  return paymentListEnvelopeSchema.parse(body).data;
}

export function parsePayment(body: unknown): Payment {
  return paymentEnvelopeSchema.parse(body).data;
}

export function parseInvoiceList(body: unknown): Invoice[] {
  return invoiceListEnvelopeSchema.parse(body).data;
}

export function parseInvoice(body: unknown): Invoice {
  return invoiceEnvelopeSchema.parse(body).data;
}

export function parseExpenseList(body: unknown): Expense[] {
  return expenseListEnvelopeSchema.parse(body).data;
}

export function parseExpense(body: unknown): Expense {
  return expenseEnvelopeSchema.parse(body).data;
}

export function parseProfitability(body: unknown): Profitability {
  return profitabilityEnvelopeSchema.parse(body).data;
}

/** Ensure a datetime-local or ISO string becomes OpenAPI date-time (Z). */
export function toApiDateTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/Z$/i.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed).toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  // datetime-local → treat as local, serialize UTC ISO without ms
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function defaultDateTimeLocalValue(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toRecordPaymentRequest(
  values: RecordPaymentFormValues,
): RecordPaymentRequest {
  return {
    amount: Number(values.amount),
    currency: values.currency.trim() || 'INR',
    method: values.method,
    receivedAt: toApiDateTime(values.receivedAt),
    ...(optionalUuid(values.bookingId)
      ? { bookingId: optionalUuid(values.bookingId) }
      : {}),
    ...(optionalUuid(values.leadId) ? { leadId: optionalUuid(values.leadId) } : {}),
    ...(optionalUuid(values.quotationId)
      ? { quotationId: optionalUuid(values.quotationId) }
      : {}),
    ...(optionalUuid(values.invoiceId)
      ? { invoiceId: optionalUuid(values.invoiceId) }
      : {}),
    ...(optionalText(values.missingProofReason)
      ? { missingProofReason: optionalText(values.missingProofReason) }
      : {}),
    ...(optionalText(values.notes) ? { notes: optionalText(values.notes) } : {}),
  };
}

export function toCreateInvoiceRequest(
  values: CreateInvoiceFormValues,
): CreateInvoiceRequest {
  return {
    bookingId: values.bookingId.trim(),
    customerId: values.customerId.trim(),
    lineItems: [
      {
        description: values.description.trim(),
        quantity: Number(values.quantity),
        unitPriceAmount: Number(values.unitPriceAmount),
      },
    ],
    ...(optionalText(values.notes) ? { notes: optionalText(values.notes) } : {}),
  };
}

export function toSendInvoiceRequest(
  values: SendInvoiceFormValues,
): SendInvoiceRequest {
  return {
    channel: values.channel,
    ...(optionalText(values.recipient)
      ? { recipient: optionalText(values.recipient) }
      : {}),
  };
}

export function toRecordExpenseRequest(
  values: RecordExpenseFormValues,
): RecordExpenseRequest {
  return {
    vendorId: values.vendorId.trim(),
    amount: Number(values.amount),
    currency: values.currency.trim() || 'INR',
    method: values.method,
    paidAt: toApiDateTime(values.paidAt),
    ...(optionalUuid(values.procurementLineId)
      ? { procurementLineId: optionalUuid(values.procurementLineId) }
      : {}),
    ...(optionalText(values.notes) ? { notes: optionalText(values.notes) } : {}),
  };
}

// ---------------------------------------------------------------------------
// P2-08 — Financial documents (metadata only)
// ---------------------------------------------------------------------------

export const FINANCIAL_DOCUMENT_TYPES = [
  'payment_proof',
  'expense_receipt',
  'vendor_invoice',
  'customer_invoice',
  'credit_note',
  'debit_note',
  'other',
] as const;

export const FINANCIAL_DOCUMENT_VERIFICATION_STATUSES = [
  'pending',
  'verified',
  'rejected',
] as const;

export type FinancialDocumentType = (typeof FINANCIAL_DOCUMENT_TYPES)[number];
export type FinancialDocumentVerificationStatus =
  (typeof FINANCIAL_DOCUMENT_VERIFICATION_STATUSES)[number];

export const financialDocumentSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  documentType: z.enum(FINANCIAL_DOCUMENT_TYPES),
  verificationStatus: z.enum(FINANCIAL_DOCUMENT_VERIFICATION_STATUSES),
  description: z.string().nullable(),
  fileName: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSizeBytes: z.number().int().nullable(),
  storageKey: z.string().nullable(),
  paymentId: z.string().nullable(),
  vendorExpenseId: z.string().nullable(),
  vendorProcurementId: z.string().nullable(),
  invoiceId: z.string().nullable(),
  uploadedByUserId: z.string().nullable(),
  uploadedAt: z.union([z.string(), z.date()]),
  verifiedByUserId: z.string().nullable(),
  verifiedAt: z.union([z.string(), z.date()]).nullable(),
  verificationNotes: z.string().nullable(),
  deletedAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const financialDocumentListEnvelopeSchema = z.object({
  data: z.array(financialDocumentSchema),
});

export const financialDocumentEnvelopeSchema = z.object({
  data: financialDocumentSchema,
});

export type FinancialDocument = z.infer<typeof financialDocumentSchema>;

export type CreateFinancialDocumentRequest = {
  bookingId: string;
  documentType: FinancialDocumentType;
  description?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  storageKey?: string;
  paymentId?: string;
  vendorExpenseId?: string;
  vendorProcurementId?: string;
  invoiceId?: string;
};

export type UpdateFinancialDocumentRequest = {
  description?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  storageKey?: string;
  paymentId?: string | null;
  vendorExpenseId?: string | null;
  vendorProcurementId?: string | null;
  invoiceId?: string | null;
};

export type VerifyFinancialDocumentRequest = {
  verificationNotes?: string;
};

export function parseFinancialDocument(body: unknown): FinancialDocument {
  return financialDocumentEnvelopeSchema.parse(body).data;
}

export function parseFinancialDocumentList(body: unknown): FinancialDocument[] {
  return financialDocumentListEnvelopeSchema.parse(body).data;
}

export function formatDocumentType(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
