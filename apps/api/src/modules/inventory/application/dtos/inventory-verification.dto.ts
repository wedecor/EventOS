import type { InventoryVerificationRecord } from '../../domain/repositories/inventory-verification.repository';

export type InventoryVerificationDto = {
  id: string;
  tenantId: string;
  movementId: string;
  bookingId: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  result: InventoryVerificationRecord['result'];
  notes: string | null;
  verifiedAt: Date;
  verifiedByUserId: string | null;
  createdAt: Date;
};

export function toInventoryVerificationDto(
  record: InventoryVerificationRecord,
): InventoryVerificationDto {
  return { ...record };
}
