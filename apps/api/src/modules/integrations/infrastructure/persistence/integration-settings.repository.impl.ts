import { Injectable } from '@nestjs/common';
import type { IntegrationSettings } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ConcurrentModificationError,
  TenantScopedRepository,
} from '../../../../shared/database';
import {
  IntegrationSettingsRepository,
  type IntegrationSettingsRecord,
  type UpsertIntegrationSettingsData,
} from '../../domain/repositories/integration-settings.repository';

@Injectable()
export class IntegrationSettingsRepositoryImpl
  extends TenantScopedRepository
  implements IntegrationSettingsRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenantId(
    tenantId: string,
  ): Promise<IntegrationSettingsRecord | null> {
    const row = await this.prisma.integrationSettings.findUnique({
      where: { tenantId },
    });
    return row ? this.map(row) : null;
  }

  async create(
    tenantId: string,
    data: UpsertIntegrationSettingsData,
  ): Promise<IntegrationSettingsRecord> {
    const row = await this.prisma.integrationSettings.create({
      data: {
        id: randomUUID(),
        tenantId,
        emailProvider: data.emailProvider ?? 'test',
        fromName: data.fromName ?? null,
        fromEmail: data.fromEmail ?? null,
        smtpUser: data.smtpUser ?? null,
        smtpPasswordEncrypted: data.smtpPasswordEncrypted ?? null,
        emailSecretConfigured: data.emailSecretConfigured ?? false,
        storageProvider: data.storageProvider ?? 'local',
        storageBucket: data.storageBucket ?? null,
        storageEndpoint: data.storageEndpoint ?? null,
        storageAccessKey: data.storageAccessKey ?? null,
        storageSecretEncrypted: data.storageSecretEncrypted ?? null,
        storageSecretConfigured: data.storageSecretConfigured ?? false,
        lastEmailTestAt: data.lastEmailTestAt ?? null,
        lastEmailTestStatus: data.lastEmailTestStatus ?? null,
        lastStorageTestAt: data.lastStorageTestAt ?? null,
        lastStorageTestStatus: data.lastStorageTestStatus ?? null,
      },
    });
    return this.map(row);
  }

  async update(
    tenantId: string,
    data: UpsertIntegrationSettingsData,
    version: number,
  ): Promise<IntegrationSettingsRecord> {
    const existing = await this.prisma.integrationSettings.findUnique({
      where: { tenantId },
    });
    if (!existing || existing.version !== version) {
      throw new ConcurrentModificationError('IntegrationSettings', tenantId);
    }
    try {
      const row = await this.prisma.integrationSettings.update({
        where: { tenantId, version },
        data: {
          ...(data.emailProvider !== undefined
            ? { emailProvider: data.emailProvider }
            : {}),
          ...(data.fromName !== undefined ? { fromName: data.fromName } : {}),
          ...(data.fromEmail !== undefined ? { fromEmail: data.fromEmail } : {}),
          ...(data.smtpUser !== undefined ? { smtpUser: data.smtpUser } : {}),
          ...(data.smtpPasswordEncrypted !== undefined
            ? { smtpPasswordEncrypted: data.smtpPasswordEncrypted }
            : {}),
          ...(data.emailSecretConfigured !== undefined
            ? { emailSecretConfigured: data.emailSecretConfigured }
            : {}),
          ...(data.storageProvider !== undefined
            ? { storageProvider: data.storageProvider }
            : {}),
          ...(data.storageBucket !== undefined
            ? { storageBucket: data.storageBucket }
            : {}),
          ...(data.storageEndpoint !== undefined
            ? { storageEndpoint: data.storageEndpoint }
            : {}),
          ...(data.storageAccessKey !== undefined
            ? { storageAccessKey: data.storageAccessKey }
            : {}),
          ...(data.storageSecretEncrypted !== undefined
            ? { storageSecretEncrypted: data.storageSecretEncrypted }
            : {}),
          ...(data.storageSecretConfigured !== undefined
            ? { storageSecretConfigured: data.storageSecretConfigured }
            : {}),
          ...(data.lastEmailTestAt !== undefined
            ? { lastEmailTestAt: data.lastEmailTestAt }
            : {}),
          ...(data.lastEmailTestStatus !== undefined
            ? { lastEmailTestStatus: data.lastEmailTestStatus }
            : {}),
          ...(data.lastStorageTestAt !== undefined
            ? { lastStorageTestAt: data.lastStorageTestAt }
            : {}),
          ...(data.lastStorageTestStatus !== undefined
            ? { lastStorageTestStatus: data.lastStorageTestStatus }
            : {}),
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('IntegrationSettings', tenantId, error);
    }
  }

  private map(row: IntegrationSettings): IntegrationSettingsRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      emailProvider: row.emailProvider,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      smtpUser: row.smtpUser,
      smtpPasswordEncrypted: row.smtpPasswordEncrypted,
      emailSecretConfigured: row.emailSecretConfigured,
      storageProvider: row.storageProvider,
      storageBucket: row.storageBucket,
      storageEndpoint: row.storageEndpoint,
      storageAccessKey: row.storageAccessKey,
      storageSecretEncrypted: row.storageSecretEncrypted,
      storageSecretConfigured: row.storageSecretConfigured,
      lastEmailTestAt: row.lastEmailTestAt,
      lastEmailTestStatus: row.lastEmailTestStatus,
      lastStorageTestAt: row.lastStorageTestAt,
      lastStorageTestStatus: row.lastStorageTestStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
