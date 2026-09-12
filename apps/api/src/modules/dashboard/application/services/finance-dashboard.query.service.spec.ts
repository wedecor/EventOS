import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';
import type {
  InvoiceRecord,
  InvoiceRepository,
} from '../../../finance/domain/repositories/invoice.repository';
import type {
  VendorExpenseRecord,
  VendorExpenseRepository,
} from '../../../finance/domain/repositories/vendor-expense.repository';
import type {
  PaymentRecord,
  PaymentRepository,
} from '../../../payment/domain/repositories/payment.repository';
import type {
  QuotationRecord,
  QuotationRepository,
} from '../../../quotation/domain/repositories/quotation.repository';
import { FinanceDashboardQueryService } from './finance-dashboard.query.service';

describe('FinanceDashboardQueryService', () => {
  const tenantId = 'tenant-1';

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
    receivedAt: new Date('2026-06-15T00:00:00.000Z'),
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
    paidAt: new Date('2026-06-15T00:00:00.000Z'),
    attachmentId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseInvoice: InvoiceRecord = {
    id: 'invoice-1',
    tenantId,
    bookingId: 'event-1',
    customerId: 'customer-1',
    invoiceNumber: 1001,
    status: 'sent',
    subtotalAmount: 100000,
    taxAmount: 0,
    totalAmount: 100000,
    currency: 'INR',
    notes: null,
    sentAt: new Date(),
    voidedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseEvent: EventRecord = {
    id: 'event-1',
    tenantId,
    customerId: 'customer-1',
    leadId: null,
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'in_preparation',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01T00:00:00.000Z'),
    eventEndDate: null,
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

  const baseQuotation: QuotationRecord = {
    id: 'quotation-1',
    tenantId,
    customerId: 'customer-1',
    leadId: null,
    quotationNumber: 1,
    revisionNumber: 1,
    status: 'approved',
    eventType: 'wedding',
    eventStartDate: null,
    eventEndDate: null,
    venue: null,
    validUntil: null,
    terms: null,
    notes: null,
    subtotalAmount: 150000,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 150000,
    currency: 'INR',
    supersededById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let paymentRepository: jest.Mocked<PaymentRepository>;
  let vendorExpenseRepository: jest.Mocked<VendorExpenseRepository>;
  let invoiceRepository: jest.Mocked<InvoiceRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let quotationRepository: jest.Mocked<QuotationRepository>;
  let service: FinanceDashboardQueryService;

  beforeEach(() => {
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
    invoiceRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findMaxInvoiceNumber: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      hasDraftInvoiceForBooking: jest.fn(),
      update: jest.fn(),
    };
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    quotationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findLatestRevision: jest.fn(),
      findMaxQuotationNumber: jest.fn(),
      findByIds: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };

    service = new FinanceDashboardQueryService(
      paymentRepository,
      vendorExpenseRepository,
      invoiceRepository,
      eventRepository,
      quotationRepository,
    );
  });

  describe('getFinanceSummary', () => {
    it('returns zeroed summary when there is no data', async () => {
      const result = await service.getFinanceSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          totalConfirmedRevenue: { amount: 0, currency: 'INR' },
          totalConfirmedVendorExpenses: { amount: 0, currency: 'INR' },
          grossMargin: { amount: 0, currency: 'INR' },
          invoices: { total: 0, byStatus: {} },
        });
      }
    });

    it('sums only confirmed payments/expenses and groups invoices by status', async () => {
      paymentRepository.findAll.mockResolvedValue([
        basePayment,
        { ...basePayment, id: 'payment-2', status: 'void', amount: 999999 },
      ]);
      vendorExpenseRepository.findAll.mockResolvedValue([
        baseExpense,
        { ...baseExpense, id: 'expense-2', status: 'void', amount: 999999 },
      ]);
      invoiceRepository.findAll.mockResolvedValue([
        baseInvoice,
        { ...baseInvoice, id: 'invoice-2', status: 'paid' },
      ]);

      const result = await service.getFinanceSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalConfirmedRevenue).toEqual({
          amount: 100000,
          currency: 'INR',
        });
        expect(result.value.totalConfirmedVendorExpenses).toEqual({
          amount: 30000,
          currency: 'INR',
        });
        expect(result.value.grossMargin).toEqual({
          amount: 70000,
          currency: 'INR',
        });
        expect(result.value.invoices).toEqual({
          total: 2,
          byStatus: { sent: 1, paid: 1 },
        });
      }
    });
  });

  describe('getMonthlyRevenueSummary', () => {
    it('returns one point per requested month, all zeroed when there is no data', async () => {
      const result = await service.getMonthlyRevenueSummary(tenantId, 3);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.months).toHaveLength(3);
        for (const point of result.value.months) {
          expect(point.revenue.amount).toBe(0);
          expect(point.vendorExpenses.amount).toBe(0);
          expect(point.grossMargin.amount).toBe(0);
        }
      }
    });

    it('buckets confirmed payments/expenses into the current month', async () => {
      const now = new Date();
      paymentRepository.findAll.mockResolvedValue([
        { ...basePayment, receivedAt: now },
      ]);
      vendorExpenseRepository.findAll.mockResolvedValue([
        { ...baseExpense, paidAt: now },
      ]);

      const result = await service.getMonthlyRevenueSummary(tenantId, 1);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.months).toHaveLength(1);
        expect(result.value.months[0].revenue.amount).toBe(100000);
        expect(result.value.months[0].vendorExpenses.amount).toBe(30000);
        expect(result.value.months[0].grossMargin.amount).toBe(70000);
      }
    });
  });

  describe('getPendingPayments', () => {
    it('returns no items when there are no active events', async () => {
      const result = await service.getPendingPayments(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
        expect(result.value.totalDueAmount).toEqual({
          amount: 0,
          currency: 'INR',
        });
      }
    });

    it('flags events whose confirmed payments have not covered the quotation total', async () => {
      eventRepository.findByEventDate.mockResolvedValue([
        baseEvent,
        { ...baseEvent, id: 'event-2', status: 'cancelled' },
      ]);
      quotationRepository.findByIds.mockResolvedValue([baseQuotation]);
      paymentRepository.findAll.mockResolvedValue([
        basePayment,
        { ...basePayment, id: 'payment-2', status: 'void', amount: 999999 },
      ]);

      const result = await service.getPendingPayments(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.items[0]).toEqual({
          bookingId: 'event-1',
          bookingNumber: 5001,
          customerId: 'customer-1',
          eventStartDate: baseEvent.eventStartDate,
          quotationTotal: { amount: 150000, currency: 'INR' },
          confirmedPaid: { amount: 100000, currency: 'INR' },
          amountDue: { amount: 50000, currency: 'INR' },
        });
        expect(result.value.totalDueAmount).toEqual({
          amount: 50000,
          currency: 'INR',
        });
      }
    });

    it('excludes events that are already fully paid', async () => {
      eventRepository.findByEventDate.mockResolvedValue([baseEvent]);
      quotationRepository.findByIds.mockResolvedValue([baseQuotation]);
      paymentRepository.findAll.mockResolvedValue([
        { ...basePayment, amount: 150000 },
      ]);

      const result = await service.getPendingPayments(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toEqual([]);
      }
    });
  });
});
