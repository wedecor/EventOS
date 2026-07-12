import type { LeadSource, LeadStage } from '@prisma/client';

// EP1-SAL-001, EP1-SAL-002, EP1-KPI-002 — Sales summary: enquiry volume, source mix, and
// conversion rate for founder/sales visibility (read-only projection of Lead data).
export type SalesSummaryDto = {
  totalLeads: number;
  newLeadsInPeriod: number;
  periodDays: number;
  convertedLeads: number;
  conversionRate: number;
  byStage: Partial<Record<LeadStage, number>>;
  bySource: Partial<Record<LeadSource, number>>;
};
