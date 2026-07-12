import { Injectable } from '@nestjs/common';
import type { ChecklistItem } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  ChecklistItemRecord,
  ChecklistItemRepository,
  CreateChecklistItemData,
  UpdateChecklistItemData,
} from '../../domain/repositories/checklist-item.repository';

@Injectable()
export class ChecklistItemRepositoryImpl
  extends TenantScopedRepository
  implements ChecklistItemRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateChecklistItemData,
  ): Promise<ChecklistItemRecord> {
    const item = await this.prisma.checklistItem.create({
      data: {
        tenantId,
        taskId: data.taskId,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    return this.mapRecord(item);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<ChecklistItemRecord | null> {
    const item = await this.prisma.checklistItem.findFirst({
      where: { id, tenantId },
    });

    return item ? this.mapRecord(item) : null;
  }

  async findByTaskId(
    tenantId: string,
    taskId: string,
  ): Promise<ChecklistItemRecord[]> {
    const items = await this.prisma.checklistItem.findMany({
      where: { tenantId, taskId },
      orderBy: { sortOrder: 'asc' },
    });

    return items.map((item) => this.mapRecord(item));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateChecklistItemData,
    version: number,
  ): Promise<ChecklistItemRecord> {
    try {
      const item = await this.prisma.checklistItem.update({
        where: { id, tenantId, version },
        data: {
          description: data.description,
          isCompleted: data.isCompleted,
          completedAt: data.completedAt,
          sortOrder: data.sortOrder,
          version: { increment: 1 },
        },
      });

      return this.mapRecord(item);
    } catch (error: unknown) {
      return this.toConcurrentModification('ChecklistItem', id, error);
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.checklistItem.deleteMany({
      where: { id, tenantId },
    });
  }

  private mapRecord(item: ChecklistItem): ChecklistItemRecord {
    return {
      id: item.id,
      tenantId: item.tenantId,
      taskId: item.taskId,
      description: item.description,
      isCompleted: item.isCompleted,
      completedAt: item.completedAt,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      version: item.version,
    };
  }
}
