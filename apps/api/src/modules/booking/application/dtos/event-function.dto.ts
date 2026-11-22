import type { EventFunctionRecord } from '../../domain/repositories/event-function.repository';

export type EventFunctionDto = {
  id: string;
  bookingId: string;
  externalFunctionId: string | null;
  eventType: string;
  eventTypeLabel: string | null;
  /** IST calendar date `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm`, Asia/Kolkata. */
  time: string | null;
  timezone: 'Asia/Kolkata';
  venueName: string | null;
  venueArea: string | null;
  venueAddress: string | null;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  sortOrder: number;
  status: EventFunctionRecord['status'];
  version: number;
};

export function toEventFunctionDto(fn: EventFunctionRecord): EventFunctionDto {
  return {
    id: fn.id,
    bookingId: fn.bookingId,
    externalFunctionId: fn.externalFunctionId,
    eventType: fn.eventType,
    eventTypeLabel: fn.eventTypeLabel,
    date: fn.date.toISOString().slice(0, 10),
    time: fn.time,
    timezone: 'Asia/Kolkata',
    venueName: fn.venueName,
    venueArea: fn.venueArea,
    venueAddress: fn.venueAddress,
    placeId: fn.placeId,
    lat: fn.lat,
    lng: fn.lng,
    notes: fn.notes,
    sortOrder: fn.sortOrder,
    status: fn.status,
    version: fn.version,
  };
}
