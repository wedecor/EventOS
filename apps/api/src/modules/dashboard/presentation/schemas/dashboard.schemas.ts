import { z } from 'zod';

// EP1-KPI-006 — Weekly review cadence: optional explicit period, defaults to the trailing week.
export const founderDashboardQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

export const salesSummaryQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional(),
});

export const monthlyRevenueQuerySchema = z.object({
  months: z.coerce.number().int().positive().max(24).optional(),
});

export const upcomingEventsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional(),
});

export type FounderDashboardQuery = z.infer<typeof founderDashboardQuerySchema>;
export type SalesSummaryQuery = z.infer<typeof salesSummaryQuerySchema>;
export type MonthlyRevenueQuery = z.infer<typeof monthlyRevenueQuerySchema>;
export type UpcomingEventsQuery = z.infer<typeof upcomingEventsQuerySchema>;
