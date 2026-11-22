import { z } from 'zod';

/**
 * Runtime validation for dashboard read models.
 * OpenAPI `data` objects are under-specified — parse before UI bind (same pattern as F1-02 auth).
 */

export const moneySchema = z.object({
  amount: z.number(),
  currency: z.string().min(1),
});

export const leadSourcePerformanceEntrySchema = z.object({
  totalLeads: z.number().int().nonnegative(),
  convertedLeads: z.number().int().nonnegative(),
  conversionRate: z.number().nonnegative(),
});

export const founderKpiSchema = z.object({
  weekOf: z.string().min(1),
  kpis: z.object({
    enquiries: z.number().int().nonnegative(),
    conversionRate: z.number().nonnegative(),
    eventsCompleted: z.number().int().nonnegative(),
    grossMargin: moneySchema,
    leadSourcePerformance: z.record(z.string(), leadSourcePerformanceEntrySchema),
  }),
});

export const leadPipelineSummarySchema = z.object({
  totalLeads: z.number().int().nonnegative(),
  activeLeads: z.number().int().nonnegative(),
  stages: z.array(
    z.object({
      stage: z.string().min(1),
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const bookingSummarySchema = z.object({
  totalBookings: z.number().int().nonnegative(),
  byStatus: z.record(z.string(), z.number().int().nonnegative()),
  upcomingCount: z.number().int().nonnegative(),
});

export const eventExecutionSummarySchema = z.object({
  activeEventCount: z.number().int().nonnegative(),
  byPreparationStatus: z.record(z.string(), z.number().int().nonnegative()),
  byWorkspaceStatus: z.record(z.string(), z.number().int().nonnegative()),
  needsAttentionCount: z.number().int().nonnegative(),
});

export const pendingPaymentsSchema = z.object({
  totalDueAmount: moneySchema,
  items: z.array(
    z.object({
      bookingId: z.string().min(1),
      bookingNumber: z.number().int(),
      customerId: z.string().min(1),
      eventStartDate: z.union([z.string(), z.null()]).optional(),
      quotationTotal: moneySchema,
      confirmedPaid: moneySchema,
      amountDue: moneySchema,
    }),
  ),
});

export const vendorSummarySchema = z.object({
  totalVendors: z.number().int().nonnegative(),
  byStatus: z.record(z.string(), z.number().int().nonnegative()),
  byCategory: z.record(z.string(), z.number().int().nonnegative()),
  procurementLines: z.object({
    total: z.number().int().nonnegative(),
    byStatus: z.record(z.string(), z.number().int().nonnegative()),
    costVarianceFlaggedCount: z.number().int().nonnegative(),
  }),
});

export const upcomingEventItemSchema = z.object({
  bookingId: z.string().min(1),
  bookingNumber: z.number().int(),
  eventType: z.string().nullable(),
  eventStartDate: z.union([z.string(), z.null()]),
  venueName: z.string().nullable(),
  status: z.string().min(1),
  preparationStatus: z.string().min(1),
});

export const upcomingEventsSchema = z.object({
  items: z.array(upcomingEventItemSchema),
});

export const operationalOverviewSchema = z.object({
  upcomingEventsCount: z.number().int().nonnegative(),
  needsAttentionEventsCount: z.number().int().nonnegative(),
  pendingPaymentsCount: z.number().int().nonnegative(),
  pendingPaymentsAmount: moneySchema,
  costVarianceFlaggedCount: z.number().int().nonnegative(),
  unconfirmedStaffForUpcomingEvents: z.number().int().nonnegative(),
});

/** F1-14 — unused by F1-04 hybrid landing. */
export const salesSummarySchema = z.object({
  totalLeads: z.number().int().nonnegative(),
  newLeadsInPeriod: z.number().int().nonnegative(),
  periodDays: z.number().int().positive(),
  convertedLeads: z.number().int().nonnegative(),
  conversionRate: z.number().nonnegative(),
  byStage: z.record(z.string(), z.number().int().nonnegative()),
  bySource: z.record(z.string(), z.number().int().nonnegative()),
});

export const staffSummarySchema = z.object({
  totalAssignments: z.number().int().nonnegative(),
  byStatus: z.record(z.string(), z.number().int().nonnegative()),
  onSiteLeadCount: z.number().int().nonnegative(),
  unconfirmedForUpcomingEvents: z.number().int().nonnegative(),
});

export const inventorySummarySchema = z.object({
  totalMovements: z.number().int().nonnegative(),
  byStatus: z.record(z.string(), z.number().int().nonnegative()),
});

export const financeSummarySchema = z.object({
  totalConfirmedRevenue: moneySchema,
  totalConfirmedVendorExpenses: moneySchema,
  grossMargin: moneySchema,
  invoices: z.object({
    total: z.number().int().nonnegative(),
    byStatus: z.record(z.string(), z.number().int().nonnegative()),
  }),
});

export const monthlyRevenuePointSchema = z.object({
  month: z.string().min(1),
  revenue: moneySchema,
  vendorExpenses: moneySchema,
  grossMargin: moneySchema,
});

export const monthlyRevenueSummarySchema = z.object({
  months: z.array(monthlyRevenuePointSchema),
});

const envelope = <T extends z.ZodType>(data: T) => z.object({ data });

export function parseDashboardData<T>(schema: z.ZodType<T>, body: unknown): T {
  return envelope(schema).parse(body).data;
}

export type FounderKpi = z.infer<typeof founderKpiSchema>;
export type LeadPipelineSummary = z.infer<typeof leadPipelineSummarySchema>;
export type BookingSummary = z.infer<typeof bookingSummarySchema>;
export type EventExecutionSummary = z.infer<typeof eventExecutionSummarySchema>;
export type PendingPayments = z.infer<typeof pendingPaymentsSchema>;
export type VendorSummary = z.infer<typeof vendorSummarySchema>;
export type UpcomingEvents = z.infer<typeof upcomingEventsSchema>;
export type OperationalOverview = z.infer<typeof operationalOverviewSchema>;
export type SalesSummary = z.infer<typeof salesSummarySchema>;
export type StaffSummary = z.infer<typeof staffSummarySchema>;
export type InventorySummary = z.infer<typeof inventorySummarySchema>;
export type FinanceSummary = z.infer<typeof financeSummarySchema>;
export type MonthlyRevenueSummary = z.infer<typeof monthlyRevenueSummarySchema>;
export type Money = z.infer<typeof moneySchema>;
