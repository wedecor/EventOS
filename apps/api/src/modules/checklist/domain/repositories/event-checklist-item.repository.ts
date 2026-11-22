export type EventChecklistItemRecord = {
  id: string;
  tenantId: string;
  checklistId: string;
  title: string;
  description: string | null;
  isRequired: boolean;
  defaultAssigneeRole: string | null;
  estimatedDurationMinutes: number | null;
  sortOrder: number;
  isCompleted: boolean;
  completedAt: Date | null;
  completedByUserId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateEventChecklistItemData = {
  title: string;
  description?: string | null;
  isRequired?: boolean;
  defaultAssigneeRole?: string | null;
  estimatedDurationMinutes?: number | null;
  sortOrder?: number;
};

export type UpdateEventChecklistItemData = {
  isCompleted?: boolean;
  completedAt?: Date | null;
  completedByUserId?: string | null;
  notes?: string | null;
};

export abstract class EventChecklistItemRepository {
  abstract create(
    tenantId: string,
    checklistId: string,
    data: CreateEventChecklistItemData,
  ): Promise<EventChecklistItemRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<EventChecklistItemRecord | null>;

  abstract findByChecklistId(
    tenantId: string,
    checklistId: string,
  ): Promise<EventChecklistItemRecord[]>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<EventChecklistItemRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateEventChecklistItemData,
    version: number,
  ): Promise<EventChecklistItemRecord>;
}
