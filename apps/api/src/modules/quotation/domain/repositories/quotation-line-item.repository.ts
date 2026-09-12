export type QuotationLineItemRecord = {
  id: string;
  tenantId: string;
  quotationId: string;
  description: string;
  packageId: string | null;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateQuotationLineItemData = {
  quotationId: string;
  description: string;
  packageId?: string | null;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
};

export type UpdateQuotationLineItemData = {
  description?: string;
  packageId?: string | null;
  quantity?: number;
  unitPrice?: number;
  sortOrder?: number;
};

export abstract class QuotationLineItemRepository {
  abstract create(
    tenantId: string,
    data: CreateQuotationLineItemData,
  ): Promise<QuotationLineItemRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<QuotationLineItemRecord | null>;

  abstract listActiveByQuotation(
    tenantId: string,
    quotationId: string,
  ): Promise<QuotationLineItemRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateQuotationLineItemData,
    version: number,
  ): Promise<QuotationLineItemRecord>;

  abstract softDelete(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<QuotationLineItemRecord>;

  abstract countActiveByQuotation(
    tenantId: string,
    quotationId: string,
  ): Promise<number>;
}
