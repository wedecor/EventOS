import type { IssueNoteSeverity } from '@prisma/client';

export type ProcurementLineIssueNoteRecord = {
  id: string;
  tenantId: string;
  procurementLineId: string;
  message: string;
  severity: IssueNoteSeverity;
  occurredAt: Date | null;
  createdAt: Date;
};

export type CreateProcurementLineIssueNoteData = {
  message: string;
  severity: IssueNoteSeverity;
  occurredAt?: Date | null;
};

export abstract class ProcurementLineIssueNoteRepository {
  abstract create(
    tenantId: string,
    procurementLineId: string,
    data: CreateProcurementLineIssueNoteData,
  ): Promise<ProcurementLineIssueNoteRecord>;

  abstract findByProcurementLineId(
    tenantId: string,
    procurementLineId: string,
  ): Promise<ProcurementLineIssueNoteRecord[]>;
}
