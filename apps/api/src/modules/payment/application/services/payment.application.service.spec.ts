import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { PaymentRecordedEvent } from '../../../../shared/events/sprint1-domain.events';
import { PaymentVoidedEvent } from '../../../../shared/events/sprint5-domain.events';
import type {
  InvoiceRecord,
  InvoiceRepository,
} from '../../../finance/domain/repositories/invoice.repository';
import { PaymentApplicationService } from './payment.application.service';
import type {
  PaymentRecord,
  PaymentRepository,
} from '../../domain/repositories/payment.repository';

describe('PaymentApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';

  const basePayment: PaymentRecord = {
    id: 'payment-1',
    tenantId,
    bookingId,
    leadId: null,
    quotationId: null,
    invoiceId: null,
    amount: 5000,
    currency: 'INR',
    method: 'upi',
    status: 'confirmed',
    receivedAt: new Date('2026-07-10T10:00:00Z'),
    attachmentId: null,
    missingProofReason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseInvoice: InvoiceRecord = {
    id: 'invoice-1',
    tenantId,
    bookingId,
    customerId: 'customer-1',
    invoiceNumber: 1,
    status: 'sent',
    subtotalAmount: 10000,
    taxAmount: 0,
    totalAmount: 10000,
    currency: 'INR',
    notes: null,
    sentAt: new Date(),
    voidedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let paymentRepository: jest.Mocked<PaymentRepository>;
  let invoiceRepository: jest.Mocked<InvoiceRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: PaymentApplicationService;

  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    paymentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn(),
      hasConfirmedAdvanceForLead: jest.fn(),
      hasConfirmedAdvanceForQuotation: jest.fn(),
      update: jest.fn(),
    };
    invoiceRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findMaxInvoiceNumber: jest.fn(),
      findAll: jest.fn(),
      hasDraftInvoiceForBooking: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new PaymentApplicationService(
      paymentRepository,
      invoiceRepository,
      eventPublisher,
    );
  });

  it('rejects recordPayment when amount is zero', async () => {
    const result = await service.recordPayment(tenantId, {
      amount: 0,
      method: 'upi',
      receivedAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects recordPayment when amount is negative', async () => {
    const result = await service.recordPayment(tenantId, {
      amount: -100,
      method: 'cash',
      receivedAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('creates a payment and publishes PaymentRecordedEvent', async () => {
    paymentRepository.create.mockResolvedValue(basePayment);

    const result = await service.recordPayment(tenantId, {
      bookingId,
      amount: 5000,
      method: 'upi',
      receivedAt: new Date('2026-07-10T10:00:00Z'),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('payment-1');
      expect(result.value.amount).toBe(5000);
    }
    expect(publish).toHaveBeenCalledWith(expect.any(PaymentRecordedEvent));
  });

  it('passes all fields to repository on create', async () => {
    paymentRepository.create.mockResolvedValue(basePayment);

    const receivedAt = new Date('2026-07-10T10:00:00Z');

    await service.recordPayment(tenantId, {
      bookingId: 'booking-1',
      leadId: 'lead-1',
      quotationId: 'quote-1',
      amount: 5000,
      currency: 'INR',
      method: 'upi',
      receivedAt,
      attachmentId: 'att-1',
      missingProofReason: 'client forgot',
      notes: 'advance payment',
    });

    expect(paymentRepository.create).toHaveBeenCalledWith(tenantId, {
      bookingId: 'booking-1',
      leadId: 'lead-1',
      quotationId: 'quote-1',
      invoiceId: undefined,
      amount: 5000,
      currency: 'INR',
      method: 'upi',
      receivedAt,
      attachmentId: 'att-1',
      missingProofReason: 'client forgot',
      notes: 'advance payment',
    });
  });

  it('returns empty array when no payments exist for booking', async () => {
    paymentRepository.findByBookingId.mockResolvedValue([]);

    const result = await service.listPaymentsForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('returns mapped DTOs for listPaymentsForBooking', async () => {
    const secondPayment: PaymentRecord = {
      ...basePayment,
      id: 'payment-2',
      amount: 3000,
      method: 'cash',
    };
    paymentRepository.findByBookingId.mockResolvedValue([
      basePayment,
      secondPayment,
    ]);

    const result = await service.listPaymentsForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe('payment-1');
      expect(result.value[0].amount).toBe(5000);
      expect(result.value[1].id).toBe('payment-2');
      expect(result.value[1].amount).toBe(3000);
    }
  });

  it('rejects recordPayment when the referenced invoice does not exist', async () => {
    invoiceRepository.findById.mockResolvedValue(null);

    const result = await service.recordPayment(tenantId, {
      invoiceId: 'invoice-missing',
      amount: 5000,
      method: 'upi',
      receivedAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(paymentRepository.create).not.toHaveBeenCalled();
  });

  it('rejects recordPayment when the referenced invoice is void', async () => {
    invoiceRepository.findById.mockResolvedValue({
      ...baseInvoice,
      status: 'void',
    });

    const result = await service.recordPayment(tenantId, {
      invoiceId: baseInvoice.id,
      amount: 5000,
      method: 'upi',
      receivedAt: new Date(),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
    expect(paymentRepository.create).not.toHaveBeenCalled();
  });

  it('records a payment linked to a sendable invoice', async () => {
    invoiceRepository.findById.mockResolvedValue(baseInvoice);
    paymentRepository.create.mockResolvedValue({
      ...basePayment,
      invoiceId: baseInvoice.id,
    });

    const result = await service.recordPayment(tenantId, {
      invoiceId: baseInvoice.id,
      amount: 5000,
      method: 'upi',
      receivedAt: new Date(),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.invoiceId).toBe(baseInvoice.id);
    }
  });

  it('voids a payment and publishes PaymentVoidedEvent', async () => {
    paymentRepository.findById.mockResolvedValue(basePayment);
    paymentRepository.update.mockResolvedValue({
      ...basePayment,
      status: 'void',
      version: 2,
    });

    const result = await service.voidPayment(tenantId, 'payment-1', 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('void');
    }
    expect(paymentRepository.update).toHaveBeenCalledWith(
      tenantId,
      'payment-1',
      { status: 'void' },
      1,
    );
    expect(publish).toHaveBeenCalledWith(expect.any(PaymentVoidedEvent));
  });

  it('rejects voidPayment when payment not found', async () => {
    paymentRepository.findById.mockResolvedValue(null);

    const result = await service.voidPayment(tenantId, 'missing', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects voidPayment when payment is already void', async () => {
    paymentRepository.findById.mockResolvedValue({
      ...basePayment,
      status: 'void',
    });

    const result = await service.voidPayment(tenantId, 'payment-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('returns CONCURRENT_MODIFICATION when voidPayment version is stale', async () => {
    paymentRepository.findById.mockResolvedValue(basePayment);
    paymentRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Payment', 'payment-1'),
    );

    const result = await service.voidPayment(tenantId, 'payment-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
