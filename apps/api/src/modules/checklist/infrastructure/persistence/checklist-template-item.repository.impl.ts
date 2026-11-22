import { Injectable } from '@nestjs/common';
import type { ChecklistTemplateItem } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  ChecklistTemplateItemRecord,
  ChecklistTemplateItemRepository,
  CreateChecklistTemplateItemData,
  UpdateChecklistTemplateItemData,
} from '../../domain/repositories/checklist-template-item.repository';

@Injectable()
export class ChecklistTemplateItemRepositoryImpl
  extends TenantScopedRepository
  implements ChecklistTemplateItemRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    templateId: string,
    data: CreateChecklistTemplateItemData,
  ): Promise<ChecklistTemplateItemRecord> {
    const item = await this.prisma.checklistTemplateItem.create({
      data: {
        tenantId,
        template: { connect: { id: templateId } },
        title: data.title,
        description: data.description ?? null,
        isRequired: data.isRequired ?? true,
        defaultAssigneeRole: data.defaultAssigneeRole ?? null,
        estimatedDurationMinutes: data.estimatedDurationMinutes ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    return this.mapRecord(item);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<ChecklistTemplateItemRecord | null> {
    const item = await this.prisma.checklistTemplateItem.findFirst({
      where: { id, tenantId },
    });
    return item ? this.mapRecord(item) : null;
  }

  async findByTemplateId(
    tenantId: string,
    templateId: string,
  ): Promise<ChecklistTemplateItemRecord[]> {
    const items = await this.prisma.checklistTemplateItem.findMany({
      where: { tenantId, templateId },
      orderBy: { sortOrder: 'asc' },
    });
    return items.map((i) => this.mapRecord(i));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateChecklistTemplateItemData,
    version: number,
  ): Promise<ChecklistTemplateItemRecord> {
    try {
      const item = await this.prisma.checklistTemplateItem.update({
        where: { id, tenantId, version },
        data: {
          title: data.title,
          description: data.description,
          isRequired: data.isRequired,
          defaultAssigneeRole: data.defaultAssigneeRole,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          sortOrder: data.sortOrder,
          version: { increment: 1 },
        },
      });
      return this.mapRecord(item);
    } catch (error: unknown) {
      return this.toConcurrentModification('ChecklistTemplateItem', id, error);
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.checklistTemplateItem.deleteMany({
      where: { id, tenantId },
    });
  }

  private mapRecord(item: ChecklistTemplateItem): ChecklistTemplateItemRecord {
    return {
      id: item.id,
      tenantId: item.tenantId,
      templateId: item.templateId,
      title: item.title,
      description: item.description,
      isRequired: item.isRequired,
      defaultAssigneeRole: item.defaultAssigneeRole,
      estimatedDurationMinutes: item.estimatedDurationMinutes,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      version: item.version,
    };
  }
}
