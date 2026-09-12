import type { EventStatus, PreparationStatus } from '@prisma/client';

export type UpcomingEventItemDto = {
  bookingId: string;
  bookingNumber: number;
  eventType: string | null;
  eventStartDate: Date | null;
  venueName: string | null;
  status: EventStatus;
  preparationStatus: PreparationStatus;
};

// EP1-OPS-005, EP1-AUT-006 — Upcoming events: calendar visibility for events starting within
// the requested window (read-only projection of Event data, ordered by event start date).
export type UpcomingEventsDto = {
  items: UpcomingEventItemDto[];
};
