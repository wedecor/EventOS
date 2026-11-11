export type IntegrationSettingsRecord = {
  id: string;
  tenantId: string;
  emailProvider: string;
  fromName: string | null;
  fromEmail: string | null;
  smtpUser: string | null;
  smtpPasswordEncrypted: string | null;
  emailSecretConfigured: boolean;
  storageProvider: string;
  storageBucket: string | null;
  storageEndpoint: string | null;
  storageAccessKey: string | null;
  storageSecretEncrypted: string | null;
  storageSecretConfigured: boolean;
  lastEmailTestAt: Date | null;
  lastEmailTestStatus: string | null;
  lastStorageTestAt: Date | null;
  lastStorageTestStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type UpsertIntegrationSettingsData = {
  emailProvider?: string;
  fromName?: string | null;
  fromEmail?: string | null;
  smtpUser?: string | null;
  smtpPasswordEncrypted?: string | null;
  emailSecretConfigured?: boolean;
  storageProvider?: string;
  storageBucket?: string | null;
  storageEndpoint?: string | null;
  storageAccessKey?: string | null;
  storageSecretEncrypted?: string | null;
  storageSecretConfigured?: boolean;
  lastEmailTestAt?: Date | null;
  lastEmailTestStatus?: string | null;
  lastStorageTestAt?: Date | null;
  lastStorageTestStatus?: string | null;
};

export abstract class IntegrationSettingsRepository {
  abstract findByTenantId(
    tenantId: string,
  ): Promise<IntegrationSettingsRecord | null>;

  abstract create(
    tenantId: string,
    data: UpsertIntegrationSettingsData,
  ): Promise<IntegrationSettingsRecord>;

  abstract update(
    tenantId: string,
    data: UpsertIntegrationSettingsData,
    version: number,
  ): Promise<IntegrationSettingsRecord>;
}
