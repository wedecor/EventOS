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
  LEAD_UPDATED: 'lead.updated',
  LEAD_AI_INTELLIGENCE: 'lead.ai_intelligence',
  // M5-01 — Firebase login bridge + identity linking + Enquiries booking feed.
  AUTH_FIREBASE_EXCHANGE: 'auth.firebase_exchange',
  EXTERNAL_IDENTITY_LINKED: 'external_identity.linked',
  EXTERNAL_IDENTITY_UNLINKED: 'external_identity.unlinked',
  ENQUIRIES_SYNC_PROCESSED: 'enquiries.sync_processed',
} as const;

/**
 * Actor id used for audit records that have no authenticated user (e.g. failed
 * unauthenticated token exchanges, machine-to-machine feed deliveries). `actor_id`
 * has no FK (see schema), so the nil UUID is a safe, recognisable sentinel.
 */
export const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000000';

export const AUDIT_ENTITY_TYPES = {
  QUOTATION: 'Quotation',
  INVOICE: 'Invoice',
  STORED_DOCUMENT: 'StoredDocument',
  PAYMENT: 'Payment',
  VENDOR_EXPENSE: 'VendorExpense',
  INTEGRATION_SETTINGS: 'IntegrationSettings',
  LEAD: 'Lead',
  EXTERNAL_IDENTITY: 'ExternalIdentity',
  EVENT: 'Event',
} as const;
