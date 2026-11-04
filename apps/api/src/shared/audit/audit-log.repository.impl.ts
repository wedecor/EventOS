import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { TenantScopedRepository } from '../database';
import type { AuditEntry } from './audit-log.entry';
import { AuditLogRepository } from './audit-log.repository';

// Persists audit records to the append-only `audit_logs` table. The write is a
// standalone insert (never enrolled in a business transaction) so a rolled-back
// business operation still leaves a durable audit trail — required to record
// `outcome = failure` entries (R1-08). Tenant scoping is enforced by connecting the
// tenant on every insert (ADR-016).
@Injectable()
export class PrismaAuditLogRepository
  extends TenantScopedRepository
  implements AuditLogRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenant: { connect: { id: entry.tenantId } },
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        outcome: entry.outcome,
        metadata:
          entry.metadata == null
            ? undefined
            : (entry.metadata as Prisma.InputJsonValue),
      },
    });
  }
}
