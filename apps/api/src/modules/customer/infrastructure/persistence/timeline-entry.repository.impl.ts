import { Injectable } from '@nestjs/common';
import type { TimelineEntry } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateTimelineEntryData,
  TimelineEntryRecord,
  TimelineEntryRepository,
} from '../../domain/repositories/timeline-entry.repository';

@Injectable()
export class TimelineEntryRepositoryImpl
  extends TenantScopedRepository
  implements TimelineEntryRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateTimelineEntryData,
  ): Promise<TimelineEntryRecord> {
    const entry = await this.prisma.timelineEntry.create({
      data: {
        tenantId,
        customerId: data.customerId,
        eventId: data.eventId,
        type: data.type,
        message: data.message,
        occurredAt: data.occurredAt,
        recordedByUserId: data.recordedByUserId,
      },
    });

    return this.mapRecord(entry);
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<TimelineEntryRecord[]> {
    const entries = await this.prisma.timelineEntry.findMany({
      where: { tenantId, customerId },
      orderBy: { occurredAt: 'desc' },
    });

    return entries.map((entry) => this.mapRecord(entry));
  }

  private mapRecord(entry: TimelineEntry): TimelineEntryRecord {
    return {
      id: entry.id,
      tenantId: entry.tenantId,
      customerId: entry.customerId,
      eventId: entry.eventId,
      type: entry.type,
      message: entry.message,
      occurredAt: entry.occurredAt,
      recordedByUserId: entry.recordedByUserId,
      createdAt: entry.createdAt,
    };
  }
}
