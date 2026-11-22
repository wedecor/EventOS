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

// EP1-AUT-006 — approve response includes the linked Approved Event id (per
// docs/09-api-design.md endpoint `POST /api/v1/quotations/:id/approve`:
// `{ "data": { "id": "uuid", "status": "approved", "eventId": "uuid|null" } }`).
// `eventId` is `null` when the conversion chain has not created the Event yet
// (e.g. EP1-BR-001 advance payment not yet confirmed) or when it already
// exists for another reason — it is never a failure of the approval itself.
export type ApproveQuotationResultDto = QuotationDto & {
  eventId: string | null;
};

export function toApproveQuotationResultDto(
  quotation: QuotationRecord,
  eventId: string | null,
): ApproveQuotationResultDto {
  return { ...toQuotationDto(quotation), eventId };
}
