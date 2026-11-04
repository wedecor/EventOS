import type { TimelineEntryRecord } from '../../domain/repositories/timeline-entry.repository';

/** Full timeline record for GET /clients/:id/interactions (decision 4A). */
export type TimelineEntryDto = {
  id: string;
  customerId: string;
  eventId: string;
  type: TimelineEntryRecord['type'];
  message: string;
  occurredAt: Date;
  recordedByUserId: string;
  createdAt: Date;
};

/** Slim create response per docs/09 POST /clients/:id/interactions. */
export type TimelineEntryCreateResultDto = {
  id: string;
  eventId: string;
  type: TimelineEntryRecord['type'];
};

export function toTimelineEntryDto(
  entry: TimelineEntryRecord,
): TimelineEntryDto {
  return {
    id: entry.id,
    customerId: entry.customerId,
    eventId: entry.eventId,
    type: entry.type,
    message: entry.message,
    occurredAt: entry.occurredAt,
    recordedByUserId: entry.recordedByUserId,
    createdAt: entry.createdAt,
  };
}

export function toTimelineEntryCreateResultDto(
  entry: TimelineEntryRecord,
): TimelineEntryCreateResultDto {
  return {
    id: entry.id,
    eventId: entry.eventId,
    type: entry.type,
  };
}
