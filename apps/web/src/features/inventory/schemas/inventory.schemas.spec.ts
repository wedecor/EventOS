import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/types/api';
import {
  NEXT_MOVEMENT_STATUS,
  findInventoryItemInList,
  inventoryItemFormSchema,
  inventoryItemToFormValues,
  parseInventoryItemList,
  parseInventoryMovement,
  toCreateInventoryItemRequest,
  toCreateMovementRequest,
  toTransitionRequest,
  toUpdateInventoryItemRequest,
} from './inventory.schemas';

const sampleItem = {
  id: 'i1',
  tenantId: 't1',
  name: 'Backdrop frame',
  sku: null,
  category: 'structures',
  taxonomy: 'reusable' as const,
  unit: 'pcs',
  condition: 'good' as const,
  quantityAtJpNagar: 4,
  status: 'active' as const,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

describe('inventory schemas', () => {
  it('parses item list and movement envelopes', () => {
    expect(parseInventoryItemList({ data: [sampleItem] })).toHaveLength(1);
    expect(
      parseInventoryMovement({
        data: {
          id: 'm1',
          tenantId: 't1',
          bookingId: 'b1',
          inventoryItemId: 'i1',
          quantity: 2,
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
        },
      }).status,
    ).toBe('planned');
  });

  it('maps create/update item forms', () => {
    const form = inventoryItemToFormValues(sampleItem);
    expect(toCreateInventoryItemRequest(form)).toEqual({
      name: 'Backdrop frame',
      category: 'structures',
      taxonomy: 'reusable',
      unit: 'pcs',
      condition: 'good',
      quantityAtJpNagar: 4,
      sku: null,
    });
    expect(toUpdateInventoryItemRequest(form).status).toBe('active');
  });

  it('finds item in list or throws ApiError', () => {
    expect(findInventoryItemInList([sampleItem], 'i1').name).toBe(
      'Backdrop frame',
    );
    expect(() => findInventoryItemInList([sampleItem], 'missing')).toThrow(
      ApiError,
    );
  });

  it('maps movement create and next transition', () => {
    expect(
      toCreateMovementRequest({
        bookingId: '11111111-1111-4111-8111-111111111111',
        inventoryItemId: '22222222-2222-4222-8222-222222222222',
        quantity: '3',
        notes: ' pack ',
      }),
    ).toEqual({
      bookingId: '11111111-1111-4111-8111-111111111111',
      inventoryItemId: '22222222-2222-4222-8222-222222222222',
      quantity: 3,
      notes: 'pack',
    });
    expect(NEXT_MOVEMENT_STATUS.planned).toBe('picked');
    expect(NEXT_MOVEMENT_STATUS.picked).toBe('packing_started');
    expect(toTransitionRequest('picked').toStatus).toBe('picked');
  });

  it('rejects negative quantity on form', () => {
    expect(
      inventoryItemFormSchema.safeParse({
        ...inventoryItemToFormValues(sampleItem),
        quantityAtJpNagar: '-1',
      }).success,
    ).toBe(false);
  });
});
