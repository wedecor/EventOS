import type { InvoiceRecord } from '../../domain/repositories/invoice.repository';
import { type InvoiceLineItemDto } from './invoice-line-item.dto';

export type InvoiceDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  customerId: string;
  invoiceNumber: number;
  status: InvoiceRecord['status'];
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  notes: string | null;
  sentAt: Date | null;
  voidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  lineItems: InvoiceLineItemDto[];
};

// EP1-FIN-002 — Line items are embedded per the `VendorProcurementDto` precedent
// (`docs/09-api-design.md` §Module: Finance read coverage).
export function toInvoiceDto(
  record: InvoiceRecord,
  lineItems: InvoiceLineItemDto[],
): InvoiceDto {
  return { ...record, lineItems };
}
