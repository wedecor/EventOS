import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics.api';
import type {
  AnalyticsGranularity,
  AnalyticsPeriodParams,
} from '../schemas/analytics.schemas';

export type AnalyticsTrendsQueryParams = AnalyticsPeriodParams & {
  granularity?: AnalyticsGranularity;
};

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (params: AnalyticsPeriodParams = {}) =>
    [...analyticsKeys.all, 'dashboard', params.from ?? '', params.to ?? ''] as const,
  sales: (params: AnalyticsPeriodParams = {}) =>
    [...analyticsKeys.all, 'sales', params.from ?? '', params.to ?? ''] as const,
  finance: (params: AnalyticsPeriodParams = {}) =>
    [...analyticsKeys.all, 'finance', params.from ?? '', params.to ?? ''] as const,
  staff: () => [...analyticsKeys.all, 'staff'] as const,
  vendors: () => [...analyticsKeys.all, 'vendors'] as const,
  inventory: () => [...analyticsKeys.all, 'inventory'] as const,
  customers: (params: AnalyticsPeriodParams = {}) =>
    [...analyticsKeys.all, 'customers', params.from ?? '', params.to ?? ''] as const,
  operations: () => [...analyticsKeys.all, 'operations'] as const,
  trends: (params: AnalyticsTrendsQueryParams = {}) =>
    [
      ...analyticsKeys.all,
      'trends',
      params.from ?? '',
      params.to ?? '',
      params.granularity ?? 'default',
    ] as const,
};

const STALE_MS = 60_000;

export function useAnalyticsDashboardQuery(
  params: AnalyticsPeriodParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(params),
    queryFn: () => analyticsApi.getDashboard(params),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useAnalyticsSalesQuery(
  params: AnalyticsPeriodParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: analyticsKeys.sales(params),
    queryFn: () => analyticsApi.getSales(params),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useAnalyticsFinanceQuery(
  params: AnalyticsPeriodParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: analyticsKeys.finance(params),
    queryFn: () => analyticsApi.getFinance(params),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useAnalyticsStaffQuery(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.staff(),
    queryFn: () => analyticsApi.getStaff(),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useAnalyticsVendorsQuery(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.vendors(),
    queryFn: () => analyticsApi.getVendors(),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useAnalyticsInventoryQuery(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.inventory(),
    queryFn: () => analyticsApi.getInventory(),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useAnalyticsCustomersQuery(
  params: AnalyticsPeriodParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: analyticsKeys.customers(params),
    queryFn: () => analyticsApi.getCustomers(params),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useAnalyticsOperationsQuery(enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.operations(),
    queryFn: () => analyticsApi.getOperations(),
    staleTime: STALE_MS,
    enabled,
  });
}

export function useAnalyticsTrendsQuery(
  params: AnalyticsTrendsQueryParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: analyticsKeys.trends(params),
    queryFn: () => analyticsApi.getTrends(params),
    staleTime: STALE_MS,
    enabled,
  });
}
