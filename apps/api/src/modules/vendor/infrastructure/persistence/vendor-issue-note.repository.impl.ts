import { Injectable } from '@nestjs/common';
import type { VendorIssueNote } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateVendorIssueNoteData,
  VendorIssueNoteRecord,
  VendorIssueNoteRepository,
} from '../../domain/repositories/vendor-issue-note.repository';

@Injectable()
export class VendorIssueNoteRepositoryImpl
  extends TenantScopedRepository
  implements VendorIssueNoteRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    vendorId: string,
    data: CreateVendorIssueNoteData,
  ): Promise<VendorIssueNoteRecord> {
    const note = await this.prisma.vendorIssueNote.create({
      data: {
        tenantId,
        vendor: { connect: { id: vendorId } },
        message: data.message,
        severity: data.severity,
        occurredAt: data.occurredAt ?? null,
      },
    });

    return this.mapRecord(note);
  }

  async findByVendorId(
    tenantId: string,
    vendorId: string,
  ): Promise<VendorIssueNoteRecord[]> {
    const notes = await this.prisma.vendorIssueNote.findMany({
      where: { tenantId, vendorId },
      orderBy: { createdAt: 'asc' },
    });

    return notes.map((note) => this.mapRecord(note));
  }

  private mapRecord(note: VendorIssueNote): VendorIssueNoteRecord {
    return {
      id: note.id,
      tenantId: note.tenantId,
      vendorId: note.vendorId,
      message: note.message,
      severity: note.severity,
      occurredAt: note.occurredAt,
      createdAt: note.createdAt,
    };
  }
}
