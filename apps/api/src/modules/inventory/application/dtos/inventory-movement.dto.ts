import type { InventoryMovementRecord } from '../../domain/repositories/inventory-movement.repository';

export type InventoryMovementDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  inventoryItemId: string;
  reservationId: string | null;
  quantity: number;
  notes: string | null;
  status: InventoryMovementRecord['status'];
  packedByUserId: string | null;
  packingStartedAt: Date | null;
  verificationNotes: string | null;
  verifiedAt: Date | null;
  readyForDispatchAt: Date | null;
  vehicle: string | null;
  driverName: string | null;
  dispatchedAt: Date | null;
  returnedQuantity: number | null;
  missingQuantity: number | null;
  damagedQuantity: number | null;
  returnVerificationNotes: string | null;
  returnVerifiedAt: Date | null;
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
