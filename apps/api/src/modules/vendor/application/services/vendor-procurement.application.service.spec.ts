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
    };
    procurementLineRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByVendorProcurementId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    vendorRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
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
    eventPublisher = { publish };

    service = new VendorProcurementApplicationService(
      vendorProcurementRepository,
      procurementLineRepository,
      vendorRepository,
      eventRepository,
      eventPublisher,
    );
  });

  // ── createProcurement ────────────────────────────────────────────────

  it('createProcurement rejects when booking not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.createProcurement(tenantId, bookingId, {
      vendorId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('createProcurement rejects when booking is cancelled', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseBooking,
      status: 'cancelled',
    });

    const result = await service.createProcurement(tenantId, bookingId, {
      vendorId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('createProcurement rejects when vendor not found', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue(null);

    const result = await service.createProcurement(tenantId, bookingId, {
      vendorId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('createProcurement rejects when vendor is blocked', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue({
      ...baseVendor,
      status: 'blocked',
    });

    const result = await service.createProcurement(tenantId, bookingId, {
      vendorId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
    expect(vendorProcurementRepository.create).not.toHaveBeenCalled();
  });

  it('createProcurement creates a header and publishes VendorProcurementCreated', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    vendorRepository.findById.mockResolvedValue(baseVendor);
    vendorProcurementRepository.create.mockResolvedValue(baseProcurement);

    const result = await service.createProcurement(tenantId, bookingId, {
      vendorId,
      notes: 'Flowers + balloons',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(procurementId);
      expect(result.value.status).toBe('planned');
      expect(result.value.lines).toEqual([]);
    }
    expect(publish).toHaveBeenCalledWith(
      expect.any(VendorProcurementCreatedEvent),
    );
  });

  // ── listProcurementsForBooking ───────────────────────────────────────

  it('listProcurementsForBooking returns empty array when none exist', async () => {
    vendorProcurementRepository.findByBookingId.mockResolvedValue([]);

    const result = await service.listProcurementsForBooking(
      tenantId,
      bookingId,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('listProcurementsForBooking embeds lines for each procurement header', async () => {
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
      expect(result.value).toHaveLength(1);
      expect(result.value[0].lines).toHaveLength(1);
      expect(result.value[0].lines[0].id).toBe('line-1');
    }
  });
});
