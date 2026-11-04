import { z } from 'zod';

/**
 * P2-10 — Unified Operations Calendar (frontend mirror of
 * `apps/api/src/modules/calendar/application/dtos/calendar.dto.ts`).
 * Read-only: the calendar owns no operational state, only projections.
 */

export const CALENDAR_ENTRY_SOURCES = [
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
] as const;

export const CALENDAR_SEVERITIES = ['info', 'warn', 'overdue'] as const;

export const CALENDAR_CONFLICT_KINDS = [
  'staff_conflict',
  'inventory_shortage',
  'procurement_delay',
  'pending_reminder',
] as const;

export type CalendarEntrySource = (typeof CALENDAR_ENTRY_SOURCES)[number];
export type CalendarSeverity = (typeof CALENDAR_SEVERITIES)[number];
export type CalendarConflictKind = (typeof CALENDAR_CONFLICT_KINDS)[number];

export const calendarEntrySourceSchema = z.enum(CALENDAR_ENTRY_SOURCES);
export const calendarSeveritySchema = z.enum(CALENDAR_SEVERITIES);
export const calendarConflictKindSchema = z.enum(CALENDAR_CONFLICT_KINDS);

export const calendarEntrySchema = z.object({
  id: z.string().min(1),
  source: calendarEntrySourceSchema,
  title: z.string(),
  /** ISO date (YYYY-MM-DD) or ISO datetime */
  startAt: z.string(),
  endAt: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  bookingId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  staffMemberId: z.string().nullable().optional(),
  inventoryItemId: z.string().nullable().optional(),
  severity: calendarSeveritySchema.optional(),
  hrefHint: z.string().nullable().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type CalendarEntryDto = z.infer<typeof calendarEntrySchema>;

export const calendarConflictItemSchema = z.object({
  id: z.string().min(1),
  kind: calendarConflictKindSchema,
  title: z.string(),
  message: z.string(),
  severity: calendarSeveritySchema,
  bookingId: z.string().nullable().optional(),
  staffMemberId: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  inventoryItemId: z.string().nullable().optional(),
  reminderId: z.string().nullable().optional(),
  occurredAt: z.string().nullable().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type CalendarConflictItemDto = z.infer<typeof calendarConflictItemSchema>;

export const calendarPlanningDashboardSchema = z.object({
  todayEvents: z.array(calendarEntrySchema),
  upcomingEvents: z.array(calendarEntrySchema),
  todayStaff: z.array(calendarEntrySchema),
  pendingProcurements: z.array(calendarEntrySchema),
  inventoryDispatches: z.array(calendarEntrySchema),
  pendingReminders: z.array(calendarEntrySchema),
  overdueItems: z.array(calendarEntrySchema),
  counts: z.object({
    todayEvents: z.number(),
    upcomingEvents: z.number(),
    todayStaff: z.number(),
    pendingProcurements: z.number(),
    inventoryDispatches: z.number(),
    pendingReminders: z.number(),
    overdueItems: z.number(),
  }),
});

export type CalendarPlanningDashboardDto = z.infer<
  typeof calendarPlanningDashboardSchema
>;

export const calendarConflictsSchema = z.object({
  items: z.array(calendarConflictItemSchema),
  counts: z.object({
    staffConflicts: z.number(),
    inventoryShortages: z.number(),
    procurementDelays: z.number(),
    pendingReminders: z.number(),
  }),
});

export type CalendarConflictsDto = z.infer<typeof calendarConflictsSchema>;

const envelope = <T extends z.ZodType>(data: T) => z.object({ data });

export const calendarEntryListEnvelopeSchema = envelope(
  z.array(calendarEntrySchema),
);
export const calendarPlanningDashboardEnvelopeSchema = envelope(
  calendarPlanningDashboardSchema,
);
export const calendarConflictsEnvelopeSchema = envelope(calendarConflictsSchema);

export function parseCalendarEntryList(body: unknown): CalendarEntryDto[] {
  return calendarEntryListEnvelopeSchema.parse(body).data;
}

export function parseCalendarPlanningDashboard(
  body: unknown,
): CalendarPlanningDashboardDto {
  return calendarPlanningDashboardEnvelopeSchema.parse(body).data;
}

export function parseCalendarConflicts(body: unknown): CalendarConflictsDto {
  return calendarConflictsEnvelopeSchema.parse(body).data;
}

export type CalendarRangeQuery = {
  from: string;
  to: string;
  bookingId?: string;
  staffMemberId?: string;
  vendorId?: string;
  customerId?: string;
  inventoryItemId?: string;
  eventType?: string;
  status?: string;
  sources?: CalendarEntrySource[];
};

export type CalendarConflictsQuery = {
  from: string;
  to: string;
  bookingId?: string;
};

/** Builds axios-ready query params, dropping empty values and comma-joining sources. */
export function toCalendarQueryParams(
  query: CalendarRangeQuery,
): Record<string, string> {
  const params: Record<string, string> = { from: query.from, to: query.to };
  if (query.bookingId) params.bookingId = query.bookingId;
  if (query.staffMemberId) params.staffMemberId = query.staffMemberId;
  if (query.vendorId) params.vendorId = query.vendorId;
  if (query.customerId) params.customerId = query.customerId;
  if (query.inventoryItemId) params.inventoryItemId = query.inventoryItemId;
  if (query.eventType) params.eventType = query.eventType;
  if (query.status) params.status = query.status;
  if (query.sources && query.sources.length > 0) {
    params.sources = query.sources.join(',');
  }
  return params;
}

export function formatCalendarSourceLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatCalendarConflictKindLabel(value: string): string {
  return formatCalendarSourceLabel(value);
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Handles both date-only (YYYY-MM-DD) and full ISO datetime entry timestamps. */
export function formatCalendarWhen(value: string | null | undefined): string {
  if (!value) return '—';
  if (DATE_ONLY_RE.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(date);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
