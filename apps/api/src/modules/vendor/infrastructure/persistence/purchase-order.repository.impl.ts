import { Injectable } from '@nestjs/common';
import type { PurchaseOrder } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreatePurchaseOrderData,
  PurchaseOrderRecord,
  PurchaseOrderRepository,
  UpdatePurchaseOrderData,
} from '../../domain/repositories/purchase-order.repository';

@Injectable()
export class PurchaseOrderRepositoryImpl
  extends TenantScopedRepository
  implements PurchaseOrderRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreatePurchaseOrderData,
  ): Promise<PurchaseOrderRecord> {
    const row = await this.prisma.purchaseOrder.create({
      data: {
        tenant: { connect: { id: tenantId } },
        vendorProcurement: { connect: { id: data.vendorProcurementId } },
        vendor: { connect: { id: data.vendorId } },
        poNumber: data.poNumber,
        issueDate: data.issueDate,
        totalAmount: data.totalAmount,
        currency: data.currency ?? 'INR',
        notes: data.notes ?? null,
        status: data.status ?? 'draft',
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<PurchaseOrderRecord | null> {
    const row = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findByVendorProcurementId(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<PurchaseOrderRecord[]> {
    const rows = await this.prisma.purchaseOrder.findMany({
      where: { tenantId, vendorProcurementId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdatePurchaseOrderData,
    version: number,
  ): Promise<PurchaseOrderRecord> {
    try {
      const row = await this.prisma.purchaseOrder.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          notes: data.notes,
          totalAmount: data.totalAmount,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('PurchaseOrder', id, error);
    }
  }

  async nextPoSequence(tenantId: string): Promise<number> {
    const count = await this.prisma.purchaseOrder.count({
      where: { tenantId },
    });
    return count + 1;
  }

  private map(row: PurchaseOrder): PurchaseOrderRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      vendorProcurementId: row.vendorProcurementId,
      vendorId: row.vendorId,
      poNumber: row.poNumber,
      issueDate: row.issueDate,
      totalAmount: this.toNumber(row.totalAmount) ?? 0,
      currency: row.currency,
      notes: row.notes,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
