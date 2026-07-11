import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { WorkspaceActivatedEvent } from '../../../../shared/events/sprint2-domain.events';
import { WorkspaceService } from './workspace.service';
import type {
  EventRecord,
  EventRepository,
} from '../../domain/repositories/event.repository';

describe('WorkspaceService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'event-1';

  const baseEvent: EventRecord = {
    id: bookingId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'approved',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venueName: 'Bangalore',
    guestCount: 200,
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

  let eventRepository: jest.Mocked<EventRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: WorkspaceService;
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
    eventPublisher = { publish };

    service = new WorkspaceService(eventRepository, eventPublisher);
  });

  // --- activateWorkspace ---

  it('rejects activate when booking is not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.activateWorkspace(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects activate when booking status is not approved or in-preparation', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      status: 'completed',
    });

    const result = await service.activateWorkspace(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('rejects activate when workspace is already active', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      workspaceStatus: 'active',
    });

    const result = await service.activateWorkspace(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('activates the workspace for an approved event and publishes WorkspaceActivated', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockResolvedValue({
      ...baseEvent,
      workspaceStatus: 'active',
      version: 2,
    });

    const result = await service.activateWorkspace(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.workspaceStatus).toBe('active');
    }
    expect(eventRepository.update).toHaveBeenCalledWith(
      tenantId,
      bookingId,
      { workspaceStatus: 'active' },
      1,
    );
    expect(publish).toHaveBeenCalledWith(expect.any(WorkspaceActivatedEvent));
  });

  it('activates the workspace for an in-preparation event', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      status: 'in_preparation',
    });
    eventRepository.update.mockResolvedValue({
      ...baseEvent,
      status: 'in_preparation',
      workspaceStatus: 'active',
      version: 2,
    });

    const result = await service.activateWorkspace(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(true);
  });

  it('maps concurrent modification failures on activate', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Event', bookingId),
    );

    const result = await service.activateWorkspace(tenantId, bookingId, {
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('rethrows unexpected errors on activate', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockRejectedValue(new Error('boom'));

    await expect(
      service.activateWorkspace(tenantId, bookingId, { version: 1 }),
    ).rejects.toThrow('boom');
  });

  // --- getWorkspace ---

  it('returns not found when getting workspace for a missing booking', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.getWorkspace(tenantId, bookingId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('returns the workspace view for an existing booking', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);

    const result = await service.getWorkspace(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.eventId).toBe(bookingId);
      expect(result.value.workspaceStatus).toBe('inactive');
    }
  });
});
