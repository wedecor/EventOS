import type { InventoryVerificationResult } from '@prisma/client';

export type InventoryVerificationRecord = {
  id: string;
  tenantId: string;
  movementId: string;
  bookingId: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  result: InventoryVerificationResult;
  notes: string | null;
  verifiedAt: Date;
  verifiedByUserId: string | null;
  createdAt: Date;
};

export type CreateInventoryVerificationData = {
  movementId: string;
  bookingId: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  result: InventoryVerificationResult;
  notes?: string | null;
  verifiedAt?: Date;
  verifiedByUserId?: string | null;
};

export abstract class InventoryVerificationRepository {
  abstract create(
    tenantId: string,
    data: CreateInventoryVerificationData,
  ): Promise<InventoryVerificationRecord>;

  abstract findByMovementId(
    tenantId: string,
    movementId: string,
  ): Promise<InventoryVerificationRecord[]>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InventoryVerificationRecord[]>;
}
