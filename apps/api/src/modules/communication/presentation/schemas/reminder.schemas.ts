import { z } from 'zod';

export const reminderCategorySchema = z.enum([
  'payment_follow_up',
  'event_reminder',
  'vendor_follow_up',
  'customer_follow_up',
  'staff_follow_up',
  'other',
]);

export const createReminderSchema = z.object({
  bookingId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  staffMemberId: z.string().uuid().optional(),
  communicationRecordId: z.string().uuid().optional(),
  category: reminderCategorySchema.optional(),
  title: z.string().min(1),
  notes: z.string().optional(),
  dueAt: z.string().datetime(),
  assignedToUserId: z.string().uuid().optional(),
});

export type CreateReminderBody = z.infer<typeof createReminderSchema>;
