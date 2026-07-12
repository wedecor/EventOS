import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  QuotationApprovedEvent,
  QuotationCreatedEvent,
  QuotationRejectedEvent,
  QuotationSentEvent,
  QuotationSupersededEvent,
} from '../../../../shared/events/sprint1-domain.events';
import { QuotationApplicationService } from './quotation.application.service';
import type {
  QuotationRecord,
  QuotationRepository,
} from '../../domain/repositories/quotation.repository';
import type { QuotationLineItemRepository } from '../../domain/repositories/quotation-line-item.repository';

describe('QuotationApplicationService', () => {
  const tenantId = 'tenant-1';
  const quotationId = 'quotation-1';

  const baseQuotation: QuotationRecord = {
    id: quotationId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationNumber: 1001,
    revisionNumber: 1,
    status: 'draft',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venue: 'Bangalore',
    validUntil: new Date('2026-08-31'),
    terms: 'Standard terms',
    notes: null,
    subtotalAmount: 100000,
    discountAmount: 0,
    taxAmount: 18000,
    totalAmount: 118000,
    currency: 'INR',
    supersededById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let quotationRepository: jest.Mocked<QuotationRepository>;
  let lineItemRepository: jest.Mocked<QuotationLineItemRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: QuotationApplicationService;

  let publish: jest.Mock;
  let createQuotation: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    createQuotation = jest.fn();
    quotationRepository = {
      create: createQuotation,
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
    eventPublisher = { publish };

    service = new QuotationApplicationService(
      quotationRepository,
      lineItemRepository,
      eventPublisher,
    );
  });

  it('returns not found when getting a missing quotation', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.getQuotationById(tenantId, quotationId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('retrieves a quotation by id', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);

    const result = await service.getQuotationById(tenantId, quotationId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(quotationId);
    }
  });

  // --- updateQuotation ---

  it('rejects update when quotation is not found', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.updateQuotation(
      tenantId,
      quotationId,
      { notes: 'Updated notes' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects update when quotation is not draft', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });

    const result = await service.updateQuotation(
      tenantId,
      quotationId,
      { notes: 'Updated notes' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('updates a draft quotation', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);
    quotationRepository.update.mockResolvedValue({
      ...baseQuotation,
      notes: 'Updated notes',
      version: 2,
    });

    const result = await service.updateQuotation(
      tenantId,
      quotationId,
      { notes: 'Updated notes' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.notes).toBe('Updated notes');
    }
    expect(quotationRepository.update).toHaveBeenCalledWith(
      tenantId,
      quotationId,
      expect.objectContaining({ notes: 'Updated notes' }),
      1,
    );
  });

  it('maps concurrent modification failures on update', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);
    quotationRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Quotation', quotationId),
    );

    const result = await service.updateQuotation(
      tenantId,
      quotationId,
      { notes: 'Updated notes' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('rejects create when quotation dates are invalid', async () => {
    const result = await service.createQuotation(tenantId, {
      customerId: 'customer-1',
      eventStartDate: new Date('2026-08-05'),
      eventEndDate: new Date('2026-08-01'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('creates a quotation and publishes QuotationCreated', async () => {
    quotationRepository.findMaxQuotationNumber.mockResolvedValue(1000);
    createQuotation.mockResolvedValue(baseQuotation);

    const result = await service.createQuotation(tenantId, {
      customerId: 'customer-1',
      leadId: 'lead-1',
    });

    expect(result.ok).toBe(true);
    expect(createQuotation).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ quotationNumber: 1001, status: 'draft' }),
    );
    expect(publish).toHaveBeenCalledWith(expect.any(QuotationCreatedEvent));
  });

  it('rejects revision when quotation is not found', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.createNewRevision(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects revision for superseded quotations', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'superseded',
    });

    const result = await service.createNewRevision(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('maps concurrent modification failures on revision', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    createQuotation.mockResolvedValue({
      ...baseQuotation,
      id: 'quotation-2',
      revisionNumber: 2,
    });
    quotationRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Quotation', quotationId),
    );

    const result = await service.createNewRevision(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('creates a new revision and supersedes the previous quotation', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    createQuotation.mockResolvedValue({
      ...baseQuotation,
      id: 'quotation-2',
      revisionNumber: 2,
      status: 'draft',
      version: 1,
    });
    quotationRepository.update.mockResolvedValue({
      ...baseQuotation,
      status: 'superseded',
      supersededById: 'quotation-2',
      version: 2,
    });

    const result = await service.createNewRevision(tenantId, quotationId, 1);

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(QuotationSupersededEvent));
    expect(publish).toHaveBeenCalledWith(expect.any(QuotationCreatedEvent));
  });

  it('rejects approving a quotation that is not found', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.approveQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects approving a quotation with zero total', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
      totalAmount: 0,
    });

    const result = await service.approveQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects approving an expired quotation', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
      validUntil: new Date('2020-01-01'),
    });

    const result = await service.approveQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('approves a sent quotation and publishes QuotationApproved', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockResolvedValue({
      ...baseQuotation,
      status: 'approved',
      version: 2,
    });

    const result = await service.approveQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(QuotationApprovedEvent));
  });

  it('rejects approving a draft quotation', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);

    const result = await service.approveQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('maps concurrent modification failures on approve', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Quotation', quotationId),
    );

    const result = await service.approveQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // --- sendQuotation ---

  it('rejects sending a quotation that is not found', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.sendQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects sending a quotation not in draft status', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });

    const result = await service.sendQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('rejects sending a quotation with no line items', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);
    lineItemRepository.countByQuotationId.mockResolvedValue(0);

    const result = await service.sendQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects sending a quotation with zero total amount', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      totalAmount: 0,
    });
    lineItemRepository.countByQuotationId.mockResolvedValue(3);

    const result = await service.sendQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('sends a draft quotation and publishes QuotationSent', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);
    lineItemRepository.countByQuotationId.mockResolvedValue(3);
    quotationRepository.update.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
      version: 2,
    });

    const result = await service.sendQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(QuotationSentEvent));
  });

  it('maps concurrent modification failures on send', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);
    lineItemRepository.countByQuotationId.mockResolvedValue(3);
    quotationRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Quotation', quotationId),
    );

    const result = await service.sendQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // --- rejectQuotation ---

  it('rejects rejecting a quotation that is not found', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.rejectQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects rejecting a quotation not in sent status', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);

    const result = await service.rejectQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('rejects a sent quotation and publishes QuotationRejected', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockResolvedValue({
      ...baseQuotation,
      status: 'rejected',
      version: 2,
    });

    const result = await service.rejectQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(QuotationRejectedEvent));
  });

  it('maps concurrent modification failures on reject', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Quotation', quotationId),
    );

    const result = await service.rejectQuotation(tenantId, quotationId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
