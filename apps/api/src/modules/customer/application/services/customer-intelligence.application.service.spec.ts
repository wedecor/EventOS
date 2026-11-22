import { CustomerIntelligenceApplicationService } from './customer-intelligence.application.service';

describe('CustomerIntelligenceApplicationService', () => {
  const tenantId = '11111111-1111-4111-8111-111111111111';
  const customerId = '22222222-2222-4222-8222-222222222222';
  const bookingId = '33333333-3333-4333-8333-333333333333';
  const quotationId = '44444444-4444-4444-8444-444444444444';

  const now = new Date('2026-07-20T12:00:00.000Z');

  function buildService() {
    const customerRepository = {
      findById: jest.fn().mockResolvedValue({
        id: customerId,
        displayName: 'Priya Sharma',
        type: 'individual',
        status: 'active',
        primaryPhone: '+919999999999',
        primaryEmail: 'priya@example.com',
        notes: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: now,
      }),
    };
    const contactRepository = {
      findByCustomerId: jest.fn().mockResolvedValue([
        {
          id: '55555555-5555-4555-8555-555555555555',
          name: 'Priya',
          role: 'primary',
          phone: '+919999999999',
          email: 'priya@example.com',
        },
      ]),
    };
    const timelineEntryRepository = {
      findByCustomerId: jest.fn().mockResolvedValue([
        {
          id: '66666666-6666-4666-8666-666666666666',
          type: 'note',
          message: 'Called about venue',
          occurredAt: new Date('2026-06-01T10:00:00.000Z'),
          eventId: null,
        },
      ]),
    };
    const leadRepository = {
      findByCustomerId: jest.fn().mockResolvedValue([
        {
          id: '77777777-7777-4777-8777-777777777777',
          stage: 'approved',
          source: 'whatsapp',
          createdAt: new Date('2025-12-01T00:00:00.000Z'),
        },
      ]),
    };
    const followUpRepository = {
      findByLeadIds: jest.fn().mockResolvedValue([]),
    };
    const quotationRepository = {
      findByCustomerId: jest.fn().mockResolvedValue([
        {
          id: quotationId,
          quotationNumber: 10,
          revisionNumber: 1,
          status: 'approved',
          totalAmount: 150000,
          currency: 'INR',
          eventType: 'Wedding',
          leadId: '77777777-7777-4777-8777-777777777777',
          createdAt: new Date('2025-12-15T00:00:00.000Z'),
        },
      ]),
    };
    const eventRepository = {
      findByCustomerId: jest.fn().mockResolvedValue([
        {
          id: bookingId,
          bookingNumber: 42,
          status: 'completed',
          eventType: 'Wedding',
          eventStartDate: new Date('2026-03-01T00:00:00.000Z'),
          eventEndDate: new Date('2026-03-02T00:00:00.000Z'),
          venueName: 'Hall A',
          quotationId,
          leadId: '77777777-7777-4777-8777-777777777777',
          createdAt: new Date('2026-01-10T00:00:00.000Z'),
          updatedAt: now,
          completedAt: new Date('2026-03-03T00:00:00.000Z'),
        },
        {
          id: '88888888-8888-4888-8888-888888888888',
          bookingNumber: 50,
          status: 'in_preparation',
          eventType: 'Birthday',
          eventStartDate: new Date('2026-08-01T00:00:00.000Z'),
          eventEndDate: null,
          venueName: 'Hall B',
          quotationId,
          leadId: null,
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
          updatedAt: now,
          completedAt: null,
        },
      ]),
    };
    const communicationRecordRepository = {
      findByCustomerId: jest.fn().mockResolvedValue([
        {
          id: '99999999-9999-4999-8999-999999999999',
          channel: 'whatsapp',
          direction: 'outgoing',
          status: 'sent',
          subject: 'Confirmation',
          occurredAt: new Date('2026-07-15T00:00:00.000Z'),
          bookingId,
        },
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          channel: 'email',
          direction: 'outgoing',
          status: 'failed',
          subject: 'Reminder',
          occurredAt: new Date('2026-07-18T00:00:00.000Z'),
          bookingId,
        },
      ]),
    };
    const reminderRepository = {
      findByCustomerId: jest.fn().mockResolvedValue([
        {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          title: 'Payment follow-up',
          status: 'pending',
          dueAt: new Date('2026-07-10T00:00:00.000Z'),
          category: 'payment_follow_up',
          bookingId,
        },
      ]),
    };
    const invoiceRepository = {
      findByCustomerId: jest.fn().mockResolvedValue([
        {
          id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          bookingId,
          invoiceNumber: 1,
          status: 'sent',
          totalAmount: 100000,
          currency: 'INR',
          sentAt: new Date('2026-02-01T00:00:00.000Z'),
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ]),
    };
    const paymentRepository = {
      findByBookingId: jest.fn().mockResolvedValue([
        {
          id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          bookingId,
          amount: 40000,
          currency: 'INR',
          method: 'upi',
          status: 'confirmed',
          receivedAt: new Date('2026-02-05T00:00:00.000Z'),
          leadId: null,
          quotationId,
        },
      ]),
    };
    const financialDocumentRepository = {
      findByBookingId: jest.fn().mockResolvedValue([]),
    };

    return new CustomerIntelligenceApplicationService(
      customerRepository as never,
      contactRepository as never,
      timelineEntryRepository as never,
      leadRepository as never,
      followUpRepository as never,
      quotationRepository as never,
      eventRepository as never,
      communicationRecordRepository as never,
      reminderRepository as never,
      invoiceRepository as never,
      paymentRepository as never,
      financialDocumentRepository as never,
    );
  }

  it('returns overview with contacts and active bookings', async () => {
    const service = buildService();
    const result = await service.getOverview(tenantId, customerId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.displayName).toBe('Priya Sharma');
    expect(result.value.contacts).toHaveLength(1);
    expect(result.value.totalEvents).toBe(2);
    expect(result.value.activeBookings).toBe(1);
    expect(result.value.health).toBe('follow_up_required');
  });

  it('orders timeline chronologically', async () => {
    const service = buildService();
    const result = await service.getTimeline(tenantId, customerId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const times = result.value.map((i) => i.occurredAt);
    expect(times).toEqual([...times].sort((a, b) => a.localeCompare(b)));
    expect(result.value.some((i) => i.source === 'lead')).toBe(true);
    expect(result.value.some((i) => i.source === 'booking')).toBe(true);
    expect(result.value.some((i) => i.source === 'communication')).toBe(true);
  });

  it('computes relationship repeat customer and preferred channel', async () => {
    const service = buildService();
    const result = await service.getRelationship(tenantId, customerId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.repeatCustomer).toBe(true);
    expect(result.value.lifetimeBookingCount).toBe(2);
    expect(result.value.preferredCommunicationChannel).toBe('whatsapp');
    expect(result.value.preferredEventTypes).toEqual(
      expect.arrayContaining(['Wedding', 'Birthday']),
    );
  });

  it('computes financial summary totals', async () => {
    const service = buildService();
    const result = await service.getFinancialSummary(tenantId, customerId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.totalQuoted).toBe(150000);
    expect(result.value.totalInvoiced).toBe(100000);
    // two bookings each return same mock payment → 80000
    expect(result.value.totalPaid).toBe(80000);
    expect(result.value.outstandingBalance).toBe(20000);
  });

  it('summarizes communications and overdue reminders', async () => {
    const service = buildService();
    const result = await service.getCommunications(tenantId, customerId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.total).toBe(2);
    expect(result.value.failed).toBe(1);
    expect(result.value.pendingReminders).toBe(1);
    expect(result.value.overdueReminders).toBe(1);
  });

  it('returns NOT_FOUND for unknown customer', async () => {
    const service = buildService();
    (
      service as unknown as {
        customerRepository: { findById: jest.Mock };
      }
    ).customerRepository.findById.mockResolvedValue(null);
    const result = await service.getOverview(tenantId, customerId);
    expect(result.ok).toBe(false);
  });
});
