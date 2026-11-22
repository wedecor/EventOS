import type {
  InventoryDamageSeverity,
  InventoryDamageType,
} from '@prisma/client';

export type InventoryDamageReportRecord = {
  id: string;
  tenantId: string;
  movementId: string;
  bookingId: string;
  inventoryItemId: string | null;
  damageType: InventoryDamageType;
  severity: InventoryDamageSeverity;
  quantity: number;
  notes: string | null;
  photoName: string | null;
  photoMimeType: string | null;
  photoSizeBytes: number | null;
  createdAt: Date;
};

export type CreateInventoryDamageReportData = {
  movementId: string;
  bookingId: string;
  inventoryItemId?: string | null;
  damageType: InventoryDamageType;
  severity?: InventoryDamageSeverity;
  quantity: number;
  notes?: string | null;
  photoName?: string | null;
  photoMimeType?: string | null;
  photoSizeBytes?: number | null;
};

export abstract class InventoryDamageReportRepository {
  abstract create(
    tenantId: string,
    data: CreateInventoryDamageReportData,
  ): Promise<InventoryDamageReportRecord>;

  abstract findByMovementId(
    tenantId: string,
    movementId: string,
  ): Promise<InventoryDamageReportRecord[]>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InventoryDamageReportRecord[]>;
}
