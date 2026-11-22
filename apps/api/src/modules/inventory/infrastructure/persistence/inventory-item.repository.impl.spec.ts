import { InventoryItemRepositoryImpl } from './inventory-item.repository.impl';

describe('InventoryItemRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const itemId = 'item-1';

  const prismaItem = {
    id: itemId,
    tenantId,
    name: 'Backdrop Frame',
    sku: 'BF-001',
    category: 'frames',
    taxonomy: 'reusable' as const,
    unit: 'piece',
    condition: 'good' as const,
    quantityAtJpNagar: 4,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const prisma = {
    inventoryItem: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  let repository: InventoryItemRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new InventoryItemRepositoryImpl(prisma as never);
  });

  it('create maps an inventory item record', async () => {
    prisma.inventoryItem.create.mockResolvedValue(prismaItem);

    const result = await repository.create(tenantId, {
      name: 'Backdrop Frame',
      sku: 'BF-001',
      category: 'frames',
      taxonomy: 'reusable',
      unit: 'piece',
      condition: 'good',
      quantityAtJpNagar: 4,
    });

    expect(result.id).toBe(itemId);
    expect(prisma.inventoryItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenant: { connect: { id: tenantId } },
        name: 'Backdrop Frame',
        taxonomy: 'reusable',
        quantityAtJpNagar: 4,
      }),
    });
  });

  it('findById scopes by tenant', async () => {
    prisma.inventoryItem.findFirst.mockResolvedValue(prismaItem);

    const result = await repository.findById(tenantId, itemId);

    expect(result?.id).toBe(itemId);
    expect(prisma.inventoryItem.findFirst).toHaveBeenCalledWith({
      where: { id: itemId, tenantId },
    });
  });

  it('findMany filters by taxonomy when provided', async () => {
    prisma.inventoryItem.findMany.mockResolvedValue([prismaItem]);

    const result = await repository.findMany(tenantId, {
      taxonomy: 'reusable',
    });

    expect(result).toHaveLength(1);
    expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        status: undefined,
        taxonomy: 'reusable',
        category: undefined,
      },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('update increments version', async () => {
    prisma.inventoryItem.update.mockResolvedValue({
      ...prismaItem,
      quantityAtJpNagar: 3,
      version: 2,
    });

    const result = await repository.update(
      tenantId,
      itemId,
      { quantityAtJpNagar: 3 },
      1,
    );

    expect(result.version).toBe(2);
    expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
      where: { id: itemId, tenantId, version: 1 },
      data: expect.objectContaining({
        quantityAtJpNagar: 3,
        version: { increment: 1 },
      }),
    });
  });
});
