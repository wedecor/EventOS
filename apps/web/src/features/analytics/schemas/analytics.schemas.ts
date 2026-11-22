import { z } from 'zod';

/**
 * Runtime validation for P2-12 Business Intelligence read models.
 * OpenAPI `data` objects are under-specified — parse before UI bind.
 */

export const moneySchema = z.object({
  amount: z.number(),
  currency: z.string().min(1),
});

export const analyticsPeriodParamsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const analyticsGranularitySchema = z.enum([
  'daily',
  'weekly',
  'monthly',
  'yearly',
]);

export const analyticsExportDatasetSchema = z.enum([
  'dashboard',
  'sales',
  'finance',
  'staff',
  'vendors',
  'inventory',
  'customers',
  'operations',
  'trends',
]);

export const analyticsExportFormatSchema = z.enum(['csv', 'xlsx']);

export const analyticsDashboardSchema = z.object({
  currency: z.string().min(1),
  totalRevenue: moneySchema,
  outstandingPayments: moneySchema,
  monthlyRevenue: moneySchema,
  monthlyProfit: moneySchema,
  monthlyExpenses: moneySchema,
  activeBookings: z.number().int().nonnegative(),
  upcomingEvents: z.number().int().nonnegative(),
  leadConversionRate: z.number().nonnegative(),
  customerRetentionRate: z.number().nonnegative(),
  staffUtilisationRate: z.number().nonnegative(),
  vendorCompletionRate: z.number().nonnegative(),
  inventoryUtilisationRate: z.number().nonnegative(),
  counts: z.object({
    leads: z.number().int().nonnegative(),
    customers: z.number().int().nonnegative(),
    bookings: z.number().int().nonnegative(),
    pendingReminders: z.number().int().nonnegative(),
    pendingProcurements: z.number().int().nonnegative(),
  }),
});

export const analyticsSalesSchema = z.object({
  leadsCreated: z.number().int().nonnegative(),
  leadsConverted: z.number().int().nonnegative(),
  conversionRate: z.number().nonnegative(),
  lostLeads: z.number().int().nonnegative(),
  quoteAcceptanceRate: z.number().nonnegative(),
  averageBookingValue: moneySchema,
  revenueByEventType: z.array(
    z.object({
      eventType: z.string(),
      revenue: z.number(),
    }),
  ),
  revenueByMonth: z.array(
    z.object({
      month: z.string().min(1),
      revenue: z.number(),
    }),
  ),
  byStage: z.record(z.string(), z.number()),
  bySource: z.record(z.string(), z.number()),
});

export const analyticsFinanceSchema = z.object({
  currency: z.string().min(1),
  revenue: moneySchema,
  expenses: moneySchema,
  grossProfit: moneySchema,
  outstandingReceivables: moneySchema,
  procurementSpend: moneySchema,
  paymentCollectionTrend: z.array(
    z.object({
      month: z.string().min(1),
      collected: z.number(),
      expenses: z.number(),
    }),
  ),
  invoicesByStatus: z.record(z.string(), z.number()),
  costVariance: z.object({
    estimated: z.number(),
    actual: z.number(),
    variance: z.number(),
  }),
});

export const analyticsStaffSchema = z.object({
  utilisationRate: z.number().nonnegative(),
  totalStaff: z.number().int().nonnegative(),
  activeStaff: z.number().int().nonnegative(),
  eventsAssigned: z.number().int().nonnegative(),
  leaveSummary: z.object({
    approved: z.number().int().nonnegative(),
    requested: z.number().int().nonnegative(),
  }),
  workload: z.array(
    z.object({
      staffMemberId: z.string().min(1),
      name: z.string(),
      eventsToday: z.number().int().nonnegative(),
      eventsThisWeek: z.number().int().nonnegative(),
      eventsThisMonth: z.number().int().nonnegative(),
      upcomingConfirmed: z.number().int().nonnegative(),
    }),
  ),
});

export const analyticsVendorsSchema = z.object({
  totalProcurements: z.number().int().nonnegative(),
  completionRate: z.number().nonnegative(),
  deliveryPerformance: z.object({
    delivered: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    partial: z.number().int().nonnegative(),
    cancelled: z.number().int().nonnegative(),
  }),
  spendByVendor: z.array(
    z.object({
      vendorId: z.string().min(1),
      spend: z.number(),
      procurements: z.number().int().nonnegative(),
    }),
  ),
  quoteWinRate: z.number().nonnegative(),
});

export const analyticsInventorySchema = z.object({
  reservations: z.number().int().nonnegative(),
  activeReservations: z.number().int().nonnegative(),
  usageMovements: z.number().int().nonnegative(),
  damageIncidents: z.number().int().nonnegative(),
  stockAvailabilityRate: z.number().nonnegative(),
  dispatchTrends: z.array(
    z.object({
      month: z.string().min(1),
      dispatched: z.number(),
      returned: z.number(),
    }),
  ),
  movementsByStatus: z.record(z.string(), z.number()),
});

export const analyticsCustomersSchema = z.object({
  newCustomers: z.number().int().nonnegative(),
  returningCustomers: z.number().int().nonnegative(),
  repeatRate: z.number().nonnegative(),
  eventTypeDistribution: z.array(
    z.object({
      eventType: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  communicationTrends: z.array(
    z.object({
      channel: z.string(),
      count: z.number().int().nonnegative(),
    }),
  ),
  healthDistribution: z.object({
    active: z.number().int().nonnegative(),
    returning: z.number().int().nonnegative(),
    dormant: z.number().int().nonnegative(),
    follow_up_required: z.number().int().nonnegative(),
  }),
  totalCustomers: z.number().int().nonnegative(),
});

export const analyticsOperationsSchema = z.object({
  todaysEvents: z.number().int().nonnegative(),
  upcomingEvents: z.number().int().nonnegative(),
  overdueTasks: z.number().int().nonnegative(),
  pendingProcurements: z.number().int().nonnegative(),
  pendingReminders: z.number().int().nonnegative(),
  overdueReminders: z.number().int().nonnegative(),
  inventoryIssues: z.number().int().nonnegative(),
  outstandingDocuments: z.number().int().nonnegative(),
  activeBookings: z.number().int().nonnegative(),
});

export const analyticsTrendsSchema = z.object({
  granularity: analyticsGranularitySchema,
  points: z.array(
    z.object({
      period: z.string().min(1),
      revenue: z.number(),
      expenses: z.number(),
      leads: z.number().int().nonnegative(),
      bookings: z.number().int().nonnegative(),
      customers: z.number().int().nonnegative(),
    }),
  ),
});

export const analyticsExportSchema = z.object({
  dataset: z.string().min(1),
  format: analyticsExportFormatSchema,
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  content: z.string(),
  rowCount: z.number().int().nonnegative(),
});

const envelope = <T extends z.ZodType>(data: T) => z.object({ data });

export function parseAnalyticsData<T>(schema: z.ZodType<T>, body: unknown): T {
  return envelope(schema).parse(body).data;
}

export type AnalyticsPeriodParams = z.infer<typeof analyticsPeriodParamsSchema>;
export type AnalyticsGranularity = z.infer<typeof analyticsGranularitySchema>;
export type AnalyticsExportDataset = z.infer<typeof analyticsExportDatasetSchema>;
export type AnalyticsExportFormat = z.infer<typeof analyticsExportFormatSchema>;
export type AnalyticsDashboard = z.infer<typeof analyticsDashboardSchema>;
export type AnalyticsSales = z.infer<typeof analyticsSalesSchema>;
export type AnalyticsFinance = z.infer<typeof analyticsFinanceSchema>;
export type AnalyticsStaff = z.infer<typeof analyticsStaffSchema>;
export type AnalyticsVendors = z.infer<typeof analyticsVendorsSchema>;
export type AnalyticsInventory = z.infer<typeof analyticsInventorySchema>;
export type AnalyticsCustomers = z.infer<typeof analyticsCustomersSchema>;
export type AnalyticsOperations = z.infer<typeof analyticsOperationsSchema>;
export type AnalyticsTrends = z.infer<typeof analyticsTrendsSchema>;
export type AnalyticsExport = z.infer<typeof analyticsExportSchema>;
export type Money = z.infer<typeof moneySchema>;
