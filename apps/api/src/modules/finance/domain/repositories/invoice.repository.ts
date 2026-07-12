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

export abstract class InvoiceRepository {
  abstract create(
    tenantId: string,
    data: CreateInvoiceData,
  ): Promise<InvoiceRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<InvoiceRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
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
