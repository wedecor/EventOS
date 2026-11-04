/**
 * P2-12 — Business Intelligence read models.
 * Analytics owns no operational state.
 */

export type MoneyAmountDto = {
  amount: number;
  currency: string;
};

export type AnalyticsDashboardDto = {
  currency: string;
  totalRevenue: MoneyAmountDto;
  outstandingPayments: MoneyAmountDto;
  monthlyRevenue: MoneyAmountDto;
  monthlyProfit: MoneyAmountDto;
  monthlyExpenses: MoneyAmountDto;
  activeBookings: number;
  upcomingEvents: number;
  leadConversionRate: number;
  customerRetentionRate: number;
  staffUtilisationRate: number;
  vendorCompletionRate: number;
  inventoryUtilisationRate: number;
  counts: {
    leads: number;
    customers: number;
    bookings: number;
    pendingReminders: number;
    pendingProcurements: number;
  };
};

export type AnalyticsSalesDto = {
  leadsCreated: number;
  leadsConverted: number;
  conversionRate: number;
  lostLeads: number;
  quoteAcceptanceRate: number;
  averageBookingValue: MoneyAmountDto;
  revenueByEventType: Array<{ eventType: string; revenue: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  byStage: Record<string, number>;
  bySource: Record<string, number>;
};

export type AnalyticsFinanceDto = {
  currency: string;
  revenue: MoneyAmountDto;
  expenses: MoneyAmountDto;
  grossProfit: MoneyAmountDto;
  outstandingReceivables: MoneyAmountDto;
  procurementSpend: MoneyAmountDto;
  paymentCollectionTrend: Array<{
    month: string;
    collected: number;
    expenses: number;
  }>;
  invoicesByStatus: Record<string, number>;
  costVariance: {
    estimated: number;
    actual: number;
    variance: number;
  };
};

export type AnalyticsStaffDto = {
  utilisationRate: number;
  totalStaff: number;
  activeStaff: number;
  eventsAssigned: number;
  leaveSummary: {
    approved: number;
    requested: number;
  };
  workload: Array<{
    staffMemberId: string;
    name: string;
    eventsToday: number;
    eventsThisWeek: number;
    eventsThisMonth: number;
    upcomingConfirmed: number;
  }>;
};

export type AnalyticsVendorsDto = {
  totalProcurements: number;
  completionRate: number;
  deliveryPerformance: {
    delivered: number;
    pending: number;
    partial: number;
    cancelled: number;
  };
  spendByVendor: Array<{
    vendorId: string;
    spend: number;
    procurements: number;
  }>;
  quoteWinRate: number;
};

export type AnalyticsInventoryDto = {
  reservations: number;
  activeReservations: number;
  usageMovements: number;
  damageIncidents: number;
  stockAvailabilityRate: number;
  dispatchTrends: Array<{
    month: string;
    dispatched: number;
    returned: number;
  }>;
  movementsByStatus: Record<string, number>;
};

export type AnalyticsCustomersDto = {
  newCustomers: number;
  returningCustomers: number;
  repeatRate: number;
  eventTypeDistribution: Array<{ eventType: string; count: number }>;
  communicationTrends: Array<{ channel: string; count: number }>;
  healthDistribution: {
    active: number;
    returning: number;
    dormant: number;
    follow_up_required: number;
  };
  totalCustomers: number;
};

export type AnalyticsOperationsDto = {
  todaysEvents: number;
  upcomingEvents: number;
  overdueTasks: number;
  pendingProcurements: number;
  pendingReminders: number;
  overdueReminders: number;
  inventoryIssues: number;
  outstandingDocuments: number;
  activeBookings: number;
};

export type AnalyticsTrendsDto = {
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly';
  points: Array<{
    period: string;
    revenue: number;
    expenses: number;
    leads: number;
    bookings: number;
    customers: number;
  }>;
};

export type AnalyticsExportDto = {
  dataset: string;
  format: 'csv' | 'xlsx';
  fileName: string;
  contentType: string;
  /** Base64-encoded file bytes for xlsx; raw CSV text for csv (UTF-8). */
  content: string;
  rowCount: number;
};
