import type { QuotationLineItemRecord } from '../../domain/repositories/quotation-line-item.repository';

export type QuotationLineItemDto = {
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

export function toQuotationLineItemDto(
  record: QuotationLineItemRecord,
): QuotationLineItemDto {
  return { ...record };
}
