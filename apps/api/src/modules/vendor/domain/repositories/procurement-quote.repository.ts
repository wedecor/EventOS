import type { ProcurementQuoteStatus } from '@prisma/client';

export type ProcurementQuoteRecord = {
  id: string;
  tenantId: string;
  vendorProcurementId: string;
  vendorId: string;
  amount: number;
  currency: string;
  validUntil: Date | null;
  notes: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  attachmentSizeBytes: number | null;
  status: ProcurementQuoteStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateProcurementQuoteData = {
  vendorProcurementId: string;
  vendorId: string;
  amount: number;
  currency?: string;
  validUntil?: Date | null;
  notes?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSizeBytes?: number | null;
};

export type UpdateProcurementQuoteData = {
  status?: ProcurementQuoteStatus;
  notes?: string | null;
};

export abstract class ProcurementQuoteRepository {
  abstract create(
    tenantId: string,
    data: CreateProcurementQuoteData,
  ): Promise<ProcurementQuoteRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<ProcurementQuoteRecord | null>;

  abstract findByVendorProcurementId(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<ProcurementQuoteRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateProcurementQuoteData,
    version: number,
  ): Promise<ProcurementQuoteRecord>;
}
