import type { MoneyDto } from '../../../finance/application/dtos/profitability.dto';

export type MonthlyRevenuePointDto = {
  month: string;
  revenue: MoneyDto;
  vendorExpenses: MoneyDto;
  grossMargin: MoneyDto;
};

// EP1-FIN-005, EP1-KPI-004 — Monthly revenue summary: confirmed revenue/expense/margin trend
// over recent months (read-only aggregation of Payment + VendorExpense data).
export type MonthlyRevenueSummaryDto = {
  months: MonthlyRevenuePointDto[];
};
