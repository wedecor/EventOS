import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { FinanceDashboardQueryService } from '../application/services/finance-dashboard.query.service';
import { FounderKpiQueryService } from '../application/services/founder-kpi.query.service';
import { OperationsDashboardQueryService } from '../application/services/operations-dashboard.query.service';
import { ResourceDashboardQueryService } from '../application/services/resource-dashboard.query.service';
import { SalesDashboardQueryService } from '../application/services/sales-dashboard.query.service';
import {
  founderDashboardQuerySchema,
  monthlyRevenueQuerySchema,
  salesSummaryQuerySchema,
  upcomingEventsQuerySchema,
  type FounderDashboardQuery,
  type MonthlyRevenueQuery,
  type SalesSummaryQuery,
  type UpcomingEventsQuery,
} from './schemas/dashboard.schemas';

// Base path matches `docs/09-api-design.md` §Module: Dashboard (`/api/v1/dashboards/founder`).
// Sibling read-only endpoints extend the documented single-endpoint dashboard with the additional
// Phase 1 summaries explicitly authorized for Sprint 6 (Sales, Lead pipeline, Booking, Event
// execution, Staff, Inventory, Vendor, Finance, Monthly revenue, Pending payments, Upcoming
// events, Operational overview) — see implementation report for the doc-extension decision.
@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboards')
export class DashboardController {
  constructor(
    private readonly founderKpiService: FounderKpiQueryService,
    private readonly salesDashboardService: SalesDashboardQueryService,
    private readonly operationsDashboardService: OperationsDashboardQueryService,
    private readonly resourceDashboardService: ResourceDashboardQueryService,
    private readonly financeDashboardService: FinanceDashboardQueryService,
  ) {}

  // EP1-KPI-001–EP1-KPI-005, EP1-MKT-001, EP1-MKT-002 — Founder KPI dashboard
  @Get('founder')
  @ApiOperation({ summary: 'Get the founder KPI dashboard' })
  async getFounderDashboard(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(founderDashboardQuerySchema))
    query: FounderDashboardQuery,
  ) {
    const result = await this.founderKpiService.getFounderKpis(tenantId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });
    return resultToResponse(result);
  }

  // EP1-SAL-001, EP1-SAL-002, EP1-KPI-002 — Sales summary
  @Get('sales-summary')
  @ApiOperation({ summary: 'Get the sales summary' })
  async getSalesSummary(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(salesSummaryQuerySchema))
    query: SalesSummaryQuery,
  ) {
    const result = await this.salesDashboardService.getSalesSummary(
      tenantId,
      query.days,
    );
    return resultToResponse(result);
  }

  // EP1-SAL-003 — Lead pipeline summary
  @Get('lead-pipeline')
  @ApiOperation({ summary: 'Get the lead pipeline summary' })
  async getLeadPipelineSummary(@TenantId() tenantId: string) {
    const result =
      await this.salesDashboardService.getLeadPipelineSummary(tenantId);
    return resultToResponse(result);
  }

  // EP1-OPS-001, EP1-OPS-005 — Booking summary
  @Get('booking-summary')
  @ApiOperation({ summary: 'Get the booking summary' })
  async getBookingSummary(@TenantId() tenantId: string) {
    const result =
      await this.operationsDashboardService.getBookingSummary(tenantId);
    return resultToResponse(result);
  }

  // EP1-OPS-004 — Event execution summary
  @Get('event-execution-summary')
  @ApiOperation({ summary: 'Get the event execution summary' })
  async getEventExecutionSummary(@TenantId() tenantId: string) {
    const result =
      await this.operationsDashboardService.getEventExecutionSummary(tenantId);
    return resultToResponse(result);
  }

  // EP1-OPS-005, EP1-AUT-006 — Upcoming events
  @Get('upcoming-events')
  @ApiOperation({ summary: 'Get upcoming events' })
  async getUpcomingEvents(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(upcomingEventsQuerySchema))
    query: UpcomingEventsQuery,
  ) {
    const result = await this.operationsDashboardService.getUpcomingEvents(
      tenantId,
      query.days,
    );
    return resultToResponse(result);
  }

  // EP1-STF-002 — Staff summary
  @Get('staff-summary')
  @ApiOperation({ summary: 'Get the staff summary' })
  async getStaffSummary(@TenantId() tenantId: string) {
    const result =
      await this.resourceDashboardService.getStaffSummary(tenantId);
    return resultToResponse(result);
  }

  // EP1-INV-003, EP1-INV-005 — Inventory summary
  @Get('inventory-summary')
  @ApiOperation({ summary: 'Get the inventory summary' })
  async getInventorySummary(@TenantId() tenantId: string) {
    const result =
      await this.resourceDashboardService.getInventorySummary(tenantId);
    return resultToResponse(result);
  }

  // EP1-VEN-001, EP1-VEN-003, EP1-VEN-005 — Vendor summary
  @Get('vendor-summary')
  @ApiOperation({ summary: 'Get the vendor summary' })
  async getVendorSummary(@TenantId() tenantId: string) {
    const result =
      await this.resourceDashboardService.getVendorSummary(tenantId);
    return resultToResponse(result);
  }

  // EP1-FIN-002, EP1-FIN-003, EP1-FIN-004, EP1-FIN-005 — Finance summary
  @Get('finance-summary')
  @ApiOperation({ summary: 'Get the finance summary' })
  async getFinanceSummary(@TenantId() tenantId: string) {
    const result =
      await this.financeDashboardService.getFinanceSummary(tenantId);
    return resultToResponse(result);
  }

  // EP1-FIN-005, EP1-KPI-004 — Monthly revenue summary
  @Get('monthly-revenue')
  @ApiOperation({ summary: 'Get the monthly revenue summary' })
  async getMonthlyRevenueSummary(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(monthlyRevenueQuerySchema))
    query: MonthlyRevenueQuery,
  ) {
    const result = await this.financeDashboardService.getMonthlyRevenueSummary(
      tenantId,
      query.months,
    );
    return resultToResponse(result);
  }

  // EP1-FIN-003 — Pending payments (I3)
  @Get('pending-payments')
  @ApiOperation({ summary: 'Get pending payments' })
  async getPendingPayments(@TenantId() tenantId: string) {
    const result =
      await this.financeDashboardService.getPendingPayments(tenantId);
    return resultToResponse(result);
  }

  // EP1-AUT-006, EP1-OPS-001, EP1-OPS-004, EP1-FIN-003, EP1-VEN-005 — Operational overview (I1, I3)
  @Get('operational-overview')
  @ApiOperation({ summary: 'Get the operational overview' })
  async getOperationalOverview(@TenantId() tenantId: string) {
    const result =
      await this.operationsDashboardService.getOperationalOverview(tenantId);
    return resultToResponse(result);
  }
}
