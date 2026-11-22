import type { InventoryItemRecord } from '../../domain/repositories/inventory-item.repository';

export type InventoryItemDto = {
  id: string;
  tenantId: string;
  name: string;
  sku: string | null;
  category: string;
  taxonomy: InventoryItemRecord['taxonomy'];
  unit: string;
  condition: InventoryItemRecord['condition'];
  quantityAtJpNagar: number;
  status: InventoryItemRecord['status'];
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toInventoryItemDto(
  record: InventoryItemRecord,
): InventoryItemDto {
  return { ...record };
}
