export type PaymentRecord = {
  id: string;
  tenantId: string;
  bookingId: string | null;
  leadId: string | null;
  quotationId: string | null;
  amount: number;
  currency: string;
  method: string;
  status: string;
  receivedAt: Date;
  attachmentId: string | null;
  missingProofReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreatePaymentData = {
  bookingId?: string | null;
  leadId?: string | null;
  quotationId?: string | null;
  amount: number;
  currency?: string;
  method: string;
  receivedAt: Date;
  attachmentId?: string | null;
  missingProofReason?: string | null;
  notes?: string | null;
};

export abstract class PaymentRepository {
  abstract create(
    tenantId: string,
    data: CreatePaymentData,
  ): Promise<PaymentRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<PaymentRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<PaymentRecord[]>;

  abstract hasConfirmedAdvanceForLead(
    tenantId: string,
    leadId: string,
  ): Promise<boolean>;

  abstract hasConfirmedAdvanceForQuotation(
    tenantId: string,
    quotationId: string,
  ): Promise<boolean>;
}
