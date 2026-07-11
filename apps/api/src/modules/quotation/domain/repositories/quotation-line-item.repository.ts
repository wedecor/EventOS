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

export abstract class QuotationLineItemRepository {
  abstract create(
    tenantId: string,
    data: CreateLineItemData,
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

  abstract remove(tenantId: string, id: string): Promise<void>;

  abstract countByQuotationId(
    tenantId: string,
    quotationId: string,
  ): Promise<number>;
}
