import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  InvoiceCreatedEvent,
  InvoiceSentEvent,
  InvoiceVoidedEvent,
} from '../../../../shared/events/sprint5-domain.events';
import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';
import type {
  CustomerRecord,
  CustomerRepository,
} from '../../../customer/domain/repositories/customer.repository';
import { InvoiceApplicationService } from './invoice.application.service';
import type {
  InvoiceLineItemRecord,
  InvoiceLineItemRepository,
} from '../../domain/repositories/invoice-line-item.repository';
import type {
  InvoiceRecord,
  InvoiceRepository,
} from '../../domain/repositories/invoice.repository';

describe('InvoiceApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const customerId = 'customer-1';

  const baseBooking: EventRecord = {
    id: bookingId,
    tenantId,
    customerId,
    leadId: null,
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

  const baseCustomer: CustomerRecord = {
    id: customerId,
    tenantId,
    displayName: 'Priya Sharma',
    type: 'individual',
    status: 'active',
    primaryPhone: '9999999999',
    primaryEmail: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseInvoice: InvoiceRecord = {
    id: 'invoice-1',
    tenantId,
    bookingId,
    customerId,
    invoiceNumber: 1,
    status: 'draft',
    subtotalAmount: 50000,
    taxAmount: 0,
    totalAmount: 50000,
    currency: 'INR',
    notes: null,
    sentAt: null,
    voidedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseLineItem: InvoiceLineItemRecord = {
    id: 'line-1',
    tenantId,
    invoiceId: baseInvoice.id,
    description: 'Decor package',
    quantity: 1,
    unitPriceAmount: 50000,
    currency: 'INR',
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let invoiceRepository: jest.Mocked<InvoiceRepository>;
  let lineItemRepository: jest.Mocked<InvoiceLineItemRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let customerRepository: jest.Mocked<CustomerRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: InvoiceApplicationService;

  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    invoiceRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findMaxInvoiceNumber: jest.fn(),
      findAll: jest.fn(),
      hasDraftInvoiceForBooking: jest.fn(),
      update: jest.fn(),
    };
    lineItemRepository = {
      create: jest.fn(),
      findByInvoiceId: jest.fn(),
    };
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };
    customerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByDisplayName: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new InvoiceApplicationService(
      invoiceRepository,
      lineItemRepository,
      eventRepository,
      customerRepository,
      eventPublisher,
    );
  });

  // --- createInvoice ---

  it('rejects createInvoice when booking is not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.createInvoice(tenantId, {
      bookingId,
      customerId,
      lineItems: [{ description: 'Decor', unitPriceAmount: 50000 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects createInvoice when customer is not found', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    customerRepository.findById.mockResolvedValue(null);

    const result = await service.createInvoice(tenantId, {
      bookingId,
      customerId,
      lineItems: [{ description: 'Decor', unitPriceAmount: 50000 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects createInvoice when customer does not match the booking customer', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    customerRepository.findById.mockResolvedValue({
      ...baseCustomer,
      id: 'customer-2',
    });

    const result = await service.createInvoice(tenantId, {
      bookingId,
      customerId: 'customer-2',
      lineItems: [{ description: 'Decor', unitPriceAmount: 50000 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects createInvoice when no line items are provided', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    customerRepository.findById.mockResolvedValue(baseCustomer);

    const result = await service.createInvoice(tenantId, {
      bookingId,
      customerId,
      lineItems: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects createInvoice when a line item has a negative unit price', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    customerRepository.findById.mockResolvedValue(baseCustomer);

    const result = await service.createInvoice(tenantId, {
      bookingId,
      customerId,
      lineItems: [{ description: 'Decor', unitPriceAmount: -1 }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('creates a draft invoice with computed totals and publishes InvoiceCreatedEvent', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    customerRepository.findById.mockResolvedValue(baseCustomer);
    invoiceRepository.findMaxInvoiceNumber.mockResolvedValue(0);
    invoiceRepository.create.mockResolvedValue(baseInvoice);
    lineItemRepository.create.mockResolvedValue(baseLineItem);

    const result = await service.createInvoice(tenantId, {
      bookingId,
      customerId,
      lineItems: [
        { description: 'Decor package', quantity: 1, unitPriceAmount: 50000 },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('invoice-1');
      expect(result.value.status).toBe('draft');
      expect(result.value.lineItems).toHaveLength(1);
    }
    expect(invoiceRepository.create).toHaveBeenCalledWith(tenantId, {
      bookingId,
      customerId,
      invoiceNumber: 1,
      subtotalAmount: 50000,
      taxAmount: 0,
      totalAmount: 50000,
      notes: undefined,
    });
    expect(publish).toHaveBeenCalledWith(expect.any(InvoiceCreatedEvent));
  });

  // --- listInvoicesForBooking ---

  it('returns empty array when no invoices exist for booking', async () => {
    invoiceRepository.findByBookingId.mockResolvedValue([]);

    const result = await service.listInvoicesForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('returns invoices with embedded line items', async () => {
    invoiceRepository.findByBookingId.mockResolvedValue([baseInvoice]);
    lineItemRepository.findByInvoiceId.mockResolvedValue([baseLineItem]);

    const result = await service.listInvoicesForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].lineItems).toHaveLength(1);
    }
  });

  // --- sendInvoice ---

  it('rejects sendInvoice when invoice is not found', async () => {
    invoiceRepository.findById.mockResolvedValue(null);

    const result = await service.sendInvoice(tenantId, 'invoice-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects sendInvoice when invoice is not draft', async () => {
    invoiceRepository.findById.mockResolvedValue({
      ...baseInvoice,
      status: 'sent',
    });

    const result = await service.sendInvoice(tenantId, 'invoice-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('rejects sendInvoice when total amount is zero', async () => {
    invoiceRepository.findById.mockResolvedValue({
      ...baseInvoice,
      totalAmount: 0,
    });

    const result = await service.sendInvoice(tenantId, 'invoice-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('sends a draft invoice and publishes InvoiceSentEvent', async () => {
    invoiceRepository.findById.mockResolvedValue(baseInvoice);
    invoiceRepository.update.mockResolvedValue({
      ...baseInvoice,
      status: 'sent',
      sentAt: new Date(),
      version: 2,
    });
    lineItemRepository.findByInvoiceId.mockResolvedValue([baseLineItem]);

    const result = await service.sendInvoice(tenantId, 'invoice-1', 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('sent');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(InvoiceSentEvent));
  });

  it('returns CONCURRENT_MODIFICATION when sendInvoice version is stale', async () => {
    invoiceRepository.findById.mockResolvedValue(baseInvoice);
    invoiceRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Invoice', 'invoice-1'),
    );

    const result = await service.sendInvoice(tenantId, 'invoice-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // --- voidInvoice ---

  it('rejects voidInvoice when invoice is not found', async () => {
    invoiceRepository.findById.mockResolvedValue(null);

    const result = await service.voidInvoice(tenantId, 'invoice-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects voidInvoice when invoice is already void', async () => {
    invoiceRepository.findById.mockResolvedValue({
      ...baseInvoice,
      status: 'void',
    });

    const result = await service.voidInvoice(tenantId, 'invoice-1', 1);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('voids a draft invoice and publishes InvoiceVoidedEvent', async () => {
    invoiceRepository.findById.mockResolvedValue(baseInvoice);
    invoiceRepository.update.mockResolvedValue({
      ...baseInvoice,
      status: 'void',
      voidedAt: new Date(),
      version: 2,
    });
    lineItemRepository.findByInvoiceId.mockResolvedValue([baseLineItem]);

    const result = await service.voidInvoice(tenantId, 'invoice-1', 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('void');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(InvoiceVoidedEvent));
  });
});
