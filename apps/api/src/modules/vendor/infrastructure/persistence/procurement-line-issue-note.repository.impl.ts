import { Injectable } from '@nestjs/common';
import type { ProcurementLineIssueNote } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateProcurementLineIssueNoteData,
  ProcurementLineIssueNoteRecord,
  ProcurementLineIssueNoteRepository,
} from '../../domain/repositories/procurement-line-issue-note.repository';

@Injectable()
export class ProcurementLineIssueNoteRepositoryImpl
  extends TenantScopedRepository
  implements ProcurementLineIssueNoteRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    procurementLineId: string,
    data: CreateProcurementLineIssueNoteData,
  ): Promise<ProcurementLineIssueNoteRecord> {
    const note = await this.prisma.procurementLineIssueNote.create({
      data: {
        tenantId,
        procurementLine: { connect: { id: procurementLineId } },
        message: data.message,
        severity: data.severity,
        occurredAt: data.occurredAt ?? null,
      },
    });

    return this.mapRecord(note);
  }

  async findByProcurementLineId(
    tenantId: string,
    procurementLineId: string,
  ): Promise<ProcurementLineIssueNoteRecord[]> {
    const notes = await this.prisma.procurementLineIssueNote.findMany({
      where: { tenantId, procurementLineId },
      orderBy: { createdAt: 'asc' },
    });

    return notes.map((note) => this.mapRecord(note));
  }

  private mapRecord(
    note: ProcurementLineIssueNote,
  ): ProcurementLineIssueNoteRecord {
    return {
      id: note.id,
      tenantId: note.tenantId,
      procurementLineId: note.procurementLineId,
      message: note.message,
      severity: note.severity,
      occurredAt: note.occurredAt,
      createdAt: note.createdAt,
    };
  }
}
