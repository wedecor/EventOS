import { Injectable } from '@nestjs/common';
import type { InventoryVerification } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateInventoryVerificationData,
  InventoryVerificationRecord,
  InventoryVerificationRepository,
} from '../../domain/repositories/inventory-verification.repository';

@Injectable()
export class InventoryVerificationRepositoryImpl
  extends TenantScopedRepository
  implements InventoryVerificationRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateInventoryVerificationData,
  ): Promise<InventoryVerificationRecord> {
    const row = await this.prisma.inventoryVerification.create({
      data: {
        tenant: { connect: { id: tenantId } },
        movement: { connect: { id: data.movementId } },
        booking: { connect: { id: data.bookingId } },
        expectedQuantity: data.expectedQuantity,
        actualQuantity: data.actualQuantity,
        difference: data.difference,
        result: data.result,
        notes: data.notes ?? null,
        verifiedAt: data.verifiedAt ?? new Date(),
        ...(data.verifiedByUserId
          ? { verifiedBy: { connect: { id: data.verifiedByUserId } } }
          : {}),
      },
    });
    return this.map(row);
  }

  async findByMovementId(
    tenantId: string,
    movementId: string,
  ): Promise<InventoryVerificationRecord[]> {
    const rows = await this.prisma.inventoryVerification.findMany({
      where: { tenantId, movementId },
      orderBy: { verifiedAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InventoryVerificationRecord[]> {
    const rows = await this.prisma.inventoryVerification.findMany({
      where: { tenantId, bookingId },
      orderBy: { verifiedAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  private map(row: InventoryVerification): InventoryVerificationRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      movementId: row.movementId,
      bookingId: row.bookingId,
      expectedQuantity: row.expectedQuantity,
      actualQuantity: row.actualQuantity,
      difference: row.difference,
      result: row.result,
      notes: row.notes,
      verifiedAt: row.verifiedAt,
      verifiedByUserId: row.verifiedByUserId,
      createdAt: row.createdAt,
    };
  }
}
