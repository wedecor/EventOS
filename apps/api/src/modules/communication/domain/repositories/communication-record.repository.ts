import type {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
} from '@prisma/client';

export type CommunicationRecordRecord = {
  id: string;
  tenantId: string;
  bookingId: string | null;
  customerId: string | null;
  leadId: string | null;
  vendorId: string | null;
  staffMemberId: string | null;
  templateId: string | null;
  quotationId: string | null;
  invoiceId: string | null;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status: CommunicationStatus;
  subject: string | null;
  body: string | null;
  recipientAddress: string | null;
  provider: string | null;
  providerMessageId: string | null;
  failureReason: string | null;
  createdByUserId: string | null;
  occurredAt: Date;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  failedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateCommunicationRecordData = {
  bookingId?: string | null;
  customerId?: string | null;
  leadId?: string | null;
  vendorId?: string | null;
  staffMemberId?: string | null;
  templateId?: string | null;
  quotationId?: string | null;
  invoiceId?: string | null;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status?: CommunicationStatus;
  subject?: string | null;
  body?: string | null;
  recipientAddress?: string | null;
  provider?: string | null;
  providerMessageId?: string | null;
  failureReason?: string | null;
  createdByUserId?: string | null;
  occurredAt?: Date;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  failedAt?: Date | null;
};

export type UpdateCommunicationRecordData = {
  subject?: string | null;
  body?: string | null;
  bookingId?: string | null;
  customerId?: string | null;
  leadId?: string | null;
  vendorId?: string | null;
  staffMemberId?: string | null;
  templateId?: string | null;
  quotationId?: string | null;
  invoiceId?: string | null;
  status?: CommunicationStatus;
  recipientAddress?: string | null;
  provider?: string | null;
  providerMessageId?: string | null;
  failureReason?: string | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  failedAt?: Date | null;
  deletedAt?: Date | null;
};

export abstract class CommunicationRecordRepository {
  abstract create(
    tenantId: string,
    data: CreateCommunicationRecordData,
  ): Promise<CommunicationRecordRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<CommunicationRecordRecord | null>;

  abstract findAll(
    tenantId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]>;

  abstract findByCustomerId(
    tenantId: string,
    customerId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]>;

  abstract findByLeadId(
    tenantId: string,
    leadId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]>;

  abstract findByQuotationId(
    tenantId: string,
    quotationId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]>;

  abstract findByInvoiceId(
    tenantId: string,
    invoiceId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateCommunicationRecordData,
    version: number,
  ): Promise<CommunicationRecordRecord>;
}
