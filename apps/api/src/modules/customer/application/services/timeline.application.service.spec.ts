import { TimelineEntryAddedEvent } from '../../../../shared/events/sprint1-domain.events';
import type { EventRecord } from '../../../booking/domain/repositories/event.repository';
import type { CustomerRecord } from '../../domain/repositories/customer.repository';
import type { TimelineEntryRecord } from '../../domain/repositories/timeline-entry.repository';
import { TimelineApplicationService } from './timeline.application.service';

describe('TimelineApplicationService', () => {
  const tenantId = 'tenant-1';
  const customerId = 'customer-1';
  const eventId = 'event-1';
  const userId = 'user-1';

  const customer: CustomerRecord = {
    id: customerId,
    tenantId,
    displayName: 'Acme Corp',
    type: 'organization',
    status: 'active',
    primaryPhone: '+919876543210',
    primaryEmail: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const event: EventRecord = {
    id: eventId,
    tenantId,
    customerId,
    leadId: null,
    quotationId: 'quotation-1',
    bookingNumber: 1001,
    status: 'approved',
    eventType: null,
    eventStartDate: null,
    eventEndDate: null,
    venueName: null,
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

  const entry: TimelineEntryRecord = {
    id: 'timeline-1',
    tenantId,
    customerId,
    eventId,
    type: 'note',
    message: 'Called customer about décor changes',
    occurredAt: new Date('2026-07-13T10:00:00.000Z'),
    recordedByUserId: userId,
    createdAt: new Date('2026-07-13T10:01:00.000Z'),
  };

  let timelineEntryRepository: {
    create: jest.Mock;
    findByCustomerId: jest.Mock;
  };
  let customerRepository: { findById: jest.Mock };
  let eventRepository: { findById: jest.Mock };
  let publish: jest.Mock;
  let service: TimelineApplicationService;

  beforeEach(() => {
    publish = jest.fn();
    timelineEntryRepository = {
      create: jest.fn(),
      findByCustomerId: jest.fn(),
    };
    customerRepository = { findById: jest.fn() };
    eventRepository = { findById: jest.fn() };

    service = new TimelineApplicationService(
      timelineEntryRepository,
      customerRepository as never,
      eventRepository as never,
      { publish },
    );
  });

  it('listInteractions returns NOT_FOUND when customer missing', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const result = await service.listInteractions(tenantId, customerId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('listInteractions returns full DTOs ordered by repository', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    timelineEntryRepository.findByCustomerId.mockResolvedValue([entry]);

    const result = await service.listInteractions(tenantId, customerId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([
        {
          id: entry.id,
          customerId,
          eventId,
          type: 'note',
          message: entry.message,
          occurredAt: entry.occurredAt,
          recordedByUserId: userId,
          createdAt: entry.createdAt,
        },
      ]);
    }
  });

  it('logInteraction rejects blank message', async () => {
    customerRepository.findById.mockResolvedValue(customer);

    const result = await service.logInteraction(tenantId, customerId, {
      eventId,
      type: 'note',
      message: '   ',
      occurredAt: entry.occurredAt,
      recordedByUserId: userId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('logInteraction rejects missing event', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.logInteraction(tenantId, customerId, {
      eventId,
      type: 'note',
      message: 'Hello',
      occurredAt: entry.occurredAt,
      recordedByUserId: userId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('logInteraction rejects cross-customer event (decision 3A)', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    eventRepository.findById.mockResolvedValue({
      ...event,
      customerId: 'other-customer',
    });

    const result = await service.logInteraction(tenantId, customerId, {
      eventId,
      type: 'note',
      message: 'Hello',
      occurredAt: entry.occurredAt,
      recordedByUserId: userId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('logInteraction returns docs/09 create shape and publishes event', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    eventRepository.findById.mockResolvedValue(event);
    timelineEntryRepository.create.mockResolvedValue(entry);

    const result = await service.logInteraction(tenantId, customerId, {
      eventId,
      type: 'note',
      message: ' Called customer about décor changes ',
      occurredAt: entry.occurredAt,
      recordedByUserId: userId,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        id: entry.id,
        eventId,
        type: 'note',
      });
    }
    expect(timelineEntryRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        message: 'Called customer about décor changes',
        recordedByUserId: userId,
      }),
    );
    expect(publish).toHaveBeenCalledWith(expect.any(TimelineEntryAddedEvent));
  });
});
