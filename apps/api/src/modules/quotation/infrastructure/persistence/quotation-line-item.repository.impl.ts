import { Injectable } from '@nestjs/common';
import type { QuotationLineItem } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { ConcurrentModificationError } from '../../../../shared/database';
import {
  QuotationLineItemRepository,
  type CreateQuotationLineItemData,
  type QuotationLineItemRecord,
  type UpdateQuotationLineItemData,
} from '../../domain/repositories/quotation-line-item.repository';

@Injectable()
export class QuotationLineItemRepositoryImpl implements QuotationLineItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: CreateQuotationLineItemData,
  ): Promise<QuotationLineItemRecord> {
    const item = await this.prisma.quotationLineItem.create({
      data: {
        tenantId,
        quotationId: data.quotationId,
        description: data.description,
        packageId: data.packageId ?? null,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return this.map(item);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<QuotationLineItemRecord | null> {
    const item = await this.prisma.quotationLineItem.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    return item ? this.map(item) : null;
  }

  async listActiveByQuotation(
    tenantId: string,
    quotationId: string,
  ): Promise<QuotationLineItemRecord[]> {
    const items = await this.prisma.quotationLineItem.findMany({
      where: { tenantId, quotationId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });

    return items.map((item) => this.map(item));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateQuotationLineItemData,
    version: number,
  ): Promise<QuotationLineItemRecord> {
    try {
      const item = await this.prisma.quotationLineItem.update({
        where: { id, tenantId, version, deletedAt: null },
        data: {
          description: data.description,
          packageId: data.packageId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          sortOrder: data.sortOrder,
          version: { increment: 1 },
        },
      });

      return this.map(item);
    } catch {
      throw new ConcurrentModificationError('QuotationLineItem', id);
    }
  }

  async softDelete(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<QuotationLineItemRecord> {
    try {
      const item = await this.prisma.quotationLineItem.update({
        where: { id, tenantId, version, deletedAt: null },
        data: {
          deletedAt: new Date(),
          version: { increment: 1 },
        },
      });

      return this.map(item);
    } catch {
      throw new ConcurrentModificationError('QuotationLineItem', id);
    }
  }

  async countActiveByQuotation(
    tenantId: string,
    quotationId: string,
  ): Promise<number> {
    return this.prisma.quotationLineItem.count({
      where: { tenantId, quotationId, deletedAt: null },
    });
  }

  private map(item: QuotationLineItem): QuotationLineItemRecord {
    return {
      id: item.id,
      tenantId: item.tenantId,
      quotationId: item.quotationId,
      description: item.description,
      packageId: item.packageId,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      sortOrder: item.sortOrder,
      deletedAt: item.deletedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      version: item.version,
    };
  }
}
