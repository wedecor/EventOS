import type { VendorIssueNoteRecord } from '../../domain/repositories/vendor-issue-note.repository';

export type VendorIssueNoteDto = {
  id: string;
  tenantId: string;
  vendorId: string;
  message: string;
  severity: VendorIssueNoteRecord['severity'];
  occurredAt: Date | null;
  createdAt: Date;
};

export function toVendorIssueNoteDto(
  record: VendorIssueNoteRecord,
): VendorIssueNoteDto {
  return { ...record };
}
