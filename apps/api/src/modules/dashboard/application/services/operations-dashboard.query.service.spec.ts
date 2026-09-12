import { success } from '../../../../shared/application/result';
import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';
import { FinanceDashboardQueryService } from './finance-dashboard.query.service';
import { OperationsDashboardQueryService } from './operations-dashboard.query.service';
import { ResourceDashboardQueryService } from './resource-dashboard.query.service';

describe('OperationsDashboardQueryService', () => {
  const tenantId = 'tenant-1';

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

  let eventRepository: jest.Mocked<EventRepository>;
  let financeDashboardQueryService: jest.Mocked<FinanceDashboardQueryService>;
  let resourceDashboardQueryService: jest.Mocked<ResourceDashboardQueryService>;
  let service: OperationsDashboardQueryService;

  beforeEach(() => {
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    financeDashboardQueryService = {
      getFinanceSummary: jest.fn(),
      getMonthlyRevenueSummary: jest.fn(),
      getPendingPayments: jest.fn().mockResolvedValue(
        success({
          totalDueAmount: { amount: 0, currency: 'INR' },
          items: [],
        }),
      ),
    } as unknown as jest.Mocked<FinanceDashboardQueryService>;
    resourceDashboardQueryService = {
      getStaffSummary: jest.fn().mockResolvedValue(
        success({
          totalAssignments: 0,
          byStatus: {},
          onSiteLeadCount: 0,
          unconfirmedForUpcomingEvents: 0,
        }),
      ),
      getInventorySummary: jest.fn(),
      getVendorSummary: jest.fn().mockResolvedValue(
        success({
          totalVendors: 0,
          byStatus: {},
          byCategory: {},
          procurementLines: {
            total: 0,
            byStatus: {},
            costVarianceFlaggedCount: 0,
          },
        }),
      ),
    } as unknown as jest.Mocked<ResourceDashboardQueryService>;

    service = new OperationsDashboardQueryService(
      eventRepository,
      financeDashboardQueryService,
      resourceDashboardQueryService,
    );
  });

  describe('getBookingSummary', () => {
    it('returns zeroed summary when there are no events', async () => {
      const result = await service.getBookingSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          totalBookings: 0,
          byStatus: {},
          upcomingCount: 0,
        });
      }
    });

    it('groups by status and counts upcoming non-cancelled events', async () => {
      eventRepository.findByEventDate.mockResolvedValue([
        baseEvent,
        { ...baseEvent, id: 'event-2', status: 'cancelled' },
        {
          ...baseEvent,
          id: 'event-3',
          eventStartDate: new Date('2020-01-01T00:00:00.000Z'),
        },
      ]);

      const result = await service.getBookingSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalBookings).toBe(3);
        expect(result.value.byStatus).toEqual({
          in_preparation: 2,
          cancelled: 1,
        });
        expect(result.value.upcomingCount).toBe(1);
      }
    });
  });

  describe('getEventExecutionSummary', () => {
    it('excludes completed/cancelled events and flags needs_attention', async () => {
      eventRepository.findByEventDate.mockResolvedValue([
        { ...baseEvent, preparationStatus: 'needs_attention' },
        { ...baseEvent, id: 'event-2', status: 'completed' },
        { ...baseEvent, id: 'event-3', status: 'cancelled' },
      ]);

      const result = await service.getEventExecutionSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.activeEventCount).toBe(1);
        expect(result.value.needsAttentionCount).toBe(1);
        expect(result.value.byPreparationStatus).toEqual({
          needs_attention: 1,
        });
        expect(result.value.byWorkspaceStatus).toEqual({ active: 1 });
      }
    });
  });

  describe('getUpcomingEvents', () => {
    it('queries the event repository with the requested window and excludes cancelled events', async () => {
      eventRepository.findByEventDate.mockResolvedValue([
        baseEvent,
        { ...baseEvent, id: 'event-2', status: 'cancelled' },
      ]);

      const result = await service.getUpcomingEvents(tenantId, 14);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(1);
        expect(result.value.items[0].bookingId).toBe('event-1');
      }
      expect(eventRepository.findByEventDate).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          from: expect.any(Date),
          to: expect.any(Date),
        }),
      );
    });
  });

  describe('getOperationalOverview', () => {
    it('composes upcoming/needs-attention counts with pending-payments and resource indicators', async () => {
      eventRepository.findByEventDate.mockResolvedValue([
        { ...baseEvent, preparationStatus: 'needs_attention' },
      ]);
      financeDashboardQueryService.getPendingPayments.mockResolvedValue(
        success({
          totalDueAmount: { amount: 50000, currency: 'INR' },
          items: [
            {
              bookingId: 'event-1',
              bookingNumber: 5001,
              customerId: 'customer-1',
              eventStartDate: null,
              quotationTotal: { amount: 150000, currency: 'INR' },
              confirmedPaid: { amount: 100000, currency: 'INR' },
              amountDue: { amount: 50000, currency: 'INR' },
            },
          ],
        }),
      );
      resourceDashboardQueryService.getVendorSummary.mockResolvedValue(
        success({
          totalVendors: 1,
          byStatus: {},
          byCategory: {},
          procurementLines: {
            total: 1,
            byStatus: {},
            costVarianceFlaggedCount: 2,
          },
        }),
      );
      resourceDashboardQueryService.getStaffSummary.mockResolvedValue(
        success({
          totalAssignments: 1,
          byStatus: {},
          onSiteLeadCount: 0,
          unconfirmedForUpcomingEvents: 3,
        }),
      );

      const result = await service.getOperationalOverview(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.upcomingEventsCount).toBe(1);
        expect(result.value.needsAttentionEventsCount).toBe(1);
        expect(result.value.pendingPaymentsCount).toBe(1);
        expect(result.value.pendingPaymentsAmount).toEqual({
          amount: 50000,
          currency: 'INR',
        });
        expect(result.value.costVarianceFlaggedCount).toBe(2);
        expect(result.value.unconfirmedStaffForUpcomingEvents).toBe(3);
      }
    });
  });
});
