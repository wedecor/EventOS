import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export type FounderKpiQueryParams = {
  from?: string;
  to?: string;
};

export const dashboardKeys = {
  all: ['dashboards'] as const,
  founder: (params: FounderKpiQueryParams = {}) =>
    [...dashboardKeys.all, 'founder', params.from ?? '', params.to ?? ''] as const,
  leadPipeline: () => [...dashboardKeys.all, 'lead-pipeline'] as const,
  bookingSummary: () => [...dashboardKeys.all, 'booking-summary'] as const,
  eventExecution: () => [...dashboardKeys.all, 'event-execution'] as const,
  pendingPayments: () => [...dashboardKeys.all, 'pending-payments'] as const,
  vendorSummary: () => [...dashboardKeys.all, 'vendor-summary'] as const,
  upcomingEvents: (days: number) =>
    [...dashboardKeys.all, 'upcoming-events', days] as const,
  operationalOverview: () => [...dashboardKeys.all, 'operational-overview'] as const,
  salesSummary: (days?: number) =>
    [...dashboardKeys.all, 'sales-summary', days ?? 'default'] as const,
  staffSummary: () => [...dashboardKeys.all, 'staff-summary'] as const,
  inventorySummary: () => [...dashboardKeys.all, 'inventory-summary'] as const,
  financeSummary: () => [...dashboardKeys.all, 'finance-summary'] as const,
  monthlyRevenue: (months?: number) =>
    [...dashboardKeys.all, 'monthly-revenue', months ?? 'default'] as const,
};

const STALE_MS = 60_000;

export function useFounderKpisQuery(params: FounderKpiQueryParams = {}) {
  return useQuery({
    queryKey: dashboardKeys.founder(params),
    queryFn: () => dashboardApi.getFounderKpis(params),
    staleTime: STALE_MS,
  });
}

export function useLeadPipelineQuery() {
  return useQuery({
    queryKey: dashboardKeys.leadPipeline(),
    queryFn: () => dashboardApi.getLeadPipeline(),
    staleTime: STALE_MS,
  });
}

export function useBookingSummaryQuery() {
  return useQuery({
    queryKey: dashboardKeys.bookingSummary(),
    queryFn: () => dashboardApi.getBookingSummary(),
    staleTime: STALE_MS,
  });
}

export function useEventExecutionQuery() {
  return useQuery({
    queryKey: dashboardKeys.eventExecution(),
    queryFn: () => dashboardApi.getEventExecutionSummary(),
    staleTime: STALE_MS,
  });
}

export function usePendingPaymentsQuery() {
  return useQuery({
    queryKey: dashboardKeys.pendingPayments(),
    queryFn: () => dashboardApi.getPendingPayments(),
    staleTime: STALE_MS,
  });
}

export function useVendorSummaryQuery() {
  return useQuery({
    queryKey: dashboardKeys.vendorSummary(),
    queryFn: () => dashboardApi.getVendorSummary(),
    staleTime: STALE_MS,
  });
}

export function useUpcomingEventsQuery(days = 30) {
  return useQuery({
    queryKey: dashboardKeys.upcomingEvents(days),
    queryFn: () => dashboardApi.getUpcomingEvents(days),
    staleTime: STALE_MS,
  });
}

export function useOperationalOverviewQuery() {
  return useQuery({
    queryKey: dashboardKeys.operationalOverview(),
    queryFn: () => dashboardApi.getOperationalOverview(),
    staleTime: STALE_MS,
  });
}

export function useSalesSummaryQuery(days?: number) {
  return useQuery({
    queryKey: dashboardKeys.salesSummary(days),
    queryFn: () => dashboardApi.getSalesSummary(days),
    staleTime: STALE_MS,
  });
}

export function useStaffSummaryQuery() {
  return useQuery({
    queryKey: dashboardKeys.staffSummary(),
    queryFn: () => dashboardApi.getStaffSummary(),
    staleTime: STALE_MS,
  });
}

export function useInventorySummaryQuery() {
  return useQuery({
    queryKey: dashboardKeys.inventorySummary(),
    queryFn: () => dashboardApi.getInventorySummary(),
    staleTime: STALE_MS,
  });
}

export function useFinanceSummaryQuery() {
  return useQuery({
    queryKey: dashboardKeys.financeSummary(),
    queryFn: () => dashboardApi.getFinanceSummary(),
    staleTime: STALE_MS,
  });
}

export function useMonthlyRevenueQuery(months?: number) {
  return useQuery({
    queryKey: dashboardKeys.monthlyRevenue(months),
    queryFn: () => dashboardApi.getMonthlyRevenue(months),
    staleTime: STALE_MS,
  });
}
