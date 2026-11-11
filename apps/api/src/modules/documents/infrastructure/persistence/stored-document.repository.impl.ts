import { Injectable } from '@nestjs/common';
import type { StoredDocument } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ConcurrentModificationError,
  TenantScopedRepository,
} from '../../../../shared/database';
import {
  StoredDocumentRepository,
  type CreateStoredDocumentData,
  type ListStoredDocumentsFilter,
  type StoredDocumentRecord,
} from '../../domain/repositories/stored-document.repository';

@Injectable()
export class StoredDocumentRepositoryImpl
  extends TenantScopedRepository
  implements StoredDocumentRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateStoredDocumentData,
  ): Promise<StoredDocumentRecord> {
    const row = await this.prisma.storedDocument.create({
      data: {
        tenantId,
        category: data.category,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSizeBytes: data.fileSizeBytes,
        storageKey: data.storageKey,
        storageProvider: data.storageProvider,
        customerId: data.customerId ?? null,
        quotationId: data.quotationId ?? null,
        bookingId: data.bookingId ?? null,
        invoiceId: data.invoiceId ?? null,
        uploadedByUserId: data.uploadedByUserId ?? null,
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<StoredDocumentRecord | null> {
    const row = await this.prisma.storedDocument.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return row ? this.map(row) : null;
  }

  async list(
    tenantId: string,
    filter: ListStoredDocumentsFilter,
  ): Promise<StoredDocumentRecord[]> {
    const rows = await this.prisma.storedDocument.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filter.customerId ? { customerId: filter.customerId } : {}),
        ...(filter.quotationId ? { quotationId: filter.quotationId } : {}),
        ...(filter.bookingId ? { bookingId: filter.bookingId } : {}),
        ...(filter.invoiceId ? { invoiceId: filter.invoiceId } : {}),
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return rows.map((row) => this.map(row));
  }

  async softDelete(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<StoredDocumentRecord> {
    const existing = await this.prisma.storedDocument.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      throw new ConcurrentModificationError('StoredDocument', id);
    }
    if (existing.version !== version) {
      throw new ConcurrentModificationError('StoredDocument', id);
    }
    const row = await this.prisma.storedDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });
    return this.map(row);
  }

  private map(row: StoredDocument): StoredDocumentRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      category: row.category,
      fileName: row.fileName,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes,
      storageKey: row.storageKey,
      storageProvider: row.storageProvider,
      customerId: row.customerId,
      quotationId: row.quotationId,
      bookingId: row.bookingId,
      invoiceId: row.invoiceId,
      uploadedByUserId: row.uploadedByUserId,
      uploadedAt: row.uploadedAt,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
