import { maskSecret } from '../../../../shared/crypto/secret-box';
import type { IntegrationSettingsRecord } from '../../domain/repositories/integration-settings.repository';

/** Public/masked view — never includes ciphertext or plaintext secrets. */
export type IntegrationSettingsDto = {
  id: string;
  tenantId: string;
  emailProvider: string;
  fromName: string | null;
  fromEmail: string | null;
  smtpUser: string | null;
  emailSecretConfigured: boolean;
  emailSecretMasked: string | null;
  storageProvider: string;
  storageBucket: string | null;
  storageEndpoint: string | null;
  storageAccessKey: string | null;
  storageSecretConfigured: boolean;
  storageSecretMasked: string | null;
  /** Last connection-test result only — not set merely because settings were saved. */
  lastEmailTestAt: string | null;
  lastEmailTestStatus: string | null;
  lastStorageTestAt: string | null;
  lastStorageTestStatus: string | null;
  version: number;
};

export type IntegrationSettingsUpdateResultDto = {
  tenantId: string;
  updated: true;
  version: number;
};

export type IntegrationConnectionTestResultDto = {
  ok: boolean;
  status: 'ok' | 'failed' | 'unconfigured';
  testedAt: string;
  message: string;
};

export function toIntegrationSettingsDto(
  record: IntegrationSettingsRecord,
): IntegrationSettingsDto {
  return {
    id: record.id,
    tenantId: record.tenantId,
    emailProvider: record.emailProvider,
    fromName: record.fromName,
    fromEmail: record.fromEmail,
    smtpUser: record.smtpUser,
    emailSecretConfigured: record.emailSecretConfigured,
    emailSecretMasked: maskSecret(record.emailSecretConfigured),
    storageProvider: record.storageProvider,
    storageBucket: record.storageBucket,
    storageEndpoint: record.storageEndpoint,
    storageAccessKey: record.storageAccessKey,
    storageSecretConfigured: record.storageSecretConfigured,
    storageSecretMasked: maskSecret(record.storageSecretConfigured),
    lastEmailTestAt: record.lastEmailTestAt?.toISOString() ?? null,
    lastEmailTestStatus: record.lastEmailTestStatus,
    lastStorageTestAt: record.lastStorageTestAt?.toISOString() ?? null,
    lastStorageTestStatus: record.lastStorageTestStatus,
    version: record.version,
  };
}
