import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  InventoryItemCreatedEvent,
  InventoryItemUpdatedEvent,
} from '../../../../shared/events/sprint3-domain.events';
import {
  InventoryItemRepository,
  type FindInventoryItemsFilter,
  type InventoryItemRecord,
} from '../../domain/repositories/inventory-item.repository';
import {
  toInventoryItemDto,
  type InventoryItemDto,
} from '../dtos/inventory-item.dto';

export type CreateInventoryItemInput = {
  name: string;
  sku?: string | null;
  category: string;
  taxonomy: InventoryItemRecord['taxonomy'];
  unit: string;
  condition?: InventoryItemRecord['condition'];
  quantityAtJpNagar?: number;
};

export type UpdateInventoryItemInput = {
  name?: string | null;
  sku?: string | null;
  category?: string;
  taxonomy?: InventoryItemRecord['taxonomy'];
  unit?: string;
  condition?: InventoryItemRecord['condition'];
  quantityAtJpNagar?: number;
  status?: InventoryItemRecord['status'];
};

// EP1-INV-001 / EP1-INV-002 — Inventory item master + JP Nagar quantity
// (`docs/07-domain-model.md` §InventoryItem, `docs/09-api-design.md` §Inventory).
// Quantity is denormalized on the AR for Phase 1 (R3-02 decision 3A). Movements
// remain loosely linked by UUID until a later alignment task (decision 1A).
@Injectable()
export class InventoryApplicationService {
  constructor(
    private readonly inventoryItemRepository: InventoryItemRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createItem(
    tenantId: string,
    input: CreateInventoryItemInput,
  ): Promise<Result<InventoryItemDto>> {
    if (!input.name?.trim()) {
      return failure('VALIDATION_ERROR', 'Inventory item name is required.');
    }
    if (!input.category?.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'Inventory item category is required.',
      );
    }
    if (!input.unit?.trim()) {
      return failure('VALIDATION_ERROR', 'Inventory item unit is required.');
    }

    const quantityError = this.validateQuantity(input.quantityAtJpNagar);
    if (quantityError) {
      return quantityError;
    }

    const item = await this.inventoryItemRepository.create(tenantId, {
      name: input.name.trim(),
      sku: input.sku?.trim() ? input.sku.trim() : null,
      category: input.category.trim(),
      taxonomy: input.taxonomy,
      unit: input.unit.trim(),
      condition: input.condition,
      quantityAtJpNagar: input.quantityAtJpNagar ?? 0,
    });

    this.eventPublisher.publish(new InventoryItemCreatedEvent(tenantId, item));

    return success(toInventoryItemDto(item));
  }

  async listItems(
    tenantId: string,
    filter?: FindInventoryItemsFilter,
  ): Promise<Result<InventoryItemDto[]>> {
    const items = await this.inventoryItemRepository.findMany(tenantId, filter);
    return success(items.map(toInventoryItemDto));
  }

  async updateItem(
    tenantId: string,
    id: string,
    input: UpdateInventoryItemInput,
    version: number,
  ): Promise<Result<InventoryItemDto>> {
    const existing = await this.inventoryItemRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Inventory item not found.');
    }

    if (input.name !== undefined) {
      if (input.name === null || !input.name.trim()) {
        return failure(
          'VALIDATION_ERROR',
          'Inventory item name cannot be blank.',
        );
      }
    }
    if (input.category !== undefined && !input.category.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'Inventory item category cannot be blank.',
      );
    }
    if (input.unit !== undefined && !input.unit.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'Inventory item unit cannot be blank.',
      );
    }

    const quantityError = this.validateQuantity(input.quantityAtJpNagar);
    if (quantityError) {
      return quantityError;
    }

    try {
      const item = await this.inventoryItemRepository.update(
        tenantId,
        id,
        {
          name: input.name?.trim(),
          sku:
            input.sku === undefined
              ? undefined
              : input.sku?.trim()
                ? input.sku.trim()
                : null,
          category: input.category?.trim(),
          taxonomy: input.taxonomy,
          unit: input.unit?.trim(),
          condition: input.condition,
          quantityAtJpNagar: input.quantityAtJpNagar,
          status: input.status,
        },
        version,
      );

      this.eventPublisher.publish(
        new InventoryItemUpdatedEvent(tenantId, item),
      );

      return success(toInventoryItemDto(item));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  private validateQuantity(quantity: number | undefined): Result<never> | null {
    if (quantity === undefined) {
      return null;
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      return failure(
        'VALIDATION_ERROR',
        'Quantity at JP Nagar must be a non-negative integer.',
        { quantityAtJpNagar: quantity },
      );
    }
    return null;
  }

  private handleConcurrency<T>(
    error: unknown,
    inventoryItemId: string,
  ): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Inventory item was modified by another request. Reload and retry.',
        { inventoryItemId },
      );
    }

    throw error;
  }
}
