import type { MoneyDto } from '../../../finance/application/dtos/profitability.dto';

export type PendingPaymentItemDto = {
  bookingId: string;
  bookingNumber: number;
  customerId: string;
  eventStartDate: Date | null;
  quotationTotal: MoneyDto;
  confirmedPaid: MoneyDto;
  amountDue: MoneyDto;
};

// EP1-FIN-003 — Pending payments: at-risk-event visibility (I3) — bookings whose confirmed
// payments have not yet covered the quotation total (read-only aggregation, no ledger writes).
export type PendingPaymentsDto = {
  totalDueAmount: MoneyDto;
  items: PendingPaymentItemDto[];
};
