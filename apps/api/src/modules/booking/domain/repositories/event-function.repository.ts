/**
 * M5-01 — functions (ceremonies) of a booking, e.g. Haldi / Sangeet / Wedding.
 * Populated by the Enquiries feed; later the attachment point for gig shifts (P3-01).
 */
export type EventFunctionStatus = 'active' | 'cancelled';

export type EventFunctionRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  externalFunctionId: string | null;
  eventType: string;
  eventTypeLabel: string | null;
  /** IST calendar date stored as a UTC-midnight Date (no timezone shifting). */
  date: Date;
  /** HH:mm wall-clock time (Asia/Kolkata). */
  time: string | null;
  venueName: string | null;
  venueArea: string | null;
  venueAddress: string | null;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  sortOrder: number;
  status: EventFunctionStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateEventFunctionData = {
  externalFunctionId?: string | null;
  eventType: string;
  eventTypeLabel?: string | null;
  date: Date;
  time?: string | null;
  venueName?: string | null;
  venueArea?: string | null;
  venueAddress?: string | null;
  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  sortOrder?: number;
  status?: EventFunctionStatus;
};

export type UpdateEventFunctionData = Partial<
  Omit<CreateEventFunctionData, 'externalFunctionId'>
>;

export abstract class EventFunctionRepository {
  abstract listByBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<EventFunctionRecord[]>;

  abstract create(
    tenantId: string,
    bookingId: string,
    data: CreateEventFunctionData,
  ): Promise<EventFunctionRecord>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateEventFunctionData,
    version: number,
  ): Promise<EventFunctionRecord>;

  abstract delete(tenantId: string, id: string): Promise<void>;
}
