import type {
  FinancialDocumentType,
  FinancialDocumentVerificationStatus,
} from '@prisma/client';

export type FinancialDocumentRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  documentType: FinancialDocumentType;
  verificationStatus: FinancialDocumentVerificationStatus;
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

export type CreateFinancialDocumentData = {
  bookingId: string;
  documentType: FinancialDocumentType;
  description?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  storageKey?: string | null;
  paymentId?: string | null;
  vendorExpenseId?: string | null;
  vendorProcurementId?: string | null;
  invoiceId?: string | null;
  uploadedByUserId?: string | null;
  uploadedAt?: Date;
};

export type UpdateFinancialDocumentData = {
  description?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  storageKey?: string | null;
  paymentId?: string | null;
  vendorExpenseId?: string | null;
  vendorProcurementId?: string | null;
  invoiceId?: string | null;
  verificationStatus?: FinancialDocumentVerificationStatus;
  verifiedByUserId?: string | null;
  verifiedAt?: Date | null;
  verificationNotes?: string | null;
  deletedAt?: Date | null;
};

export abstract class FinancialDocumentRepository {
  abstract create(
    tenantId: string,
    data: CreateFinancialDocumentData,
  ): Promise<FinancialDocumentRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<FinancialDocumentRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<FinancialDocumentRecord[]>;

  abstract findByPaymentId(
    tenantId: string,
    paymentId: string,
  ): Promise<FinancialDocumentRecord[]>;

  abstract findByExpenseId(
    tenantId: string,
    vendorExpenseId: string,
  ): Promise<FinancialDocumentRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateFinancialDocumentData,
    version: number,
  ): Promise<FinancialDocumentRecord>;
}
