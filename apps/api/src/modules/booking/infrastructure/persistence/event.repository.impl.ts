import { Injectable } from '@nestjs/common';
import type { Event, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateEventData,
  EventRecord,
  EventRepository,
  FindByEventDateFilter,
  UpdateEventData,
} from '../../domain/repositories/event.repository';

@Injectable()
export class EventRepositoryImpl
  extends TenantScopedRepository
  implements EventRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(tenantId: string, data: CreateEventData): Promise<EventRecord> {
    const event = await this.prisma.event.create({
      data: this.toCreateInput(tenantId, data),
    });

    return this.mapEvent(event);
  }

  async findById(tenantId: string, id: string): Promise<EventRecord | null> {
    const event = await this.prisma.event.findFirst({
      where: { id, tenantId },
    });

    return event ? this.mapEvent(event) : null;
  }

  async findByQuotationId(
    tenantId: string,
    quotationId: string,
  ): Promise<EventRecord | null> {
    const event = await this.prisma.event.findFirst({
      where: { tenantId, quotationId },
    });

    return event ? this.mapEvent(event) : null;
  }

  async findByLeadId(
    tenantId: string,
    leadId: string,
  ): Promise<EventRecord | null> {
    const event = await this.prisma.event.findFirst({
      where: { tenantId, leadId },
    });

    return event ? this.mapEvent(event) : null;
  }

  async findMaxBookingNumber(tenantId: string): Promise<number> {
    const result = await this.prisma.event.aggregate({
      where: { tenantId },
      _max: { bookingNumber: true },
    });

    return result._max.bookingNumber ?? 0;
  }

  async findByEventDate(
    tenantId: string,
    filter: FindByEventDateFilter,
  ): Promise<EventRecord[]> {
    const eventStartDate: Prisma.DateTimeNullableFilter = {};

    if (filter.from) {
      eventStartDate.gte = filter.from;
    }

    if (filter.to) {
      eventStartDate.lte = filter.to;
    }

    const events = await this.prisma.event.findMany({
      where: {
        tenantId,
        ...(filter.from || filter.to ? { eventStartDate } : {}),
      },
      orderBy: { eventStartDate: 'asc' },
    });

    return events.map((event) => this.mapEvent(event));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEventData,
    version: number,
  ): Promise<EventRecord> {
    try {
      const event = await this.prisma.event.update({
        where: { id, tenantId, version },
        data: {
          ...this.toUpdateInput(data),
          version: { increment: 1 },
        },
      });

      return this.mapEvent(event);
    } catch (error: unknown) {
      return this.toConcurrentModification('Event', id, error);
    }
  }

  private toCreateInput(
    tenantId: string,
    data: CreateEventData,
  ): Prisma.EventCreateInput {
    return {
      tenant: { connect: { id: tenantId } },
      customer: { connect: { id: data.customerId } },
      quotation: { connect: { id: data.quotationId } },
      lead: data.leadId ? { connect: { id: data.leadId } } : undefined,
      bookingNumber: data.bookingNumber,
      status: data.status ?? 'approved',
      eventType: data.eventType ?? null,
      eventStartDate: data.eventStartDate ?? null,
      eventEndDate: data.eventEndDate ?? null,
      venueName: data.venueName ?? null,
      guestCount: data.guestCount ?? null,
      requirementsNotes: data.requirementsNotes ?? null,
      workspaceStatus: data.workspaceStatus ?? 'inactive',
      preparationStatus: data.preparationStatus ?? 'pending',
      operationalMilestone: data.operationalMilestone ?? null,
      executionOwner: data.executionOwnerId
        ? { connect: { id: data.executionOwnerId } }
        : undefined,
    };
  }

  private toUpdateInput(data: UpdateEventData): Prisma.EventUpdateInput {
    return {
      status: data.status,
      eventType: data.eventType,
      eventStartDate: data.eventStartDate,
      eventEndDate: data.eventEndDate,
      venueName: data.venueName,
      guestCount: data.guestCount,
      requirementsNotes: data.requirementsNotes,
      workspaceStatus: data.workspaceStatus,
      preparationStatus: data.preparationStatus,
      operationalMilestone: data.operationalMilestone,
      executionOwner:
        data.executionOwnerId === undefined
          ? undefined
          : data.executionOwnerId === null
            ? { disconnect: true }
            : { connect: { id: data.executionOwnerId } },
      cancellationReason: data.cancellationReason,
      completedAt: data.completedAt,
    };
  }

  private mapEvent(event: Event): EventRecord {
    return {
      id: event.id,
      tenantId: event.tenantId,
      customerId: event.customerId,
      leadId: event.leadId,
      quotationId: event.quotationId,
      bookingNumber: event.bookingNumber,
      status: event.status,
      eventType: event.eventType,
      eventStartDate: event.eventStartDate,
      eventEndDate: event.eventEndDate,
      venueName: event.venueName,
      guestCount: event.guestCount,
      requirementsNotes: event.requirementsNotes,
      workspaceStatus: event.workspaceStatus,
      preparationStatus: event.preparationStatus,
      operationalMilestone: event.operationalMilestone,
      executionOwnerId: event.executionOwnerId,
      cancellationReason: event.cancellationReason,
      completedAt: event.completedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      version: event.version,
    };
  }
}
