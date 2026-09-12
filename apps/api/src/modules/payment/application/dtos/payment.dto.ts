import type { PaymentRecord } from '../../domain/repositories/payment.repository';

export type PaymentDto = {
  id: string;
  tenantId: string;
  bookingId: string | null;
  leadId: string | null;
  quotationId: string | null;
  invoiceId: string | null;
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

export function toPaymentDto(payment: PaymentRecord): PaymentDto {
  return { ...payment };
}
