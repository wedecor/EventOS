export type StoredDocumentCategory =
  | 'quotation_pdf'
  | 'invoice_pdf'
  | 'customer_document'
  | 'event_image'
  | 'contract'
  | 'other';

export type StoredDocumentRecord = {
  id: string;
  tenantId: string;
  category: StoredDocumentCategory;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  storageProvider: string;
  customerId: string | null;
  quotationId: string | null;
  bookingId: string | null;
  invoiceId: string | null;
  uploadedByUserId: string | null;
  uploadedAt: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateStoredDocumentData = {
  category: StoredDocumentCategory;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  storageProvider: string;
  customerId?: string | null;
  quotationId?: string | null;
  bookingId?: string | null;
  invoiceId?: string | null;
  uploadedByUserId?: string | null;
};

export type ListStoredDocumentsFilter = {
  customerId?: string;
  quotationId?: string;
  bookingId?: string;
  invoiceId?: string;
};

export abstract class StoredDocumentRepository {
  abstract create(
    tenantId: string,
    data: CreateStoredDocumentData,
  ): Promise<StoredDocumentRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<StoredDocumentRecord | null>;

  abstract list(
    tenantId: string,
    filter: ListStoredDocumentsFilter,
  ): Promise<StoredDocumentRecord[]>;

  abstract softDelete(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<StoredDocumentRecord>;
}
