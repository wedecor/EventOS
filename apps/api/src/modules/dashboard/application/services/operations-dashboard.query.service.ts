import { Injectable } from '@nestjs/common';
import type {
  EventStatus,
  PreparationStatus,
  WorkspaceStatus,
} from '@prisma/client';
import { success, type Result } from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import type { BookingSummaryDto } from '../dtos/booking-summary.dto';
import type { EventExecutionSummaryDto } from '../dtos/event-execution-summary.dto';
import type { OperationalOverviewDto } from '../dtos/operational-overview.dto';
import type { UpcomingEventsDto } from '../dtos/upcoming-events.dto';
import { FinanceDashboardQueryService } from './finance-dashboard.query.service';
import { ResourceDashboardQueryService } from './resource-dashboard.query.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_UPCOMING_WINDOW_DAYS = 30;
const NON_ACTIVE_EVENT_STATUSES = new Set(['completed', 'cancelled']);

// EP1-OPS-001, EP1-OPS-004, EP1-OPS-005 — Booking/execution/upcoming-events dashboards (Z1, I1).
// EP1-AUT-006, EP1-FIN-003, EP1-VEN-005 — Operational overview (I1, I3): composes the pending-
// payments and cost-variance/staff indicators already computed by the finance/resource dashboard
// services rather than re-deriving them (no business logic duplication).
@Injectable()
export class OperationsDashboardQueryService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly financeDashboardQueryService: FinanceDashboardQueryService,
    private readonly resourceDashboardQueryService: ResourceDashboardQueryService,
  ) {}

  async getBookingSummary(
    tenantId: string,
  ): Promise<Result<BookingSummaryDto>> {
    const events = await this.eventRepository.findByEventDate(tenantId, {});

    const byStatus: Partial<Record<EventStatus, number>> = {};
    for (const event of events) {
      byStatus[event.status] = (byStatus[event.status] ?? 0) + 1;
    }

    const now = new Date();
    const upcomingCount = events.filter(
      (event) =>
        event.status !== 'cancelled' &&
        event.eventStartDate !== null &&
        event.eventStartDate.getTime() >= now.getTime(),
    ).length;

    return success({
      totalBookings: events.length,
      byStatus,
      upcomingCount,
    });
  }

  async getEventExecutionSummary(
    tenantId: string,
  ): Promise<Result<EventExecutionSummaryDto>> {
    const events = await this.eventRepository.findByEventDate(tenantId, {});
    const activeEvents = events.filter(
      (event) => !NON_ACTIVE_EVENT_STATUSES.has(event.status),
    );

    const byPreparationStatus: Partial<Record<PreparationStatus, number>> = {};
    const byWorkspaceStatus: Partial<Record<WorkspaceStatus, number>> = {};
    for (const event of activeEvents) {
      byPreparationStatus[event.preparationStatus] =
        (byPreparationStatus[event.preparationStatus] ?? 0) + 1;
      byWorkspaceStatus[event.workspaceStatus] =
        (byWorkspaceStatus[event.workspaceStatus] ?? 0) + 1;
    }

    return success({
      activeEventCount: activeEvents.length,
      byPreparationStatus,
      byWorkspaceStatus,
      needsAttentionCount: activeEvents.filter(
        (event) => event.preparationStatus === 'needs_attention',
      ).length,
    });
  }

  async getUpcomingEvents(
    tenantId: string,
    windowDays: number = DEFAULT_UPCOMING_WINDOW_DAYS,
  ): Promise<Result<UpcomingEventsDto>> {
    const now = new Date();
    const events = await this.eventRepository.findByEventDate(tenantId, {
      from: now,
      to: new Date(now.getTime() + windowDays * MS_PER_DAY),
    });

    const items = events
      .filter((event) => event.status !== 'cancelled')
      .map((event) => ({
        bookingId: event.id,
        bookingNumber: event.bookingNumber,
        eventType: event.eventType,
        eventStartDate: event.eventStartDate,
        venueName: event.venueName,
        status: event.status,
        preparationStatus: event.preparationStatus,
      }));

    return success({ items });
  }

  async getOperationalOverview(
    tenantId: string,
  ): Promise<Result<OperationalOverviewDto>> {
    const [
      events,
      pendingPaymentsResult,
      staffSummaryResult,
      vendorSummaryResult,
    ] = await Promise.all([
      this.eventRepository.findByEventDate(tenantId, {}),
      this.financeDashboardQueryService.getPendingPayments(tenantId),
      this.resourceDashboardQueryService.getStaffSummary(tenantId),
      this.resourceDashboardQueryService.getVendorSummary(tenantId),
    ]);

    if (!pendingPaymentsResult.ok) {
      return pendingPaymentsResult;
    }
    if (!staffSummaryResult.ok) {
      return staffSummaryResult;
    }
    if (!vendorSummaryResult.ok) {
      return vendorSummaryResult;
    }

    const now = new Date();
    const activeEvents = events.filter(
      (event) => !NON_ACTIVE_EVENT_STATUSES.has(event.status),
    );
    const upcomingEventsCount = activeEvents.filter(
      (event) =>
        event.eventStartDate !== null &&
        event.eventStartDate.getTime() >= now.getTime(),
    ).length;
    const needsAttentionEventsCount = activeEvents.filter(
      (event) => event.preparationStatus === 'needs_attention',
    ).length;

    return success({
      upcomingEventsCount,
      needsAttentionEventsCount,
      pendingPaymentsCount: pendingPaymentsResult.value.items.length,
      pendingPaymentsAmount: pendingPaymentsResult.value.totalDueAmount,
      costVarianceFlaggedCount:
        vendorSummaryResult.value.procurementLines.costVarianceFlaggedCount,
      unconfirmedStaffForUpcomingEvents:
        staffSummaryResult.value.unconfirmedForUpcomingEvents,
    });
  }
}
