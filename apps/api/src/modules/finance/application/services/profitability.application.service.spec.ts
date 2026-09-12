import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';
import type {
  PaymentRecord,
  PaymentRepository,
} from '../../../payment/domain/repositories/payment.repository';
import { ProfitabilityApplicationService } from './profitability.application.service';
import type {
  VendorExpenseRecord,
  VendorExpenseRepository,
} from '../../domain/repositories/vendor-expense.repository';

describe('ProfitabilityApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';

  const baseBooking: EventRecord = {
    id: bookingId,
    tenantId,
    customerId: 'customer-1',
    leadId: null,
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'in_execution',
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

  const confirmedPayment: PaymentRecord = {
    id: 'payment-1',
    tenantId,
    bookingId,
    leadId: null,
    quotationId: null,
    invoiceId: null,
    amount: 118000,
    currency: 'INR',
    method: 'bank_transfer',
    status: 'confirmed',
    receivedAt: new Date('2026-07-01'),
    attachmentId: null,
    missingProofReason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const voidPayment: PaymentRecord = {
    ...confirmedPayment,
    id: 'payment-2',
    amount: 20000,
    status: 'void',
  };

  const confirmedExpense: VendorExpenseRecord = {
    id: 'expense-1',
    tenantId,
    bookingId,
    vendorId: 'vendor-1',
    procurementLineId: null,
    amount: 30000,
    currency: 'INR',
    method: 'bank_transfer',
    status: 'confirmed',
    paidAt: new Date('2026-07-02'),
    attachmentId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const voidExpense: VendorExpenseRecord = {
    ...confirmedExpense,
    id: 'expense-2',
    amount: 5000,
    status: 'void',
  };

  let eventRepository: jest.Mocked<EventRepository>;
  let paymentRepository: jest.Mocked<PaymentRepository>;
  let vendorExpenseRepository: jest.Mocked<VendorExpenseRepository>;
  let service: ProfitabilityApplicationService;

  beforeEach(() => {
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };
    paymentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn(),
      hasConfirmedAdvanceForLead: jest.fn(),
      hasConfirmedAdvanceForQuotation: jest.fn(),
      update: jest.fn(),
    };
    vendorExpenseRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };

    service = new ProfitabilityApplicationService(
      eventRepository,
      paymentRepository,
      vendorExpenseRepository,
    );
  });

  it('rejects getProfitability when booking is not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.getProfitability(tenantId, bookingId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('computes revenue from confirmed payments only', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    paymentRepository.findByBookingId.mockResolvedValue([
      confirmedPayment,
      voidPayment,
    ]);
    vendorExpenseRepository.findByBookingId.mockResolvedValue([]);

    const result = await service.getProfitability(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.revenue).toEqual({ amount: 118000, currency: 'INR' });
    }
  });

  it('computes vendor expenses from confirmed expenses only', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    paymentRepository.findByBookingId.mockResolvedValue([]);
    vendorExpenseRepository.findByBookingId.mockResolvedValue([
      confirmedExpense,
      voidExpense,
    ]);

    const result = await service.getProfitability(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.vendorExpenses).toEqual({
        amount: 30000,
        currency: 'INR',
      });
    }
  });

  it('computes gross margin as revenue minus vendor expenses', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    paymentRepository.findByBookingId.mockResolvedValue([confirmedPayment]);
    vendorExpenseRepository.findByBookingId.mockResolvedValue([
      confirmedExpense,
    ]);

    const result = await service.getProfitability(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.eventId).toBe(bookingId);
      expect(result.value.grossMargin).toEqual({
        amount: 118000 - 30000,
        currency: 'INR',
      });
    }
  });

  it('returns zeroed money values when there are no payments or expenses', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    paymentRepository.findByBookingId.mockResolvedValue([]);
    vendorExpenseRepository.findByBookingId.mockResolvedValue([]);

    const result = await service.getProfitability(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.revenue.amount).toBe(0);
      expect(result.value.vendorExpenses.amount).toBe(0);
      expect(result.value.grossMargin.amount).toBe(0);
    }
  });
});
