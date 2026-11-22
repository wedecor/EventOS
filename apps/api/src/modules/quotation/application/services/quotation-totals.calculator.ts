/**
 * EP1-FIN-001 — Single source of truth for Quotation total calculation.
 *
 * Per docs/07-domain-model.md ("Line totals computed — not manually
 * overridden") and docs/20-definition-of-done.md ("Total calculation correct
 * (subtotal - discount + tax)"), `Quotation.totalAmount` must always be
 * derived from the current set of active line items plus the quotation's
 * discount/tax. Every operation that mutates line items (add/update/remove)
 * must call this function to recompute `subtotalAmount` and `totalAmount`
 * before persisting — this is the ONLY place that formula is implemented.
 */

export type QuotationTotalsLineItemInput = {
  quantity: number;
  unitPriceAmount: number;
};

export type QuotationTotalsInput = {
  lineItems: QuotationTotalsLineItemInput[];
  discountAmount: number;
  taxAmount: number;
};

export type QuotationTotals = {
  subtotalAmount: number;
  totalAmount: number;
};

export function calculateQuotationTotals(
  input: QuotationTotalsInput,
): QuotationTotals {
  const subtotalAmount = roundToCents(
    input.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceAmount,
      0,
    ),
  );

  // Zero line items correctly resolves to subtotalAmount = 0, and therefore
  // totalAmount = 0 - discount + tax, matching the same formula used for any
  // other line-item count (no special-casing required).
  const totalAmount = roundToCents(
    subtotalAmount - input.discountAmount + input.taxAmount,
  );

  return { subtotalAmount, totalAmount };
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
