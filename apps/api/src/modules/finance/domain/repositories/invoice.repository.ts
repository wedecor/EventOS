import type {
  CreateInvoiceLineItemData,
  InvoiceLineItemRecord,
} from './invoice-line-item.repository';

export type InvoiceRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  customerId: string;
  invoiceNumber: number;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'void';
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
};

export type CreateInvoiceData = {
  bookingId: string;
  customerId: string;
  invoiceNumber: number;
  subtotalAmount: number;
  taxAmount?: number;
  totalAmount: number;
  currency?: string;
  notes?: string | null;
};

export type UpdateInvoiceData = {
  status?: InvoiceRecord['status'];
  sentAt?: Date | null;
  voidedAt?: Date | null;
};

export type CreateInvoiceWithLineItemsResult = {
  invoice: InvoiceRecord;
  lineItems: InvoiceLineItemRecord[];
};

export abstract class InvoiceRepository {
  abstract create(
    tenantId: string,
    data: CreateInvoiceData,
  ): Promise<InvoiceRecord>;

  /**
   * Atomically create a draft invoice and its line items (R3-14 production
   * integrity — avoids orphan invoices if a line insert fails mid-flight).
   */
  abstract createWithLineItems(
    tenantId: string,
    data: CreateInvoiceData,
    lineItems: CreateInvoiceLineItemData[],
  ): Promise<CreateInvoiceWithLineItemsResult>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<InvoiceRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InvoiceRecord[]>;

  abstract findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<InvoiceRecord[]>;

  abstract findMaxInvoiceNumber(tenantId: string): Promise<number>;

  // EP1-FIN-002 — Dashboard: tenant-wide invoice read for finance summary
  abstract findAll(tenantId: string): Promise<InvoiceRecord[]>;

  // EP1-BR-002 — Financial review gate: an unreviewed (draft) invoice blocks booking completion.
  abstract hasDraftInvoiceForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<boolean>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateInvoiceData,
    version: number,
  ): Promise<InvoiceRecord>;
}
