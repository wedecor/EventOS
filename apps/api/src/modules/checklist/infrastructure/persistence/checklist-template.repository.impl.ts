import { Injectable } from '@nestjs/common';
import type { ChecklistTemplate } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  ChecklistTemplateRecord,
  ChecklistTemplateRepository,
  CreateChecklistTemplateData,
  UpdateChecklistTemplateData,
} from '../../domain/repositories/checklist-template.repository';
import type { ChecklistTemplateStatus } from '@prisma/client';

@Injectable()
export class ChecklistTemplateRepositoryImpl
  extends TenantScopedRepository
  implements ChecklistTemplateRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateChecklistTemplateData,
  ): Promise<ChecklistTemplateRecord> {
    const id = crypto.randomUUID();
    const template = await this.prisma.checklistTemplate.create({
      data: {
        id,
        tenant: { connect: { id: tenantId } },
        name: data.name,
        description: data.description ?? null,
        eventTypes: data.eventTypes ?? [],
        category: data.category ?? 'general',
        status: data.status ?? 'active',
        templateVersion: data.templateVersion ?? 1,
        sortOrder: data.sortOrder ?? 0,
        rootTemplateId: data.rootTemplateId ?? id,
      },
    });
    return this.mapRecord(template);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<ChecklistTemplateRecord | null> {
    const template = await this.prisma.checklistTemplate.findFirst({
      where: { id, tenantId },
    });
    return template ? this.mapRecord(template) : null;
  }

  async findMany(
    tenantId: string,
    filters?: { status?: ChecklistTemplateStatus; rootTemplateId?: string },
  ): Promise<ChecklistTemplateRecord[]> {
    const templates = await this.prisma.checklistTemplate.findMany({
      where: {
        tenantId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.rootTemplateId
          ? { rootTemplateId: filters.rootTemplateId }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return templates.map((t) => this.mapRecord(t));
  }

  async findActiveMatchingEventType(
    tenantId: string,
    eventType: string | null,
  ): Promise<ChecklistTemplateRecord[]> {
    const templates = await this.prisma.checklistTemplate.findMany({
      where: { tenantId, status: 'active' },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return templates
      .filter((t) => {
        if (t.eventTypes.length === 0) return true;
        if (!eventType) return false;
        return t.eventTypes.some(
          (type) => type.toLowerCase() === eventType.toLowerCase(),
        );
      })
      .map((t) => this.mapRecord(t));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateChecklistTemplateData,
    version: number,
  ): Promise<ChecklistTemplateRecord> {
    try {
      const template = await this.prisma.checklistTemplate.update({
        where: { id, tenantId, version },
        data: {
          name: data.name,
          description: data.description,
          eventTypes: data.eventTypes,
          category: data.category,
          status: data.status,
          templateVersion: data.templateVersion,
          sortOrder: data.sortOrder,
          version: { increment: 1 },
        },
      });
      return this.mapRecord(template);
    } catch (error: unknown) {
      return this.toConcurrentModification('ChecklistTemplate', id, error);
    }
  }

  async countGeneratedForTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<number> {
    return this.prisma.eventChecklist.count({
      where: { tenantId, templateId },
    });
  }

  private mapRecord(template: ChecklistTemplate): ChecklistTemplateRecord {
    return {
      id: template.id,
      tenantId: template.tenantId,
      name: template.name,
      description: template.description,
      eventTypes: template.eventTypes,
      category: template.category,
      status: template.status,
      templateVersion: template.templateVersion,
      sortOrder: template.sortOrder,
      rootTemplateId: template.rootTemplateId,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      version: template.version,
    };
  }
}
