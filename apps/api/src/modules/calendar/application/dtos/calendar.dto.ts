/**
 * P2-10 — Unified Operations Calendar read models.
 * Calendar owns no operational state; entries project existing module facts.
 */

export type CalendarEntrySource =
  | 'event'
  | 'staff_assignment'
  | 'staff_leave'
  | 'staff_availability'
  | 'procurement'
  | 'inventory_movement'
  | 'inventory_reservation'
  | 'reminder'
  | 'communication'
  | 'finance_document';

export type CalendarSeverity = 'info' | 'warn' | 'overdue';

export type CalendarEntryDto = {
  id: string;
  source: CalendarEntrySource;
  title: string;
  /** ISO date (YYYY-MM-DD) or ISO datetime */
  startAt: string;
  endAt?: string | null;
  status?: string | null;
  bookingId?: string | null;
  customerId?: string | null;
  vendorId?: string | null;
  staffMemberId?: string | null;
  inventoryItemId?: string | null;
  severity?: CalendarSeverity;
  /** Frontend deep-link path hint (relative). */
  hrefHint?: string | null;
  meta?: Record<string, unknown>;
};

export type CalendarConflictItemDto = {
  id: string;
  kind:
    | 'staff_conflict'
    | 'inventory_shortage'
    | 'procurement_delay'
    | 'pending_reminder';
  title: string;
  message: string;
  severity: CalendarSeverity;
  bookingId?: string | null;
  staffMemberId?: string | null;
  vendorId?: string | null;
  inventoryItemId?: string | null;
  reminderId?: string | null;
  occurredAt?: string | null;
  meta?: Record<string, unknown>;
};

export type CalendarPlanningDashboardDto = {
  todayEvents: CalendarEntryDto[];
  upcomingEvents: CalendarEntryDto[];
  todayStaff: CalendarEntryDto[];
  pendingProcurements: CalendarEntryDto[];
  inventoryDispatches: CalendarEntryDto[];
  pendingReminders: CalendarEntryDto[];
  overdueItems: CalendarEntryDto[];
  counts: {
    todayEvents: number;
    upcomingEvents: number;
    todayStaff: number;
    pendingProcurements: number;
    inventoryDispatches: number;
    pendingReminders: number;
    overdueItems: number;
  };
};

export type CalendarConflictsDto = {
  items: CalendarConflictItemDto[];
  counts: {
    staffConflicts: number;
    inventoryShortages: number;
    procurementDelays: number;
    pendingReminders: number;
  };
};
