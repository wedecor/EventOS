import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';
import type {
  InventoryMovementRecord,
  InventoryMovementRepository,
} from '../../../inventory/domain/repositories/inventory-movement.repository';
import type {
  StaffAssignmentRecord,
  StaffAssignmentRepository,
} from '../../../staff/domain/repositories/staff-assignment.repository';
import type {
  ProcurementLineRecord,
  ProcurementLineRepository,
} from '../../../vendor/domain/repositories/procurement-line.repository';
import type {
  VendorRecord,
  VendorRepository,
} from '../../../vendor/domain/repositories/vendor.repository';
import { ResourceDashboardQueryService } from './resource-dashboard.query.service';

describe('ResourceDashboardQueryService', () => {
  const tenantId = 'tenant-1';

  const baseAssignment: StaffAssignmentRecord = {
    id: 'assignment-1',
    tenantId,
    bookingId: 'event-1',
    staffMemberId: 'user-1',
    role: 'setup',
    isOnSiteLead: false,
    reportingAt: null,
    note: null,
    status: 'proposed',
    confirmedAt: null,
    releasedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseMovement: InventoryMovementRecord = {
    id: 'movement-1',
    tenantId,
    bookingId: 'event-1',
    inventoryItemId: 'item-1',
    quantity: 10,
    notes: null,
    status: 'planned',
    pickedAt: null,
    packedAt: null,
    loadedAt: null,
    atVenueAt: null,
    returnedAt: null,
    cleanedReadyAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseVendor: VendorRecord = {
    id: 'vendor-1',
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

  const baseLine: ProcurementLineRecord = {
    id: 'line-1',
    tenantId,
    vendorProcurementId: 'procurement-1',
    bookingId: 'event-1',
    quotationLineItemId: null,
    description: 'Flowers',
    category: 'decor',
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

  const baseEvent: EventRecord = {
    id: 'event-1',
    tenantId,
    customerId: 'customer-1',
    leadId: null,
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'in_preparation',
    eventType: 'wedding',
    eventStartDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
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

  let staffAssignmentRepository: jest.Mocked<StaffAssignmentRepository>;
  let inventoryMovementRepository: jest.Mocked<InventoryMovementRepository>;
  let vendorRepository: jest.Mocked<VendorRepository>;
  let procurementLineRepository: jest.Mocked<ProcurementLineRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let service: ResourceDashboardQueryService;

  beforeEach(() => {
    staffAssignmentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    inventoryMovementRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    vendorRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    procurementLineRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByVendorProcurementId: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
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

    service = new ResourceDashboardQueryService(
      staffAssignmentRepository,
      inventoryMovementRepository,
      vendorRepository,
      procurementLineRepository,
      eventRepository,
    );
  });

  describe('getStaffSummary', () => {
    it('returns zeroed summary when there are no assignments', async () => {
      const result = await service.getStaffSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          totalAssignments: 0,
          byStatus: {},
          onSiteLeadCount: 0,
          unconfirmedForUpcomingEvents: 0,
        });
      }
    });

    it('counts on-site leads and unconfirmed assignments for upcoming events only', async () => {
      staffAssignmentRepository.findAll.mockResolvedValue([
        {
          ...baseAssignment,
          id: 'a-1',
          status: 'proposed',
          bookingId: 'event-1',
        },
        {
          ...baseAssignment,
          id: 'a-2',
          status: 'confirmed',
          isOnSiteLead: true,
          bookingId: 'event-1',
        },
        {
          ...baseAssignment,
          id: 'a-3',
          status: 'proposed',
          bookingId: 'event-other',
        },
      ]);
      eventRepository.findByEventDate.mockResolvedValue([baseEvent]);

      const result = await service.getStaffSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalAssignments).toBe(3);
        expect(result.value.onSiteLeadCount).toBe(1);
        expect(result.value.unconfirmedForUpcomingEvents).toBe(1);
        expect(result.value.byStatus).toEqual({ proposed: 2, confirmed: 1 });
      }
    });
  });

  describe('getInventorySummary', () => {
    it('returns zeroed summary when there are no movements', async () => {
      const result = await service.getInventorySummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          totalMovements: 0,
          byStatus: {},
          awaitingCleanupCount: 0,
        });
      }
    });

    it('groups by status and counts returned-but-not-cleaned movements', async () => {
      inventoryMovementRepository.findAll.mockResolvedValue([
        { ...baseMovement, id: 'm-1', status: 'returned' },
        { ...baseMovement, id: 'm-2', status: 'cleaned_ready' },
        { ...baseMovement, id: 'm-3', status: 'planned' },
      ]);

      const result = await service.getInventorySummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalMovements).toBe(3);
        expect(result.value.byStatus).toEqual({
          returned: 1,
          cleaned_ready: 1,
          planned: 1,
        });
        expect(result.value.awaitingCleanupCount).toBe(1);
      }
    });
  });

  describe('getVendorSummary', () => {
    it('returns zeroed summary when there are no vendors or procurement lines', async () => {
      const result = await service.getVendorSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          totalVendors: 0,
          byStatus: {},
          byCategory: {},
          procurementLines: {
            total: 0,
            byStatus: {},
            costVarianceFlaggedCount: 0,
          },
        });
      }
    });

    it('groups vendors by status/category and counts cost-variance-flagged lines', async () => {
      vendorRepository.findMany.mockResolvedValue([
        { ...baseVendor, id: 'v-1', status: 'preferred', category: 'decor' },
        { ...baseVendor, id: 'v-2', status: 'active', category: 'catering' },
      ]);
      procurementLineRepository.findAll.mockResolvedValue([
        { ...baseLine, id: 'l-1', status: 'confirmed' },
        {
          ...baseLine,
          id: 'l-2',
          status: 'completed',
          costVarianceReason: 'market_price_increase',
        },
      ]);

      const result = await service.getVendorSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalVendors).toBe(2);
        expect(result.value.byStatus).toEqual({ preferred: 1, active: 1 });
        expect(result.value.byCategory).toEqual({ decor: 1, catering: 1 });
        expect(result.value.procurementLines).toEqual({
          total: 2,
          byStatus: { confirmed: 1, completed: 1 },
          costVarianceFlaggedCount: 1,
        });
      }
    });
  });
});
