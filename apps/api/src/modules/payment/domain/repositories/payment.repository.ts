import type { PaymentMethod, PaymentStatus, PaymentType } from '@prisma/client';

export type PaymentRecord = {
  id: string;
  tenantId: string;
  eventId: string | null;
  leadId: string | null;
  quotationId: string | null;
  paymentType: PaymentType;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  receivedAt: Date;
  missingProofReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreatePaymentData = {
  eventId?: string | null;
  leadId?: string | null;
  quotationId?: string | null;
  paymentType?: PaymentType;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  receivedAt: Date;
  missingProofReason?: string | null;
};

export abstract class PaymentRepository {
  abstract create(
    tenantId: string,
    data: CreatePaymentData,
  ): Promise<PaymentRecord>;

  abstract hasConfirmedAdvance(
    tenantId: string,
    criteria: { leadId?: string; quotationId?: string; eventId?: string },
  ): Promise<boolean>;
}
