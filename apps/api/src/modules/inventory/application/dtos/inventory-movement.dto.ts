import type { InventoryMovementRecord } from '../../domain/repositories/inventory-movement.repository';

export type InventoryMovementDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  notes: string | null;
  status: InventoryMovementRecord['status'];
  pickedAt: Date | null;
  packedAt: Date | null;
  loadedAt: Date | null;
  atVenueAt: Date | null;
  returnedAt: Date | null;
  cleanedReadyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toInventoryMovementDto(
  record: InventoryMovementRecord,
): InventoryMovementDto {
  return { ...record };
}
