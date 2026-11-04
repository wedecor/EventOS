import { AnalyticsApplicationService } from './analytics.application.service';

describe('AnalyticsApplicationService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';

  function buildService() {
    const leadRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'l1',
          stage: 'approved',
          source: 'whatsapp',
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
          updatedAt: new Date('2026-07-05T00:00:00.000Z'),
        },
        {
          id: 'l2',
          stage: 'lost',
          source: 'instagram',
          createdAt: new Date('2026-07-02T00:00:00.000Z'),
          updatedAt: new Date('2026-07-06T00:00:00.000Z'),
        },
      ]),
    };
    const quotationRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'q1',
          status: 'approved',
          createdAt: new Date('2026-07-03T00:00:00.000Z'),
          totalAmount: 100000,
        },
        {
          id: 'q2',
          status: 'rejected',
          createdAt: new Date('2026-07-04T00:00:00.000Z'),
          totalAmount: 50000,
        },
      ]),
    };
    const eventRepository = {
      findByEventDate: jest.fn().mockResolvedValue([
        {
          id: 'e1',
          customerId: 'c1',
          status: 'completed',
          eventType: 'Wedding',
          eventStartDate: new Date('2026-07-10T00:00:00.000Z'),
          eventEndDate: null,
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
          updatedAt: new Date('2026-07-11T00:00:00.000Z'),
          completedAt: new Date('2026-07-11T00:00:00.000Z'),
        },
        {
          id: 'e2',
          customerId: 'c1',
          status: 'in_preparation',
          eventType: 'Birthday',
          eventStartDate: new Date('2026-08-01T00:00:00.000Z'),
          eventEndDate: null,
          createdAt: new Date('2026-07-15T00:00:00.000Z'),
          updatedAt: new Date('2026-07-15T00:00:00.000Z'),
          completedAt: null,
        },
      ]),
    };
    const customerRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'c1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-07-15T00:00:00.000Z'),
        },
        {
          id: 'c2',
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
          updatedAt: new Date('2026-07-20T00:00:00.000Z'),
        },
      ]),
    };
    const paymentRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'p1',
          status: 'confirmed',
          amount: 40000,
          bookingId: 'e1',
          invoiceId: null,
          receivedAt: new Date('2026-07-08T00:00:00.000Z'),
        },
      ]),
    };
    const vendorExpenseRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'x1',
          status: 'confirmed',
          amount: 10000,
          paidAt: new Date('2026-07-09T00:00:00.000Z'),
          bookingId: 'e1',
        },
      ]),
    };
    const invoiceRepository = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ id: 'i1', status: 'sent', totalAmount: 50000 }]),
    };
    const financialDocumentRepository = {
      findByBookingId: jest.fn().mockResolvedValue([]),
    };
    const vendorProcurementRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'vp1',
          vendorId: 'v1',
          workflowStatus: 'completed',
          deliveryStatus: 'delivered',
          estimatedCost: 8000,
          actualCost: 9000,
          approvedCost: 8500,
        },
      ]),
    };
    const vendorRepository = {
      findMany: jest.fn().mockResolvedValue([{ id: 'v1' }]),
    };
    const inventoryItemRepository = {
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: 'item1', quantityAtJpNagar: 100 }]),
    };
    const inventoryMovementRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'm1',
          status: 'dispatched',
          quantity: 10,
          damagedQuantity: 0,
          missingQuantity: 0,
          dispatchedAt: new Date('2026-07-10T00:00:00.000Z'),
          returnedAt: new Date('2026-07-12T00:00:00.000Z'),
        },
      ]),
    };
    const inventoryReservationRepository = {
      findByBookingId: jest
        .fn()
        .mockResolvedValue([{ id: 'r1', status: 'reserved' }]),
    };
    const staffMemberRepository = {
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: 's1', status: 'active', name: 'Alex' }]),
    };
    const staffAssignmentRepository = {
      findAll: jest.fn().mockResolvedValue([{ id: 'a1', status: 'confirmed' }]),
    };
    const staffLeaveRepository = {
      findApprovedInRange: jest.fn().mockResolvedValue([]),
    };
    const reminderRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'rem1',
          status: 'pending',
          dueAt: new Date('2026-07-01T00:00:00.000Z'),
          customerId: 'c1',
        },
      ]),
    };
    const communicationRecordRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'com1',
          customerId: 'c1',
          channel: 'whatsapp',
          status: 'sent',
          occurredAt: new Date('2026-07-07T00:00:00.000Z'),
        },
      ]),
    };
    const schedulingService = {
      getWorkload: jest.fn().mockResolvedValue({
        ok: true,
        value: [
          {
            staffMemberId: 's1',
            name: 'Alex',
            eventsToday: 1,
            eventsThisWeek: 2,
            eventsThisMonth: 3,
            upcomingConfirmed: 1,
          },
        ],
      }),
    };

    return new AnalyticsApplicationService(
      leadRepository as never,
      quotationRepository as never,
      eventRepository as never,
      customerRepository as never,
      paymentRepository as never,
      vendorExpenseRepository as never,
      invoiceRepository as never,
      financialDocumentRepository as never,
      vendorProcurementRepository as never,
      vendorRepository as never,
      inventoryItemRepository as never,
      inventoryMovementRepository as never,
      inventoryReservationRepository as never,
      staffMemberRepository as never,
      staffAssignmentRepository as never,
      staffLeaveRepository as never,
      reminderRepository as never,
      communicationRecordRepository as never,
      schedulingService as never,
    );
  }

  it('builds founder dashboard KPIs', async () => {
    const service = buildService();
    const result = await service.getDashboard(tenantId, {
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-31T23:59:59.000Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalRevenue.amount).toBe(40000);
    expect(result.value.activeBookings).toBe(1);
    expect(result.value.counts.leads).toBe(2);
  });

  it('computes sales conversion and quote acceptance', async () => {
    const service = buildService();
    const result = await service.getSales(tenantId, {
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-31T23:59:59.000Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.leadsCreated).toBe(2);
    expect(result.value.quoteAcceptanceRate).toBe(0.5);
  });

  it('exports CSV for finance dataset', async () => {
    const service = buildService();
    const result = await service.exportDataset(tenantId, {
      dataset: 'finance',
      format: 'csv',
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-31T23:59:59.000Z',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.format).toBe('csv');
    expect(result.value.contentType).toContain('text/csv');
    expect(result.value.content).toContain('month');
  });

  it('builds monthly trend points without forecasting', async () => {
    const service = buildService();
    const result = await service.getTrends(tenantId, {
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-31T23:59:59.000Z',
      granularity: 'monthly',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.granularity).toBe('monthly');
    expect(result.value.points.length).toBeGreaterThan(0);
  });
});
