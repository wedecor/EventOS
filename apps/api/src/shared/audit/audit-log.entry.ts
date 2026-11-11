// R1-08 — Structured audit logging. Shape of a single audit record as emitted by
// application services (docs/10-implementation-specification.md §Audit Strategy;
// docs/14-security-principles.md §Audit Logging). `metadata` carries small,
// non-sensitive before/after status summaries only — never payment proofs, file
// keys, secrets, or credentials (docs/10 §Logging Strategy).

export type AuditOutcome = 'success' | 'failure';

export type AuditEntry = {
  actorId: string;
  tenantId: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: AuditOutcome;
  metadata?: Record<string, unknown> | null;
};

// Instrumented sensitive operations for R1-08 (representative set). Kept as
// constants so callers never rely on magic strings.
export const AUDIT_ACTIONS = {
  QUOTATION_APPROVED: 'quotation.approved',
  QUOTATION_PDF_GENERATED: 'quotation.pdf_generated',
  QUOTATION_EMAIL_QUEUED: 'quotation.email_queued',
  INVOICE_PDF_GENERATED: 'invoice.pdf_generated',
  INVOICE_EMAIL_QUEUED: 'invoice.email_queued',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_DELETED: 'document.deleted',
  PAYMENT_RECORDED: 'payment.recorded',
  VENDOR_EXPENSE_CREATED: 'vendor_expense.created',
  INTEGRATION_SETTINGS_UPDATED: 'integration.settings_updated',
} as const;

export const AUDIT_ENTITY_TYPES = {
  QUOTATION: 'Quotation',
  INVOICE: 'Invoice',
  STORED_DOCUMENT: 'StoredDocument',
  PAYMENT: 'Payment',
  VENDOR_EXPENSE: 'VendorExpense',
  INTEGRATION_SETTINGS: 'IntegrationSettings',
} as const;
