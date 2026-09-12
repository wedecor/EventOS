import type { MoneyDto } from '../../../finance/application/dtos/profitability.dto';

export type LeadSourcePerformanceEntryDto = {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
};

// EP1-KPI-005, EP1-MKT-001 — Lead source performance breakdown (same data as the lead-source
// dashboard; `docs/business/19-event-os-phase1-requirements.md` cross-reference table).
export type LeadSourcePerformanceDto = Record<
  string,
  LeadSourcePerformanceEntryDto
>;

// EP1-KPI-001–EP1-KPI-005 — Founder KPI dashboard. Response shape matches
// `docs/09-api-design.md` §Module: Dashboard exactly (`{ weekOf, kpis: {...} }`).
export type FounderKpiDto = {
  weekOf: string;
  kpis: {
    enquiries: number;
    conversionRate: number;
    eventsCompleted: number;
    grossMargin: MoneyDto;
    leadSourcePerformance: LeadSourcePerformanceDto;
  };
};
