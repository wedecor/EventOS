import { Injectable } from '@nestjs/common';
import type { VendorProcurement } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateVendorProcurementData,
  UpdateVendorProcurementData,
  VendorProcurementRecord,
  VendorProcurementRepository,
} from '../../domain/repositories/vendor-procurement.repository';

@Injectable()
export class VendorProcurementRepositoryImpl
  extends TenantScopedRepository
  implements VendorProcurementRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateVendorProcurementData,
  ): Promise<VendorProcurementRecord> {
    const procurement = await this.prisma.vendorProcurement.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        vendor: { connect: { id: data.vendorId } },
        notes: data.notes ?? null,
        serviceCategory: data.serviceCategory ?? null,
        requiredDate: data.requiredDate ?? null,
        estimatedCost: data.estimatedCost ?? null,
        workflowStatus: 'draft',
        status: 'planned',
        deliveryStatus: 'pending',
      },
    });

    return this.mapRecord(procurement);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<VendorProcurementRecord | null> {
    const procurement = await this.prisma.vendorProcurement.findFirst({
      where: { id, tenantId },
    });

    return procurement ? this.mapRecord(procurement) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<VendorProcurementRecord[]> {
    const procurements = await this.prisma.vendorProcurement.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'asc' },
    });

    return procurements.map((procurement) => this.mapRecord(procurement));
  }

  async findAll(tenantId: string): Promise<VendorProcurementRecord[]> {
    const procurements = await this.prisma.vendorProcurement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return procurements.map((p) => this.mapRecord(p));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateVendorProcurementData,
    version: number,
  ): Promise<VendorProcurementRecord> {
    try {
      const procurement = await this.prisma.vendorProcurement.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          workflowStatus: data.workflowStatus,
          serviceCategory: data.serviceCategory,
          requiredDate: data.requiredDate,
          estimatedCost: data.estimatedCost,
          approvedCost: data.approvedCost,
          actualCost: data.actualCost,
          deliveryStatus: data.deliveryStatus,
          deliveryNotes: data.deliveryNotes,
          notes: data.notes,
          version: { increment: 1 },
        },
      });
      return this.mapRecord(procurement);
    } catch (error: unknown) {
      return this.toConcurrentModification('VendorProcurement', id, error);
    }
  }

  private mapRecord(procurement: VendorProcurement): VendorProcurementRecord {
    return {
      id: procurement.id,
      tenantId: procurement.tenantId,
      bookingId: procurement.bookingId,
      vendorId: procurement.vendorId,
      status: procurement.status,
      workflowStatus: procurement.workflowStatus,
      serviceCategory: procurement.serviceCategory,
      requiredDate: procurement.requiredDate,
      estimatedCost: this.toNumber(procurement.estimatedCost),
      approvedCost: this.toNumber(procurement.approvedCost),
      actualCost: this.toNumber(procurement.actualCost),
      deliveryStatus: procurement.deliveryStatus,
      deliveryNotes: procurement.deliveryNotes,
      notes: procurement.notes,
      createdAt: procurement.createdAt,
      updatedAt: procurement.updatedAt,
      version: procurement.version,
    };
  }
}
