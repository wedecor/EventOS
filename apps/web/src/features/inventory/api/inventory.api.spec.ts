import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}));

const item = {
  id: 'i1',
  tenantId: 't1',
  name: 'Frame',
  sku: null,
  category: 'structures',
  taxonomy: 'reusable',
  unit: 'pcs',
  condition: 'good',
  quantityAtJpNagar: 4,
  status: 'active',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

const movement = {
  id: 'm1',
  tenantId: 't1',
  bookingId: 'b1',
  inventoryItemId: 'i1',
  quantity: 1,
  notes: null,
  status: 'planned',
  pickedAt: null,
  packedAt: null,
  loadedAt: null,
  atVenueAt: null,
  returnedAt: null,
  cleanedReadyAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 1,
};

describe('inventoryApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('lists items with filters and resolves detail via list', async () => {
    const { inventoryApi } = await import('./inventory.api');
    get.mockResolvedValue({ data: { data: [item] } });
    await inventoryApi.listItems({ status: 'active', taxonomy: 'reusable' });
    expect(get).toHaveBeenCalledWith('/api/v1/inventory/items', {
      params: { status: 'active', taxonomy: 'reusable' },
    });
    const found = await inventoryApi.getItemById('i1');
    expect(found.id).toBe('i1');
  });

  it('creates and updates items with If-Match', async () => {
    const { inventoryApi } = await import('./inventory.api');
    post.mockResolvedValue({ data: { data: item } });
    patch.mockResolvedValue({ data: { data: { ...item, version: 3 } } });
    await inventoryApi.createItem({
      name: 'Frame',
      category: 'structures',
      taxonomy: 'reusable',
      unit: 'pcs',
    });
    expect(post).toHaveBeenCalledWith('/api/v1/inventory/items', {
      name: 'Frame',
      category: 'structures',
      taxonomy: 'reusable',
      unit: 'pcs',
    });
    await inventoryApi.updateItem('i1', { name: 'Frame XL' }, 2);
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/inventory/items/i1',
      { name: 'Frame XL' },
      { headers: { 'If-Match': '"2"' } },
    );
  });

  it('lists booking movements and transitions with If-Match', async () => {
    const { inventoryApi } = await import('./inventory.api');
    get.mockResolvedValue({ data: { data: [movement] } });
    await inventoryApi.listMovementsForBooking('b1');
    expect(get).toHaveBeenCalledWith('/api/v1/bookings/b1/inventory-movements');

    post.mockResolvedValue({
      data: { data: { ...movement, status: 'picked', version: 2 } },
    });
    await inventoryApi.transitionMovement('m1', { toStatus: 'picked' }, 1);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/inventory/movements/m1/transition',
      { toStatus: 'picked' },
      { headers: { 'If-Match': '"1"' } },
    );
  });

  it('creates movement and adds damage note', async () => {
    const { inventoryApi } = await import('./inventory.api');
    post.mockResolvedValueOnce({ data: { data: movement } });
    await inventoryApi.createMovement({
      bookingId: 'b1',
      inventoryItemId: 'i1',
      quantity: 1,
    });
    expect(post).toHaveBeenCalledWith('/api/v1/inventory/movements', {
      bookingId: 'b1',
      inventoryItemId: 'i1',
      quantity: 1,
    });

    post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'n1',
          tenantId: 't1',
          movementId: 'm1',
          message: 'Bent frame',
          accountability: null,
          occurredAt: null,
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      },
    });
    await inventoryApi.addDamageNote('m1', { message: 'Bent frame' });
    expect(post).toHaveBeenCalledWith(
      '/api/v1/inventory/movements/m1/damage-notes',
      { message: 'Bent frame' },
    );
  });
});
