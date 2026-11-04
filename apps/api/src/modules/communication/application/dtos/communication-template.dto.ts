import type { CommunicationTemplateRecord } from '../../domain/repositories/communication-template.repository';

export type CommunicationTemplateDto = {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  channel: CommunicationTemplateRecord['channel'];
  subject: string | null;
  body: string;
  status: CommunicationTemplateRecord['status'];
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toCommunicationTemplateDto(
  record: CommunicationTemplateRecord,
): CommunicationTemplateDto {
  return { ...record };
}
