import type { ExternalIdentityRecord } from '../../domain/repositories/external-identity.repository';

export type ExternalIdentityDto = {
  id: string;
  userId: string;
  provider: string;
  subject: string;
  email: string | null;
  linkedAt: string;
  linkedByUserId: string;
  lastUsedAt: string | null;
};

export function toExternalIdentityDto(
  record: ExternalIdentityRecord,
): ExternalIdentityDto {
  return {
    id: record.id,
    userId: record.userId,
    provider: record.provider,
    subject: record.subject,
    email: record.email,
    linkedAt: record.linkedAt.toISOString(),
    linkedByUserId: record.linkedByUserId,
    lastUsedAt: record.lastUsedAt ? record.lastUsedAt.toISOString() : null,
  };
}
