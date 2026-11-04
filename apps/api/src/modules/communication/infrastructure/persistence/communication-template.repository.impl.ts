import { Injectable } from '@nestjs/common';
import type { CommunicationTemplate } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CommunicationTemplateRecord,
  CommunicationTemplateRepository,
  CreateCommunicationTemplateData,
  UpdateCommunicationTemplateData,
} from '../../domain/repositories/communication-template.repository';

@Injectable()
export class CommunicationTemplateRepositoryImpl
  extends TenantScopedRepository
  implements CommunicationTemplateRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateCommunicationTemplateData,
  ): Promise<CommunicationTemplateRecord> {
    const row = await this.prisma.communicationTemplate.create({
      data: {
        tenant: { connect: { id: tenantId } },
        name: data.name,
        category: data.category,
        channel: data.channel ?? null,
        subject: data.subject ?? null,
        body: data.body,
        status: data.status ?? 'active',
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<CommunicationTemplateRecord | null> {
    const row = await this.prisma.communicationTemplate.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findAll(tenantId: string): Promise<CommunicationTemplateRecord[]> {
    const rows = await this.prisma.communicationTemplate.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateCommunicationTemplateData,
    version: number,
  ): Promise<CommunicationTemplateRecord> {
    try {
      const row = await this.prisma.communicationTemplate.update({
        where: { id, tenantId, version },
        data: {
          name: data.name,
          category: data.category,
          channel: data.channel,
          subject: data.subject,
          body: data.body,
          status: data.status,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('CommunicationTemplate', id, error);
    }
  }

  private map(row: CommunicationTemplate): CommunicationTemplateRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      category: row.category,
      channel: row.channel,
      subject: row.subject,
      body: row.body,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
