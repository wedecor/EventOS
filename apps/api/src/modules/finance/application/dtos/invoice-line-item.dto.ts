import type { InvoiceLineItemRecord } from '../../domain/repositories/invoice-line-item.repository';

export type InvoiceLineItemDto = {
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

export function toInvoiceLineItemDto(
  record: InvoiceLineItemRecord,
): InvoiceLineItemDto {
  return { ...record };
}
