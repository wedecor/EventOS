import type { QuotationRecord } from '../../domain/repositories/quotation.repository';

export type QuotationDto = {
  id: string;
  tenantId: string;
  customerId: string;
  leadId: string | null;
  quotationNumber: number;
  revisionNumber: number;
  status: QuotationRecord['status'];
  eventType: string | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  venue: string | null;
  validUntil: Date | null;
  terms: string | null;
  notes: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  supersededById: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toQuotationDto(quotation: QuotationRecord): QuotationDto {
  return { ...quotation };
}
