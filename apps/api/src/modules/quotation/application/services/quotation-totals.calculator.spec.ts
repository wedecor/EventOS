import { calculateQuotationTotals } from './quotation-totals.calculator';

describe('calculateQuotationTotals (EP1-FIN-001)', () => {
  it('returns zero totals when there are no line items', () => {
    const result = calculateQuotationTotals({
      lineItems: [],
      discountAmount: 0,
      taxAmount: 0,
    });

    expect(result).toEqual({ subtotalAmount: 0, totalAmount: 0 });
  });

  it('sums quantity * unitPriceAmount across all line items for the subtotal', () => {
    const result = calculateQuotationTotals({
      lineItems: [
        { quantity: 1, unitPriceAmount: 5000 },
        { quantity: 2, unitPriceAmount: 1500 },
      ],
      discountAmount: 0,
      taxAmount: 0,
    });

    expect(result.subtotalAmount).toBe(8000);
    expect(result.totalAmount).toBe(8000);
  });

  it('applies totalAmount = subtotal - discount + tax', () => {
    const result = calculateQuotationTotals({
      lineItems: [{ quantity: 1, unitPriceAmount: 10000 }],
      discountAmount: 1000,
      taxAmount: 500,
    });

    expect(result.subtotalAmount).toBe(10000);
    expect(result.totalAmount).toBe(9500);
  });

  it('resolves totalAmount to 0 for zero line items even with discount/tax set', () => {
    const result = calculateQuotationTotals({
      lineItems: [],
      discountAmount: 100,
      taxAmount: 100,
    });

    // subtotal = 0, so total = 0 - 100 + 100 = 0
    expect(result).toEqual({ subtotalAmount: 0, totalAmount: 0 });
  });

  it('rounds to the nearest cent', () => {
    const result = calculateQuotationTotals({
      lineItems: [{ quantity: 3, unitPriceAmount: 33.333 }],
      discountAmount: 0,
      taxAmount: 0,
    });

    expect(result.subtotalAmount).toBe(100);
  });
});
