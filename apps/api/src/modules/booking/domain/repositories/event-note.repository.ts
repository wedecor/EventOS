export type EventNoteRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  body: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateEventNoteData = {
  bookingId: string;
  body: string;
  createdByUserId: string;
};

export abstract class EventNoteRepository {
  abstract create(
    tenantId: string,
    data: CreateEventNoteData,
  ): Promise<EventNoteRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<EventNoteRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<EventNoteRecord[]>;

  abstract remove(tenantId: string, id: string): Promise<void>;
}
