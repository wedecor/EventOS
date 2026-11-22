import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AuditLogService,
} from '../../../../shared/audit';
import {
  decryptSecret,
  encryptSecret,
} from '../../../../shared/crypto/secret-box';
import { ConcurrentModificationError } from '../../../../shared/database';
import { createMailPort } from '../../../../shared/mail/mail.factory';
import { MAIL_PORT, type MailPort } from '../../../../shared/mail/mail.port';
import { createStoragePort } from '../../../../shared/storage/storage.factory';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../../shared/storage/storage.port';
import {
  IntegrationSettingsRepository,
  type IntegrationSettingsRecord,
} from '../../domain/repositories/integration-settings.repository';
import {
  toIntegrationSettingsDto,
  type IntegrationConnectionTestResultDto,
  type IntegrationSettingsDto,
  type IntegrationSettingsUpdateResultDto,
} from '../dtos/integration-settings.dto';

export type UpdateIntegrationSettingsInput = {
  emailProvider?: string;
  fromName?: string | null;
  fromEmail?: string | null;
  smtpUser?: string | null;
  smtpPassword?: string;
  storageProvider?: string;
  storageBucket?: string | null;
  storageEndpoint?: string | null;
  storageAccessKey?: string | null;
  storageSecretKey?: string;
};

@Injectable()
export class IntegrationSettingsApplicationService {
  constructor(
    private readonly repository: IntegrationSettingsRepository,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
    @Inject(MAIL_PORT) private readonly mail: MailPort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async getSettings(tenantId: string): Promise<Result<IntegrationSettingsDto>> {
    const settings = await this.getOrCreate(tenantId);
    return success(toIntegrationSettingsDto(settings));
  }

  async updateSettings(
    tenantId: string,
    input: UpdateIntegrationSettingsInput,
    version: number,
    actorId: string,
  ): Promise<Result<IntegrationSettingsUpdateResultDto>> {
    const existing = await this.getOrCreate(tenantId);
    if (existing.version !== version) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Integration settings were modified by another request. Reload and retry.',
        { tenantId },
      );
    }

    const validationError = this.validateUpdate(input, existing);
    if (validationError) return validationError;

    const secretKey = this.encryptionKey();
    const patch: Parameters<IntegrationSettingsRepository['update']>[1] = {};

    if (input.emailProvider !== undefined)
      patch.emailProvider = input.emailProvider;
    if (input.fromName !== undefined) patch.fromName = input.fromName;
    if (input.fromEmail !== undefined) {
      patch.fromEmail = input.fromEmail === '' ? null : input.fromEmail;
    }
    if (input.smtpUser !== undefined) patch.smtpUser = input.smtpUser;
    if (input.storageProvider !== undefined) {
      patch.storageProvider = input.storageProvider;
    }
    if (input.storageBucket !== undefined) {
      patch.storageBucket = input.storageBucket;
    }
    if (input.storageEndpoint !== undefined) {
      patch.storageEndpoint = input.storageEndpoint;
    }
    if (input.storageAccessKey !== undefined) {
      patch.storageAccessKey = input.storageAccessKey;
    }
    if (input.smtpPassword !== undefined) {
      patch.smtpPasswordEncrypted = encryptSecret(
        input.smtpPassword,
        secretKey,
      );
      patch.emailSecretConfigured = true;
    }
    if (input.storageSecretKey !== undefined) {
      patch.storageSecretEncrypted = encryptSecret(
        input.storageSecretKey,
        secretKey,
      );
      patch.storageSecretConfigured = true;
    }

    try {
      const updated = await this.repository.update(
        tenantId,
        patch,
        existing.version,
      );
      await this.auditLog.record({
        actorId,
        tenantId,
        action: AUDIT_ACTIONS.INTEGRATION_SETTINGS_UPDATED,
        entityType: AUDIT_ENTITY_TYPES.INTEGRATION_SETTINGS,
        entityId: updated.id,
        outcome: 'success',
        metadata: {
          emailProvider: updated.emailProvider,
          storageProvider: updated.storageProvider,
          emailSecretUpdated: input.smtpPassword !== undefined,
          storageSecretUpdated: input.storageSecretKey !== undefined,
          connectionClaimed: false,
        },
      });
      return success({
        tenantId: updated.tenantId,
        updated: true,
        version: updated.version,
      });
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Integration settings were modified by another request. Reload and retry.',
          { tenantId },
        );
      }
      throw error;
    }
  }

  async testEmail(
    tenantId: string,
    actorId: string,
    to?: string,
  ): Promise<Result<IntegrationConnectionTestResultDto>> {
    const settings = await this.getOrCreate(tenantId);
    const testedAt = new Date();
    const recipient =
      to?.trim() ||
      settings.fromEmail?.trim() ||
      this.config.get<string>('MAIL_FROM_EMAIL')?.trim();

    if (!recipient || settings.emailProvider === 'none') {
      const result = {
        ok: false,
        status: 'unconfigured' as const,
        testedAt: testedAt.toISOString(),
        message: !recipient
          ? 'Configure fromEmail (or pass to) before testing email.'
          : 'Email provider is set to none.',
      };
      await this.repository.update(
        tenantId,
        {
          lastEmailTestAt: testedAt,
          lastEmailTestStatus: 'unconfigured',
        },
        settings.version,
      );
      return success(result);
    }

    try {
      const mailer = this.resolveMailPort(settings);
      const sendResult = await mailer.send({
        to: recipient,
        subject: 'EventOS integration connection test',
        text: 'EventOS email connection test. Provider acceptance is not delivery proof.',
        html: '<p>EventOS email connection test.</p><p>Provider acceptance is not delivery proof.</p>',
        fromName: settings.fromName ?? undefined,
        fromEmail: settings.fromEmail ?? undefined,
      });
      const status = sendResult.accepted ? 'ok' : 'failed';
      await this.repository.update(
        tenantId,
        {
          lastEmailTestAt: testedAt,
          lastEmailTestStatus: status,
        },
        settings.version,
      );
      await this.auditLog.record({
        actorId,
        tenantId,
        action: AUDIT_ACTIONS.INTEGRATION_SETTINGS_UPDATED,
        entityType: AUDIT_ENTITY_TYPES.INTEGRATION_SETTINGS,
        entityId: settings.id,
        outcome: sendResult.accepted ? 'success' : 'failure',
        metadata: { connectionTest: 'email', status },
      });
      return success({
        ok: sendResult.accepted,
        status,
        testedAt: testedAt.toISOString(),
        message: sendResult.accepted
          ? 'Provider accepted the test message (not delivery proof).'
          : sanitizePublicError(
              sendResult.errorMessage ?? 'Email connection test failed.',
            ),
      });
    } catch (error: unknown) {
      const message = sanitizePublicError(
        error instanceof Error
          ? error.message
          : 'Email connection test failed.',
      );
      await this.repository.update(
        tenantId,
        {
          lastEmailTestAt: testedAt,
          lastEmailTestStatus: 'failed',
        },
        settings.version,
      );
      return success({
        ok: false,
        status: 'failed',
        testedAt: testedAt.toISOString(),
        message,
      });
    }
  }

  async testStorage(
    tenantId: string,
    actorId: string,
  ): Promise<Result<IntegrationConnectionTestResultDto>> {
    const settings = await this.getOrCreate(tenantId);
    const testedAt = new Date();

    if (settings.storageProvider === 'none') {
      await this.repository.update(
        tenantId,
        {
          lastStorageTestAt: testedAt,
          lastStorageTestStatus: 'unconfigured',
        },
        settings.version,
      );
      return success({
        ok: false,
        status: 'unconfigured',
        testedAt: testedAt.toISOString(),
        message: 'Storage provider is set to none.',
      });
    }

    const probeKey = `${tenantId}/connection-tests/${Date.now()}.txt`;
    try {
      const storage = this.resolveStoragePort(settings);
      const probe = Buffer.from('eventos-storage-connection-test');
      await storage.put({
        key: probeKey,
        body: probe,
        contentType: 'text/plain',
      });
      const got = await storage.get(probeKey);
      await storage.delete(probeKey);
      const ok = got.body.equals(probe);
      const status = ok ? 'ok' : 'failed';
      await this.repository.update(
        tenantId,
        {
          lastStorageTestAt: testedAt,
          lastStorageTestStatus: status,
        },
        settings.version,
      );
      await this.auditLog.record({
        actorId,
        tenantId,
        action: AUDIT_ACTIONS.INTEGRATION_SETTINGS_UPDATED,
        entityType: AUDIT_ENTITY_TYPES.INTEGRATION_SETTINGS,
        entityId: settings.id,
        outcome: ok ? 'success' : 'failure',
        metadata: { connectionTest: 'storage', status },
      });
      return success({
        ok,
        status,
        testedAt: testedAt.toISOString(),
        message: ok
          ? 'Storage put/get/delete probe succeeded.'
          : 'Storage probe mismatch.',
      });
    } catch (error: unknown) {
      const message = sanitizePublicError(
        error instanceof Error
          ? error.message
          : 'Storage connection test failed.',
      );
      await this.repository.update(
        tenantId,
        {
          lastStorageTestAt: testedAt,
          lastStorageTestStatus: 'failed',
        },
        settings.version,
      );
      return success({
        ok: false,
        status: 'failed',
        testedAt: testedAt.toISOString(),
        message,
      });
    }
  }

  private async getOrCreate(
    tenantId: string,
  ): Promise<IntegrationSettingsRecord> {
    const existing = await this.repository.findByTenantId(tenantId);
    if (existing) return existing;
    return this.repository.create(tenantId, {
      emailProvider: this.config.get<string>('MAIL_PROVIDER') ?? 'test',
      fromName: this.config.get<string>('MAIL_FROM_NAME') ?? null,
      fromEmail: this.config.get<string>('MAIL_FROM_EMAIL') || null,
      emailSecretConfigured: Boolean(this.config.get<string>('SMTP_PASS')),
      storageProvider: this.config.get<string>('STORAGE_PROVIDER') ?? 'local',
      storageBucket: this.config.get<string>('STORAGE_BUCKET') ?? null,
      storageEndpoint: this.config.get<string>('STORAGE_ENDPOINT') ?? null,
      storageAccessKey: this.config.get<string>('STORAGE_ACCESS_KEY') ?? null,
      storageSecretConfigured: Boolean(
        this.config.get<string>('STORAGE_SECRET_KEY'),
      ),
    });
  }

  private validateUpdate(
    input: UpdateIntegrationSettingsInput,
    existing: IntegrationSettingsRecord,
  ): Result<never> | null {
    const emailProvider = input.emailProvider ?? existing.emailProvider;
    const storageProvider = input.storageProvider ?? existing.storageProvider;
    const fromEmail =
      input.fromEmail !== undefined ? input.fromEmail : existing.fromEmail;
    const storageBucket =
      input.storageBucket !== undefined
        ? input.storageBucket
        : existing.storageBucket;
    const storageEndpoint =
      input.storageEndpoint !== undefined
        ? input.storageEndpoint
        : existing.storageEndpoint;

    if (emailProvider === 'smtp' && !fromEmail) {
      return failure(
        'VALIDATION_ERROR',
        'fromEmail is required when emailProvider is smtp.',
      );
    }
    if (storageProvider === 's3' && !storageBucket) {
      return failure(
        'VALIDATION_ERROR',
        'storageBucket is required when storageProvider is s3.',
      );
    }
    if (storageProvider === 's3' && !storageEndpoint) {
      return failure(
        'VALIDATION_ERROR',
        'storageEndpoint is required when storageProvider is s3.',
      );
    }
    return null;
  }

  private encryptionKey(): string {
    const key = this.config.get<string>('JWT_SECRET');
    if (!key || key.length < 32) {
      throw new Error('JWT_SECRET required to protect integration secrets');
    }
    return key;
  }

  private resolveMailPort(settings: IntegrationSettingsRecord): MailPort {
    if (settings.emailProvider === 'test') {
      // Use injected port so unit tests and default runtime test adapter stay aligned.
      return this.mail.providerName === 'test'
        ? this.mail
        : createMailPort({ MAIL_PROVIDER: 'test' });
    }
    if (settings.emailProvider === 'none') {
      return createMailPort({ MAIL_PROVIDER: 'none' });
    }
    const password = settings.smtpPasswordEncrypted
      ? decryptSecret(settings.smtpPasswordEncrypted, this.encryptionKey())
      : this.config.get<string>('SMTP_PASS');
    return createMailPort({
      MAIL_PROVIDER: 'smtp',
      MAIL_FROM_NAME: settings.fromName ?? undefined,
      MAIL_FROM_EMAIL: settings.fromEmail ?? undefined,
      SMTP_HOST: this.config.get<string>('SMTP_HOST'),
      SMTP_PORT: this.config.get<number>('SMTP_PORT'),
      SMTP_USER: settings.smtpUser ?? this.config.get<string>('SMTP_USER'),
      SMTP_PASS: password,
      SMTP_SECURE: this.config.get<boolean>('SMTP_SECURE'),
    });
  }

  private resolveStoragePort(settings: IntegrationSettingsRecord): StoragePort {
    if (settings.storageProvider === 'local') {
      return this.storage.providerName === 'local'
        ? this.storage
        : createStoragePort({
            STORAGE_PROVIDER: 'local',
            STORAGE_LOCAL_ROOT: this.config.get<string>('STORAGE_LOCAL_ROOT'),
          });
    }
    if (settings.storageProvider === 'none') {
      throw new Error('Storage provider is none');
    }
    const secret = settings.storageSecretEncrypted
      ? decryptSecret(settings.storageSecretEncrypted, this.encryptionKey())
      : this.config.get<string>('STORAGE_SECRET_KEY');
    return createStoragePort({
      STORAGE_PROVIDER: 's3',
      STORAGE_ENDPOINT:
        settings.storageEndpoint ?? this.config.get<string>('STORAGE_ENDPOINT'),
      STORAGE_ACCESS_KEY:
        settings.storageAccessKey ??
        this.config.get<string>('STORAGE_ACCESS_KEY'),
      STORAGE_SECRET_KEY: secret,
      STORAGE_BUCKET:
        settings.storageBucket ?? this.config.get<string>('STORAGE_BUCKET'),
      STORAGE_REGION: this.config.get<string>('STORAGE_REGION'),
    });
  }
}

function sanitizePublicError(message: string): string {
  return message
    .replace(/pass(word)?[=:].*/gi, 'password=[redacted]')
    .replace(/secret[=:].*/gi, 'secret=[redacted]')
    .replace(/AKIA[0-9A-Z]{16}/g, '[redacted-access-key]')
    .slice(0, 300);
}
