import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';
import type {
  VendorExpenseRecord,
  VendorExpenseRepository,
} from '../../../finance/domain/repositories/vendor-expense.repository';
import type {
  LeadRecord,
  LeadRepository,
} from '../../../lead/domain/repositories/lead.repository';
import type {
  PaymentRecord,
  PaymentRepository,
} from '../../../payment/domain/repositories/payment.repository';
import { FounderKpiQueryService } from './founder-kpi.query.service';

describe('FounderKpiQueryService', () => {
  const tenantId = 'tenant-1';
  const from = new Date('2026-07-01T00:00:00.000Z');
  const to = new Date('2026-07-07T23:59:59.000Z');

  const baseLead: LeadRecord = {
    id: 'lead-1',
    tenantId,
    customerId: null,
    assignedToId: null,
    source: 'website',
    sourceDetail: null,
    stage: 'new',
    lostReason: null,
    eventType: 'wedding',
    eventStartDate: null,
    eventEndDate: null,
    venue: null,
    estimatedBudgetAmount: null,
    estimatedBudgetCurrency: 'INR',
    guestCount: null,
    notes: null,
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    version: 1,
  };

  const baseEvent: EventRecord = {
    id: 'event-1',
    tenantId,
    customerId: 'customer-1',
    leadId: null,
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'completed',
    eventType: 'wedding',
    eventStartDate: new Date('2026-07-03T00:00:00.000Z'),
    eventEndDate: new Date('2026-07-03T00:00:00.000Z'),
    venueName: 'Bangalore',
    guestCount: 200,
    requirementsNotes: null,
    workspaceStatus: 'archived',
    preparationStatus: 'ready',
    operationalMilestone: null,
    executionOwnerId: null,
    cancellationReason: null,
    completedAt: new Date('2026-07-05T00:00:00.000Z'),
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-05T00:00:00.000Z'),
    version: 1,
  };

  const basePayment: PaymentRecord = {
    id: 'payment-1',
    tenantId,
    bookingId: 'event-1',
    leadId: null,
    quotationId: null,
    invoiceId: null,
    amount: 100000,
    currency: 'INR',
    method: 'bank_transfer',
    status: 'confirmed',
    receivedAt: new Date('2026-07-04T00:00:00.000Z'),
    attachmentId: null,
    missingProofReason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseExpense: VendorExpenseRecord = {
    id: 'expense-1',
    tenantId,
    bookingId: 'event-1',
    vendorId: 'vendor-1',
    procurementLineId: null,
    amount: 30000,
    currency: 'INR',
    method: 'bank_transfer',
    status: 'confirmed',
    paidAt: new Date('2026-07-04T00:00:00.000Z'),
    attachmentId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let leadRepository: jest.Mocked<LeadRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let paymentRepository: jest.Mocked<PaymentRepository>;
  let vendorExpenseRepository: jest.Mocked<VendorExpenseRepository>;
  let service: FounderKpiQueryService;

  beforeEach(() => {
    leadRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByStage: jest.fn(),
      update: jest.fn(),
      changeStage: jest.fn(),
    };
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    paymentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      hasConfirmedAdvanceForLead: jest.fn(),
      hasConfirmedAdvanceForQuotation: jest.fn(),
      update: jest.fn(),
    };
    vendorExpenseRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };

    service = new FounderKpiQueryService(
      leadRepository,
      eventRepository,
      paymentRepository,
      vendorExpenseRepository,
    );
  });

  it('returns zeroed KPIs when there is no data', async () => {
    const result = await service.getFounderKpis(tenantId, { from, to });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kpis.enquiries).toBe(0);
      expect(result.value.kpis.conversionRate).toBe(0);
      expect(result.value.kpis.eventsCompleted).toBe(0);
      expect(result.value.kpis.grossMargin).toEqual({
        amount: 0,
        currency: 'INR',
      });
      expect(result.value.kpis.leadSourcePerformance).toEqual({});
      expect(result.value.weekOf).toBe('2026-07-01');
    }
  });

  it('counts enquiries and conversion rate for leads within the period only', async () => {
    leadRepository.findAll.mockResolvedValue([
      { ...baseLead, id: 'lead-1', stage: 'approved' },
      { ...baseLead, id: 'lead-2', stage: 'new' },
      {
        ...baseLead,
        id: 'lead-3',
        createdAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ]);

    const result = await service.getFounderKpis(tenantId, { from, to });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kpis.enquiries).toBe(2);
      expect(result.value.kpis.conversionRate).toBe(0.5);
    }
  });

  it('counts events completed within the period based on completedAt', async () => {
    eventRepository.findByEventDate.mockResolvedValue([
      baseEvent,
      { ...baseEvent, id: 'event-2', completedAt: null },
      {
        ...baseEvent,
        id: 'event-3',
        completedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
      { ...baseEvent, id: 'event-4', status: 'in_execution' },
    ]);

    const result = await service.getFounderKpis(tenantId, { from, to });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kpis.eventsCompleted).toBe(1);
    }
  });

  it('computes gross margin from confirmed payments/expenses for completed events only', async () => {
    eventRepository.findByEventDate.mockResolvedValue([baseEvent]);
    paymentRepository.findAll.mockResolvedValue([
      basePayment,
      { ...basePayment, id: 'payment-2', status: 'void', amount: 999999 },
      { ...basePayment, id: 'payment-3', bookingId: 'other-event' },
    ]);
    vendorExpenseRepository.findAll.mockResolvedValue([
      baseExpense,
      { ...baseExpense, id: 'expense-2', status: 'void', amount: 999999 },
      { ...baseExpense, id: 'expense-3', bookingId: 'other-event' },
    ]);

    const result = await service.getFounderKpis(tenantId, { from, to });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kpis.grossMargin).toEqual({
        amount: 100000 - 30000,
        currency: 'INR',
      });
    }
  });

  it('groups lead source performance by source with per-source conversion rate', async () => {
    leadRepository.findAll.mockResolvedValue([
      { ...baseLead, id: 'lead-1', source: 'website', stage: 'approved' },
      { ...baseLead, id: 'lead-2', source: 'website', stage: 'new' },
      { ...baseLead, id: 'lead-3', source: 'instagram', stage: 'completed' },
    ]);

    const result = await service.getFounderKpis(tenantId, { from, to });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kpis.leadSourcePerformance).toEqual({
        website: { totalLeads: 2, convertedLeads: 1, conversionRate: 0.5 },
        instagram: { totalLeads: 1, convertedLeads: 1, conversionRate: 1 },
      });
    }
  });

  it('defaults to the trailing 7-day period when no params are provided', async () => {
    const result = await service.getFounderKpis(tenantId);

    expect(result.ok).toBe(true);
    expect(leadRepository.findAll).toHaveBeenCalledWith(tenantId);
    expect(eventRepository.findByEventDate).toHaveBeenCalledWith(tenantId, {});
  });
});
