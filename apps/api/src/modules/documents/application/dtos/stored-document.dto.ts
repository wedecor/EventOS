import type { StoredDocumentRecord } from '../../domain/repositories/stored-document.repository';

export type StoredDocumentDto = {
  id: string;
  category: StoredDocumentRecord['category'];
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  customerId: string | null;
  quotationId: string | null;
  bookingId: string | null;
  invoiceId: string | null;
  uploadedByUserId: string | null;
  uploadedAt: string;
  version: number;
};

export function toStoredDocumentDto(
  record: StoredDocumentRecord,
): StoredDocumentDto {
  return {
    id: record.id,
    category: record.category,
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSizeBytes: record.fileSizeBytes,
    customerId: record.customerId,
    quotationId: record.quotationId,
    bookingId: record.bookingId,
    invoiceId: record.invoiceId,
    uploadedByUserId: record.uploadedByUserId,
    uploadedAt: record.uploadedAt.toISOString(),
    version: record.version,
  };
}
