import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  InventoryItemCreatedEvent,
  InventoryItemUpdatedEvent,
} from '../../../../shared/events/sprint3-domain.events';
import { InventoryApplicationService } from './inventory.application.service';
import type {
  InventoryItemRecord,
  InventoryItemRepository,
} from '../../domain/repositories/inventory-item.repository';

describe('InventoryApplicationService', () => {
  const tenantId = 'tenant-1';
  const itemId = 'item-1';

  const baseItem: InventoryItemRecord = {
    id: itemId,
    tenantId,
    name: 'Backdrop Frame',
    sku: 'BF-001',
    category: 'frames',
    taxonomy: 'reusable',
    unit: 'piece',
    condition: 'good',
    quantityAtJpNagar: 4,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let inventoryItemRepository: jest.Mocked<InventoryItemRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: InventoryApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    inventoryItemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new InventoryApplicationService(
      inventoryItemRepository,
      eventPublisher,
    );
  });

  it('createItem rejects blank name', async () => {
    const result = await service.createItem(tenantId, {
      name: '  ',
      category: 'frames',
      taxonomy: 'reusable',
      unit: 'piece',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(inventoryItemRepository.create).not.toHaveBeenCalled();
  });

  it('createItem rejects blank category', async () => {
    const result = await service.createItem(tenantId, {
      name: 'Backdrop Frame',
      category: '',
      taxonomy: 'reusable',
      unit: 'piece',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('createItem rejects blank unit', async () => {
    const result = await service.createItem(tenantId, {
      name: 'Backdrop Frame',
      category: 'frames',
      taxonomy: 'reusable',
      unit: ' ',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('createItem rejects negative quantityAtJpNagar', async () => {
    const result = await service.createItem(tenantId, {
      name: 'Backdrop Frame',
      category: 'frames',
      taxonomy: 'reusable',
      unit: 'piece',
      quantityAtJpNagar: -1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('createItem creates an item and publishes InventoryItemCreated', async () => {
    inventoryItemRepository.create.mockResolvedValue(baseItem);

    const result = await service.createItem(tenantId, {
      name: 'Backdrop Frame',
      sku: 'BF-001',
      category: 'frames',
      taxonomy: 'reusable',
      unit: 'piece',
      condition: 'good',
      quantityAtJpNagar: 4,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(itemId);
      expect(result.value.taxonomy).toBe('reusable');
      expect(result.value.status).toBe('active');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(InventoryItemCreatedEvent));
  });

  it('listItems returns items from the repository', async () => {
    inventoryItemRepository.findMany.mockResolvedValue([baseItem]);

    const result = await service.listItems(tenantId, {
      taxonomy: 'reusable',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
    expect(inventoryItemRepository.findMany).toHaveBeenCalledWith(tenantId, {
      taxonomy: 'reusable',
    });
  });

  it('updateItem returns NOT_FOUND when missing', async () => {
    inventoryItemRepository.findById.mockResolvedValue(null);

    const result = await service.updateItem(
      tenantId,
      itemId,
      { status: 'retired' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateItem rejects blank name', async () => {
    inventoryItemRepository.findById.mockResolvedValue(baseItem);

    const result = await service.updateItem(
      tenantId,
      itemId,
      { name: null },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updateItem rejects negative quantity', async () => {
    inventoryItemRepository.findById.mockResolvedValue(baseItem);

    const result = await service.updateItem(
      tenantId,
      itemId,
      { quantityAtJpNagar: -2 },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updateItem updates mutable fields and publishes InventoryItemUpdated', async () => {
    const updated: InventoryItemRecord = {
      ...baseItem,
      name: 'Backdrop Frame XL',
      taxonomy: 'consumable',
      unit: 'set',
      condition: 'fair',
      quantityAtJpNagar: 2,
      status: 'inactive',
      version: 2,
    };
    inventoryItemRepository.findById.mockResolvedValue(baseItem);
    inventoryItemRepository.update.mockResolvedValue(updated);

    const result = await service.updateItem(
      tenantId,
      itemId,
      {
        name: 'Backdrop Frame XL',
        sku: null,
        category: 'frames',
        taxonomy: 'consumable',
        unit: 'set',
        condition: 'fair',
        quantityAtJpNagar: 2,
        status: 'inactive',
      },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('inactive');
      expect(result.value.quantityAtJpNagar).toBe(2);
    }
    expect(publish).toHaveBeenCalledWith(expect.any(InventoryItemUpdatedEvent));
  });

  it('updateItem maps ConcurrentModificationError', async () => {
    inventoryItemRepository.findById.mockResolvedValue(baseItem);
    inventoryItemRepository.update.mockRejectedValue(
      new ConcurrentModificationError('InventoryItem', itemId),
    );

    const result = await service.updateItem(
      tenantId,
      itemId,
      { status: 'retired' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
