import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  ExecutionOwnerAssignedEvent,
  ExecutionProgressAdvancedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { ExecutionProgressService } from './execution-progress.service';
import type {
  EventRecord,
  EventRepository,
} from '../../domain/repositories/event.repository';

describe('ExecutionProgressService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'event-1';

  const baseEvent: EventRecord = {
    id: bookingId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'in_preparation',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venueName: 'Bangalore',
    guestCount: 200,
    requirementsNotes: null,
    workspaceStatus: 'active',
    preparationStatus: 'pending',
    operationalMilestone: null,
    executionOwnerId: 'user-1',
    cancellationReason: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let eventRepository: jest.Mocked<EventRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: ExecutionProgressService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new ExecutionProgressService(eventRepository, eventPublisher);
  });

  // ── assignExecutionOwner ─────────────────────────────────────────────

  it('rejects assign when booking is not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.assignExecutionOwner(tenantId, bookingId, {
      executionOwnerId: 'user-2',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects assign when booking is cancelled', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      status: 'cancelled',
    });

    const result = await service.assignExecutionOwner(tenantId, bookingId, {
      executionOwnerId: 'user-2',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('rejects assign when booking is completed', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      status: 'completed',
    });

    const result = await service.assignExecutionOwner(tenantId, bookingId, {
      executionOwnerId: 'user-2',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('assigns an execution owner and publishes ExecutionOwnerAssigned', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      executionOwnerId: null,
    });
    eventRepository.update.mockResolvedValue({
      ...baseEvent,
      executionOwnerId: 'user-2',
      version: 2,
    });

    const result = await service.assignExecutionOwner(tenantId, bookingId, {
      executionOwnerId: 'user-2',
      version: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.executionOwnerId).toBe('user-2');
    }
    expect(eventRepository.update).toHaveBeenCalledWith(
      tenantId,
      bookingId,
      { executionOwnerId: 'user-2' },
      1,
    );
    expect(publish).toHaveBeenCalledWith(
      expect.any(ExecutionOwnerAssignedEvent),
    );
  });

  it('reassigns an execution owner to a different staff member (update flow)', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent); // executionOwnerId: 'user-1'
    eventRepository.update.mockResolvedValue({
      ...baseEvent,
      executionOwnerId: 'user-3',
      version: 2,
    });

    const result = await service.assignExecutionOwner(tenantId, bookingId, {
      executionOwnerId: 'user-3',
      version: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.executionOwnerId).toBe('user-3');
    }
    expect(eventRepository.update).toHaveBeenCalledWith(
      tenantId,
      bookingId,
      { executionOwnerId: 'user-3' },
      1,
    );
  });

  it('maps concurrent modification failures on assign', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Event', bookingId),
    );

    const result = await service.assignExecutionOwner(tenantId, bookingId, {
      executionOwnerId: 'user-2',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('rethrows unexpected errors on assign', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockRejectedValue(new Error('boom'));

    await expect(
      service.assignExecutionOwner(tenantId, bookingId, {
        executionOwnerId: 'user-2',
        version: 1,
      }),
    ).rejects.toThrow('boom');
  });

  // ── advanceStage ─────────────────────────────────────────────────────

  it('rejects advance when booking is not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.advanceStage(tenantId, bookingId, {
      milestoneKey: 'setup-complete',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('enforces EP1-BR-003 when no execution owner is assigned', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      executionOwnerId: null,
    });

    const result = await service.advanceStage(tenantId, bookingId, {
      milestoneKey: 'setup-complete',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EP1-BR-003');
    }
  });

  it('rejects advance when booking status is not in-preparation or in-execution', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseEvent,
      status: 'approved',
    });

    const result = await service.advanceStage(tenantId, bookingId, {
      milestoneKey: 'setup-complete',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('advances the execution stage and publishes ExecutionProgressAdvanced', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockResolvedValue({
      ...baseEvent,
      operationalMilestone: 'setup-complete',
      version: 2,
    });

    const result = await service.advanceStage(tenantId, bookingId, {
      milestoneKey: 'setup-complete',
      version: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.operationalMilestone).toBe('setup-complete');
    }
    expect(eventRepository.update).toHaveBeenCalledWith(
      tenantId,
      bookingId,
      { operationalMilestone: 'setup-complete' },
      1,
    );
    expect(publish).toHaveBeenCalledWith(
      expect.any(ExecutionProgressAdvancedEvent),
    );
  });

  it('also updates preparationStatus when provided', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockResolvedValue({
      ...baseEvent,
      operationalMilestone: 'setup-complete',
      preparationStatus: 'ready',
      version: 2,
    });

    const result = await service.advanceStage(tenantId, bookingId, {
      milestoneKey: 'setup-complete',
      preparationStatus: 'ready',
      version: 1,
    });

    expect(result.ok).toBe(true);
    expect(eventRepository.update).toHaveBeenCalledWith(
      tenantId,
      bookingId,
      { operationalMilestone: 'setup-complete', preparationStatus: 'ready' },
      1,
    );
  });

  it('maps concurrent modification failures on advance', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Event', bookingId),
    );

    const result = await service.advanceStage(tenantId, bookingId, {
      milestoneKey: 'setup-complete',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('rethrows unexpected errors on advance', async () => {
    eventRepository.findById.mockResolvedValue(baseEvent);
    eventRepository.update.mockRejectedValue(new Error('boom'));

    await expect(
      service.advanceStage(tenantId, bookingId, {
        milestoneKey: 'setup-complete',
        version: 1,
      }),
    ).rejects.toThrow('boom');
  });
});
