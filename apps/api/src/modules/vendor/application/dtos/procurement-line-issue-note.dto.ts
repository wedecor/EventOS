import type { ProcurementLineIssueNoteRecord } from '../../domain/repositories/procurement-line-issue-note.repository';

export type ProcurementLineIssueNoteDto = {
  id: string;
  tenantId: string;
  procurementLineId: string;
  message: string;
  severity: ProcurementLineIssueNoteRecord['severity'];
  occurredAt: Date | null;
  createdAt: Date;
};

export function toProcurementLineIssueNoteDto(
  record: ProcurementLineIssueNoteRecord,
): ProcurementLineIssueNoteDto {
  return { ...record };
}
