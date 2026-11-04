import type { InventoryReservationRecord } from '../../domain/repositories/inventory-reservation.repository';

export type InventoryReservationDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  status: InventoryReservationRecord['status'];
  notes: string | null;
  vendorProcurementId: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toInventoryReservationDto(
  record: InventoryReservationRecord,
): InventoryReservationDto {
  return { ...record };
}
