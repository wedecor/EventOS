import type { IssueNoteSeverity, IssueNoteStatus } from '@prisma/client';

export type IssueNoteRecord = {
  id: string;
  tenantId: string;
  eventId: string;
  customerId: string;
  message: string;
  severity: IssueNoteSeverity;
  notes: string | null;
  status: IssueNoteStatus;
  createdAt: Date;
};

export type CreateIssueNoteData = {
  eventId: string;
  customerId: string;
  message: string;
  severity: IssueNoteSeverity;
  notes?: string | null;
};

export abstract class IssueNoteRepository {
  abstract create(
    tenantId: string,
    data: CreateIssueNoteData,
  ): Promise<IssueNoteRecord>;
}
