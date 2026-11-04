import { SchedulingApplicationService } from './scheduling.application.service';
import type { StaffMemberRepository } from '../../domain/repositories/staff-member.repository';
import type { StaffAssignmentRepository } from '../../domain/repositories/staff-assignment.repository';
import type { StaffAvailabilityRepository } from '../../domain/repositories/staff-availability.repository';
import type { StaffLeaveRepository } from '../../domain/repositories/staff-leave.repository';
import type { EventRepository } from '../../../booking/domain/repositories/event.repository';

describe('SchedulingApplicationService', () => {
  const tenantId = 'tenant-1';
  const staffMemberId = 'staff-1';
  const bookingId = 'booking-1';

  const activeMember = {
    id: staffMemberId,
    tenantId,
    userId: null,
    name: 'Ravi',
    role: 'decorator',
    department: null,
    phone: '+919999999999',
    email: null,
    employmentType: 'permanent' as const,
    status: 'active' as const,
    joinedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const booking = {
    id: bookingId,
    tenantId,
    customerId: 'c1',
    leadId: null as string | null,
    quotationId: 'q1',
    bookingNumber: 100,
    status: 'in_preparation' as const,
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-10T00:00:00.000Z'),
    eventEndDate: new Date('2026-08-11T00:00:00.000Z'),
    venueName: null as string | null,
    guestCount: null as number | null,
    requirementsNotes: null as string | null,
    workspaceStatus: 'active' as const,
    preparationStatus: 'pending' as const,
    operationalMilestone: null as string | null,
    executionOwnerId: null as string | null,
    cancellationReason: null as string | null,
    completedAt: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let staffMemberRepository: jest.Mocked<
    Pick<StaffMemberRepository, 'findById' | 'findMany'>
  >;
  let staffAssignmentRepository: jest.Mocked<
    Pick<StaffAssignmentRepository, 'findConfirmedByStaffMemberId'>
  >;
  let availabilityRepository: jest.Mocked<
    Pick<StaffAvailabilityRepository, 'findForStaffInRange'>
  >;
  let leaveRepository: jest.Mocked<
    Pick<
      StaffLeaveRepository,
      'findApprovedOverlapping' | 'findApprovedInRange'
    >
  >;
  let eventRepository: jest.Mocked<Pick<EventRepository, 'findById'>>;
  let service: SchedulingApplicationService;

  beforeEach(() => {
    staffMemberRepository = {
      findById: jest.fn().mockResolvedValue(activeMember),
      findMany: jest.fn().mockResolvedValue([activeMember]),
    };
    staffAssignmentRepository = {
      findConfirmedByStaffMemberId: jest.fn().mockResolvedValue([]),
    };
    availabilityRepository = {
      findForStaffInRange: jest.fn().mockResolvedValue([]),
    };
    leaveRepository = {
      findApprovedOverlapping: jest.fn().mockResolvedValue([]),
      findApprovedInRange: jest.fn().mockResolvedValue([]),
    };
    eventRepository = {
      findById: jest.fn().mockResolvedValue(booking),
    };

    service = new SchedulingApplicationService(
      staffMemberRepository as never,
      staffAssignmentRepository as never,
      availabilityRepository as never,
      leaveRepository as never,
      eventRepository as never,
    );
  });

  it('detectConflicts returns empty when staff is free', async () => {
    const result = await service.detectConflictsForStaffOnBooking(
      tenantId,
      staffMemberId,
      bookingId,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('detectConflicts flags approved leave overlap', async () => {
    leaveRepository.findApprovedOverlapping.mockResolvedValue([
      {
        id: 'leave-1',
        tenantId,
        staffMemberId,
        leaveType: 'sick',
        status: 'approved',
        startDate: new Date('2026-08-09'),
        endDate: new Date('2026-08-12'),
        reason: null,
        notes: null,
        reviewedByUserId: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    ]);

    const result = await service.detectConflictsForStaffOnBooking(
      tenantId,
      staffMemberId,
      bookingId,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.some((c) => c.code === 'approved_leave')).toBe(true);
    }
  });

  it('detectConflicts flags unavailable availability', async () => {
    availabilityRepository.findForStaffInRange.mockResolvedValue([
      {
        id: 'av-1',
        tenantId,
        staffMemberId,
        date: new Date('2026-08-10'),
        weekday: null,
        startTime: null,
        endTime: null,
        kind: 'unavailable',
        reason: 'Personal',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    ]);

    const result = await service.detectConflictsForStaffOnBooking(
      tenantId,
      staffMemberId,
      bookingId,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.some((c) => c.code === 'unavailable')).toBe(true);
    }
  });

  it('detectConflicts flags overlapping confirmed assignment', async () => {
    staffAssignmentRepository.findConfirmedByStaffMemberId.mockResolvedValue([
      {
        id: 'asg-2',
        tenantId,
        bookingId: 'booking-2',
        staffMemberId,
        legacyUserId: null,
        role: null,
        isOnSiteLead: false,
        reportingAt: null,
        note: null,
        status: 'confirmed',
        confirmedAt: new Date(),
        releasedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    ]);
    eventRepository.findById.mockImplementation((_t, id) => {
      if (id === bookingId) return Promise.resolve(booking);
      return Promise.resolve({
        ...booking,
        id: 'booking-2',
        bookingNumber: 101,
        eventStartDate: new Date('2026-08-11T00:00:00.000Z'),
        eventEndDate: new Date('2026-08-12T00:00:00.000Z'),
      });
    });

    const result = await service.detectConflictsForStaffOnBooking(
      tenantId,
      staffMemberId,
      bookingId,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        result.value.some((c) => c.code === 'overlapping_assignment'),
      ).toBe(true);
    }
  });

  it('recommendForBooking ranks conflict-free permanent staff higher', async () => {
    const temp = {
      ...activeMember,
      id: 'staff-2',
      name: 'Temp Worker',
      employmentType: 'temporary' as const,
    };
    staffMemberRepository.findMany.mockResolvedValue([activeMember, temp]);
    staffMemberRepository.findById.mockImplementation((_t, id) =>
      Promise.resolve(id === staffMemberId ? activeMember : temp),
    );

    const result = await service.recommendForBooking(tenantId, bookingId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.staffMemberId).toBe(staffMemberId);
      expect(result.value[0]?.score).toBeGreaterThan(
        result.value[1]?.score ?? 0,
      );
    }
  });

  it('getWorkload counts confirmed events in windows', async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    staffAssignmentRepository.findConfirmedByStaffMemberId.mockResolvedValue([
      {
        id: 'asg-1',
        tenantId,
        bookingId,
        staffMemberId,
        legacyUserId: null,
        role: null,
        isOnSiteLead: false,
        reportingAt: null,
        note: null,
        status: 'confirmed',
        confirmedAt: new Date(),
        releasedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    ]);
    eventRepository.findById.mockResolvedValue({
      ...booking,
      eventStartDate: today,
      eventEndDate: today,
    });

    const result = await service.getWorkload(tenantId, staffMemberId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]?.eventsToday).toBe(1);
      expect(result.value[0]?.upcomingConfirmed).toBe(1);
    }
  });
});
