import type { FinancialDocumentRecord } from '../../domain/repositories/financial-document.repository';
import type { FinancialDocumentAuditEventRecord } from '../../domain/repositories/financial-document-audit-event.repository';

export type FinancialDocumentDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  documentType: FinancialDocumentRecord['documentType'];
  verificationStatus: FinancialDocumentRecord['verificationStatus'];
  description: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  storageKey: string | null;
  paymentId: string | null;
  vendorExpenseId: string | null;
  vendorProcurementId: string | null;
  invoiceId: string | null;
  uploadedByUserId: string | null;
  uploadedAt: Date;
  verifiedByUserId: string | null;
  verifiedAt: Date | null;
  verificationNotes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type FinancialDocumentAuditEventDto = {
  id: string;
  tenantId: string;
  financialDocumentId: string;
  eventType: FinancialDocumentAuditEventRecord['eventType'];
  message: string;
  actorUserId: string | null;
  occurredAt: Date;
  createdAt: Date;
};

export function toFinancialDocumentDto(
  record: FinancialDocumentRecord,
): FinancialDocumentDto {
  return { ...record };
}

export function toFinancialDocumentAuditEventDto(
  record: FinancialDocumentAuditEventRecord,
): FinancialDocumentAuditEventDto {
  return { ...record };
}
