import { Injectable } from '@nestjs/common';
import type { FinancialDocumentAuditEvent } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateFinancialDocumentAuditEventData,
  FinancialDocumentAuditEventRecord,
  FinancialDocumentAuditEventRepository,
} from '../../domain/repositories/financial-document-audit-event.repository';

@Injectable()
export class FinancialDocumentAuditEventRepositoryImpl
  extends TenantScopedRepository
  implements FinancialDocumentAuditEventRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateFinancialDocumentAuditEventData,
  ): Promise<FinancialDocumentAuditEventRecord> {
    const row = await this.prisma.financialDocumentAuditEvent.create({
      data: {
        tenant: { connect: { id: tenantId } },
        document: { connect: { id: data.financialDocumentId } },
        eventType: data.eventType,
        message: data.message,
        actorUserId: data.actorUserId ?? null,
        occurredAt: data.occurredAt ?? new Date(),
      },
    });
    return this.map(row);
  }

  async findByDocumentId(
    tenantId: string,
    financialDocumentId: string,
  ): Promise<FinancialDocumentAuditEventRecord[]> {
    const rows = await this.prisma.financialDocumentAuditEvent.findMany({
      where: { tenantId, financialDocumentId },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByBookingDocumentIds(
    tenantId: string,
    financialDocumentIds: string[],
  ): Promise<FinancialDocumentAuditEventRecord[]> {
    if (financialDocumentIds.length === 0) return [];
    const rows = await this.prisma.financialDocumentAuditEvent.findMany({
      where: {
        tenantId,
        financialDocumentId: { in: financialDocumentIds },
      },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  private map(
    row: FinancialDocumentAuditEvent,
  ): FinancialDocumentAuditEventRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      financialDocumentId: row.financialDocumentId,
      eventType: row.eventType,
      message: row.message,
      actorUserId: row.actorUserId,
      occurredAt: row.occurredAt,
      createdAt: row.createdAt,
    };
  }
}
