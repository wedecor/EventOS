import { z } from 'zod';

export const financialDocumentTypeSchema = z.enum([
  'payment_proof',
  'expense_receipt',
  'vendor_invoice',
  'customer_invoice',
  'credit_note',
  'debit_note',
  'other',
]);

export const createFinancialDocumentSchema = z.object({
  bookingId: z.string().uuid(),
  documentType: financialDocumentTypeSchema,
  description: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  storageKey: z.string().optional(),
  paymentId: z.string().uuid().optional(),
  vendorExpenseId: z.string().uuid().optional(),
  vendorProcurementId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
});

export const updateFinancialDocumentSchema = z.object({
  description: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  storageKey: z.string().optional(),
  paymentId: z.string().uuid().nullable().optional(),
  vendorExpenseId: z.string().uuid().nullable().optional(),
  vendorProcurementId: z.string().uuid().nullable().optional(),
  invoiceId: z.string().uuid().nullable().optional(),
});

export const verifyFinancialDocumentSchema = z.object({
  verificationNotes: z.string().optional(),
});

export type CreateFinancialDocumentBody = z.infer<
  typeof createFinancialDocumentSchema
>;
export type UpdateFinancialDocumentBody = z.infer<
  typeof updateFinancialDocumentSchema
>;
export type VerifyFinancialDocumentBody = z.infer<
  typeof verifyFinancialDocumentSchema
>;
