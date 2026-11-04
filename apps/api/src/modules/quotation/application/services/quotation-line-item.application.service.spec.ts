import { ConcurrentModificationError } from '../../../../shared/database';
import { QuotationLineItemApplicationService } from './quotation-line-item.application.service';
import type {
  QuotationRecord,
  QuotationRepository,
} from '../../domain/repositories/quotation.repository';
import type {
  QuotationLineItemRecord,
  QuotationLineItemRepository,
} from '../../domain/repositories/quotation-line-item.repository';

describe('QuotationLineItemApplicationService', () => {
  const tenantId = 'tenant-1';
  const quotationId = 'quotation-1';
  const itemId = 'item-1';

  const draftQuotation: QuotationRecord = {
    id: quotationId,
    tenantId,
    customerId: 'customer-1',
    leadId: null,
    quotationNumber: 1001,
    revisionNumber: 1,
    status: 'draft',
    eventType: null,
    eventStartDate: null,
    eventEndDate: null,
    venue: null,
    validUntil: null,
    terms: null,
    notes: null,
    subtotalAmount: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    currency: 'INR',
    supersededById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseLineItem: QuotationLineItemRecord = {
    id: itemId,
    tenantId,
    quotationId,
    description: 'Stage decoration',
    quantity: 1,
    unitPriceAmount: 5000,
    currency: 'INR',
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let quotationRepository: jest.Mocked<QuotationRepository>;
  let lineItemRepository: jest.Mocked<QuotationLineItemRepository>;
  let service: QuotationLineItemApplicationService;

  beforeEach(() => {
    quotationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findLatestRevision: jest.fn(),
      findMaxQuotationNumber: jest.fn(),
      findByIds: jest.fn(),
      update: jest.fn(),
    };
    lineItemRepository = {
      create: jest.fn(),
      createWithQuotationTotals: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      update: jest.fn(),
      updateWithQuotationTotals: jest.fn(),
      remove: jest.fn(),
      removeWithQuotationTotals: jest.fn(),
      countByQuotationId: jest.fn(),
    };

    service = new QuotationLineItemApplicationService(
      quotationRepository,
      lineItemRepository,
    );
  });

  // ── addLineItem ──────────────────────────────────────────────────────

  it('addLineItem rejects when quotation not found', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.addLineItem(tenantId, quotationId, {
      description: 'Stage decoration',
      unitPriceAmount: 5000,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('addLineItem rejects when quotation not in draft', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...draftQuotation,
      status: 'sent',
    });

    const result = await service.addLineItem(tenantId, quotationId, {
      description: 'Stage decoration',
      unitPriceAmount: 5000,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('addLineItem rejects negative unit price', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);

    const result = await service.addLineItem(tenantId, quotationId, {
      description: 'Stage decoration',
      unitPriceAmount: -100,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('addLineItem recalculates totals for the first line item', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findByQuotationId.mockResolvedValue([]);
    lineItemRepository.createWithQuotationTotals.mockResolvedValue(
      baseLineItem,
    );

    const result = await service.addLineItem(tenantId, quotationId, {
      description: 'Stage decoration',
      unitPriceAmount: 5000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(itemId);
      expect(result.value.description).toBe('Stage decoration');
    }
    expect(lineItemRepository.createWithQuotationTotals).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        quotationId,
        description: 'Stage decoration',
        unitPriceAmount: 5000,
      }),
      { subtotalAmount: 5000, totalAmount: 5000 },
      draftQuotation.version,
    );
  });

  it('addLineItem recalculates totals when multiple line items exist', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...draftQuotation,
      discountAmount: 500,
      taxAmount: 200,
    });
    lineItemRepository.findByQuotationId.mockResolvedValue([baseLineItem]);
    lineItemRepository.createWithQuotationTotals.mockResolvedValue({
      ...baseLineItem,
      id: 'item-2',
      description: 'Lighting setup',
      quantity: 2,
      unitPriceAmount: 1500,
    });

    const result = await service.addLineItem(tenantId, quotationId, {
      description: 'Lighting setup',
      quantity: 2,
      unitPriceAmount: 1500,
    });

    expect(result.ok).toBe(true);
    // subtotal = (1 * 5000) + (2 * 1500) = 8000; total = 8000 - 500 + 200 = 7700
    expect(lineItemRepository.createWithQuotationTotals).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ description: 'Lighting setup' }),
      { subtotalAmount: 8000, totalAmount: 7700 },
      draftQuotation.version,
    );
  });

  it('addLineItem returns CONCURRENT_MODIFICATION when quotation changed underneath', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findByQuotationId.mockResolvedValue([]);
    lineItemRepository.createWithQuotationTotals.mockRejectedValue(
      new ConcurrentModificationError('Quotation', quotationId),
    );

    const result = await service.addLineItem(tenantId, quotationId, {
      description: 'Stage decoration',
      unitPriceAmount: 5000,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // ── updateLineItem ───────────────────────────────────────────────────

  it('updateLineItem rejects when quotation not found', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { description: 'Updated decoration' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateLineItem rejects when quotation not draft', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...draftQuotation,
      status: 'sent',
    });

    const result = await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { description: 'Updated decoration' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('updateLineItem rejects when line item not found', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(null);

    const result = await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { description: 'Updated decoration' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateLineItem rejects when line item belongs to different quotation', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue({
      ...baseLineItem,
      quotationId: 'other-quotation',
    });

    const result = await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { description: 'Updated decoration' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateLineItem recalculates totals when quantity changes', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.findByQuotationId.mockResolvedValue([baseLineItem]);
    lineItemRepository.updateWithQuotationTotals.mockResolvedValue({
      ...baseLineItem,
      quantity: 3,
      version: 2,
    });

    const result = await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { quantity: 3 },
      1,
    );

    expect(result.ok).toBe(true);
    // subtotal = 3 * 5000 = 15000; total = 15000 - 0 + 0
    expect(lineItemRepository.updateWithQuotationTotals).toHaveBeenCalledWith(
      tenantId,
      itemId,
      { quantity: 3 },
      1,
      { subtotalAmount: 15000, totalAmount: 15000 },
      draftQuotation.version,
    );
  });

  it('updateLineItem recalculates totals when unit price changes', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.findByQuotationId.mockResolvedValue([baseLineItem]);
    lineItemRepository.updateWithQuotationTotals.mockResolvedValue({
      ...baseLineItem,
      unitPriceAmount: 6000,
      version: 2,
    });

    const result = await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { unitPriceAmount: 6000 },
      1,
    );

    expect(result.ok).toBe(true);
    // subtotal = 1 * 6000 = 6000; total = 6000 - 0 + 0
    expect(lineItemRepository.updateWithQuotationTotals).toHaveBeenCalledWith(
      tenantId,
      itemId,
      { unitPriceAmount: 6000 },
      1,
      { subtotalAmount: 6000, totalAmount: 6000 },
      draftQuotation.version,
    );
  });

  it('updateLineItem handles ConcurrentModificationError', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.findByQuotationId.mockResolvedValue([baseLineItem]);
    lineItemRepository.updateWithQuotationTotals.mockRejectedValue(
      new ConcurrentModificationError('QuotationLineItem', itemId),
    );

    const result = await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { description: 'Updated decoration' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('updateLineItem updates successfully', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.findByQuotationId.mockResolvedValue([baseLineItem]);
    lineItemRepository.updateWithQuotationTotals.mockResolvedValue({
      ...baseLineItem,
      description: 'Updated decoration',
      version: 2,
    });

    const result = await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { description: 'Updated decoration' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toBe('Updated decoration');
      expect(result.value.version).toBe(2);
    }
  });

  // ── removeLineItem ───────────────────────────────────────────────────

  it('removeLineItem rejects when quotation not draft', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...draftQuotation,
      status: 'approved',
    });

    const result = await service.removeLineItem(tenantId, quotationId, itemId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('removeLineItem recalculates totals to zero when removing the last remaining line item', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...draftQuotation,
      subtotalAmount: 5000,
      totalAmount: 5000,
    });
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.findByQuotationId.mockResolvedValue([baseLineItem]);
    lineItemRepository.removeWithQuotationTotals.mockResolvedValue(undefined);

    const result = await service.removeLineItem(tenantId, quotationId, itemId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.itemId).toBe(itemId);
      expect(result.value.deleted).toBe(true);
    }
    expect(lineItemRepository.removeWithQuotationTotals).toHaveBeenCalledWith(
      tenantId,
      itemId,
      quotationId,
      { subtotalAmount: 0, totalAmount: 0 },
      draftQuotation.version,
    );
  });

  it('removeLineItem recalculates the remaining subtotal when other line items remain', async () => {
    const secondItem: QuotationLineItemRecord = {
      ...baseLineItem,
      id: 'item-2',
      description: 'Lighting setup',
      quantity: 2,
      unitPriceAmount: 1500,
    };
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.findByQuotationId.mockResolvedValue([
      baseLineItem,
      secondItem,
    ]);
    lineItemRepository.removeWithQuotationTotals.mockResolvedValue(undefined);

    const result = await service.removeLineItem(tenantId, quotationId, itemId);

    expect(result.ok).toBe(true);
    // remaining: 2 * 1500 = 3000 subtotal/total
    expect(lineItemRepository.removeWithQuotationTotals).toHaveBeenCalledWith(
      tenantId,
      itemId,
      quotationId,
      { subtotalAmount: 3000, totalAmount: 3000 },
      draftQuotation.version,
    );
  });

  it('removeLineItem returns CONCURRENT_MODIFICATION when quotation changed underneath', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.findByQuotationId.mockResolvedValue([baseLineItem]);
    lineItemRepository.removeWithQuotationTotals.mockRejectedValue(
      new ConcurrentModificationError('Quotation', quotationId),
    );

    const result = await service.removeLineItem(tenantId, quotationId, itemId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // ── mixed add/update/remove sequence ─────────────────────────────────

  it('handles a mixed add, update, remove sequence with correct running totals', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);

    // 1. Add first line item (quantity 1 * 5000 = 5000)
    lineItemRepository.findByQuotationId.mockResolvedValueOnce([]);
    lineItemRepository.createWithQuotationTotals.mockResolvedValueOnce(
      baseLineItem,
    );
    const addResult = await service.addLineItem(tenantId, quotationId, {
      description: 'Stage decoration',
      unitPriceAmount: 5000,
    });
    expect(addResult.ok).toBe(true);
    expect(
      lineItemRepository.createWithQuotationTotals,
    ).toHaveBeenNthCalledWith(
      1,
      tenantId,
      expect.any(Object),
      { subtotalAmount: 5000, totalAmount: 5000 },
      draftQuotation.version,
    );

    // 2. Add a second line item (2 * 1500 = 3000) → subtotal becomes 8000
    const secondItem: QuotationLineItemRecord = {
      ...baseLineItem,
      id: 'item-2',
      description: 'Lighting setup',
      quantity: 2,
      unitPriceAmount: 1500,
    };
    lineItemRepository.findByQuotationId.mockResolvedValueOnce([baseLineItem]);
    lineItemRepository.createWithQuotationTotals.mockResolvedValueOnce(
      secondItem,
    );
    await service.addLineItem(tenantId, quotationId, {
      description: 'Lighting setup',
      quantity: 2,
      unitPriceAmount: 1500,
    });
    expect(
      lineItemRepository.createWithQuotationTotals,
    ).toHaveBeenNthCalledWith(
      2,
      tenantId,
      expect.any(Object),
      { subtotalAmount: 8000, totalAmount: 8000 },
      draftQuotation.version,
    );

    // 3. Update the first item's quantity to 2 (2 * 5000 = 10000) → subtotal becomes 13000
    lineItemRepository.findById.mockResolvedValueOnce(baseLineItem);
    lineItemRepository.findByQuotationId.mockResolvedValueOnce([
      baseLineItem,
      secondItem,
    ]);
    lineItemRepository.updateWithQuotationTotals.mockResolvedValueOnce({
      ...baseLineItem,
      quantity: 2,
      version: 2,
    });
    await service.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      { quantity: 2 },
      1,
    );
    expect(
      lineItemRepository.updateWithQuotationTotals,
    ).toHaveBeenNthCalledWith(
      1,
      tenantId,
      itemId,
      { quantity: 2 },
      1,
      { subtotalAmount: 13000, totalAmount: 13000 },
      draftQuotation.version,
    );

    // 4. Remove the second item → subtotal returns to 10000 (only updated first item remains)
    lineItemRepository.findById.mockResolvedValueOnce(secondItem);
    lineItemRepository.findByQuotationId.mockResolvedValueOnce([
      { ...baseLineItem, quantity: 2 },
      secondItem,
    ]);
    lineItemRepository.removeWithQuotationTotals.mockResolvedValueOnce(
      undefined,
    );
    await service.removeLineItem(tenantId, quotationId, secondItem.id);
    expect(
      lineItemRepository.removeWithQuotationTotals,
    ).toHaveBeenNthCalledWith(
      1,
      tenantId,
      secondItem.id,
      quotationId,
      { subtotalAmount: 10000, totalAmount: 10000 },
      draftQuotation.version,
    );
  });

  // ── listLineItems ────────────────────────────────────────────────────

  it('listLineItems returns mapped DTOs', async () => {
    const secondItem: QuotationLineItemRecord = {
      ...baseLineItem,
      id: 'item-2',
      description: 'Lighting setup',
      unitPriceAmount: 3000,
      sortOrder: 1,
    };
    lineItemRepository.findByQuotationId.mockResolvedValue([
      baseLineItem,
      secondItem,
    ]);

    const result = await service.listLineItems(tenantId, quotationId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe(itemId);
      expect(result.value[1].id).toBe('item-2');
    }
  });
});
