import type { FinancialDocumentAuditEventType } from '@prisma/client';

export type FinancialDocumentAuditEventRecord = {
  id: string;
  tenantId: string;
  financialDocumentId: string;
  eventType: FinancialDocumentAuditEventType;
  message: string;
  actorUserId: string | null;
  occurredAt: Date;
  createdAt: Date;
};

export type CreateFinancialDocumentAuditEventData = {
  financialDocumentId: string;
  eventType: FinancialDocumentAuditEventType;
  message: string;
  actorUserId?: string | null;
  occurredAt?: Date;
};

export abstract class FinancialDocumentAuditEventRepository {
  abstract create(
    tenantId: string,
    data: CreateFinancialDocumentAuditEventData,
  ): Promise<FinancialDocumentAuditEventRecord>;

  abstract findByDocumentId(
    tenantId: string,
    financialDocumentId: string,
  ): Promise<FinancialDocumentAuditEventRecord[]>;

  abstract findByBookingDocumentIds(
    tenantId: string,
    financialDocumentIds: string[],
  ): Promise<FinancialDocumentAuditEventRecord[]>;
}
