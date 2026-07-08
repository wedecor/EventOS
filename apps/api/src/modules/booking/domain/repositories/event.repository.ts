import type { EventStatus, PreparationStatus } from '@prisma/client';

export type EventRecord = {
  id: string;
  tenantId: string;
  customerId: string;
  leadId: string | null;
  quotationId: string;
  bookingNumber: number;
  status: EventStatus;
  eventType: string | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  venueName: string | null;
  guestCount: number | null;
  requirementsNotes: string | null;
  preparationStatus: PreparationStatus;
  operationalMilestone: string | null;
  executionOwnerId: string | null;
  cancellationReason: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateEventData = {
  customerId: string;
  quotationId: string;
  leadId?: string | null;
  bookingNumber: number;
  status?: EventStatus;
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venueName?: string | null;
  guestCount?: number | null;
  requirementsNotes?: string | null;
  preparationStatus?: PreparationStatus;
  operationalMilestone?: string | null;
  executionOwnerId?: string | null;
};

export type UpdateEventData = {
  status?: EventStatus;
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venueName?: string | null;
  guestCount?: number | null;
  requirementsNotes?: string | null;
  preparationStatus?: PreparationStatus;
  operationalMilestone?: string | null;
  executionOwnerId?: string | null;
  cancellationReason?: string | null;
  completedAt?: Date | null;
};

export type FindByEventDateFilter = {
  from?: Date;
  to?: Date;
};

export abstract class EventRepository {
  abstract create(
    tenantId: string,
    data: CreateEventData,
  ): Promise<EventRecord>;

  abstract findById(tenantId: string, id: string): Promise<EventRecord | null>;

  abstract findByQuotationId(
    tenantId: string,
    quotationId: string,
  ): Promise<EventRecord | null>;

  abstract findMaxBookingNumber(tenantId: string): Promise<number>;

  abstract findByEventDate(
    tenantId: string,
    filter: FindByEventDateFilter,
  ): Promise<EventRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateEventData,
    version: number,
  ): Promise<EventRecord>;
}
