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
  PAYMENT_RECORDED: 'payment.recorded',
  VENDOR_EXPENSE_CREATED: 'vendor_expense.created',
} as const;

export const AUDIT_ENTITY_TYPES = {
  QUOTATION: 'Quotation',
  PAYMENT: 'Payment',
  VENDOR_EXPENSE: 'VendorExpense',
} as const;
