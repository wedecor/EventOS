import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  QuotationApprovedEvent,
  QuotationCreatedEvent,
  QuotationSupersededEvent,
} from '../../../../shared/events/sprint1-domain.events';
import type { TenantRepository } from '../../../platform/domain/repositories/tenant.repository';
import { QuotationApplicationService } from './quotation.application.service';
import type {
  QuotationRecord,
  QuotationRepository,
} from '../../domain/repositories/quotation.repository';

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
    validUntil: new Date('2099-12-31'),
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
  let lineItemRepository: jest.Mocked<
    import('../../domain/repositories/quotation-line-item.repository').QuotationLineItemRepository
  >;
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
      findLatestByLeadId: jest.fn(),
      findMaxQuotationNumber: jest.fn(),
      update: jest.fn(),
    };
    lineItemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listActiveByQuotation: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      countActiveByQuotation: jest.fn(),
    };
    eventPublisher = { publish };

    service = new QuotationApplicationService(
      quotationRepository,
      lineItemRepository,
      {
        findById: jest.fn().mockResolvedValue({
          id: tenantId,
          name: 'We Decor Events',
          slug: 'we-decor',
        }),
      } as unknown as TenantRepository,
      eventPublisher,
    );
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
});
