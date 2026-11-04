import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { CommunicationRecordRepository } from '../../../communication/domain/repositories/communication-record.repository';
import { ReminderRepository } from '../../../communication/domain/repositories/reminder.repository';
import { FinancialDocumentRepository } from '../../../finance/domain/repositories/financial-document.repository';
import { InventoryAvailabilityService } from '../../../inventory/application/services/inventory-availability.service';
import { InventoryMovementRepository } from '../../../inventory/domain/repositories/inventory-movement.repository';
import { InventoryReservationRepository } from '../../../inventory/domain/repositories/inventory-reservation.repository';
import { SchedulingApplicationService } from '../../../staff/application/services/scheduling.application.service';
import { StaffAssignmentRepository } from '../../../staff/domain/repositories/staff-assignment.repository';
import { StaffAvailabilityRepository } from '../../../staff/domain/repositories/staff-availability.repository';
import { StaffLeaveRepository } from '../../../staff/domain/repositories/staff-leave.repository';
import { StaffMemberRepository } from '../../../staff/domain/repositories/staff-member.repository';
import { VendorProcurementRepository } from '../../../vendor/domain/repositories/vendor-procurement.repository';
import type {
  CalendarConflictItemDto,
  CalendarConflictsDto,
  CalendarEntryDto,
  CalendarEntrySource,
  CalendarPlanningDashboardDto,
} from '../dtos/calendar.dto';

export type CalendarQueryFilter = {
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

const PROCUREMENT_OPEN = new Set([
  'draft',
  'quotation_requested',
  'quotation_received',
  'approved',
  'purchase_ordered',
  'vendor_confirmed',
  'materials_delivered',
]);

const DISPATCH_READY = new Set([
  'planned',
  'picked',
  'packing_started',
  'packed',
  'verified',
  'ready_for_dispatch',
]);

function startOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfDay(next);
}

function toDateKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

function toIso(d: Date): string {
  return d.toISOString();
}

function datesOverlap(
  aStart: Date | null,
  aEnd: Date | null,
  bStart: Date | null,
  bEnd: Date | null,
): boolean {
  if (!aStart || !bStart) return false;
  const aE = aEnd ?? aStart;
  const bE = bEnd ?? bStart;
  return (
    startOfDay(aStart) <= startOfDay(bE) && startOfDay(bStart) <= startOfDay(aE)
  );
}

function parseRange(
  fromIso: string,
  toIso: string,
): Result<{ from: Date; to: Date }> {
  const from = startOfDay(new Date(fromIso));
  const to = startOfDay(new Date(toIso));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return failure('VALIDATION_ERROR', 'Invalid calendar date range.');
  }
  return success({ from, to });
}

function eachDate(from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  let cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function sourceAllowed(
  source: CalendarEntrySource,
  sources?: CalendarEntrySource[],
): boolean {
  if (!sources || sources.length === 0) return true;
  return sources.includes(source);
}

function matchesFilters(
  entry: CalendarEntryDto,
  filter: CalendarQueryFilter,
): boolean {
  if (filter.bookingId && entry.bookingId !== filter.bookingId) return false;
  if (filter.staffMemberId && entry.staffMemberId !== filter.staffMemberId) {
    return false;
  }
  if (filter.vendorId && entry.vendorId !== filter.vendorId) return false;
  if (filter.customerId && entry.customerId !== filter.customerId) return false;
  if (
    filter.inventoryItemId &&
    entry.inventoryItemId !== filter.inventoryItemId
  ) {
    return false;
  }
  if (filter.status && entry.status !== filter.status) return false;
  if (
    filter.eventType &&
    entry.meta?.eventType !== filter.eventType &&
    !(
      typeof entry.meta?.eventType === 'string' &&
      entry.meta.eventType === filter.eventType
    )
  ) {
    // Events carry eventType in meta; other sources ignore unless set
    if (entry.source === 'event') return false;
  }
  return sourceAllowed(entry.source, filter.sources);
}

function sortEntries(a: CalendarEntryDto, b: CalendarEntryDto): number {
  const cmp = a.startAt.localeCompare(b.startAt);
  if (cmp !== 0) return cmp;
  return a.id.localeCompare(b.id);
}

// P2-10 — Read-only aggregation; no write ownership
@Injectable()
export class CalendarApplicationService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly staffMemberRepository: StaffMemberRepository,
    private readonly staffAssignmentRepository: StaffAssignmentRepository,
    private readonly leaveRepository: StaffLeaveRepository,
    private readonly availabilityRepository: StaffAvailabilityRepository,
    private readonly vendorProcurementRepository: VendorProcurementRepository,
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly inventoryReservationRepository: InventoryReservationRepository,
    private readonly reminderRepository: ReminderRepository,
    private readonly communicationRecordRepository: CommunicationRecordRepository,
    private readonly financialDocumentRepository: FinancialDocumentRepository,
    private readonly schedulingService: SchedulingApplicationService,
    private readonly inventoryAvailabilityService: InventoryAvailabilityService,
  ) {}

  async getEvents(
    tenantId: string,
    filter: CalendarQueryFilter,
  ): Promise<Result<CalendarEntryDto[]>> {
    const range = parseRange(filter.from, filter.to);
    if (!range.ok) return range;

    const entries = await this.aggregateOperationalEntries(
      tenantId,
      range.value.from,
      range.value.to,
      filter,
      'calendar',
    );
    return success(entries.sort(sortEntries));
  }

  async getAgenda(
    tenantId: string,
    filter: CalendarQueryFilter,
  ): Promise<Result<CalendarEntryDto[]>> {
    return this.getEvents(tenantId, filter);
  }

  async getTimeline(
    tenantId: string,
    filter: CalendarQueryFilter,
  ): Promise<Result<CalendarEntryDto[]>> {
    const range = parseRange(filter.from, filter.to);
    if (!range.ok) return range;

    const entries = await this.aggregateOperationalEntries(
      tenantId,
      range.value.from,
      range.value.to,
      filter,
      'timeline',
    );
    return success(entries.sort(sortEntries));
  }

  async getPlanningDashboard(
    tenantId: string,
  ): Promise<Result<CalendarPlanningDashboardDto>> {
    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 6);
    const filterBase: CalendarQueryFilter = {
      from: toDateKey(addDays(today, -1)),
      to: toDateKey(addDays(today, 30)),
    };

    const [eventsToday, eventsUpcoming, allInHorizon] = await Promise.all([
      this.aggregateOperationalEntries(
        tenantId,
        today,
        today,
        { ...filterBase, from: toDateKey(today), to: toDateKey(today) },
        'calendar',
      ),
      this.aggregateOperationalEntries(
        tenantId,
        addDays(today, 1),
        weekEnd,
        {
          ...filterBase,
          from: toDateKey(addDays(today, 1)),
          to: toDateKey(weekEnd),
        },
        'calendar',
      ),
      this.aggregateOperationalEntries(
        tenantId,
        addDays(today, -14),
        addDays(today, 30),
        {
          ...filterBase,
          from: toDateKey(addDays(today, -14)),
          to: toDateKey(addDays(today, 30)),
        },
        'calendar',
      ),
    ]);

    const todayEvents = eventsToday.filter((e) => e.source === 'event');
    const upcomingEvents = eventsUpcoming.filter((e) => e.source === 'event');
    const todayStaff = eventsToday.filter(
      (e) =>
        e.source === 'staff_assignment' ||
        e.source === 'staff_leave' ||
        e.source === 'staff_availability',
    );
    const pendingProcurements = allInHorizon.filter(
      (e) =>
        e.source === 'procurement' &&
        e.status != null &&
        PROCUREMENT_OPEN.has(e.status),
    );
    const inventoryDispatches = allInHorizon.filter(
      (e) =>
        e.source === 'inventory_movement' &&
        e.status != null &&
        DISPATCH_READY.has(e.status),
    );
    const pendingReminders = allInHorizon.filter(
      (e) => e.source === 'reminder' && e.status === 'pending',
    );
    const overdueItems = allInHorizon.filter((e) => e.severity === 'overdue');

    return success({
      todayEvents,
      upcomingEvents,
      todayStaff,
      pendingProcurements,
      inventoryDispatches,
      pendingReminders,
      overdueItems,
      counts: {
        todayEvents: todayEvents.length,
        upcomingEvents: upcomingEvents.length,
        todayStaff: todayStaff.length,
        pendingProcurements: pendingProcurements.length,
        inventoryDispatches: inventoryDispatches.length,
        pendingReminders: pendingReminders.length,
        overdueItems: overdueItems.length,
      },
    });
  }

  async getConflicts(
    tenantId: string,
    filter: {
      from: string;
      to: string;
      bookingId?: string;
    },
  ): Promise<Result<CalendarConflictsDto>> {
    const range = parseRange(filter.from, filter.to);
    if (!range.ok) return range;
    const { from, to } = range.value;
    const today = startOfDay(new Date());
    const items: CalendarConflictItemDto[] = [];

    const events = await this.eventRepository.findByEventDate(tenantId, {
      from,
      to,
    });
    const scopedEvents = filter.bookingId
      ? events.filter((e) => e.id === filter.bookingId)
      : events;

    // Staff conflicts — reuse SchedulingApplicationService (display only)
    for (const event of scopedEvents) {
      const assignments = await this.staffAssignmentRepository.findByBookingId(
        tenantId,
        event.id,
      );
      for (const assignment of assignments) {
        if (assignment.status === 'cancelled') continue;
        const result =
          await this.schedulingService.detectConflictsForStaffOnBooking(
            tenantId,
            assignment.staffMemberId,
            event.id,
            assignment.id,
          );
        if (!result.ok) continue;
        for (const conflict of result.value) {
          items.push({
            id: `staff-${assignment.id}-${conflict.code}`,
            kind: 'staff_conflict',
            title: `Staff conflict · B-${event.bookingNumber}`,
            message: conflict.message,
            severity: 'warn',
            bookingId: event.id,
            staffMemberId: assignment.staffMemberId,
            meta: { code: conflict.code, details: conflict.details },
          });
        }
      }
    }

    // Procurement delays — requiredDate past, still open
    const procurements =
      await this.vendorProcurementRepository.findAll(tenantId);
    for (const p of procurements) {
      if (filter.bookingId && p.bookingId !== filter.bookingId) continue;
      if (!p.requiredDate) continue;
      if (!PROCUREMENT_OPEN.has(p.workflowStatus)) continue;
      const required = startOfDay(p.requiredDate);
      if (required < today || datesOverlap(required, required, from, to)) {
        if (required < today) {
          items.push({
            id: `procurement-delay-${p.id}`,
            kind: 'procurement_delay',
            title: 'Procurement delay',
            message: `Required ${toDateKey(required)}; workflow is ${p.workflowStatus}.`,
            severity: 'overdue',
            bookingId: p.bookingId,
            vendorId: p.vendorId,
            occurredAt: toDateKey(required),
            meta: {
              procurementId: p.id,
              workflowStatus: p.workflowStatus,
            },
          });
        }
      }
    }

    // Inventory shortages — display-only via availability snapshots for active reservations
    for (const event of scopedEvents) {
      const reservations =
        await this.inventoryReservationRepository.findByBookingId(
          tenantId,
          event.id,
        );
      for (const reservation of reservations) {
        if (reservation.status !== 'reserved') continue;
        const snap = await this.inventoryAvailabilityService.getAvailability(
          tenantId,
          reservation.inventoryItemId,
          { excludeReservationId: reservation.id },
        );
        if (!snap) continue;
        if (snap.availableQuantity < reservation.quantity) {
          items.push({
            id: `inventory-shortage-${reservation.id}`,
            kind: 'inventory_shortage',
            title: `Inventory shortage · B-${event.bookingNumber}`,
            message: `Need ${reservation.quantity}; available ${snap.availableQuantity}.`,
            severity: 'warn',
            bookingId: event.id,
            inventoryItemId: reservation.inventoryItemId,
            meta: {
              reservationId: reservation.id,
              reservedQuantity: reservation.quantity,
              availableQuantity: snap.availableQuantity,
            },
          });
        }
      }
    }

    // Pending / overdue reminders in range
    const reminders = await this.reminderRepository.findAll(tenantId);
    for (const reminder of reminders) {
      if (reminder.status !== 'pending') continue;
      if (filter.bookingId && reminder.bookingId !== filter.bookingId) continue;
      const due = startOfDay(reminder.dueAt);
      if (!datesOverlap(due, due, from, to) && due >= today) continue;
      const overdue = due < today;
      items.push({
        id: `reminder-${reminder.id}`,
        kind: 'pending_reminder',
        title: reminder.title,
        message: overdue
          ? `Overdue since ${toDateKey(due)}`
          : `Due ${toDateKey(due)}`,
        severity: overdue ? 'overdue' : 'info',
        bookingId: reminder.bookingId,
        reminderId: reminder.id,
        staffMemberId: reminder.staffMemberId,
        vendorId: reminder.vendorId,
        occurredAt: toIso(reminder.dueAt),
        meta: { category: reminder.category },
      });
    }

    const counts = {
      staffConflicts: items.filter((i) => i.kind === 'staff_conflict').length,
      inventoryShortages: items.filter((i) => i.kind === 'inventory_shortage')
        .length,
      procurementDelays: items.filter((i) => i.kind === 'procurement_delay')
        .length,
      pendingReminders: items.filter((i) => i.kind === 'pending_reminder')
        .length,
    };

    return success({ items, counts });
  }

  private async aggregateOperationalEntries(
    tenantId: string,
    from: Date,
    to: Date,
    filter: CalendarQueryFilter,
    mode: 'calendar' | 'timeline',
  ): Promise<CalendarEntryDto[]> {
    const today = startOfDay(new Date());
    const entries: CalendarEntryDto[] = [];

    const events = await this.eventRepository.findByEventDate(tenantId, {
      from,
      to,
    });

    for (const event of events) {
      if (!event.eventStartDate) continue;
      const start = startOfDay(event.eventStartDate);
      const end = event.eventEndDate ? startOfDay(event.eventEndDate) : start;
      const entry: CalendarEntryDto = {
        id: `event-${event.id}`,
        source: 'event',
        title: `B-${event.bookingNumber}${event.eventType ? ` · ${event.eventType}` : ''}${event.venueName ? ` @ ${event.venueName}` : ''}`,
        startAt: toDateKey(start),
        endAt: toDateKey(end),
        status: event.status,
        bookingId: event.id,
        customerId: event.customerId,
        severity: end < today && event.status !== 'completed' ? 'warn' : 'info',
        hrefHint: `/app/bookings/view/?id=${event.id}`,
        meta: {
          eventType: event.eventType,
          bookingNumber: event.bookingNumber,
          preparationStatus: event.preparationStatus,
          workspaceStatus: event.workspaceStatus,
        },
      };
      if (matchesFilters(entry, filter)) entries.push(entry);
    }

    // Staff lanes via existing scheduling sources
    if (
      sourceAllowed('staff_assignment', filter.sources) ||
      sourceAllowed('staff_leave', filter.sources) ||
      sourceAllowed('staff_availability', filter.sources)
    ) {
      const members = filter.staffMemberId
        ? [
            await this.staffMemberRepository.findById(
              tenantId,
              filter.staffMemberId,
            ),
          ].filter((m): m is NonNullable<typeof m> => m !== null)
        : await this.staffMemberRepository.findMany(tenantId, {
            status: 'active',
          });

      for (const member of members) {
        if (sourceAllowed('staff_assignment', filter.sources)) {
          const confirmed =
            await this.staffAssignmentRepository.findConfirmedByStaffMemberId(
              tenantId,
              member.id,
            );
          for (const assignment of confirmed) {
            const event = await this.eventRepository.findById(
              tenantId,
              assignment.bookingId,
            );
            if (!event?.eventStartDate) continue;
            const start = startOfDay(event.eventStartDate);
            const end = event.eventEndDate
              ? startOfDay(event.eventEndDate)
              : start;
            if (!datesOverlap(start, end, from, to)) continue;
            const entry: CalendarEntryDto = {
              id: `staff-assignment-${assignment.id}`,
              source: 'staff_assignment',
              title: `${member.name} · B-${event.bookingNumber}${assignment.role ? ` · ${assignment.role}` : ''}`,
              startAt: toDateKey(start),
              endAt: toDateKey(end),
              status: assignment.status,
              bookingId: event.id,
              customerId: event.customerId,
              staffMemberId: member.id,
              hrefHint: `/app/staff/scheduling/`,
              meta: {
                assignmentId: assignment.id,
                eventType: event.eventType,
              },
            };
            if (matchesFilters(entry, filter)) entries.push(entry);
          }
        }

        if (sourceAllowed('staff_leave', filter.sources)) {
          const leave = await this.leaveRepository.findApprovedInRange(
            tenantId,
            from,
            to,
            member.id,
          );
          for (const row of leave) {
            const entry: CalendarEntryDto = {
              id: `staff-leave-${row.id}`,
              source: 'staff_leave',
              title: `${member.name} · ${row.leaveType} leave`,
              startAt: toDateKey(row.startDate),
              endAt: toDateKey(row.endDate),
              status: row.status,
              staffMemberId: member.id,
              hrefHint: `/app/staff/view/?id=${member.id}`,
              meta: { leaveId: row.id, leaveType: row.leaveType },
            };
            if (matchesFilters(entry, filter)) entries.push(entry);
          }
        }

        if (sourceAllowed('staff_availability', filter.sources)) {
          const availability =
            await this.availabilityRepository.findForStaffInRange(
              tenantId,
              member.id,
              from,
              to,
            );
          for (const avail of availability) {
            if (avail.date) {
              const key = toDateKey(avail.date);
              if (key < toDateKey(from) || key > toDateKey(to)) continue;
              const entry: CalendarEntryDto = {
                id: `staff-availability-${avail.id}-${key}`,
                source: 'staff_availability',
                title: `${member.name} · ${avail.kind}`,
                startAt: key,
                status: avail.kind,
                staffMemberId: member.id,
                hrefHint: `/app/staff/scheduling/`,
                meta: { availabilityId: avail.id, kind: avail.kind },
              };
              if (matchesFilters(entry, filter)) entries.push(entry);
            } else if (avail.weekday !== null) {
              for (const day of eachDate(from, to)) {
                if (day.getUTCDay() !== avail.weekday) continue;
                const entry: CalendarEntryDto = {
                  id: `staff-availability-${avail.id}-${toDateKey(day)}`,
                  source: 'staff_availability',
                  title: `${member.name} · ${avail.kind} (weekly)`,
                  startAt: toDateKey(day),
                  status: avail.kind,
                  staffMemberId: member.id,
                  hrefHint: `/app/staff/scheduling/`,
                  meta: {
                    availabilityId: avail.id,
                    kind: avail.kind,
                    weekday: avail.weekday,
                  },
                };
                if (matchesFilters(entry, filter)) entries.push(entry);
              }
            }
          }
        }
      }
    }

    if (sourceAllowed('procurement', filter.sources)) {
      const procurements =
        await this.vendorProcurementRepository.findAll(tenantId);
      for (const p of procurements) {
        if (!p.requiredDate) continue;
        const required = startOfDay(p.requiredDate);
        if (!datesOverlap(required, required, from, to)) continue;
        const overdue =
          required < today && PROCUREMENT_OPEN.has(p.workflowStatus);
        const entry: CalendarEntryDto = {
          id: `procurement-${p.id}`,
          source: 'procurement',
          title: `Procurement · ${p.serviceCategory ?? 'vendor'}`,
          startAt: toDateKey(required),
          status: p.workflowStatus,
          bookingId: p.bookingId,
          vendorId: p.vendorId,
          severity: overdue ? 'overdue' : 'info',
          hrefHint: `/app/vendors/procurements/view/?id=${p.id}`,
          meta: {
            procurementId: p.id,
            deliveryStatus: p.deliveryStatus,
          },
        };
        if (matchesFilters(entry, filter)) entries.push(entry);
      }
    }

    if (
      sourceAllowed('inventory_movement', filter.sources) ||
      sourceAllowed('inventory_reservation', filter.sources)
    ) {
      const movements =
        await this.inventoryMovementRepository.findAll(tenantId);

      for (const movement of movements) {
        if (filter.bookingId && movement.bookingId !== filter.bookingId) {
          continue;
        }
        // Anchor to movement timestamps that fall in range, else booking event dates
        const timestamps: { label: string; at: Date }[] = [];
        if (mode === 'timeline') {
          if (movement.dispatchedAt)
            timestamps.push({ label: 'Dispatched', at: movement.dispatchedAt });
          if (movement.returnedAt)
            timestamps.push({ label: 'Returned', at: movement.returnedAt });
          if (movement.readyForDispatchAt)
            timestamps.push({
              label: 'Ready for dispatch',
              at: movement.readyForDispatchAt,
            });
          if (timestamps.length === 0) {
            timestamps.push({ label: 'Movement', at: movement.createdAt });
          }
        } else {
          const event = await this.eventRepository.findById(
            tenantId,
            movement.bookingId,
          );
          if (!event?.eventStartDate) continue;
          const start = startOfDay(event.eventStartDate);
          const end = event.eventEndDate
            ? startOfDay(event.eventEndDate)
            : start;
          if (!datesOverlap(start, end, from, to)) continue;
          if (!sourceAllowed('inventory_movement', filter.sources)) continue;
          const entry: CalendarEntryDto = {
            id: `inventory-movement-${movement.id}`,
            source: 'inventory_movement',
            title: `Inventory · ${movement.status}`,
            startAt: toDateKey(start),
            endAt: toDateKey(end),
            status: movement.status,
            bookingId: movement.bookingId,
            inventoryItemId: movement.inventoryItemId,
            hrefHint: `/app/inventory/movements/?bookingId=${movement.bookingId}`,
            meta: { movementId: movement.id },
          };
          if (matchesFilters(entry, filter)) entries.push(entry);
          continue;
        }

        for (const ts of timestamps) {
          const day = startOfDay(ts.at);
          if (!datesOverlap(day, day, from, to)) continue;
          if (!sourceAllowed('inventory_movement', filter.sources)) continue;
          const entry: CalendarEntryDto = {
            id: `inventory-movement-${movement.id}-${ts.label}`,
            source: 'inventory_movement',
            title: `Inventory · ${ts.label}`,
            startAt: toIso(ts.at),
            status: movement.status,
            bookingId: movement.bookingId,
            inventoryItemId: movement.inventoryItemId,
            hrefHint: `/app/inventory/movements/?bookingId=${movement.bookingId}`,
            meta: { movementId: movement.id, milestone: ts.label },
          };
          if (matchesFilters(entry, filter)) entries.push(entry);
        }
      }

      if (sourceAllowed('inventory_reservation', filter.sources)) {
        for (const event of events) {
          const reservations =
            await this.inventoryReservationRepository.findByBookingId(
              tenantId,
              event.id,
            );
          for (const reservation of reservations) {
            if (!event.eventStartDate) continue;
            const start = startOfDay(event.eventStartDate);
            const end = event.eventEndDate
              ? startOfDay(event.eventEndDate)
              : start;
            const entry: CalendarEntryDto = {
              id: `inventory-reservation-${reservation.id}`,
              source: 'inventory_reservation',
              title: `Reservation · qty ${reservation.quantity}`,
              startAt: toDateKey(start),
              endAt: toDateKey(end),
              status: reservation.status,
              bookingId: event.id,
              customerId: event.customerId,
              inventoryItemId: reservation.inventoryItemId,
              hrefHint: `/app/inventory/operations/?bookingId=${event.id}`,
              meta: { reservationId: reservation.id },
            };
            if (matchesFilters(entry, filter)) entries.push(entry);
          }
        }
      }
    }

    if (sourceAllowed('reminder', filter.sources)) {
      const reminders = await this.reminderRepository.findAll(tenantId);
      for (const reminder of reminders) {
        if (reminder.status === 'cancelled') continue;
        const due = startOfDay(reminder.dueAt);
        if (!datesOverlap(due, due, from, to)) continue;
        const overdue = reminder.status === 'pending' && due < today;
        const entry: CalendarEntryDto = {
          id: `reminder-${reminder.id}`,
          source: 'reminder',
          title: reminder.title,
          startAt: toIso(reminder.dueAt),
          status: reminder.status,
          bookingId: reminder.bookingId,
          customerId: reminder.customerId,
          vendorId: reminder.vendorId,
          staffMemberId: reminder.staffMemberId,
          severity: overdue ? 'overdue' : 'info',
          hrefHint: `/app/communications/reminders/`,
          meta: { category: reminder.category, reminderId: reminder.id },
        };
        if (matchesFilters(entry, filter)) entries.push(entry);
      }
    }

    if (mode === 'timeline' && sourceAllowed('communication', filter.sources)) {
      const communications =
        await this.communicationRecordRepository.findAll(tenantId);
      for (const record of communications) {
        if (record.deletedAt) continue;
        const occurred = startOfDay(record.occurredAt);
        if (!datesOverlap(occurred, occurred, from, to)) continue;
        const entry: CalendarEntryDto = {
          id: `communication-${record.id}`,
          source: 'communication',
          title: record.subject ?? `${record.channel} · ${record.status}`,
          startAt: toIso(record.occurredAt),
          status: record.status,
          bookingId: record.bookingId,
          customerId: record.customerId,
          vendorId: record.vendorId,
          staffMemberId: record.staffMemberId,
          hrefHint: `/app/communications/view/?id=${record.id}`,
          meta: {
            channel: record.channel,
            direction: record.direction,
          },
        };
        if (matchesFilters(entry, filter)) entries.push(entry);
      }
    }

    if (
      mode === 'timeline' &&
      sourceAllowed('finance_document', filter.sources)
    ) {
      for (const event of events) {
        const docs = await this.financialDocumentRepository.findByBookingId(
          tenantId,
          event.id,
        );
        for (const doc of docs) {
          if (doc.deletedAt) continue;
          const uploaded = startOfDay(doc.uploadedAt);
          if (!datesOverlap(uploaded, uploaded, from, to)) continue;
          const entry: CalendarEntryDto = {
            id: `finance-document-${doc.id}`,
            source: 'finance_document',
            title: doc.fileName ?? doc.documentType,
            startAt: toIso(doc.uploadedAt),
            status: doc.verificationStatus,
            bookingId: event.id,
            customerId: event.customerId,
            hrefHint: `/app/bookings/view/?id=${event.id}`,
            meta: {
              documentType: doc.documentType,
              documentId: doc.id,
            },
          };
          if (matchesFilters(entry, filter)) entries.push(entry);
        }
      }
    }

    return entries;
  }
}
