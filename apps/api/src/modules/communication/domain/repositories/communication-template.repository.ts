import type {
  CommunicationChannel,
  CommunicationTemplateStatus,
} from '@prisma/client';

export type CommunicationTemplateRecord = {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  channel: CommunicationChannel | null;
  subject: string | null;
  body: string;
  status: CommunicationTemplateStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateCommunicationTemplateData = {
  name: string;
  category: string;
  channel?: CommunicationChannel | null;
  subject?: string | null;
  body: string;
  status?: CommunicationTemplateStatus;
};

export type UpdateCommunicationTemplateData = {
  name?: string;
  category?: string;
  channel?: CommunicationChannel | null;
  subject?: string | null;
  body?: string;
  status?: CommunicationTemplateStatus;
};

export abstract class CommunicationTemplateRepository {
  abstract create(
    tenantId: string,
    data: CreateCommunicationTemplateData,
  ): Promise<CommunicationTemplateRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<CommunicationTemplateRecord | null>;

  abstract findAll(tenantId: string): Promise<CommunicationTemplateRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateCommunicationTemplateData,
    version: number,
  ): Promise<CommunicationTemplateRecord>;
}
