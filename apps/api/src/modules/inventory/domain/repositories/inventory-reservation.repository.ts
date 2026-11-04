import type { InventoryReservationStatus } from '@prisma/client';

export type InventoryReservationRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  status: InventoryReservationStatus;
  notes: string | null;
  vendorProcurementId: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateInventoryReservationData = {
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  notes?: string | null;
  vendorProcurementId?: string | null;
};

export type UpdateInventoryReservationData = {
  quantity?: number;
  status?: InventoryReservationStatus;
  notes?: string | null;
};

export abstract class InventoryReservationRepository {
  abstract create(
    tenantId: string,
    data: CreateInventoryReservationData,
  ): Promise<InventoryReservationRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<InventoryReservationRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InventoryReservationRecord[]>;

  abstract findActiveByItemId(
    tenantId: string,
    inventoryItemId: string,
  ): Promise<InventoryReservationRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateInventoryReservationData,
    version: number,
  ): Promise<InventoryReservationRecord>;
}
