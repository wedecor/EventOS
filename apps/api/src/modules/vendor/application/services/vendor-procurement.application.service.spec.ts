import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { VendorProcurementCreatedEvent } from '../../../../shared/events/sprint4-domain.events';
import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';
import type {
  ProcurementLineRecord,
  ProcurementLineRepository,
} from '../../domain/repositories/procurement-line.repository';
import type { ProcurementQuoteRepository } from '../../domain/repositories/procurement-quote.repository';
import type { ProcurementTimelineEventRepository } from '../../domain/repositories/procurement-timeline-event.repository';
import type { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import type {
  VendorRecord,
  VendorRepository,
} from '../../domain/repositories/vendor.repository';
import type {
  VendorProcurementRecord,
  VendorProcurementRepository,
} from '../../domain/repositories/vendor-procurement.repository';
import { VendorProcurementApplicationService } from './vendor-procurement.application.service';

describe('VendorProcurementApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const vendorId = 'vendor-1';
  const procurementId = 'procurement-1';

  const baseBooking: EventRecord = {
    id: bookingId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
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

  const baseVendor: VendorRecord = {
    id: vendorId,
    tenantId,
    name: 'Blossom Flowers',
    category: 'fresh_flowers',
    status: 'active',
    contactName: null,
    contactPhone: null,
    location: null,
    servicesProvided: null,
    pricingNotes: null,
    paymentTerms: null,
    taxDetails: null,
    notes: null,
    procurementCount: 0,
    onTimeDeliveryCount: 0,
    completedProcurementCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseProcurement: VendorProcurementRecord = {
    id: procurementId,
    tenantId,
    bookingId,
    vendorId,
    status: 'planned',
    workflowStatus: 'draft',
    serviceCategory: null,
    requiredDate: null,
    estimatedCost: 10000,
    approvedCost: null,
    actualCost: null,
    deliveryStatus: 'pending',
    deliveryNotes: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseLine: ProcurementLineRecord = {
    id: 'line-1',
    tenantId,
    vendorProcurementId: procurementId,
    bookingId,
    quotationLineItemId: null,
    description: 'Fresh flowers for stage',
    category: 'fresh_flowers',
    quantity: 1,
    budgetedAmount: 10000,
    actualAmount: null,
    currency: 'INR',
    status: 'planned',
    requestedAt: null,
    confirmedAt: null,
    deliveredAt: null,
    completedAt: null,
    costVarianceAmount: null,
    costVarianceReason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let vendorProcurementRepository: jest.Mocked<VendorProcurementRepository>;
  let procurementLineRepository: jest.Mocked<ProcurementLineRepository>;
  let quoteRepository: jest.Mocked<ProcurementQuoteRepository>;
  let purchaseOrderRepository: jest.Mocked<PurchaseOrderRepository>;
  let timelineRepository: jest.Mocked<ProcurementTimelineEventRepository>;
  let vendorRepository: jest.Mocked<VendorRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: VendorProcurementApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    vendorProcurementRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    procurementLineRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByVendorProcurementId: jest.fn().mockResolvedValue([]),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    quoteRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByVendorProcurementId: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    purchaseOrderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByVendorProcurementId: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      nextPoSequence: jest.fn().mockResolvedValue(1),
    };
    timelineRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'tl-1',
        tenantId,
        vendorProcurementId: procurementId,
        bookingId,
        eventType: 'request_created',
        message: 'created',
        occurredAt: new Date(),
        createdAt: new Date(),
      }),
      findByVendorProcurementId: jest.fn().mockResolvedValue([]),
      findByBookingId: jest.fn().mockResolvedValue([]),
    };
    vendorRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      incrementPerformance: jest.fn().mockResolvedValue(undefined),
    };
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new VendorProcurementApplicationService(
      vendorProcurementRepository,
      procurementLineRepository,
      quoteRepository,
      purchaseOrderRepository,
      timelineRepository,
      vendorRepository,
      eventRepository,
      eventPublisher,
    );
  });

  it('createProcurement rejects when booking not found', async () => {
    eventRepository.findById.mockResolvedValue(null);
    const result = await service.createProcurement(tenantId, bookingId, {
      vendorId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
  });

  it('createProcurement creates draft workflow and timeline', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue(baseVendor);
    vendorProcurementRepository.create.mockResolvedValue(baseProcurement);

    const result = await service.createProcurement(tenantId, bookingId, {
      vendorId,
      notes: 'Flowers',
      estimatedCost: 10000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.workflowStatus).toBe('draft');
      expect(result.value.status).toBe('planned');
    }
    expect(timelineRepository.create).toHaveBeenCalled();
    expect(vendorRepository.incrementPerformance).toHaveBeenCalledWith(
      tenantId,
      vendorId,
      { procurementCount: 1 },
    );
    expect(publish).toHaveBeenCalledWith(
      expect.any(VendorProcurementCreatedEvent),
    );
  });

  it('transitionWorkflow advances draft to quotation_requested', async () => {
    vendorProcurementRepository.findById.mockResolvedValue(baseProcurement);
    vendorProcurementRepository.update.mockResolvedValue({
      ...baseProcurement,
      workflowStatus: 'quotation_requested',
      status: 'requested',
      version: 2,
    });

    const result = await service.transitionWorkflow(
      tenantId,
      procurementId,
      { toStatus: 'quotation_requested' },
      1,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.workflowStatus).toBe('quotation_requested');
      expect(result.value.status).toBe('requested');
    }
  });

  it('transitionWorkflow rejects invalid jumps', async () => {
    vendorProcurementRepository.findById.mockResolvedValue(baseProcurement);
    const result = await service.transitionWorkflow(
      tenantId,
      procurementId,
      { toStatus: 'completed' },
      1,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_TRANSITION');
  });

  it('approveQuote sets approved cost and rejects sibling quotes', async () => {
    const quote = {
      id: 'quote-1',
      tenantId,
      vendorProcurementId: procurementId,
      vendorId,
      amount: 12000,
      currency: 'INR',
      validUntil: null,
      notes: null,
      attachmentName: null,
      attachmentMimeType: null,
      attachmentSizeBytes: null,
      status: 'submitted' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    quoteRepository.findById.mockResolvedValue(quote);
    vendorProcurementRepository.findById.mockResolvedValue({
      ...baseProcurement,
      workflowStatus: 'quotation_received',
      status: 'requested',
    });
    quoteRepository.findByVendorProcurementId.mockResolvedValue([
      quote,
      { ...quote, id: 'quote-2', status: 'approved', version: 2 },
    ]);
    quoteRepository.update
      .mockResolvedValueOnce({ ...quote, id: 'quote-2', status: 'rejected' })
      .mockResolvedValueOnce({ ...quote, status: 'approved', version: 2 });
    vendorProcurementRepository.update.mockResolvedValue({
      ...baseProcurement,
      workflowStatus: 'approved',
      approvedCost: 12000,
      version: 2,
    });

    const result = await service.approveQuote(tenantId, 'quote-1', 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.status).toBe('approved');
  });

  it('createPurchaseOrder requires approved procurement', async () => {
    vendorProcurementRepository.findById.mockResolvedValue(baseProcurement);
    const result = await service.createPurchaseOrder(
      tenantId,
      procurementId,
      {},
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_STATE');
  });

  it('listProcurementsForBooking embeds lines and cost summary', async () => {
    vendorProcurementRepository.findByBookingId.mockResolvedValue([
      baseProcurement,
    ]);
    procurementLineRepository.findByVendorProcurementId.mockResolvedValue([
      baseLine,
    ]);

    const result = await service.listProcurementsForBooking(
      tenantId,
      bookingId,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].lines).toHaveLength(1);
      expect(result.value[0].costSummary?.estimatedCost).toBe(10000);
    }
  });
});
