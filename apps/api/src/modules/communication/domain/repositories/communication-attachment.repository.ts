export type CommunicationAttachmentRecord = {
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

export type CreateCommunicationAttachmentData = {
  communicationRecordId: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  storageKey?: string | null;
};

export type UpdateCommunicationAttachmentData = {
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  storageKey?: string | null;
  deletedAt?: Date | null;
};

export abstract class CommunicationAttachmentRepository {
  abstract create(
    tenantId: string,
    data: CreateCommunicationAttachmentData,
  ): Promise<CommunicationAttachmentRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<CommunicationAttachmentRecord | null>;

  abstract findByCommunicationRecordId(
    tenantId: string,
    communicationRecordId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationAttachmentRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateCommunicationAttachmentData,
    version: number,
  ): Promise<CommunicationAttachmentRecord>;
}
