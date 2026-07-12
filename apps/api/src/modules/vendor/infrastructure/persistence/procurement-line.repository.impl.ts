import { Injectable } from '@nestjs/common';
import type { ProcurementLine } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateProcurementLineData,
  ProcurementLineRecord,
  ProcurementLineRepository,
  UpdateProcurementLineData,
} from '../../domain/repositories/procurement-line.repository';

@Injectable()
export class ProcurementLineRepositoryImpl
  extends TenantScopedRepository
  implements ProcurementLineRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    vendorProcurementId: string,
    bookingId: string,
    data: CreateProcurementLineData,
  ): Promise<ProcurementLineRecord> {
    const line = await this.prisma.procurementLine.create({
      data: {
        tenantId,
        vendorProcurementId,
        bookingId,
        quotationLineItemId: data.quotationLineItemId ?? null,
        description: data.description,
        category: data.category,
        quantity: data.quantity ?? 1,
        budgetedAmount: data.budgetedAmount ?? null,
        currency: data.currency ?? 'INR',
        notes: data.notes ?? null,
      },
    });

    return this.mapRecord(line);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<ProcurementLineRecord | null> {
    const line = await this.prisma.procurementLine.findFirst({
      where: { id, tenantId },
    });

    return line ? this.mapRecord(line) : null;
  }

  async findByVendorProcurementId(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<ProcurementLineRecord[]> {
    const lines = await this.prisma.procurementLine.findMany({
      where: { tenantId, vendorProcurementId },
      orderBy: { createdAt: 'asc' },
    });

    return lines.map((line) => this.mapRecord(line));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateProcurementLineData,
    version: number,
  ): Promise<ProcurementLineRecord> {
    try {
      const line = await this.prisma.procurementLine.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          actualAmount: data.actualAmount,
          costVarianceAmount: data.costVarianceAmount,
          costVarianceReason: data.costVarianceReason,
          notes: data.notes,
          requestedAt: data.requestedAt,
          confirmedAt: data.confirmedAt,
          deliveredAt: data.deliveredAt,
          completedAt: data.completedAt,
          version: { increment: 1 },
        },
      });

      return this.mapRecord(line);
    } catch (error: unknown) {
      return this.toConcurrentModification('ProcurementLine', id, error);
    }
  }

  private mapRecord(line: ProcurementLine): ProcurementLineRecord {
    return {
      id: line.id,
      tenantId: line.tenantId,
      vendorProcurementId: line.vendorProcurementId,
      bookingId: line.bookingId,
      quotationLineItemId: line.quotationLineItemId,
      description: line.description,
      category: line.category,
      quantity: line.quantity,
      budgetedAmount: this.toNumber(line.budgetedAmount),
      actualAmount: this.toNumber(line.actualAmount),
      currency: line.currency,
      status: line.status,
      requestedAt: line.requestedAt,
      confirmedAt: line.confirmedAt,
      deliveredAt: line.deliveredAt,
      completedAt: line.completedAt,
      costVarianceAmount: this.toNumber(line.costVarianceAmount),
      costVarianceReason: line.costVarianceReason,
      notes: line.notes,
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
      version: line.version,
    };
  }
}
