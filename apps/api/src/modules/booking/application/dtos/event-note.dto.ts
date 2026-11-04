import type { EventNoteRecord } from '../../domain/repositories/event-note.repository';

export type EventNoteDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  body: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toEventNoteDto(record: EventNoteRecord): EventNoteDto {
  return { ...record };
}
