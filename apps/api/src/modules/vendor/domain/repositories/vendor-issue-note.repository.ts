import type { IssueNoteSeverity } from '@prisma/client';

export type VendorIssueNoteRecord = {
  id: string;
  tenantId: string;
  vendorId: string;
  message: string;
  severity: IssueNoteSeverity;
  occurredAt: Date | null;
  createdAt: Date;
};

export type CreateVendorIssueNoteData = {
  message: string;
  severity: IssueNoteSeverity;
  occurredAt?: Date | null;
};

export abstract class VendorIssueNoteRepository {
  abstract create(
    tenantId: string,
    vendorId: string,
    data: CreateVendorIssueNoteData,
  ): Promise<VendorIssueNoteRecord>;

  abstract findByVendorId(
    tenantId: string,
    vendorId: string,
  ): Promise<VendorIssueNoteRecord[]>;
}
