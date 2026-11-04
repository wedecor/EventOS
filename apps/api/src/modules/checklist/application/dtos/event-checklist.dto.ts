import type { EventChecklistRecord } from '../../domain/repositories/event-checklist.repository';
import type { EventChecklistItemRecord } from '../../domain/repositories/event-checklist-item.repository';

export type EventChecklistItemDto = EventChecklistItemRecord;

export type EventChecklistDto = EventChecklistRecord & {
  items: EventChecklistItemDto[];
};

export function toEventChecklistItemDto(
  record: EventChecklistItemRecord,
): EventChecklistItemDto {
  return { ...record };
}

export function toEventChecklistDto(
  record: EventChecklistRecord,
  items: EventChecklistItemRecord[] = [],
): EventChecklistDto {
  return {
    ...record,
    items: items.map(toEventChecklistItemDto),
  };
}
