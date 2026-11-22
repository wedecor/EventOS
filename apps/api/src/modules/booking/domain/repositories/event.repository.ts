import type {
  EventStatus,
  PreparationStatus,
  WorkspaceStatus,
} from '@prisma/client';

export type EventRecord = {
  id: string;
  tenantId: string;
  customerId: string;
  leadId: string | null;
  quotationId: string | null;
  bookingNumber: number;
  status: EventStatus;
  eventType: string | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  venueName: string | null;
  guestCount: number | null;
  requirementsNotes: string | null;
  workspaceStatus: WorkspaceStatus;
  preparationStatus: PreparationStatus;
  operationalMilestone: string | null;
  executionOwnerId: string | null;
  cancellationReason: string | null;
  completedAt: Date | null;
  /** M5-01 — origin system ('eventos' or e.g. 'wedecor-enquiries'). */
  source: string;
  externalRef: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateEventData = {
  customerId: string;
  /** Null for events synced from an external source (M5-01). */
  quotationId: string | null;
  leadId?: string | null;
  bookingNumber: number;
  status?: EventStatus;
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venueName?: string | null;
  guestCount?: number | null;
  requirementsNotes?: string | null;
  workspaceStatus?: WorkspaceStatus;
  preparationStatus?: PreparationStatus;
  operationalMilestone?: string | null;
  executionOwnerId?: string | null;
  source?: string;
  externalRef?: string | null;
};

export type UpdateEventData = {
  status?: EventStatus;
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venueName?: string | null;
  guestCount?: number | null;
  requirementsNotes?: string | null;
  workspaceStatus?: WorkspaceStatus;
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

  abstract findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<EventRecord[]>;

  abstract findByQuotationId(
    tenantId: string,
    quotationId: string,
  ): Promise<EventRecord | null>;

  abstract findByLeadId(
    tenantId: string,
    leadId: string,
  ): Promise<EventRecord | null>;

  abstract findMaxBookingNumber(tenantId: string): Promise<number>;

  abstract findByEventDate(
    tenantId: string,
    filter: FindByEventDateFilter,
  ): Promise<EventRecord[]>;

  abstract findPage(
    tenantId: string,
    options: {
      page: number;
      pageSize: number;
      q?: string;
      status?: string;
      sort?: 'createdAt' | 'eventStartDate';
      order?: 'asc' | 'desc';
    },
  ): Promise<{ items: EventRecord[]; total: number }>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateEventData,
    version: number,
  ): Promise<EventRecord>;
}
