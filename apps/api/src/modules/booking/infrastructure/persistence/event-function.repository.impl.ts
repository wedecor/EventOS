import { Injectable } from '@nestjs/common';
import type { EventFunction, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import {
  EventFunctionRepository,
  type CreateEventFunctionData,
  type EventFunctionRecord,
  type EventFunctionStatus,
  type UpdateEventFunctionData,
} from '../../domain/repositories/event-function.repository';

@Injectable()
export class EventFunctionRepositoryImpl
  extends TenantScopedRepository
  implements EventFunctionRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async listByBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<EventFunctionRecord[]> {
    const rows = await this.prisma.eventFunction.findMany({
      where: { tenantId, bookingId },
      orderBy: [{ sortOrder: 'asc' }, { date: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.map(row));
  }

  async create(
    tenantId: string,
    bookingId: string,
    data: CreateEventFunctionData,
  ): Promise<EventFunctionRecord> {
    const row = await this.prisma.eventFunction.create({
      data: {
        tenantId,
        bookingId,
        externalFunctionId: data.externalFunctionId ?? null,
        eventType: data.eventType,
        eventTypeLabel: data.eventTypeLabel ?? null,
        date: data.date,
        time: data.time ?? null,
        venueName: data.venueName ?? null,
        venueArea: data.venueArea ?? null,
        venueAddress: data.venueAddress ?? null,
        placeId: data.placeId ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        notes: data.notes ?? null,
        sortOrder: data.sortOrder ?? 0,
        status: data.status ?? 'active',
      },
    });
    return this.map(row);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEventFunctionData,
    version: number,
  ): Promise<EventFunctionRecord> {
    const input: Prisma.EventFunctionUpdateInput = {
      ...(data.eventType !== undefined && { eventType: data.eventType }),
      ...(data.eventTypeLabel !== undefined && {
        eventTypeLabel: data.eventTypeLabel,
      }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.time !== undefined && { time: data.time }),
      ...(data.venueName !== undefined && { venueName: data.venueName }),
      ...(data.venueArea !== undefined && { venueArea: data.venueArea }),
      ...(data.venueAddress !== undefined && {
        venueAddress: data.venueAddress,
      }),
      ...(data.placeId !== undefined && { placeId: data.placeId }),
      ...(data.lat !== undefined && { lat: data.lat }),
      ...(data.lng !== undefined && { lng: data.lng }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.status !== undefined && { status: data.status }),
    };

    try {
      const row = await this.prisma.eventFunction.update({
        where: { id, tenantId, version },
        data: { ...input, version: { increment: 1 } },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('EventFunction', id, error);
    }
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.eventFunction.deleteMany({ where: { id, tenantId } });
  }

  private map(row: EventFunction): EventFunctionRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      bookingId: row.bookingId,
      externalFunctionId: row.externalFunctionId,
      eventType: row.eventType,
      eventTypeLabel: row.eventTypeLabel,
      date: row.date,
      time: row.time,
      venueName: row.venueName,
      venueArea: row.venueArea,
      venueAddress: row.venueAddress,
      placeId: row.placeId,
      lat: this.toNumber(row.lat),
      lng: this.toNumber(row.lng),
      notes: row.notes,
      sortOrder: row.sortOrder,
      status: row.status as EventFunctionStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
