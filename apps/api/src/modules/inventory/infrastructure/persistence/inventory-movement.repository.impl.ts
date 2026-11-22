import { Injectable } from '@nestjs/common';
import type { InventoryMovement } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import {
  INVENTORY_MOVEMENT_RELEASED_STATUSES,
  type CreateInventoryMovementData,
  type InventoryMovementRecord,
  type InventoryMovementRepository,
  type UpdateInventoryMovementData,
} from '../../domain/repositories/inventory-movement.repository';

@Injectable()
export class InventoryMovementRepositoryImpl
  extends TenantScopedRepository
  implements InventoryMovementRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateInventoryMovementData,
  ): Promise<InventoryMovementRecord> {
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        inventoryItemId: data.inventoryItemId,
        quantity: data.quantity,
        notes: data.notes ?? null,
        ...(data.reservationId
          ? { reservation: { connect: { id: data.reservationId } } }
          : {}),
      },
    });

    return this.mapRecord(movement);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<InventoryMovementRecord | null> {
    const movement = await this.prisma.inventoryMovement.findFirst({
      where: { id, tenantId },
    });

    return movement ? this.mapRecord(movement) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InventoryMovementRecord[]> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'asc' },
    });

    return movements.map((movement) => this.mapRecord(movement));
  }

  async findAll(tenantId: string): Promise<InventoryMovementRecord[]> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return movements.map((movement) => this.mapRecord(movement));
  }

  async findUnlinkedActiveByItemId(
    tenantId: string,
    inventoryItemId: string,
  ): Promise<InventoryMovementRecord[]> {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        inventoryItemId,
        reservationId: null,
        status: { notIn: INVENTORY_MOVEMENT_RELEASED_STATUSES },
      },
    });

    return movements.map((movement) => this.mapRecord(movement));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateInventoryMovementData,
    version: number,
  ): Promise<InventoryMovementRecord> {
    try {
      const movement = await this.prisma.inventoryMovement.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          notes: data.notes,
          packedByUserId: data.packedByUserId,
          packingStartedAt: data.packingStartedAt,
          verificationNotes: data.verificationNotes,
          verifiedAt: data.verifiedAt,
          readyForDispatchAt: data.readyForDispatchAt,
          vehicle: data.vehicle,
          driverName: data.driverName,
          dispatchedAt: data.dispatchedAt,
          returnedQuantity: data.returnedQuantity,
          missingQuantity: data.missingQuantity,
          damagedQuantity: data.damagedQuantity,
          returnVerificationNotes: data.returnVerificationNotes,
          returnVerifiedAt: data.returnVerifiedAt,
          pickedAt: data.pickedAt,
          packedAt: data.packedAt,
          loadedAt: data.loadedAt,
          atVenueAt: data.atVenueAt,
          returnedAt: data.returnedAt,
          cleanedReadyAt: data.cleanedReadyAt,
          version: { increment: 1 },
        },
      });

      return this.mapRecord(movement);
    } catch (error: unknown) {
      return this.toConcurrentModification('InventoryMovement', id, error);
    }
  }

  private mapRecord(movement: InventoryMovement): InventoryMovementRecord {
    return {
      id: movement.id,
      tenantId: movement.tenantId,
      bookingId: movement.bookingId,
      inventoryItemId: movement.inventoryItemId,
      reservationId: movement.reservationId,
      quantity: movement.quantity,
      notes: movement.notes,
      status: movement.status,
      packedByUserId: movement.packedByUserId,
      packingStartedAt: movement.packingStartedAt,
      verificationNotes: movement.verificationNotes,
      verifiedAt: movement.verifiedAt,
      readyForDispatchAt: movement.readyForDispatchAt,
      vehicle: movement.vehicle,
      driverName: movement.driverName,
      dispatchedAt: movement.dispatchedAt,
      returnedQuantity: movement.returnedQuantity,
      missingQuantity: movement.missingQuantity,
      damagedQuantity: movement.damagedQuantity,
      returnVerificationNotes: movement.returnVerificationNotes,
      returnVerifiedAt: movement.returnVerifiedAt,
      pickedAt: movement.pickedAt,
      packedAt: movement.packedAt,
      loadedAt: movement.loadedAt,
      atVenueAt: movement.atVenueAt,
      returnedAt: movement.returnedAt,
      cleanedReadyAt: movement.cleanedReadyAt,
      createdAt: movement.createdAt,
      updatedAt: movement.updatedAt,
      version: movement.version,
    };
  }
}
