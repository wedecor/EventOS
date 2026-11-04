export type QuotationLineItemRecord = {
  id: string;
  tenantId: string;
  quotationId: string;
  description: string;
  quantity: number;
  unitPriceAmount: number;
  currency: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateLineItemData = {
  quotationId: string;
  description: string;
  quantity?: number;
  unitPriceAmount: number;
  currency?: string;
  sortOrder?: number;
};

export type UpdateLineItemData = {
  description?: string;
  quantity?: number;
  unitPriceAmount?: number;
  sortOrder?: number;
};

// EP1-FIN-001 — recalculated Quotation.subtotalAmount/totalAmount that must be
// persisted atomically with the line item mutation that triggered them.
export type QuotationTotalsUpdate = {
  subtotalAmount: number;
  totalAmount: number;
};

export abstract class QuotationLineItemRepository {
  abstract create(
    tenantId: string,
    data: CreateLineItemData,
  ): Promise<QuotationLineItemRecord>;

  // EP1-FIN-001 — creates the line item and persists the recalculated parent
  // Quotation totals in the same transaction, so a line item can never exist
  // without the quotation total reflecting it.
  abstract createWithQuotationTotals(
    tenantId: string,
    data: CreateLineItemData,
    quotationTotals: QuotationTotalsUpdate,
    quotationVersion: number,
  ): Promise<QuotationLineItemRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<QuotationLineItemRecord | null>;

  abstract findByQuotationId(
    tenantId: string,
    quotationId: string,
  ): Promise<QuotationLineItemRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateLineItemData,
    version: number,
  ): Promise<QuotationLineItemRecord>;

  // EP1-FIN-001 — updates the line item and persists the recalculated parent
  // Quotation totals atomically. Preserves optimistic concurrency on both the
  // line item (`lineItemVersion`) and the quotation (`quotationVersion`).
  abstract updateWithQuotationTotals(
    tenantId: string,
    id: string,
    data: UpdateLineItemData,
    lineItemVersion: number,
    quotationTotals: QuotationTotalsUpdate,
    quotationVersion: number,
  ): Promise<QuotationLineItemRecord>;

  abstract remove(tenantId: string, id: string): Promise<void>;

  // EP1-FIN-001 — removes the line item and persists the recalculated parent
  // Quotation totals atomically (including the zero-line-item case, where
  // totals resolve to 0).
  abstract removeWithQuotationTotals(
    tenantId: string,
    id: string,
    quotationId: string,
    quotationTotals: QuotationTotalsUpdate,
    quotationVersion: number,
  ): Promise<void>;

  abstract countByQuotationId(
    tenantId: string,
    quotationId: string,
  ): Promise<number>;
}
