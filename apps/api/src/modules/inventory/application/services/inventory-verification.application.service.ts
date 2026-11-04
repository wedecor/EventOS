import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository';
import { InventoryVerificationRepository } from '../../domain/repositories/inventory-verification.repository';
import {
  toInventoryVerificationDto,
  type InventoryVerificationDto,
} from '../dtos/inventory-verification.dto';

export type CreateInventoryVerificationInput = {
  expectedQuantity: number;
  actualQuantity: number;
  notes?: string | null;
  verifiedByUserId?: string | null;
  verifiedAt?: Date;
};

@Injectable()
export class InventoryVerificationApplicationService {
  constructor(
    private readonly verificationRepository: InventoryVerificationRepository,
    private readonly movementRepository: InventoryMovementRepository,
  ) {}

  async createVerification(
    tenantId: string,
    movementId: string,
    input: CreateInventoryVerificationInput,
  ): Promise<Result<InventoryVerificationDto>> {
    const movement = await this.movementRepository.findById(
      tenantId,
      movementId,
    );
    if (!movement) {
      return failure('NOT_FOUND', 'Inventory movement not found.');
    }

    if (input.expectedQuantity < 0 || input.actualQuantity < 0) {
      return failure(
        'VALIDATION_ERROR',
        'Expected and actual quantities must be non-negative.',
      );
    }

    const difference = input.actualQuantity - input.expectedQuantity;
    const result =
      difference === 0 ? 'pass' : difference < 0 ? 'fail' : 'partial';

    const verification = await this.verificationRepository.create(tenantId, {
      movementId,
      bookingId: movement.bookingId,
      expectedQuantity: input.expectedQuantity,
      actualQuantity: input.actualQuantity,
      difference,
      result,
      notes: input.notes,
      verifiedAt: input.verifiedAt ?? new Date(),
      verifiedByUserId: input.verifiedByUserId,
    });

    return success(toInventoryVerificationDto(verification));
  }

  async listForMovement(
    tenantId: string,
    movementId: string,
  ): Promise<Result<InventoryVerificationDto[]>> {
    const rows = await this.verificationRepository.findByMovementId(
      tenantId,
      movementId,
    );
    return success(rows.map(toInventoryVerificationDto));
  }

  async listForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<InventoryVerificationDto[]>> {
    const rows = await this.verificationRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    return success(rows.map(toInventoryVerificationDto));
  }
}
