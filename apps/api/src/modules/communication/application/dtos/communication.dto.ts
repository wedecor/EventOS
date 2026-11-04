import type { CommunicationRecordRecord } from '../../domain/repositories/communication-record.repository';
import type { CommunicationAttachmentRecord } from '../../domain/repositories/communication-attachment.repository';

export type CommunicationDto = {
  id: string;
  tenantId: string;
  bookingId: string | null;
  customerId: string | null;
  vendorId: string | null;
  staffMemberId: string | null;
  templateId: string | null;
  channel: CommunicationRecordRecord['channel'];
  direction: CommunicationRecordRecord['direction'];
  status: CommunicationRecordRecord['status'];
  subject: string | null;
  body: string | null;
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

export type CommunicationAttachmentDto = {
  id: string;
  tenantId: string;
  communicationRecordId: string;
  fileName: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  storageKey: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toCommunicationDto(
  record: CommunicationRecordRecord,
): CommunicationDto {
  return { ...record };
}

export function toCommunicationAttachmentDto(
  record: CommunicationAttachmentRecord,
): CommunicationAttachmentDto {
  return { ...record };
}
