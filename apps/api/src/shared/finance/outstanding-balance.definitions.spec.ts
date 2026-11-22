import {
  OUTSTANDING_BALANCE_METRICS,
  computeBookingCollectionGap,
  computeCustomerInvoiceOutstanding,
  computeOpenInvoiceFaceValue,
  computeOpenInvoiceNetOfInvoiceLinkedPayments,
} from './outstanding-balance.definitions';

describe('outstanding balance definitions (M4-AI remediation)', () => {
  describe('metric ids', () => {
    it('exposes three distinct business concepts (plus net variant)', () => {
      expect(OUTSTANDING_BALANCE_METRICS.BOOKING_COLLECTION_GAP).toBe(
        'bookingCollectionGap',
      );
      expect(OUTSTANDING_BALANCE_METRICS.CUSTOMER_INVOICE_OUTSTANDING).toBe(
        'customerInvoiceOutstanding',
      );
      expect(OUTSTANDING_BALANCE_METRICS.OPEN_INVOICE_FACE_VALUE).toBe(
        'openInvoiceFaceValue',
      );
      expect(
        OUTSTANDING_BALANCE_METRICS.OPEN_INVOICE_NET_OF_INVOICE_LINKED_PAYMENTS,
      ).toBe('openInvoiceNetOfInvoiceLinkedPayments');
    });
  });

  describe('Definition A — bookingCollectionGap', () => {
    it('subtracts confirmed booking payments from quotation total', () => {
      expect(
        computeBookingCollectionGap({
          quotationTotalAmount: 100000,
          confirmedBookingPaymentsAmount: 40000,
        }),
      ).toBe(60000);
    });

    it('treats advance payments without bookingId as invisible (caller omits them)', () => {
      // Lead/quotation advances are excluded by the caller when summing
      // confirmedBookingPaymentsAmount — formula receives only booking-linked.
      expect(
        computeBookingCollectionGap({
          quotationTotalAmount: 100000,
          confirmedBookingPaymentsAmount: 0,
        }),
      ).toBe(100000);
    });

    it('handles partial payments', () => {
      expect(
        computeBookingCollectionGap({
          quotationTotalAmount: 50000,
          confirmedBookingPaymentsAmount: 12500.5,
        }),
      ).toBe(37499.5);
    });

    it('allows overpayment to yield a negative gap (caller filters > epsilon)', () => {
      expect(
        computeBookingCollectionGap({
          quotationTotalAmount: 10000,
          confirmedBookingPaymentsAmount: 12000,
        }),
      ).toBe(-2000);
    });
  });

  describe('Definition B — customerInvoiceOutstanding', () => {
    it('is max(0, invoiced − paid)', () => {
      expect(
        computeCustomerInvoiceOutstanding({
          totalInvoiced: 80000,
          totalPaidOnBookings: 30000,
        }),
      ).toBe(50000);
    });

    it('floors at zero when overpaid', () => {
      expect(
        computeCustomerInvoiceOutstanding({
          totalInvoiced: 10000,
          totalPaidOnBookings: 15000,
        }),
      ).toBe(0);
    });

    it('excludes void invoices via caller (totalInvoiced already filtered)', () => {
      // Void excluded upstream → totalInvoiced only active invoices.
      expect(
        computeCustomerInvoiceOutstanding({
          totalInvoiced: 50000, // void 20000 not included
          totalPaidOnBookings: 10000,
        }),
      ).toBe(40000);
    });

    it('includes draft invoices when caller sums status !== void', () => {
      expect(
        computeCustomerInvoiceOutstanding({
          totalInvoiced: 25000, // draft + sent
          totalPaidOnBookings: 0,
        }),
      ).toBe(25000);
    });

    it('supports multiple invoices aggregated by caller', () => {
      const totalInvoiced = 10000 + 20000 + 30000;
      expect(
        computeCustomerInvoiceOutstanding({
          totalInvoiced,
          totalPaidOnBookings: 15000,
        }),
      ).toBe(45000);
    });
  });

  describe('Definition C — openInvoiceFaceValue / net', () => {
    const invoices = [
      { status: 'draft', totalAmount: 1000 },
      { status: 'sent', totalAmount: 5000 },
      { status: 'partially_paid', totalAmount: 3000 },
      { status: 'paid', totalAmount: 9000 },
      { status: 'void', totalAmount: 4000 },
    ];

    it('sums only sent and partially_paid face values', () => {
      expect(computeOpenInvoiceFaceValue(invoices)).toBe(8000);
    });

    it('fully paid invoices are excluded from open face value', () => {
      expect(
        computeOpenInvoiceFaceValue([{ status: 'paid', totalAmount: 999 }]),
      ).toBe(0);
    });

    it('voided invoices are excluded from open face value', () => {
      expect(
        computeOpenInvoiceFaceValue([{ status: 'void', totalAmount: 999 }]),
      ).toBe(0);
    });

    it('nets invoice-linked confirmed payments (advances without invoiceId excluded by caller)', () => {
      const face = computeOpenInvoiceFaceValue(invoices);
      expect(
        computeOpenInvoiceNetOfInvoiceLinkedPayments({
          openInvoiceFaceValue: face,
          confirmedInvoiceLinkedPaymentsAmount: 2500,
        }),
      ).toBe(5500);
    });

    it('floors net at zero', () => {
      expect(
        computeOpenInvoiceNetOfInvoiceLinkedPayments({
          openInvoiceFaceValue: 1000,
          confirmedInvoiceLinkedPaymentsAmount: 5000,
        }),
      ).toBe(0);
    });

    it('canceled bookings do not change open-invoice formulas (status-driven)', () => {
      // Bookings are not an input — canceled booking invoices still counted if sent.
      expect(
        computeOpenInvoiceFaceValue([{ status: 'sent', totalAmount: 7000 }]),
      ).toBe(7000);
    });
  });

  describe('concepts remain distinct', () => {
    it('does not equate booking gap with customer AR for the same numbers', () => {
      const gap = computeBookingCollectionGap({
        quotationTotalAmount: 100000,
        confirmedBookingPaymentsAmount: 20000,
      });
      const ar = computeCustomerInvoiceOutstanding({
        totalInvoiced: 100000,
        totalPaidOnBookings: 20000,
      });
      // Same arithmetic here, but AR floors at 0 and sources differ in production.
      expect(gap).toBe(80000);
      expect(ar).toBe(80000);
      // Face value ignores payments entirely:
      expect(
        computeOpenInvoiceFaceValue([{ status: 'sent', totalAmount: 100000 }]),
      ).toBe(100000);
    });
  });
});
