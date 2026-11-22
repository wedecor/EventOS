import type { InventoryDamageReportRecord } from '../../domain/repositories/inventory-damage-report.repository';

export type InventoryDamageReportDto = {
  id: string;
  tenantId: string;
  movementId: string;
  bookingId: string;
  inventoryItemId: string | null;
  damageType: InventoryDamageReportRecord['damageType'];
  severity: InventoryDamageReportRecord['severity'];
  quantity: number;
  notes: string | null;
  photoName: string | null;
  photoMimeType: string | null;
  photoSizeBytes: number | null;
  createdAt: Date;
};

export function toInventoryDamageReportDto(
  record: InventoryDamageReportRecord,
): InventoryDamageReportDto {
  return { ...record };
}
