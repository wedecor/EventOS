import { Injectable } from '@nestjs/common';
import type { ExternalIdentity } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateExternalIdentityData,
  ExternalIdentityRecord,
  ExternalIdentityRepository,
} from '../../domain/repositories/external-identity.repository';

@Injectable()
export class ExternalIdentityRepositoryImpl
  extends TenantScopedRepository
  implements ExternalIdentityRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateExternalIdentityData,
  ): Promise<ExternalIdentityRecord> {
    const record = await this.prisma.externalIdentity.create({
      data: {
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: data.userId } },
        linkedBy: { connect: { id: data.linkedByUserId } },
        provider: data.provider,
        subject: data.subject,
        email: data.email ?? null,
      },
    });
    return this.mapRecord(record);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<ExternalIdentityRecord | null> {
    const record = await this.prisma.externalIdentity.findFirst({
      where: { id, tenantId },
    });
    return record ? this.mapRecord(record) : null;
  }

  async findByProviderSubject(
    tenantId: string,
    provider: string,
    subject: string,
  ): Promise<ExternalIdentityRecord | null> {
    const record = await this.prisma.externalIdentity.findFirst({
      where: { tenantId, provider, subject },
    });
    return record ? this.mapRecord(record) : null;
  }

  async touchLastUsed(tenantId: string, id: string, at: Date): Promise<void> {
    await this.prisma.externalIdentity.updateMany({
      where: { id, tenantId },
      data: { lastUsedAt: at },
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.externalIdentity.deleteMany({ where: { id, tenantId } });
  }

  private mapRecord(record: ExternalIdentity): ExternalIdentityRecord {
    return {
      id: record.id,
      tenantId: record.tenantId,
      userId: record.userId,
      provider: record.provider,
      subject: record.subject,
      email: record.email,
      linkedAt: record.linkedAt,
      linkedByUserId: record.linkedByUserId,
      lastUsedAt: record.lastUsedAt,
      createdAt: record.createdAt,
    };
  }
}
