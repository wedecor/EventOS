import type { QuotationLineItemRecord } from '../../domain/repositories/quotation-line-item.repository';

export type QuotationLineItemDto = {
  id: string;
  quotationId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  version: number;
};

export function toQuotationLineItemDto(
  item: QuotationLineItemRecord,
): QuotationLineItemDto {
  return {
    id: item.id,
    quotationId: item.quotationId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    sortOrder: item.sortOrder,
    version: item.version,
  };
}
