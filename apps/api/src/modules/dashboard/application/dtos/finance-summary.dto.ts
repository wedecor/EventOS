import type { InvoiceStatus } from '@prisma/client';
import type { MoneyDto } from '../../../finance/application/dtos/profitability.dto';

export type InvoicesSummaryDto = {
  total: number;
  byStatus: Partial<Record<InvoiceStatus, number>>;
};

// EP1-FIN-002–EP1-FIN-005 — Finance summary: confirmed revenue, confirmed vendor expenses,
// aggregate gross margin, and invoice status mix (read-only projection; no ledger recomputation).
export type FinanceSummaryDto = {
  totalConfirmedRevenue: MoneyDto;
  totalConfirmedVendorExpenses: MoneyDto;
  grossMargin: MoneyDto;
  invoices: InvoicesSummaryDto;
};
