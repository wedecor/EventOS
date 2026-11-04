import { Injectable } from '@nestjs/common';
import type {
  InventoryDamageSeverity,
  InventoryDamageType,
} from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { InventoryDamageReportRepository } from '../../domain/repositories/inventory-damage-report.repository';
import { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository';
import {
  toInventoryDamageReportDto,
  type InventoryDamageReportDto,
} from '../dtos/inventory-damage-report.dto';

export type CreateInventoryDamageReportInput = {
  damageType: InventoryDamageType;
  severity?: InventoryDamageSeverity;
  quantity: number;
  notes?: string | null;
  photoName?: string | null;
  photoMimeType?: string | null;
  photoSizeBytes?: number | null;
};

@Injectable()
export class InventoryDamageReportApplicationService {
  constructor(
    private readonly damageReportRepository: InventoryDamageReportRepository,
    private readonly movementRepository: InventoryMovementRepository,
  ) {}

  async createDamageReport(
    tenantId: string,
    movementId: string,
    input: CreateInventoryDamageReportInput,
  ): Promise<Result<InventoryDamageReportDto>> {
    const movement = await this.movementRepository.findById(
      tenantId,
      movementId,
    );
    if (!movement) {
      return failure('NOT_FOUND', 'Inventory movement not found.');
    }

    if (input.quantity <= 0) {
      return failure('VALIDATION_ERROR', 'Quantity must be greater than zero.');
    }

    const report = await this.damageReportRepository.create(tenantId, {
      movementId,
      bookingId: movement.bookingId,
      inventoryItemId: movement.inventoryItemId,
      damageType: input.damageType,
      severity: input.severity,
      quantity: input.quantity,
      notes: input.notes,
      photoName: input.photoName,
      photoMimeType: input.photoMimeType,
      photoSizeBytes: input.photoSizeBytes,
    });

    return success(toInventoryDamageReportDto(report));
  }

  async listForMovement(
    tenantId: string,
    movementId: string,
  ): Promise<Result<InventoryDamageReportDto[]>> {
    const rows = await this.damageReportRepository.findByMovementId(
      tenantId,
      movementId,
    );
    return success(rows.map(toInventoryDamageReportDto));
  }

  async listForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<InventoryDamageReportDto[]>> {
    const rows = await this.damageReportRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    return success(rows.map(toInventoryDamageReportDto));
  }
}
