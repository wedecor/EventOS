export type MoneyDto = {
  amount: number;
  currency: string;
};

// EP1-FIN-005 — Event profitability view (`docs/09-api-design.md` §Module: Finance response
// shape: `{ eventId, revenue, vendorExpenses, grossMargin }`).
export type ProfitabilityDto = {
  eventId: string;
  revenue: MoneyDto;
  vendorExpenses: MoneyDto;
  grossMargin: MoneyDto;
};
