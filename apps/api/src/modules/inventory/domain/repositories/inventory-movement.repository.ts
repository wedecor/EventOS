import type { InventoryMovementStatus } from '@prisma/client';

export type InventoryMovementRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  notes: string | null;
  status: InventoryMovementStatus;
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
};

export type UpdateInventoryMovementData = {
  status?: InventoryMovementStatus;
  notes?: string | null;
  pickedAt?: Date | null;
  packedAt?: Date | null;
  loadedAt?: Date | null;
  atVenueAt?: Date | null;
  returnedAt?: Date | null;
  cleanedReadyAt?: Date | null;
};

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

  // EP1-INV-003, EP1-INV-005 — Dashboard: tenant-wide movement read for inventory summary
  abstract findAll(tenantId: string): Promise<InventoryMovementRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateInventoryMovementData,
    version: number,
  ): Promise<InventoryMovementRecord>;
}
