import type { InventoryMovementStatus } from '@prisma/client';

export type InventoryMovementRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  inventoryItemId: string;
  reservationId: string | null;
  quantity: number;
  notes: string | null;
  status: InventoryMovementStatus;
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

export type CreateInventoryMovementData = {
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  notes?: string | null;
  reservationId?: string | null;
};

export type UpdateInventoryMovementData = {
  status?: InventoryMovementStatus;
  notes?: string | null;
  packedByUserId?: string | null;
  packingStartedAt?: Date | null;
  verificationNotes?: string | null;
  verifiedAt?: Date | null;
  readyForDispatchAt?: Date | null;
  vehicle?: string | null;
  driverName?: string | null;
  dispatchedAt?: Date | null;
  returnedQuantity?: number | null;
  missingQuantity?: number | null;
  damagedQuantity?: number | null;
  returnVerificationNotes?: string | null;
  returnVerifiedAt?: Date | null;
  pickedAt?: Date | null;
  packedAt?: Date | null;
  loadedAt?: Date | null;
  atVenueAt?: Date | null;
  returnedAt?: Date | null;
  cleanedReadyAt?: Date | null;
};

/** Statuses that no longer hold stock (available again or never held). */
export const INVENTORY_MOVEMENT_RELEASED_STATUSES: InventoryMovementStatus[] = [
  'cancelled',
  'cleaned_ready',
];

export abstract class InventoryMovementRepository {
  abstract create(
    tenantId: string,
    data: CreateInventoryMovementData,
  ): Promise<InventoryMovementRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<InventoryMovementRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InventoryMovementRecord[]>;

  abstract findAll(tenantId: string): Promise<InventoryMovementRecord[]>;

  /** Active movements for an item that are not linked to a reservation (stock holders). */
  abstract findUnlinkedActiveByItemId(
    tenantId: string,
    inventoryItemId: string,
  ): Promise<InventoryMovementRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateInventoryMovementData,
    version: number,
  ): Promise<InventoryMovementRecord>;
}
