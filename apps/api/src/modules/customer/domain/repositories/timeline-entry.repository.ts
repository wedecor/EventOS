import type { TimelineEntryType } from '@prisma/client';

export type TimelineEntryRecord = {
  id: string;
  tenantId: string;
  customerId: string;
  eventId: string;
  type: TimelineEntryType;
  message: string;
  occurredAt: Date;
  recordedByUserId: string;
  createdAt: Date;
};

export type CreateTimelineEntryData = {
  customerId: string;
  eventId: string;
  type: TimelineEntryType;
  message: string;
  occurredAt: Date;
  recordedByUserId: string;
};

export abstract class TimelineEntryRepository {
  abstract create(
    tenantId: string,
    data: CreateTimelineEntryData,
  ): Promise<TimelineEntryRecord>;

  abstract findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<TimelineEntryRecord[]>;
}
