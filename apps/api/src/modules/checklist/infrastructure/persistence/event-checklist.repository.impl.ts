import { Injectable } from '@nestjs/common';
import type { EventChecklist } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateEventChecklistData,
  EventChecklistRecord,
  EventChecklistRepository,
} from '../../domain/repositories/event-checklist.repository';

@Injectable()
export class EventChecklistRepositoryImpl
  extends TenantScopedRepository
  implements EventChecklistRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateEventChecklistData,
  ): Promise<EventChecklistRecord> {
    const checklist = await this.prisma.eventChecklist.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        ...(data.templateId
          ? { template: { connect: { id: data.templateId } } }
          : {}),
        templateVersion: data.templateVersion ?? null,
        name: data.name,
        description: data.description ?? null,
        category: data.category ?? 'general',
        sortOrder: data.sortOrder ?? 0,
      },
    });
    return this.mapRecord(checklist);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<EventChecklistRecord | null> {
    const checklist = await this.prisma.eventChecklist.findFirst({
      where: { id, tenantId },
    });
    return checklist ? this.mapRecord(checklist) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<EventChecklistRecord[]> {
    const checklists = await this.prisma.eventChecklist.findMany({
      where: { tenantId, bookingId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return checklists.map((c) => this.mapRecord(c));
  }

  async findByBookingAndTemplate(
    tenantId: string,
    bookingId: string,
    templateId: string,
  ): Promise<EventChecklistRecord | null> {
    const checklist = await this.prisma.eventChecklist.findFirst({
      where: { tenantId, bookingId, templateId },
    });
    return checklist ? this.mapRecord(checklist) : null;
  }

  private mapRecord(checklist: EventChecklist): EventChecklistRecord {
    return {
      id: checklist.id,
      tenantId: checklist.tenantId,
      bookingId: checklist.bookingId,
      templateId: checklist.templateId,
      templateVersion: checklist.templateVersion,
      name: checklist.name,
      description: checklist.description,
      category: checklist.category,
      sortOrder: checklist.sortOrder,
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt,
      version: checklist.version,
    };
  }
}
