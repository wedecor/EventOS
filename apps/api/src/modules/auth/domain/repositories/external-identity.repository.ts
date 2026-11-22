// M5-01 — Auth Module domain layer: link between an external identity provider
// subject (Firebase uid) and an EventOS User. Tenant-scoped (ADR-016).

export type ExternalIdentityRecord = {
  id: string;
  tenantId: string;
  userId: string;
  provider: string;
  subject: string;
  email: string | null;
  linkedAt: Date;
  linkedByUserId: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export type CreateExternalIdentityData = {
  userId: string;
  provider: string;
  subject: string;
  email?: string | null;
  linkedByUserId: string;
};

export abstract class ExternalIdentityRepository {
  abstract create(
    tenantId: string,
    data: CreateExternalIdentityData,
  ): Promise<ExternalIdentityRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<ExternalIdentityRecord | null>;

  abstract findByProviderSubject(
    tenantId: string,
    provider: string,
    subject: string,
  ): Promise<ExternalIdentityRecord | null>;

  abstract touchLastUsed(tenantId: string, id: string, at: Date): Promise<void>;

  abstract delete(tenantId: string, id: string): Promise<void>;
}
