import { Injectable } from '@nestjs/common';
import type { IssueNote } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateIssueNoteData,
  IssueNoteRecord,
  IssueNoteRepository,
} from '../../domain/repositories/issue-note.repository';

@Injectable()
export class IssueNoteRepositoryImpl
  extends TenantScopedRepository
  implements IssueNoteRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateIssueNoteData,
  ): Promise<IssueNoteRecord> {
    const note = await this.prisma.issueNote.create({
      data: {
        tenantId,
        eventId: data.eventId,
        customerId: data.customerId,
        message: data.message,
        severity: data.severity,
        notes: data.notes ?? null,
        status: 'open',
      },
    });

    return this.mapRecord(note);
  }

  private mapRecord(note: IssueNote): IssueNoteRecord {
    return {
      id: note.id,
      tenantId: note.tenantId,
      eventId: note.eventId,
      customerId: note.customerId,
      message: note.message,
      severity: note.severity,
      notes: note.notes,
      status: note.status,
      createdAt: note.createdAt,
    };
  }
}
