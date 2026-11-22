import { Injectable } from '@nestjs/common';
import type { ProcurementQuote } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateProcurementQuoteData,
  ProcurementQuoteRecord,
  ProcurementQuoteRepository,
  UpdateProcurementQuoteData,
} from '../../domain/repositories/procurement-quote.repository';

@Injectable()
export class ProcurementQuoteRepositoryImpl
  extends TenantScopedRepository
  implements ProcurementQuoteRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateProcurementQuoteData,
  ): Promise<ProcurementQuoteRecord> {
    const row = await this.prisma.procurementQuote.create({
      data: {
        tenant: { connect: { id: tenantId } },
        vendorProcurement: { connect: { id: data.vendorProcurementId } },
        vendor: { connect: { id: data.vendorId } },
        amount: data.amount,
        currency: data.currency ?? 'INR',
        validUntil: data.validUntil ?? null,
        notes: data.notes ?? null,
        attachmentName: data.attachmentName ?? null,
        attachmentMimeType: data.attachmentMimeType ?? null,
        attachmentSizeBytes: data.attachmentSizeBytes ?? null,
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<ProcurementQuoteRecord | null> {
    const row = await this.prisma.procurementQuote.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findByVendorProcurementId(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<ProcurementQuoteRecord[]> {
    const rows = await this.prisma.procurementQuote.findMany({
      where: { tenantId, vendorProcurementId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateProcurementQuoteData,
    version: number,
  ): Promise<ProcurementQuoteRecord> {
    try {
      const row = await this.prisma.procurementQuote.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          notes: data.notes,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('ProcurementQuote', id, error);
    }
  }

  private map(row: ProcurementQuote): ProcurementQuoteRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      vendorProcurementId: row.vendorProcurementId,
      vendorId: row.vendorId,
      amount: this.toNumber(row.amount) ?? 0,
      currency: row.currency,
      validUntil: row.validUntil,
      notes: row.notes,
      attachmentName: row.attachmentName,
      attachmentMimeType: row.attachmentMimeType,
      attachmentSizeBytes: row.attachmentSizeBytes,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
