import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  StaffAssignmentCancelledEvent,
  StaffAssignmentConfirmedEvent,
  StaffAssignmentCreatedEvent,
  StaffAssignmentReleasedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { StaffAssignmentApplicationService } from './staff-assignment.application.service';
import type {
  StaffAssignmentRecord,
  StaffAssignmentRepository,
} from '../../domain/repositories/staff-assignment.repository';
import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';

describe('StaffAssignmentApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const staffMemberId = 'user-1';
  const assignmentId = 'assignment-1';

  const baseBooking: EventRecord = {
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
    executionOwnerId: null,
    cancellationReason: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseAssignment: StaffAssignmentRecord = {
    id: assignmentId,
    tenantId,
    bookingId,
    staffMemberId,
    role: 'decorator',
    isOnSiteLead: false,
    reportingAt: null,
    note: null,
    status: 'proposed',
    confirmedAt: null,
    releasedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let staffAssignmentRepository: jest.Mocked<StaffAssignmentRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: StaffAssignmentApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    staffAssignmentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      update: jest.fn(),
    };
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new StaffAssignmentApplicationService(
      staffAssignmentRepository,
      eventRepository,
      eventPublisher,
    );
  });

  // ── createAssignment ─────────────────────────────────────────────────

  it('createAssignment rejects when booking not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.createAssignment(tenantId, {
      bookingId,
      staffMemberId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('createAssignment rejects when booking is cancelled', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseBooking,
      status: 'cancelled',
    });

    const result = await service.createAssignment(tenantId, {
      bookingId,
      staffMemberId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('createAssignment creates assignment in proposed status and publishes StaffAssignmentCreated', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    staffAssignmentRepository.create.mockResolvedValue(baseAssignment);

    const result = await service.createAssignment(tenantId, {
      bookingId,
      staffMemberId,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(assignmentId);
      expect(result.value.status).toBe('proposed');
    }
    expect(publish).toHaveBeenCalledWith(
      expect.any(StaffAssignmentCreatedEvent),
    );
  });

  it('createAssignment passes all fields to repository', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    staffAssignmentRepository.create.mockResolvedValue(baseAssignment);

    const reportingAt = new Date('2026-08-01T07:00:00.000Z');
    await service.createAssignment(tenantId, {
      bookingId,
      staffMemberId,
      role: 'on_site_lead',
      isOnSiteLead: true,
      reportingAt,
      note: 'Bring backdrop frame',
    });

    expect(staffAssignmentRepository.create).toHaveBeenCalledWith(tenantId, {
      bookingId,
      staffMemberId,
      role: 'on_site_lead',
      isOnSiteLead: true,
      reportingAt,
      note: 'Bring backdrop frame',
    });
  });

  // ── getAssignmentById ─────────────────────────────────────────────────

  it('getAssignmentById returns NOT_FOUND when missing', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(null);

    const result = await service.getAssignmentById(tenantId, assignmentId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('getAssignmentById returns the assignment when found', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(baseAssignment);

    const result = await service.getAssignmentById(tenantId, assignmentId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(assignmentId);
    }
  });

  // ── listAssignmentsForBooking ────────────────────────────────────────

  it('listAssignmentsForBooking returns empty array when none exist', async () => {
    staffAssignmentRepository.findByBookingId.mockResolvedValue([]);

    const result = await service.listAssignmentsForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('listAssignmentsForBooking returns assignments for the booking', async () => {
    staffAssignmentRepository.findByBookingId.mockResolvedValue([
      baseAssignment,
    ]);

    const result = await service.listAssignmentsForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(assignmentId);
    }
  });

  // ── confirmAssignment ─────────────────────────────────────────────────

  it('confirmAssignment rejects when assignment not found', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(null);

    const result = await service.confirmAssignment(tenantId, assignmentId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('confirmAssignment rejects invalid transition from a terminal state', async () => {
    staffAssignmentRepository.findById.mockResolvedValue({
      ...baseAssignment,
      status: 'released',
    });

    const result = await service.confirmAssignment(tenantId, assignmentId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
    expect(staffAssignmentRepository.update).not.toHaveBeenCalled();
  });

  it('confirmAssignment confirms a proposed assignment and publishes StaffAssignmentConfirmed', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(baseAssignment);
    staffAssignmentRepository.update.mockResolvedValue({
      ...baseAssignment,
      status: 'confirmed',
      confirmedAt: new Date(),
      version: 2,
    });

    const result = await service.confirmAssignment(tenantId, assignmentId, 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('confirmed');
      expect(result.value.confirmedAt).not.toBeNull();
    }
    expect(staffAssignmentRepository.update).toHaveBeenCalledWith(
      tenantId,
      assignmentId,
      { status: 'confirmed', confirmedAt: expect.any(Date) },
      1,
    );
    expect(publish).toHaveBeenCalledWith(
      expect.any(StaffAssignmentConfirmedEvent),
    );
  });

  it('confirmAssignment handles ConcurrentModificationError', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(baseAssignment);
    staffAssignmentRepository.update.mockRejectedValue(
      new ConcurrentModificationError('StaffAssignment', assignmentId),
    );

    const result = await service.confirmAssignment(tenantId, assignmentId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // ── releaseAssignment ─────────────────────────────────────────────────

  it('releaseAssignment rejects when not confirmed', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(baseAssignment);

    const result = await service.releaseAssignment(tenantId, assignmentId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('releaseAssignment releases a confirmed assignment and publishes StaffAssignmentReleased', async () => {
    const confirmedAssignment: StaffAssignmentRecord = {
      ...baseAssignment,
      status: 'confirmed',
      confirmedAt: new Date(),
    };
    staffAssignmentRepository.findById.mockResolvedValue(confirmedAssignment);
    staffAssignmentRepository.update.mockResolvedValue({
      ...confirmedAssignment,
      status: 'released',
      releasedAt: new Date(),
      version: 2,
    });

    const result = await service.releaseAssignment(tenantId, assignmentId, 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('released');
    }
    expect(publish).toHaveBeenCalledWith(
      expect.any(StaffAssignmentReleasedEvent),
    );
  });

  it('releaseAssignment handles ConcurrentModificationError', async () => {
    const confirmedAssignment: StaffAssignmentRecord = {
      ...baseAssignment,
      status: 'confirmed',
    };
    staffAssignmentRepository.findById.mockResolvedValue(confirmedAssignment);
    staffAssignmentRepository.update.mockRejectedValue(
      new ConcurrentModificationError('StaffAssignment', assignmentId),
    );

    const result = await service.releaseAssignment(tenantId, assignmentId, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // ── cancelAssignment ──────────────────────────────────────────────────

  it('cancelAssignment rejects blank reason', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(baseAssignment);

    const result = await service.cancelAssignment(
      tenantId,
      assignmentId,
      { reason: '   ' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('cancelAssignment rejects when already released', async () => {
    staffAssignmentRepository.findById.mockResolvedValue({
      ...baseAssignment,
      status: 'released',
    });

    const result = await service.cancelAssignment(
      tenantId,
      assignmentId,
      { reason: 'No longer needed' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('cancelAssignment cancels a proposed assignment and publishes StaffAssignmentCancelled', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(baseAssignment);
    staffAssignmentRepository.update.mockResolvedValue({
      ...baseAssignment,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: 'Staff unavailable',
      version: 2,
    });

    const result = await service.cancelAssignment(
      tenantId,
      assignmentId,
      { reason: 'Staff unavailable' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('cancelled');
      expect(result.value.cancellationReason).toBe('Staff unavailable');
    }
    expect(publish).toHaveBeenCalledWith(
      expect.any(StaffAssignmentCancelledEvent),
    );
  });

  it('cancelAssignment cancels a confirmed assignment', async () => {
    const confirmedAssignment: StaffAssignmentRecord = {
      ...baseAssignment,
      status: 'confirmed',
    };
    staffAssignmentRepository.findById.mockResolvedValue(confirmedAssignment);
    staffAssignmentRepository.update.mockResolvedValue({
      ...confirmedAssignment,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: 'Event postponed',
      version: 2,
    });

    const result = await service.cancelAssignment(
      tenantId,
      assignmentId,
      { reason: 'Event postponed' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('cancelled');
    }
  });

  it('cancelAssignment handles ConcurrentModificationError', async () => {
    staffAssignmentRepository.findById.mockResolvedValue(baseAssignment);
    staffAssignmentRepository.update.mockRejectedValue(
      new ConcurrentModificationError('StaffAssignment', assignmentId),
    );

    const result = await service.cancelAssignment(
      tenantId,
      assignmentId,
      { reason: 'Staff unavailable' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
