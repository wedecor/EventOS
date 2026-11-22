import { CalendarApplicationService } from './calendar.application.service';

describe('CalendarApplicationService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const bookingId = '22222222-2222-4222-8222-222222222222';
  const customerId = '33333333-3333-4333-8333-333333333333';
  const staffId = '44444444-4444-4444-8444-444444444444';

  const eventStart = new Date('2026-07-20T00:00:00.000Z');
  const eventEnd = new Date('2026-07-21T00:00:00.000Z');

  function buildService(overrides?: {
    events?: unknown[];
    reminders?: unknown[];
    procurements?: unknown[];
    conflicts?: unknown[];
  }) {
    const eventRepository = {
      findByEventDate: jest.fn().mockResolvedValue(
        overrides?.events ?? [
          {
            id: bookingId,
            tenantId,
            customerId,
            leadId: null,
            quotationId: '55555555-5555-4555-8555-555555555555',
            bookingNumber: 42,
            status: 'confirmed',
            eventType: 'Wedding',
            eventStartDate: eventStart,
            eventEndDate: eventEnd,
            venueName: 'Hall A',
            guestCount: 100,
            requirementsNotes: null,
            workspaceStatus: 'active',
            preparationStatus: 'in_progress',
            operationalMilestone: null,
            executionOwnerId: null,
            cancellationReason: null,
            completedAt: null,
            createdAt: eventStart,
            updatedAt: eventStart,
            version: 1,
          },
        ],
      ),
      findById: jest.fn().mockResolvedValue({
        id: bookingId,
        tenantId,
        customerId,
        bookingNumber: 42,
        status: 'confirmed',
        eventType: 'Wedding',
        eventStartDate: eventStart,
        eventEndDate: eventEnd,
        venueName: 'Hall A',
        workspaceStatus: 'active',
        preparationStatus: 'in_progress',
      }),
    };

    const staffMemberRepository = {
      findById: jest.fn(),
      findMany: jest.fn().mockResolvedValue([
        {
          id: staffId,
          name: 'Alex',
          status: 'active',
          employmentType: 'permanent',
          role: 'coordinator',
        },
      ]),
    };

    const staffAssignmentRepository = {
      findConfirmedByStaffMemberId: jest.fn().mockResolvedValue([
        {
          id: '66666666-6666-4666-8666-666666666666',
          bookingId,
          staffMemberId: staffId,
          role: 'Lead',
          status: 'confirmed',
        },
      ]),
      findByBookingId: jest.fn().mockResolvedValue([
        {
          id: '66666666-6666-4666-8666-666666666666',
          bookingId,
          staffMemberId: staffId,
          role: 'Lead',
          status: 'confirmed',
        },
      ]),
    };

    const leaveRepository = {
      findApprovedInRange: jest.fn().mockResolvedValue([]),
    };
    const availabilityRepository = {
      findForStaffInRange: jest.fn().mockResolvedValue([]),
    };
    const vendorProcurementRepository = {
      findAll: jest.fn().mockResolvedValue(
        overrides?.procurements ?? [
          {
            id: '77777777-7777-4777-8777-777777777777',
            bookingId,
            vendorId: '88888888-8888-4888-8888-888888888888',
            requiredDate: new Date('2026-07-10T00:00:00.000Z'),
            workflowStatus: 'approved',
            deliveryStatus: 'pending',
            serviceCategory: 'Catering',
          },
        ],
      ),
    };
    const inventoryMovementRepository = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    const inventoryReservationRepository = {
      findByBookingId: jest.fn().mockResolvedValue([]),
    };
    const reminderRepository = {
      findAll: jest.fn().mockResolvedValue(
        overrides?.reminders ?? [
          {
            id: '99999999-9999-4999-8999-999999999999',
            title: 'Payment follow-up',
            dueAt: new Date('2026-07-20T10:00:00.000Z'),
            status: 'pending',
            category: 'payment_follow_up',
            bookingId,
            customerId,
            vendorId: null,
            staffMemberId: null,
          },
        ],
      ),
    };
    const communicationRecordRepository = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    const financialDocumentRepository = {
      findByBookingId: jest.fn().mockResolvedValue([]),
    };
    const schedulingService = {
      detectConflictsForStaffOnBooking: jest.fn().mockResolvedValue({
        ok: true,
        value: overrides?.conflicts ?? [],
      }),
    };
    const inventoryAvailabilityService = {
      getAvailability: jest.fn().mockResolvedValue({
        inventoryItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        quantityAtJpNagar: 10,
        reservedQuantity: 0,
        unlinkedMovementQuantity: 0,
        availableQuantity: 10,
      }),
    };

    return new CalendarApplicationService(
      eventRepository as never,
      staffMemberRepository as never,
      staffAssignmentRepository as never,
      leaveRepository as never,
      availabilityRepository as never,
      vendorProcurementRepository as never,
      inventoryMovementRepository as never,
      inventoryReservationRepository as never,
      reminderRepository as never,
      communicationRecordRepository as never,
      financialDocumentRepository as never,
      schedulingService as never,
      inventoryAvailabilityService as never,
    );
  }

  it('aggregates events, staff, reminders ordered by startAt', async () => {
    const service = buildService();
    const result = await service.getEvents(tenantId, {
      from: '2026-07-19',
      to: '2026-07-22',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sources = result.value.map((e) => e.source);
    expect(sources).toContain('event');
    expect(sources).toContain('staff_assignment');
    expect(sources).toContain('reminder');
    const times = result.value.map((e) => e.startAt);
    const sorted = [...times].sort((a, b) => a.localeCompare(b));
    expect(times).toEqual(sorted);
  });

  it('filters by bookingId', async () => {
    const service = buildService();
    const result = await service.getEvents(tenantId, {
      from: '2026-07-19',
      to: '2026-07-22',
      bookingId,
      sources: ['event'],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.every((e) => e.bookingId === bookingId)).toBe(true);
  });

  it('rejects invalid date range', async () => {
    const service = buildService();
    const result = await service.getEvents(tenantId, {
      from: '2026-07-22',
      to: '2026-07-19',
    });
    expect(result.ok).toBe(false);
  });

  it('timeline includes communications when present', async () => {
    const service = buildService();
    (
      service as unknown as {
        communicationRecordRepository: {
          findAll: jest.Mock;
        };
      }
    ).communicationRecordRepository.findAll.mockResolvedValue([
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        channel: 'whatsapp',
        direction: 'outgoing',
        status: 'sent',
        subject: 'Confirmation',
        occurredAt: new Date('2026-07-20T12:00:00.000Z'),
        bookingId,
        customerId,
        vendorId: null,
        staffMemberId: null,
        deletedAt: null,
      },
    ]);

    const result = await service.getTimeline(tenantId, {
      from: '2026-07-19',
      to: '2026-07-22',
      sources: ['communication'],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.some((e) => e.source === 'communication')).toBe(true);
  });

  it('exposes overdue procurement delays in conflicts', async () => {
    const service = buildService();
    const result = await service.getConflicts(tenantId, {
      from: '2026-07-01',
      to: '2026-07-31',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.counts.procurementDelays).toBeGreaterThan(0);
    expect(result.value.items.some((i) => i.kind === 'procurement_delay')).toBe(
      true,
    );
  });

  it('builds planning dashboard counts', async () => {
    const service = buildService();
    const result = await service.getPlanningDashboard(tenantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.counts).toEqual(
      expect.objectContaining({
        todayEvents: expect.any(Number),
        upcomingEvents: expect.any(Number),
        pendingReminders: expect.any(Number),
        overdueItems: expect.any(Number),
      }),
    );
  });
});
