import { Injectable } from '@nestjs/common';
import type { VendorProcurement } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateVendorProcurementData,
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

  private mapRecord(procurement: VendorProcurement): VendorProcurementRecord {
    return {
      id: procurement.id,
      tenantId: procurement.tenantId,
      bookingId: procurement.bookingId,
      vendorId: procurement.vendorId,
      status: procurement.status,
      notes: procurement.notes,
      createdAt: procurement.createdAt,
      updatedAt: procurement.updatedAt,
      version: procurement.version,
    };
  }
}
