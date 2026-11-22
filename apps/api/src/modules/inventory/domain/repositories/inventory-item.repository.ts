import type {
  InventoryItemCondition,
  InventoryItemStatus,
  InventoryItemTaxonomy,
} from '@prisma/client';

export type InventoryItemRecord = {
  id: string;
  tenantId: string;
  name: string;
  sku: string | null;
  category: string;
  taxonomy: InventoryItemTaxonomy;
  unit: string;
  condition: InventoryItemCondition;
  quantityAtJpNagar: number;
  status: InventoryItemStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateInventoryItemData = {
  name: string;
  sku?: string | null;
  category: string;
  taxonomy: InventoryItemTaxonomy;
  unit: string;
  condition?: InventoryItemCondition;
  quantityAtJpNagar?: number;
  status?: InventoryItemStatus;
};

export type UpdateInventoryItemData = {
  name?: string;
  sku?: string | null;
  category?: string;
  taxonomy?: InventoryItemTaxonomy;
  unit?: string;
  condition?: InventoryItemCondition;
  quantityAtJpNagar?: number;
  status?: InventoryItemStatus;
};

export type FindInventoryItemsFilter = {
  status?: InventoryItemStatus;
  taxonomy?: InventoryItemTaxonomy;
  category?: string;
};

export abstract class InventoryItemRepository {
  abstract create(
    tenantId: string,
    data: CreateInventoryItemData,
  ): Promise<InventoryItemRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<InventoryItemRecord | null>;

  abstract findMany(
    tenantId: string,
    filter?: FindInventoryItemsFilter,
  ): Promise<InventoryItemRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateInventoryItemData,
    version: number,
  ): Promise<InventoryItemRecord>;
}
