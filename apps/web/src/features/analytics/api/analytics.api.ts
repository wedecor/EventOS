import { apiClient } from '@/shared/api/client';
import {
  analyticsCustomersSchema,
  analyticsDashboardSchema,
  analyticsExportSchema,
  analyticsFinanceSchema,
  analyticsInventorySchema,
  analyticsOperationsSchema,
  analyticsSalesSchema,
  analyticsStaffSchema,
  analyticsTrendsSchema,
  analyticsVendorsSchema,
  parseAnalyticsData,
  type AnalyticsCustomers,
  type AnalyticsDashboard,
  type AnalyticsExport,
  type AnalyticsExportDataset,
  type AnalyticsExportFormat,
  type AnalyticsFinance,
  type AnalyticsGranularity,
  type AnalyticsInventory,
  type AnalyticsOperations,
  type AnalyticsPeriodParams,
  type AnalyticsSales,
  type AnalyticsStaff,
  type AnalyticsTrends,
  type AnalyticsVendors,
} from '../schemas/analytics.schemas';

function periodQuery(params?: AnalyticsPeriodParams): Record<string, string> | undefined {
  const query: Record<string, string> = {};
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;
  return Object.keys(query).length > 0 ? query : undefined;
}

/** P2-12 BI paths under `/api/v1/analytics/*` (all require `analytics:read`). */
export const analyticsApi = {
  async getDashboard(params?: AnalyticsPeriodParams): Promise<AnalyticsDashboard> {
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/dashboard', {
      params: periodQuery(params),
    });
    return parseAnalyticsData(analyticsDashboardSchema, data);
  },

  async getSales(params?: AnalyticsPeriodParams): Promise<AnalyticsSales> {
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/sales', {
      params: periodQuery(params),
    });
    return parseAnalyticsData(analyticsSalesSchema, data);
  },

  async getFinance(params?: AnalyticsPeriodParams): Promise<AnalyticsFinance> {
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/finance', {
      params: periodQuery(params),
    });
    return parseAnalyticsData(analyticsFinanceSchema, data);
  },

  async getStaff(): Promise<AnalyticsStaff> {
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/staff');
    return parseAnalyticsData(analyticsStaffSchema, data);
  },

  async getVendors(): Promise<AnalyticsVendors> {
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/vendors');
    return parseAnalyticsData(analyticsVendorsSchema, data);
  },

  async getInventory(): Promise<AnalyticsInventory> {
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/inventory');
    return parseAnalyticsData(analyticsInventorySchema, data);
  },

  async getCustomers(params?: AnalyticsPeriodParams): Promise<AnalyticsCustomers> {
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/customers', {
      params: periodQuery(params),
    });
    return parseAnalyticsData(analyticsCustomersSchema, data);
  },

  async getOperations(): Promise<AnalyticsOperations> {
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/operations');
    return parseAnalyticsData(analyticsOperationsSchema, data);
  },

  async getTrends(params?: AnalyticsPeriodParams & {
    granularity?: AnalyticsGranularity;
  }): Promise<AnalyticsTrends> {
    const query: Record<string, string> = { ...periodQuery(params) };
    if (params?.granularity) query.granularity = params.granularity;
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/trends', {
      params: Object.keys(query).length > 0 ? query : undefined,
    });
    return parseAnalyticsData(analyticsTrendsSchema, data);
  },

  async exportDataset(params: {
    dataset: AnalyticsExportDataset;
    format?: AnalyticsExportFormat;
    from?: string;
    to?: string;
  }): Promise<AnalyticsExport> {
    const query: Record<string, string> = { dataset: params.dataset };
    if (params.format) query.format = params.format;
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;
    const { data } = await apiClient.get<unknown>('/api/v1/analytics/export', {
      params: query,
    });
    return parseAnalyticsData(analyticsExportSchema, data);
  },
};
