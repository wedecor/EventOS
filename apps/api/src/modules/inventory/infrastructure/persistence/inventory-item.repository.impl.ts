import { Injectable } from '@nestjs/common';
import type { InventoryItem } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateInventoryItemData,
  FindInventoryItemsFilter,
  InventoryItemRecord,
  InventoryItemRepository,
  UpdateInventoryItemData,
} from '../../domain/repositories/inventory-item.repository';

@Injectable()
export class InventoryItemRepositoryImpl
  extends TenantScopedRepository
  implements InventoryItemRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateInventoryItemData,
  ): Promise<InventoryItemRecord> {
    const item = await this.prisma.inventoryItem.create({
      data: {
        tenant: { connect: { id: tenantId } },
        name: data.name,
        sku: data.sku ?? null,
        category: data.category,
        taxonomy: data.taxonomy,
        unit: data.unit,
        condition: data.condition,
        quantityAtJpNagar: data.quantityAtJpNagar ?? 0,
        status: data.status,
      },
    });

    return this.mapRecord(item);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<InventoryItemRecord | null> {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    return item ? this.mapRecord(item) : null;
  }

  async findMany(
    tenantId: string,
    filter?: FindInventoryItemsFilter,
  ): Promise<InventoryItemRecord[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        status: filter?.status,
        taxonomy: filter?.taxonomy,
        category: filter?.category,
      },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) => this.mapRecord(item));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateInventoryItemData,
    version: number,
  ): Promise<InventoryItemRecord> {
    try {
      const item = await this.prisma.inventoryItem.update({
        where: { id, tenantId, version },
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          taxonomy: data.taxonomy,
          unit: data.unit,
          condition: data.condition,
          quantityAtJpNagar: data.quantityAtJpNagar,
          status: data.status,
          version: { increment: 1 },
        },
      });

      return this.mapRecord(item);
    } catch (error: unknown) {
      return this.toConcurrentModification('InventoryItem', id, error);
    }
  }

  private mapRecord(item: InventoryItem): InventoryItemRecord {
    return {
      id: item.id,
      tenantId: item.tenantId,
      name: item.name,
      sku: item.sku,
      category: item.category,
      taxonomy: item.taxonomy,
      unit: item.unit,
      condition: item.condition,
      quantityAtJpNagar: item.quantityAtJpNagar,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      version: item.version,
    };
  }
}
