export type InvoiceLineItemRecord = {
  id: string;
  tenantId: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPriceAmount: number;
  currency: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateInvoiceLineItemData = {
  description: string;
  quantity?: number;
  unitPriceAmount: number;
  currency?: string;
  sortOrder?: number;
};

export abstract class InvoiceLineItemRepository {
  abstract create(
    tenantId: string,
    invoiceId: string,
    data: CreateInvoiceLineItemData,
  ): Promise<InvoiceLineItemRecord>;

  abstract findByInvoiceId(
    tenantId: string,
    invoiceId: string,
  ): Promise<InvoiceLineItemRecord[]>;
}
