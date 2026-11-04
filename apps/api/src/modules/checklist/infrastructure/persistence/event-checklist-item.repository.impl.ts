import { Injectable } from '@nestjs/common';
import type { EventChecklistItem } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateEventChecklistItemData,
  EventChecklistItemRecord,
  EventChecklistItemRepository,
  UpdateEventChecklistItemData,
} from '../../domain/repositories/event-checklist-item.repository';

@Injectable()
export class EventChecklistItemRepositoryImpl
  extends TenantScopedRepository
  implements EventChecklistItemRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    checklistId: string,
    data: CreateEventChecklistItemData,
  ): Promise<EventChecklistItemRecord> {
    const item = await this.prisma.eventChecklistItem.create({
      data: {
        tenantId,
        checklist: { connect: { id: checklistId } },
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
  ): Promise<EventChecklistItemRecord | null> {
    const item = await this.prisma.eventChecklistItem.findFirst({
      where: { id, tenantId },
    });
    return item ? this.mapRecord(item) : null;
  }

  async findByChecklistId(
    tenantId: string,
    checklistId: string,
  ): Promise<EventChecklistItemRecord[]> {
    const items = await this.prisma.eventChecklistItem.findMany({
      where: { tenantId, checklistId },
      orderBy: { sortOrder: 'asc' },
    });
    return items.map((i) => this.mapRecord(i));
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<EventChecklistItemRecord[]> {
    const items = await this.prisma.eventChecklistItem.findMany({
      where: { tenantId, checklist: { bookingId } },
      orderBy: { sortOrder: 'asc' },
    });
    return items.map((i) => this.mapRecord(i));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEventChecklistItemData,
    version: number,
  ): Promise<EventChecklistItemRecord> {
    try {
      const item = await this.prisma.eventChecklistItem.update({
        where: { id, tenantId, version },
        data: {
          isCompleted: data.isCompleted,
          completedAt: data.completedAt,
          completedByUserId: data.completedByUserId,
          notes: data.notes,
          version: { increment: 1 },
        },
      });
      return this.mapRecord(item);
    } catch (error: unknown) {
      return this.toConcurrentModification('EventChecklistItem', id, error);
    }
  }

  private mapRecord(item: EventChecklistItem): EventChecklistItemRecord {
    return {
      id: item.id,
      tenantId: item.tenantId,
      checklistId: item.checklistId,
      title: item.title,
      description: item.description,
      isRequired: item.isRequired,
      defaultAssigneeRole: item.defaultAssigneeRole,
      estimatedDurationMinutes: item.estimatedDurationMinutes,
      sortOrder: item.sortOrder,
      isCompleted: item.isCompleted,
      completedAt: item.completedAt,
      completedByUserId: item.completedByUserId,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      version: item.version,
    };
  }
}
