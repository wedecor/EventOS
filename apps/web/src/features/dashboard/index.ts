export { dashboardApi } from './api/dashboard.api';
export { DashboardPage } from './components/dashboard-page';
export { DashboardWidget } from './components/dashboard-widget';
export { KpiCard } from './components/kpi-card';
export {
  useFounderKpisQuery,
  useLeadPipelineQuery,
  useUpcomingEventsQuery,
  useSalesSummaryQuery,
  useStaffSummaryQuery,
  useInventorySummaryQuery,
  useFinanceSummaryQuery,
  useMonthlyRevenueQuery,
  dashboardKeys,
} from './hooks/use-dashboard-queries';
