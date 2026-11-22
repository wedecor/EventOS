import { z } from 'zod';

export const calendarEntrySourceSchema = z.enum([
  'event',
  'staff_assignment',
  'staff_leave',
  'staff_availability',
  'procurement',
  'inventory_movement',
  'inventory_reservation',
  'reminder',
  'communication',
  'finance_document',
]);

export const calendarRangeQuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
  bookingId: z.string().uuid().optional(),
  staffMemberId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  status: z.string().optional(),
  /** Comma-separated CalendarEntrySource values */
  sources: z.string().optional(),
});

export const calendarConflictsQuerySchema = z.object({
  from: z.string().date(),
  to: z.string().date(),
  bookingId: z.string().uuid().optional(),
});

export type CalendarRangeQuery = z.infer<typeof calendarRangeQuerySchema>;
export type CalendarConflictsQuery = z.infer<
  typeof calendarConflictsQuerySchema
>;

export function parseSources(
  raw?: string,
): z.infer<typeof calendarEntrySourceSchema>[] | undefined {
  if (!raw || raw.trim() === '') return undefined;
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const parsed: z.infer<typeof calendarEntrySourceSchema>[] = [];
  for (const part of parts) {
    const result = calendarEntrySourceSchema.safeParse(part);
    if (result.success) parsed.push(result.data);
  }
  return parsed.length > 0 ? parsed : undefined;
}
