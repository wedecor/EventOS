import { AUDIT_ACTIONS, type AuditLogService } from '../../../../shared/audit';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  QuotationApprovedEvent,
  QuotationCreatedEvent,
  QuotationRejectedEvent,
  QuotationSentEvent,
  QuotationSupersededEvent,
} from '../../../../shared/events/sprint1-domain.events';
import { failure, success } from '../../../../shared/application/result';
import type { BookingApplicationService } from '../../../booking/application/services/booking.application.service';
import type { BookingDto } from '../../../booking/application/dtos/booking.dto';
import { QuotationApplicationService } from './quotation.application.service';
import type {
  QuotationRecord,
  QuotationRepository,
} from '../../domain/repositories/quotation.repository';
import type { QuotationLineItemRepository } from '../../domain/repositories/quotation-line-item.repository';

describe('QuotationApplicationService', () => {
  const tenantId = 'tenant-1';
  const quotationId = 'quotation-1';
  const actorId = 'user-1';

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
  let bookingService: jest.Mocked<BookingApplicationService>;
  let service: QuotationApplicationService;

  let publish: jest.Mock;
  let createQuotation: jest.Mock;
  let createEventFromApprovedQuotation: jest.Mock;
  let auditRecord: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    createQuotation = jest.fn();
    createEventFromApprovedQuotation = jest.fn();
    auditRecord = jest.fn().mockResolvedValue(undefined);
    quotationRepository = {
      create: createQuotation,
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
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
    bookingService = {
      createEventFromApprovedQuotation,
      activateBooking: jest.fn(),
      retrieveBooking: jest.fn(),
      cancelBooking: jest.fn(),
      completeBooking: jest.fn(),
    } as unknown as jest.Mocked<BookingApplicationService>;
    // Default: advance payment not yet confirmed, matching the most common
    // pre-approval state; individual tests override this as needed.
    createEventFromApprovedQuotation.mockResolvedValue(
      failure('EP1-BR-001', 'Advance payment not confirmed.'),
    );

    service = new QuotationApplicationService(
      quotationRepository,
      lineItemRepository,
      eventPublisher,
      bookingService,
      { record: auditRecord } as unknown as AuditLogService,
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

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    // R1-08 — a failure audit record is emitted even when approval is rejected.
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId,
        action: AUDIT_ACTIONS.QUOTATION_APPROVED,
        entityId: quotationId,
        outcome: 'failure',
        metadata: expect.objectContaining({ errorCode: 'NOT_FOUND' }),
      }),
    );
  });

  it('rejects approving a quotation with zero total', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
      totalAmount: 0,
    });

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

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

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('approves a sent quotation and publishes QuotationApproved exactly once', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockResolvedValue({
      ...baseQuotation,
      status: 'approved',
      version: 2,
    });

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(QuotationApprovedEvent));
    expect(publish).toHaveBeenCalledTimes(1);
    // R1-08 — a success audit record is emitted for the approval.
    expect(auditRecord).toHaveBeenCalledTimes(1);
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId,
        tenantId,
        action: AUDIT_ACTIONS.QUOTATION_APPROVED,
        entityType: 'Quotation',
        entityId: quotationId,
        outcome: 'success',
      }),
    );
  });

  it('rejects approving a draft quotation', async () => {
    quotationRepository.findById.mockResolvedValue(baseQuotation);

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
    expect(createEventFromApprovedQuotation).not.toHaveBeenCalled();
  });

  it('rejects approving an already-approved (already processed) quotation', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'approved',
    });

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
    expect(createEventFromApprovedQuotation).not.toHaveBeenCalled();
  });

  it('maps concurrent modification failures on approve', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Quotation', quotationId),
    );

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
    expect(createEventFromApprovedQuotation).not.toHaveBeenCalled();
  });

  // --- approveQuotation: booking/event conversion wiring (C11) ---

  it('creates the linked booking/event when approving with confirmed advance payment', async () => {
    const approvedQuotation = {
      ...baseQuotation,
      status: 'approved' as const,
      version: 2,
    };
    const booking: BookingDto = {
      id: 'event-1',
      tenantId,
      customerId: baseQuotation.customerId,
      leadId: baseQuotation.leadId,
      quotationId,
      bookingNumber: 5001,
      status: 'approved',
      eventType: baseQuotation.eventType,
      eventStartDate: baseQuotation.eventStartDate,
      eventEndDate: baseQuotation.eventEndDate,
      venueName: baseQuotation.venue,
      guestCount: null,
      requirementsNotes: null,
      workspaceStatus: 'inactive',
      preparationStatus: 'pending',
      operationalMilestone: null,
      executionOwnerId: null,
      cancellationReason: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockResolvedValue(approvedQuotation);
    createEventFromApprovedQuotation.mockResolvedValue(success(booking));

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(createEventFromApprovedQuotation).toHaveBeenCalledWith(
      tenantId,
      quotationId,
    );
    expect(createEventFromApprovedQuotation).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.eventId).toBe('event-1');
      expect(result.value.status).toBe('approved');
    }
  });

  it('approves successfully with a null eventId when advance payment is not yet confirmed', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockResolvedValue({
      ...baseQuotation,
      status: 'approved',
      version: 2,
    });
    createEventFromApprovedQuotation.mockResolvedValue(
      failure('EP1-BR-001', 'Advance payment not confirmed.'),
    );

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.eventId).toBeNull();
    }
  });

  it('returns the existing event id instead of creating a duplicate booking/event', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...baseQuotation,
      status: 'sent',
    });
    quotationRepository.update.mockResolvedValue({
      ...baseQuotation,
      status: 'approved',
      version: 2,
    });
    createEventFromApprovedQuotation.mockResolvedValue(
      failure(
        'DUPLICATE_EVENT',
        'An event already exists for this quotation.',
        {
          eventId: 'event-existing',
        },
      ),
    );

    const result = await service.approveQuotation(
      actorId,
      tenantId,
      quotationId,
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.eventId).toBe('event-existing');
    }
    expect(createEventFromApprovedQuotation).toHaveBeenCalledTimes(1);
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
