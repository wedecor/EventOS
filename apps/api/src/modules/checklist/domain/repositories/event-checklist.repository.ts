import type { TaskCategory } from '@prisma/client';

export type EventChecklistRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  templateId: string | null;
  templateVersion: number | null;
  name: string;
  description: string | null;
  category: TaskCategory;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateEventChecklistData = {
  bookingId: string;
  templateId?: string | null;
  templateVersion?: number | null;
  name: string;
  description?: string | null;
  category?: TaskCategory;
  sortOrder?: number;
};

export abstract class EventChecklistRepository {
  abstract create(
    tenantId: string,
    data: CreateEventChecklistData,
  ): Promise<EventChecklistRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<EventChecklistRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<EventChecklistRecord[]>;

  abstract findByBookingAndTemplate(
    tenantId: string,
    bookingId: string,
    templateId: string,
  ): Promise<EventChecklistRecord | null>;
}
