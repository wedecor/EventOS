import { Injectable } from '@nestjs/common';
import type { InventoryReservation } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateInventoryReservationData,
  InventoryReservationRecord,
  InventoryReservationRepository,
  UpdateInventoryReservationData,
} from '../../domain/repositories/inventory-reservation.repository';

@Injectable()
export class InventoryReservationRepositoryImpl
  extends TenantScopedRepository
  implements InventoryReservationRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateInventoryReservationData,
  ): Promise<InventoryReservationRecord> {
    const row = await this.prisma.inventoryReservation.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        inventoryItem: { connect: { id: data.inventoryItemId } },
        quantity: data.quantity,
        notes: data.notes ?? null,
        ...(data.vendorProcurementId
          ? {
              vendorProcurement: {
                connect: { id: data.vendorProcurementId },
              },
            }
          : {}),
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<InventoryReservationRecord | null> {
    const row = await this.prisma.inventoryReservation.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InventoryReservationRecord[]> {
    const rows = await this.prisma.inventoryReservation.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findActiveByItemId(
    tenantId: string,
    inventoryItemId: string,
  ): Promise<InventoryReservationRecord[]> {
    const rows = await this.prisma.inventoryReservation.findMany({
      where: { tenantId, inventoryItemId, status: 'reserved' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateInventoryReservationData,
    version: number,
  ): Promise<InventoryReservationRecord> {
    try {
      const row = await this.prisma.inventoryReservation.update({
        where: { id, tenantId, version },
        data: {
          quantity: data.quantity,
          status: data.status,
          notes: data.notes,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('InventoryReservation', id, error);
    }
  }

  private map(row: InventoryReservation): InventoryReservationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      bookingId: row.bookingId,
      inventoryItemId: row.inventoryItemId,
      quantity: row.quantity,
      status: row.status,
      notes: row.notes,
      vendorProcurementId: row.vendorProcurementId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
