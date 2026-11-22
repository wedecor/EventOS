/**
 * M4-AI remediation — three distinct outstanding / receivable concepts.
 *
 * Do NOT collapse these into one formula. AI BI tools and API docs must cite a
 * `metricId` from {@link OUTSTANDING_BALANCE_METRICS}. Pure functions below are
 * the single implementation of each formula; query services call them.
 *
 * See `docs/ai/M4_PRE_IMPLEMENTATION_REMEDIATION_PLAN.md` §2.
 */

export const OUTSTANDING_BALANCE_METRICS = {
  /** Quotation total − confirmed booking-linked payments (ops collection list). */
  BOOKING_COLLECTION_GAP: 'bookingCollectionGap',
  /** Non-void invoiced − confirmed payments on customer bookings (customer AR). */
  CUSTOMER_INVOICE_OUTSTANDING: 'customerInvoiceOutstanding',
  /** Face value of invoices in sent | partially_paid (analytics finance). */
  OPEN_INVOICE_FACE_VALUE: 'openInvoiceFaceValue',
  /**
   * Open-invoice face value minus all confirmed payments that have invoiceId set
   * (analytics dashboard). Subtractor is tenant-wide invoice-linked payments,
   * not scoped only to the open invoices in the sum.
   */
  OPEN_INVOICE_NET_OF_INVOICE_LINKED_PAYMENTS:
    'openInvoiceNetOfInvoiceLinkedPayments',
} as const;

export type OutstandingBalanceMetricId =
  (typeof OUTSTANDING_BALANCE_METRICS)[keyof typeof OUTSTANDING_BALANCE_METRICS];

export type BookingCollectionGapInput = {
  /** Booking/event must not be cancelled before calling (caller filters). */
  quotationTotalAmount: number;
  /** Confirmed payments with bookingId = this booking only. */
  confirmedBookingPaymentsAmount: number;
};

/** Definition A — booking collection gap vs sold quotation. */
export function computeBookingCollectionGap(
  input: BookingCollectionGapInput,
): number {
  return input.quotationTotalAmount - input.confirmedBookingPaymentsAmount;
}

export type CustomerInvoiceOutstandingInput = {
  /** Invoice totals where status !== 'void' (draft currently included). */
  totalInvoiced: number;
  /** Confirmed payments on any of the customer's bookings. */
  totalPaidOnBookings: number;
};

/** Definition B — customer invoice accounts receivable. */
export function computeCustomerInvoiceOutstanding(
  input: CustomerInvoiceOutstandingInput,
): number {
  return Math.max(0, input.totalInvoiced - input.totalPaidOnBookings);
}

export type OpenInvoiceStatuses = 'sent' | 'partially_paid';

export function isOpenInvoiceStatus(status: string): status is OpenInvoiceStatuses {
  return status === 'sent' || status === 'partially_paid';
}

/** Definition C face — open invoice face value. */
export function computeOpenInvoiceFaceValue(
  invoices: ReadonlyArray<{ status: string; totalAmount: number }>,
): number {
  return invoices
    .filter((invoice) => isOpenInvoiceStatus(invoice.status))
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
}

/**
 * Definition C net — open face value minus confirmed payments with invoiceId.
 * Payments without invoiceId (e.g. booking/lead advances) are excluded.
 */
export function computeOpenInvoiceNetOfInvoiceLinkedPayments(input: {
  openInvoiceFaceValue: number;
  confirmedInvoiceLinkedPaymentsAmount: number;
}): number {
  return Math.max(
    0,
    input.openInvoiceFaceValue - input.confirmedInvoiceLinkedPaymentsAmount,
  );
}
