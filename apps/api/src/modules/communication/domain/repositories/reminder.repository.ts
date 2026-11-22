import type { ReminderCategory, ReminderStatus } from '@prisma/client';

export type ReminderRecord = {
  id: string;
  tenantId: string;
  bookingId: string | null;
  customerId: string | null;
  vendorId: string | null;
  staffMemberId: string | null;
  communicationRecordId: string | null;
  category: ReminderCategory;
  title: string;
  notes: string | null;
  dueAt: Date;
  status: ReminderStatus;
  assignedToUserId: string | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateReminderData = {
  bookingId?: string | null;
  customerId?: string | null;
  vendorId?: string | null;
  staffMemberId?: string | null;
  communicationRecordId?: string | null;
  category?: ReminderCategory;
  title: string;
  notes?: string | null;
  dueAt: Date;
  assignedToUserId?: string | null;
};

export type UpdateReminderData = {
  status?: ReminderStatus;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  notes?: string | null;
  title?: string;
  dueAt?: Date;
  assignedToUserId?: string | null;
};

export abstract class ReminderRepository {
  abstract create(
    tenantId: string,
    data: CreateReminderData,
  ): Promise<ReminderRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<ReminderRecord | null>;

  abstract findAll(tenantId: string): Promise<ReminderRecord[]>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<ReminderRecord[]>;

  abstract findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<ReminderRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateReminderData,
    version: number,
  ): Promise<ReminderRecord>;
}
