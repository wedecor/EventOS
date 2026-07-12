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
      findLatestRevision: jest.fn(),
      findMaxQuotationNumber: jest.fn(),
      findByIds: jest.fn(),
      update: jest.fn(),
    };
    lineItemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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

  it('addLineItem creates line item on draft quotation', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.create.mockResolvedValue(baseLineItem);

    const result = await service.addLineItem(tenantId, quotationId, {
      description: 'Stage decoration',
      unitPriceAmount: 5000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(itemId);
      expect(result.value.description).toBe('Stage decoration');
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

  it('updateLineItem handles ConcurrentModificationError', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.update.mockRejectedValue(
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
    lineItemRepository.update.mockResolvedValue({
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

  it('removeLineItem removes and returns success', async () => {
    quotationRepository.findById.mockResolvedValue(draftQuotation);
    lineItemRepository.findById.mockResolvedValue(baseLineItem);
    lineItemRepository.remove.mockResolvedValue(undefined);

    const result = await service.removeLineItem(tenantId, quotationId, itemId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.itemId).toBe(itemId);
      expect(result.value.deleted).toBe(true);
    }
    expect(lineItemRepository.remove).toHaveBeenCalledWith(tenantId, itemId);
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
