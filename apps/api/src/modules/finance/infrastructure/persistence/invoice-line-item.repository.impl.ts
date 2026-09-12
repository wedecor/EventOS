import { Injectable } from '@nestjs/common';
import type { InvoiceLineItem } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateInvoiceLineItemData,
  InvoiceLineItemRecord,
  InvoiceLineItemRepository,
} from '../../domain/repositories/invoice-line-item.repository';

@Injectable()
export class InvoiceLineItemRepositoryImpl
  extends TenantScopedRepository
  implements InvoiceLineItemRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    invoiceId: string,
    data: CreateInvoiceLineItemData,
  ): Promise<InvoiceLineItemRecord> {
    const lineItem = await this.prisma.invoiceLineItem.create({
      data: {
        tenantId,
        invoiceId,
        description: data.description,
        quantity: data.quantity ?? 1,
        unitPriceAmount: data.unitPriceAmount,
        currency: data.currency ?? 'INR',
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return this.mapLineItem(lineItem);
  }

  async findByInvoiceId(
    tenantId: string,
    invoiceId: string,
  ): Promise<InvoiceLineItemRecord[]> {
    const lineItems = await this.prisma.invoiceLineItem.findMany({
      where: { tenantId, invoiceId },
      orderBy: { sortOrder: 'asc' },
    });

    return lineItems.map((item) => this.mapLineItem(item));
  }

  private mapLineItem(lineItem: InvoiceLineItem): InvoiceLineItemRecord {
    return {
      id: lineItem.id,
      tenantId: lineItem.tenantId,
      invoiceId: lineItem.invoiceId,
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
