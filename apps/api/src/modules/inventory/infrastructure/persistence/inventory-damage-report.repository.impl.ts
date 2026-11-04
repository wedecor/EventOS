import { Injectable } from '@nestjs/common';
import type { InventoryDamageReport } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateInventoryDamageReportData,
  InventoryDamageReportRecord,
  InventoryDamageReportRepository,
} from '../../domain/repositories/inventory-damage-report.repository';

@Injectable()
export class InventoryDamageReportRepositoryImpl
  extends TenantScopedRepository
  implements InventoryDamageReportRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateInventoryDamageReportData,
  ): Promise<InventoryDamageReportRecord> {
    const row = await this.prisma.inventoryDamageReport.create({
      data: {
        tenant: { connect: { id: tenantId } },
        movement: { connect: { id: data.movementId } },
        booking: { connect: { id: data.bookingId } },
        ...(data.inventoryItemId
          ? { inventoryItem: { connect: { id: data.inventoryItemId } } }
          : {}),
        damageType: data.damageType,
        severity: data.severity ?? 'medium',
        quantity: data.quantity,
        notes: data.notes ?? null,
        photoName: data.photoName ?? null,
        photoMimeType: data.photoMimeType ?? null,
        photoSizeBytes: data.photoSizeBytes ?? null,
      },
    });
    return this.map(row);
  }

  async findByMovementId(
    tenantId: string,
    movementId: string,
  ): Promise<InventoryDamageReportRecord[]> {
    const rows = await this.prisma.inventoryDamageReport.findMany({
      where: { tenantId, movementId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InventoryDamageReportRecord[]> {
    const rows = await this.prisma.inventoryDamageReport.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  private map(row: InventoryDamageReport): InventoryDamageReportRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      movementId: row.movementId,
      bookingId: row.bookingId,
      inventoryItemId: row.inventoryItemId,
      damageType: row.damageType,
      severity: row.severity,
      quantity: row.quantity,
      notes: row.notes,
      photoName: row.photoName,
      photoMimeType: row.photoMimeType,
      photoSizeBytes: row.photoSizeBytes,
      createdAt: row.createdAt,
    };
  }
}
