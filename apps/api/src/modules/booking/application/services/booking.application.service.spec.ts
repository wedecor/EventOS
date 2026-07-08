import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  BookingStatusChangedEvent,
  EventCreatedEvent,
} from '../../../../shared/events/sprint1-domain.events';
import { AdvancePaymentQuery } from '../../../../shared/application/ports/advance-payment.query';
import { BookingApplicationService } from './booking.application.service';
import type {
  EventRecord,
  EventRepository,
} from '../../domain/repositories/event.repository';
import type {
  QuotationRecord,
  QuotationRepository,
} from '../../../quotation/domain/repositories/quotation.repository';

describe('BookingApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'event-1';
  const quotationId = 'quotation-1';

  const approvedQuotation: QuotationRecord = {
    id: quotationId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationNumber: 1001,
    revisionNumber: 1,
    status: 'approved',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venue: 'Bangalore',
    validUntil: new Date('2026-08-31'),
    terms: null,
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

  const baseEvent: EventRecord = {
    id: bookingId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationId,
    bookingNumber: 5001,
    status: 'approved',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venueName: 'Bangalore',
    guestCount: 200,
    requirementsNotes: null,
    preparationStatus: 'pending',
    operationalMilestone: null,
    executionOwnerId: null,
    cancellationReason: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let eventRepository: jest.Mocked<EventRepository>;
  let quotationRepository: jest.Mocked<QuotationRepository>;
  let advancePaymentQuery: jest.Mocked<AdvancePaymentQuery>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: BookingApplicationService;

  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };
    quotationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findLatestRevision: jest.fn(),
      findMaxQuotationNumber: jest.fn(),
      update: jest.fn(),
    };
    advancePaymentQuery = {
      hasConfirmedAdvance: jest.fn(),
    };
    eventPublisher = { publish };

    service = new BookingApplicationService(
      eventRepository,
      quotationRepository,
      advancePaymentQuery,
      eventPublisher,
    );
  });

  it('rejects create when quotation is not found', async () => {
    quotationRepository.findById.mockResolvedValue(null);

    const result = await service.createEventFromApprovedQuotation(
      tenantId,
      quotationId,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects create when quotation is not approved', async () => {
    quotationRepository.findById.mockResolvedValue({
      ...approvedQuotation,
      status: 'sent',
    });

    const result = await service.createEventFromApprovedQuotation(
      tenantId,
      quotationId,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('rejects duplicate event for the same quotation', async () => {
    quotationRepository.findById.mockResolvedValue(approvedQuotation);
    advancePaymentQuery.hasConfirmedAdvance.mockResolvedValue(true);
    eventRepository.findByQuotationId.mockResolvedValue(baseEvent);

    const result = await service.createEventFromApprovedQuotation(
      tenantId,
      quotationId,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('DUPLICATE_EVENT');
    }
  });

  it('creates an event from an approved quotation and publishes EventCreated', async () => {
    quotationRepository.findById.mockResolvedValue(approvedQuotation);
    advancePaymentQuery.hasConfirmedAdvance.mockResolvedValue(true);
    eventRepository.findByQuotationId.mockResolvedValue(null);
    eventRepository.findMaxBookingNumber.mockResolvedValue(5000);
    eventRepository.create.mockResolvedValue(baseEvent);

    const result = await service.createEventFromApprovedQuotation(
      tenantId,
      quotationId,
    );

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(EventCreatedEvent));
  });

  it('enforces EP1-BR-001 when creating an event', async () => {
    quotationRepository.findById.mockResolvedValue(approvedQuotation);
    advancePaymentQuery.hasConfirmedAdvance.mockResolvedValue(false);

    const result = await service.createEventFromApprovedQuotation(
      tenantId,
      quotationId,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EP1-BR-001');
    }
  });

  it('rejects activate when booking is not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.activateBooking(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects activate when booking is not approved', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      status: 'in_preparation',
    });

    const result = await service.activateBooking(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('activates a booking without workspace and publishes BookingStatusChanged', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockResolvedValue({
      ...baseEvent,
      status: 'in_preparation',
      version: 2,
    });

    const result = await service.activateBooking(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(BookingStatusChangedEvent));
  });

  it('returns not found when retrieving a missing booking', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.retrieveBooking(tenantId, bookingId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('retrieves a booking by id', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);

    const result = await service.retrieveBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(bookingId);
    }
  });

  it('maps concurrent modification failures on activate', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Event', bookingId),
    );

    const result = await service.activateBooking(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
