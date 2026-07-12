import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  ExpenseRecordedEvent,
  ExpenseVoidedEvent,
} from '../../../../shared/events/sprint5-domain.events';
import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';
import type {
  ProcurementLineRecord,
  ProcurementLineRepository,
} from '../../../vendor/domain/repositories/procurement-line.repository';
import type {
  VendorRecord,
  VendorRepository,
} from '../../../vendor/domain/repositories/vendor.repository';
import { VendorExpenseApplicationService } from './vendor-expense.application.service';
import type {
  VendorExpenseRecord,
  VendorExpenseRepository,
} from '../../domain/repositories/vendor-expense.repository';

describe('VendorExpenseApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const vendorId = 'vendor-1';
  const procurementLineId = 'line-1';

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

  const baseVendor: VendorRecord = {
    id: vendorId,
    tenantId,
    name: 'Decor Co',
    category: 'decor',
    status: 'active',
    contactName: null,
    contactPhone: null,
    location: null,
    servicesProvided: null,
    pricingNotes: null,
    paymentTerms: null,
    taxDetails: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseProcurementLine: ProcurementLineRecord = {
    id: procurementLineId,
    tenantId,
    vendorProcurementId: 'procurement-1',
    bookingId,
    quotationLineItemId: null,
    description: 'Flowers',
    category: 'decor',
    quantity: 1,
    budgetedAmount: 10000,
    actualAmount: null,
    currency: 'INR',
    status: 'confirmed',
    requestedAt: new Date(),
    confirmedAt: new Date(),
    deliveredAt: null,
    completedAt: null,
    costVarianceAmount: null,
    costVarianceReason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseExpense: VendorExpenseRecord = {
    id: 'expense-1',
    tenantId,
    bookingId,
    vendorId,
    procurementLineId,
    amount: 10000,
    currency: 'INR',
    method: 'bank_transfer',
    status: 'confirmed',
    paidAt: new Date('2026-07-01'),
    attachmentId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let vendorExpenseRepository: jest.Mocked<VendorExpenseRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let vendorRepository: jest.Mocked<VendorRepository>;
  let procurementLineRepository: jest.Mocked<ProcurementLineRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: VendorExpenseApplicationService;

  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    vendorExpenseRepository = {
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
    vendorRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    };
    procurementLineRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByVendorProcurementId: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new VendorExpenseApplicationService(
      vendorExpenseRepository,
      eventRepository,
      vendorRepository,
      procurementLineRepository,
      eventPublisher,
    );
  });

  // --- recordExpense ---

  it('rejects recordExpense when booking is not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.recordExpense(tenantId, bookingId, {
      vendorId,
      amount: 10000,
      method: 'bank_transfer',
      paidAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects recordExpense when amount is zero or negative', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);

    const result = await service.recordExpense(tenantId, bookingId, {
      vendorId,
      amount: 0,
      method: 'bank_transfer',
      paidAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects recordExpense when vendor is not found', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue(null);

    const result = await service.recordExpense(tenantId, bookingId, {
      vendorId,
      amount: 10000,
      method: 'bank_transfer',
      paidAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects recordExpense when procurement line is not found', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue(baseVendor);
    procurementLineRepository.findById.mockResolvedValue(null);

    const result = await service.recordExpense(tenantId, bookingId, {
      vendorId,
      procurementLineId,
      amount: 10000,
      method: 'bank_transfer',
      paidAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects recordExpense when procurement line belongs to a different booking', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue(baseVendor);
    procurementLineRepository.findById.mockResolvedValue({
      ...baseProcurementLine,
      bookingId: 'other-booking',
    });

    const result = await service.recordExpense(tenantId, bookingId, {
      vendorId,
      procurementLineId,
      amount: 10000,
      method: 'bank_transfer',
      paidAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('records a vendor expense and publishes ExpenseRecordedEvent', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue(baseVendor);
    procurementLineRepository.findById.mockResolvedValue(baseProcurementLine);
    vendorExpenseRepository.create.mockResolvedValue(baseExpense);

    const result = await service.recordExpense(tenantId, bookingId, {
      vendorId,
      procurementLineId,
      amount: 10000,
      method: 'bank_transfer',
      paidAt: new Date('2026-07-01'),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('expense-1');
      expect(result.value.status).toBe('confirmed');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(ExpenseRecordedEvent));
  });

  it('records a vendor expense without a procurement line', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue(baseVendor);
    vendorExpenseRepository.create.mockResolvedValue({
      ...baseExpense,
      procurementLineId: null,
    });

    const result = await service.recordExpense(tenantId, bookingId, {
      vendorId,
      amount: 10000,
      method: 'bank_transfer',
      paidAt: new Date('2026-07-01'),
    });

    expect(result.ok).toBe(true);
    expect(procurementLineRepository.findById).not.toHaveBeenCalled();
  });

  // --- listExpensesForBooking ---

  it('returns expenses for a booking', async () => {
    vendorExpenseRepository.findByBookingId.mockResolvedValue([baseExpense]);

    const result = await service.listExpensesForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  // --- voidExpense ---

  it('rejects voidExpense when expense is not found', async () => {
    vendorExpenseRepository.findById.mockResolvedValue(null);

    const result = await service.voidExpense(tenantId, 'expense-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects voidExpense when expense is already void', async () => {
    vendorExpenseRepository.findById.mockResolvedValue({
      ...baseExpense,
      status: 'void',
    });

    const result = await service.voidExpense(tenantId, 'expense-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('voids a confirmed expense and publishes ExpenseVoidedEvent', async () => {
    vendorExpenseRepository.findById.mockResolvedValue(baseExpense);
    vendorExpenseRepository.update.mockResolvedValue({
      ...baseExpense,
      status: 'void',
      version: 2,
    });

    const result = await service.voidExpense(tenantId, 'expense-1', 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('void');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(ExpenseVoidedEvent));
  });

  it('returns CONCURRENT_MODIFICATION when voidExpense version is stale', async () => {
    vendorExpenseRepository.findById.mockResolvedValue(baseExpense);
    vendorExpenseRepository.update.mockRejectedValue(
      new ConcurrentModificationError('VendorExpense', 'expense-1'),
    );

    const result = await service.voidExpense(tenantId, 'expense-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
