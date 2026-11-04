import type { ReminderRecord } from '../../domain/repositories/reminder.repository';

export type ReminderDto = {
  id: string;
  tenantId: string;
  bookingId: string | null;
  customerId: string | null;
  vendorId: string | null;
  staffMemberId: string | null;
  communicationRecordId: string | null;
  category: ReminderRecord['category'];
  title: string;
  notes: string | null;
  dueAt: Date;
  status: ReminderRecord['status'];
  assignedToUserId: string | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toReminderDto(record: ReminderRecord): ReminderDto {
  return { ...record };
}
