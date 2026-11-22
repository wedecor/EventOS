import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
  },
}));

describe('dashboardApi', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('loads founder KPIs from frozen path', async () => {
    const { dashboardApi } = await import('./dashboard.api');
    get.mockResolvedValue({
      data: {
        data: {
          weekOf: '2026-07-06',
          kpis: {
            enquiries: 1,
            conversionRate: 0,
            eventsCompleted: 0,
            grossMargin: { amount: 0, currency: 'INR' },
            leadSourcePerformance: {},
          },
        },
      },
    });

    const result = await dashboardApi.getFounderKpis();
    expect(result.kpis.enquiries).toBe(1);
    expect(get).toHaveBeenCalledWith('/api/v1/dashboards/founder', {
      params: undefined,
    });
  });

  it('loads upcoming events with days query', async () => {
    const { dashboardApi } = await import('./dashboard.api');
    get.mockResolvedValue({ data: { data: { items: [] } } });
    await dashboardApi.getUpcomingEvents(14);
    expect(get).toHaveBeenCalledWith('/api/v1/dashboards/upcoming-events', {
      params: { days: 14 },
    });
  });

  it('loads F1-14 report endpoints with optional filters', async () => {
    const { dashboardApi } = await import('./dashboard.api');

    get.mockResolvedValue({
      data: {
        data: {
          totalLeads: 1,
          newLeadsInPeriod: 1,
          periodDays: 14,
          convertedLeads: 0,
          conversionRate: 0,
          byStage: {},
          bySource: {},
        },
      },
    });
    await dashboardApi.getSalesSummary(14);
    expect(get).toHaveBeenCalledWith('/api/v1/dashboards/sales-summary', {
      params: { days: 14 },
    });

    get.mockResolvedValue({
      data: {
        data: {
          totalAssignments: 0,
          byStatus: {},
          onSiteLeadCount: 0,
          unconfirmedForUpcomingEvents: 0,
        },
      },
    });
    await dashboardApi.getStaffSummary();
    expect(get).toHaveBeenCalledWith('/api/v1/dashboards/staff-summary');

    get.mockResolvedValue({
      data: { data: { totalMovements: 0, byStatus: {} } },
    });
    await dashboardApi.getInventorySummary();
    expect(get).toHaveBeenCalledWith('/api/v1/dashboards/inventory-summary');

    get.mockResolvedValue({
      data: {
        data: {
          totalConfirmedRevenue: { amount: 0, currency: 'INR' },
          totalConfirmedVendorExpenses: { amount: 0, currency: 'INR' },
          grossMargin: { amount: 0, currency: 'INR' },
          invoices: { total: 0, byStatus: {} },
        },
      },
    });
    await dashboardApi.getFinanceSummary();
    expect(get).toHaveBeenCalledWith('/api/v1/dashboards/finance-summary');

    get.mockResolvedValue({ data: { data: { months: [] } } });
    await dashboardApi.getMonthlyRevenue(6);
    expect(get).toHaveBeenCalledWith('/api/v1/dashboards/monthly-revenue', {
      params: { months: 6 },
    });

    get.mockResolvedValue({
      data: {
        data: {
          weekOf: '2026-07-01',
          kpis: {
            enquiries: 0,
            conversionRate: 0,
            eventsCompleted: 0,
            grossMargin: { amount: 0, currency: 'INR' },
            leadSourcePerformance: {},
          },
        },
      },
    });
    await dashboardApi.getFounderKpis({ from: '2026-07-01', to: '2026-07-07' });
    expect(get).toHaveBeenCalledWith('/api/v1/dashboards/founder', {
      params: { from: '2026-07-01', to: '2026-07-07' },
    });
  });
});
