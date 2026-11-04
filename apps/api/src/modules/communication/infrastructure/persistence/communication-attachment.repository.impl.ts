import { Injectable } from '@nestjs/common';
import type { CommunicationAttachment } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CommunicationAttachmentRecord,
  CommunicationAttachmentRepository,
  CreateCommunicationAttachmentData,
  UpdateCommunicationAttachmentData,
} from '../../domain/repositories/communication-attachment.repository';

@Injectable()
export class CommunicationAttachmentRepositoryImpl
  extends TenantScopedRepository
  implements CommunicationAttachmentRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateCommunicationAttachmentData,
  ): Promise<CommunicationAttachmentRecord> {
    const row = await this.prisma.communicationAttachment.create({
      data: {
        tenant: { connect: { id: tenantId } },
        record: { connect: { id: data.communicationRecordId } },
        fileName: data.fileName ?? null,
        mimeType: data.mimeType ?? null,
        fileSizeBytes: data.fileSizeBytes ?? null,
        storageKey: data.storageKey ?? null,
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<CommunicationAttachmentRecord | null> {
    const row = await this.prisma.communicationAttachment.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findByCommunicationRecordId(
    tenantId: string,
    communicationRecordId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationAttachmentRecord[]> {
    const rows = await this.prisma.communicationAttachment.findMany({
      where: {
        tenantId,
        communicationRecordId,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateCommunicationAttachmentData,
    version: number,
  ): Promise<CommunicationAttachmentRecord> {
    try {
      const row = await this.prisma.communicationAttachment.update({
        where: { id, tenantId, version },
        data: {
          fileName: data.fileName,
          mimeType: data.mimeType,
          fileSizeBytes: data.fileSizeBytes,
          storageKey: data.storageKey,
          deletedAt: data.deletedAt,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification(
        'CommunicationAttachment',
        id,
        error,
      );
    }
  }

  private map(row: CommunicationAttachment): CommunicationAttachmentRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      communicationRecordId: row.communicationRecordId,
      fileName: row.fileName,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes,
      storageKey: row.storageKey,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
