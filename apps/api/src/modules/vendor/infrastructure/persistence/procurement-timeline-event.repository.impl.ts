import { Injectable } from '@nestjs/common';
import type { ProcurementTimelineEvent } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateProcurementTimelineEventData,
  ProcurementTimelineEventRecord,
  ProcurementTimelineEventRepository,
} from '../../domain/repositories/procurement-timeline-event.repository';

@Injectable()
export class ProcurementTimelineEventRepositoryImpl
  extends TenantScopedRepository
  implements ProcurementTimelineEventRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateProcurementTimelineEventData,
  ): Promise<ProcurementTimelineEventRecord> {
    const row = await this.prisma.procurementTimelineEvent.create({
      data: {
        tenant: { connect: { id: tenantId } },
        vendorProcurement: { connect: { id: data.vendorProcurementId } },
        booking: { connect: { id: data.bookingId } },
        eventType: data.eventType,
        message: data.message,
        occurredAt: data.occurredAt ?? new Date(),
      },
    });
    return this.map(row);
  }

  async findByVendorProcurementId(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<ProcurementTimelineEventRecord[]> {
    const rows = await this.prisma.procurementTimelineEvent.findMany({
      where: { tenantId, vendorProcurementId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<ProcurementTimelineEventRecord[]> {
    const rows = await this.prisma.procurementTimelineEvent.findMany({
      where: { tenantId, bookingId },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((r) => this.map(r));
  }

  private map(row: ProcurementTimelineEvent): ProcurementTimelineEventRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      vendorProcurementId: row.vendorProcurementId,
      bookingId: row.bookingId,
      eventType: row.eventType,
      message: row.message,
      occurredAt: row.occurredAt,
      createdAt: row.createdAt,
    };
  }
}
