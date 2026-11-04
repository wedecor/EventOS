import { Injectable } from '@nestjs/common';
import type { QuotationLineItem } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateLineItemData,
  QuotationLineItemRecord,
  QuotationLineItemRepository,
  QuotationTotalsUpdate,
  UpdateLineItemData,
} from '../../domain/repositories/quotation-line-item.repository';

@Injectable()
export class QuotationLineItemRepositoryImpl
  extends TenantScopedRepository
  implements QuotationLineItemRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateLineItemData,
  ): Promise<QuotationLineItemRecord> {
    const lineItem = await this.prisma.quotationLineItem.create({
      data: {
        tenantId,
        quotationId: data.quotationId,
        description: data.description,
        quantity: data.quantity ?? 1,
        unitPriceAmount: data.unitPriceAmount,
        currency: data.currency ?? 'INR',
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return this.mapLineItem(lineItem);
  }

  async createWithQuotationTotals(
    tenantId: string,
    data: CreateLineItemData,
    quotationTotals: QuotationTotalsUpdate,
    quotationVersion: number,
  ): Promise<QuotationLineItemRecord> {
    try {
      const [lineItem] = await this.prisma.$transaction(async (tx) => {
        const createdLineItem = await tx.quotationLineItem.create({
          data: {
            tenantId,
            quotationId: data.quotationId,
            description: data.description,
            quantity: data.quantity ?? 1,
            unitPriceAmount: data.unitPriceAmount,
            currency: data.currency ?? 'INR',
            sortOrder: data.sortOrder ?? 0,
          },
        });

        await tx.quotation.update({
          where: {
            id: data.quotationId,
            tenantId,
            version: quotationVersion,
          },
          data: {
            subtotalAmount: quotationTotals.subtotalAmount,
            totalAmount: quotationTotals.totalAmount,
            version: { increment: 1 },
          },
        });

        return [createdLineItem];
      });

      return this.mapLineItem(lineItem);
    } catch (error: unknown) {
      return this.toConcurrentModification(
        'Quotation',
        data.quotationId,
        error,
      );
    }
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<QuotationLineItemRecord | null> {
    const lineItem = await this.prisma.quotationLineItem.findFirst({
      where: { id, tenantId },
    });

    return lineItem ? this.mapLineItem(lineItem) : null;
  }

  async findByQuotationId(
    tenantId: string,
    quotationId: string,
  ): Promise<QuotationLineItemRecord[]> {
    const lineItems = await this.prisma.quotationLineItem.findMany({
      where: { tenantId, quotationId },
      orderBy: { sortOrder: 'asc' },
    });

    return lineItems.map((item) => this.mapLineItem(item));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateLineItemData,
    version: number,
  ): Promise<QuotationLineItemRecord> {
    try {
      const lineItem = await this.prisma.quotationLineItem.update({
        where: { id, tenantId, version },
        data: {
          description: data.description,
          quantity: data.quantity,
          unitPriceAmount: data.unitPriceAmount,
          sortOrder: data.sortOrder,
          version: { increment: 1 },
        },
      });

      return this.mapLineItem(lineItem);
    } catch (error: unknown) {
      return this.toConcurrentModification('QuotationLineItem', id, error);
    }
  }

  async updateWithQuotationTotals(
    tenantId: string,
    id: string,
    data: UpdateLineItemData,
    lineItemVersion: number,
    quotationTotals: QuotationTotalsUpdate,
    quotationVersion: number,
  ): Promise<QuotationLineItemRecord> {
    try {
      const [lineItem] = await this.prisma.$transaction(async (tx) => {
        const updatedLineItem = await tx.quotationLineItem.update({
          where: { id, tenantId, version: lineItemVersion },
          data: {
            description: data.description,
            quantity: data.quantity,
            unitPriceAmount: data.unitPriceAmount,
            sortOrder: data.sortOrder,
            version: { increment: 1 },
          },
        });

        await tx.quotation.update({
          where: {
            id: updatedLineItem.quotationId,
            tenantId,
            version: quotationVersion,
          },
          data: {
            subtotalAmount: quotationTotals.subtotalAmount,
            totalAmount: quotationTotals.totalAmount,
            version: { increment: 1 },
          },
        });

        return [updatedLineItem];
      });

      return this.mapLineItem(lineItem);
    } catch (error: unknown) {
      return this.toConcurrentModification('QuotationLineItem', id, error);
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.quotationLineItem.deleteMany({
      where: { id, tenantId },
    });
  }

  async removeWithQuotationTotals(
    tenantId: string,
    id: string,
    quotationId: string,
    quotationTotals: QuotationTotalsUpdate,
    quotationVersion: number,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.quotationLineItem.deleteMany({
          where: { id, tenantId },
        });

        await tx.quotation.update({
          where: { id: quotationId, tenantId, version: quotationVersion },
          data: {
            subtotalAmount: quotationTotals.subtotalAmount,
            totalAmount: quotationTotals.totalAmount,
            version: { increment: 1 },
          },
        });
      });
    } catch (error: unknown) {
      this.toConcurrentModification('Quotation', quotationId, error);
    }
  }

  async countByQuotationId(
    tenantId: string,
    quotationId: string,
  ): Promise<number> {
    return this.prisma.quotationLineItem.count({
      where: { tenantId, quotationId },
    });
  }

  private mapLineItem(lineItem: QuotationLineItem): QuotationLineItemRecord {
    return {
      id: lineItem.id,
      tenantId: lineItem.tenantId,
      quotationId: lineItem.quotationId,
      description: lineItem.description,
      quantity: lineItem.quantity,
      unitPriceAmount: this.toNumber(lineItem.unitPriceAmount) ?? 0,
      currency: lineItem.currency,
      sortOrder: lineItem.sortOrder,
      createdAt: lineItem.createdAt,
      updatedAt: lineItem.updatedAt,
      version: lineItem.version,
    };
  }
}
