import { apiClient } from '@/shared/api/client';
import {
  bookingSummarySchema,
  eventExecutionSummarySchema,
  financeSummarySchema,
  founderKpiSchema,
  inventorySummarySchema,
  leadPipelineSummarySchema,
  monthlyRevenueSummarySchema,
  operationalOverviewSchema,
  parseDashboardData,
  pendingPaymentsSchema,
  salesSummarySchema,
  staffSummarySchema,
  upcomingEventsSchema,
  vendorSummarySchema,
  type BookingSummary,
  type EventExecutionSummary,
  type FinanceSummary,
  type FounderKpi,
  type InventorySummary,
  type LeadPipelineSummary,
  type MonthlyRevenueSummary,
  type OperationalOverview,
  type PendingPayments,
  type SalesSummary,
  type StaffSummary,
  type UpcomingEvents,
  type VendorSummary,
} from '../schemas/dashboard.schemas';

/** Frozen OpenAPI paths under `/api/v1/dashboards/*` (all require `dashboards:read`). */
export const dashboardApi = {
  async getFounderKpis(params?: { from?: string; to?: string }): Promise<FounderKpi> {
    const query: Record<string, string> = {};
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/founder', {
      params: Object.keys(query).length > 0 ? query : undefined,
    });
    return parseDashboardData(founderKpiSchema, data);
  },

  async getLeadPipeline(): Promise<LeadPipelineSummary> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/lead-pipeline');
    return parseDashboardData(leadPipelineSummarySchema, data);
  },

  async getBookingSummary(): Promise<BookingSummary> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/booking-summary');
    return parseDashboardData(bookingSummarySchema, data);
  },

  async getEventExecutionSummary(): Promise<EventExecutionSummary> {
    const { data } = await apiClient.get<unknown>(
      '/api/v1/dashboards/event-execution-summary',
    );
    return parseDashboardData(eventExecutionSummarySchema, data);
  },

  async getPendingPayments(): Promise<PendingPayments> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/pending-payments');
    return parseDashboardData(pendingPaymentsSchema, data);
  },

  async getVendorSummary(): Promise<VendorSummary> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/vendor-summary');
    return parseDashboardData(vendorSummarySchema, data);
  },

  async getUpcomingEvents(days = 30): Promise<UpcomingEvents> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/upcoming-events', {
      params: { days },
    });
    return parseDashboardData(upcomingEventsSchema, data);
  },

  async getOperationalOverview(): Promise<OperationalOverview> {
    const { data } = await apiClient.get<unknown>(
      '/api/v1/dashboards/operational-overview',
    );
    return parseDashboardData(operationalOverviewSchema, data);
  },

  /** F1-14 Reports — sales summary (optional trailing `days`, max 365). */
  async getSalesSummary(days?: number): Promise<SalesSummary> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/sales-summary', {
      params: days != null ? { days } : undefined,
    });
    return parseDashboardData(salesSummarySchema, data);
  },

  async getStaffSummary(): Promise<StaffSummary> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/staff-summary');
    return parseDashboardData(staffSummarySchema, data);
  },

  async getInventorySummary(): Promise<InventorySummary> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/inventory-summary');
    return parseDashboardData(inventorySummarySchema, data);
  },

  async getFinanceSummary(): Promise<FinanceSummary> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/finance-summary');
    return parseDashboardData(financeSummarySchema, data);
  },

  /** F1-14 Reports — monthly revenue series (optional `months`, max 24; backend default 6). */
  async getMonthlyRevenue(months?: number): Promise<MonthlyRevenueSummary> {
    const { data } = await apiClient.get<unknown>('/api/v1/dashboards/monthly-revenue', {
      params: months != null ? { months } : undefined,
    });
    return parseDashboardData(monthlyRevenueSummarySchema, data);
  },
};
