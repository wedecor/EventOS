import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { StaffMemberRepository } from '../../domain/repositories/staff-member.repository';
import { StaffAssignmentRepository } from '../../domain/repositories/staff-assignment.repository';
import { StaffAvailabilityRepository } from '../../domain/repositories/staff-availability.repository';
import { StaffLeaveRepository } from '../../domain/repositories/staff-leave.repository';
import type {
  SchedulingCalendarEntryDto,
  SchedulingConflictDto,
  StaffRecommendationDto,
  StaffWorkloadDto,
} from '../dtos/scheduling.dto';

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

function toDateKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
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

// P2-05 — Conflict detection, workload, calendar, rule-based recommendations
@Injectable()
export class SchedulingApplicationService {
  constructor(
    private readonly staffMemberRepository: StaffMemberRepository,
    private readonly staffAssignmentRepository: StaffAssignmentRepository,
    private readonly availabilityRepository: StaffAvailabilityRepository,
    private readonly leaveRepository: StaffLeaveRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async detectConflictsForStaffOnBooking(
    tenantId: string,
    staffMemberId: string,
    bookingId: string,
    excludeAssignmentId?: string,
  ): Promise<Result<SchedulingConflictDto[]>> {
    const staff = await this.staffMemberRepository.findById(
      tenantId,
      staffMemberId,
    );
    if (!staff) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }

    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    const conflicts: SchedulingConflictDto[] = [];

    if (staff.status !== 'active') {
      conflicts.push({
        code: 'staff_inactive',
        message: `Staff member is '${staff.status}' and cannot be confirmed.`,
        details: { status: staff.status },
      });
    }

    const eventStart = booking.eventStartDate
      ? startOfDay(booking.eventStartDate)
      : null;
    const eventEnd = booking.eventEndDate
      ? startOfDay(booking.eventEndDate)
      : eventStart;

    if (eventStart && eventEnd) {
      const confirmed =
        await this.staffAssignmentRepository.findConfirmedByStaffMemberId(
          tenantId,
          staffMemberId,
        );
      for (const assignment of confirmed) {
        if (excludeAssignmentId && assignment.id === excludeAssignmentId) {
          continue;
        }
        if (assignment.bookingId === bookingId) {
          continue;
        }
        const other = await this.eventRepository.findById(
          tenantId,
          assignment.bookingId,
        );
        if (!other) continue;
        if (
          datesOverlap(
            eventStart,
            eventEnd,
            other.eventStartDate,
            other.eventEndDate,
          )
        ) {
          conflicts.push({
            code: 'overlapping_assignment',
            message: `Already confirmed on overlapping booking B-${other.bookingNumber}.`,
            details: {
              assignmentId: assignment.id,
              bookingId: other.id,
              bookingNumber: other.bookingNumber,
            },
          });
        }
      }

      const leave = await this.leaveRepository.findApprovedOverlapping(
        tenantId,
        staffMemberId,
        eventStart,
        eventEnd,
      );
      for (const row of leave) {
        conflicts.push({
          code: 'approved_leave',
          message: `Approved ${row.leaveType} leave overlaps the event dates.`,
          details: {
            leaveId: row.id,
            startDate: toDateKey(row.startDate),
            endDate: toDateKey(row.endDate),
          },
        });
      }

      const availability =
        await this.availabilityRepository.findForStaffInRange(
          tenantId,
          staffMemberId,
          eventStart,
          eventEnd,
        );
      for (const day of eachDate(eventStart, eventEnd)) {
        const weekday = day.getUTCDay();
        const dayKey = toDateKey(day);
        const blocking = availability.filter((entry) => {
          if (entry.kind === 'available') return false;
          if (entry.date && toDateKey(entry.date) === dayKey) return true;
          if (entry.weekday !== null && entry.weekday === weekday) return true;
          return false;
        });
        for (const entry of blocking) {
          conflicts.push({
            code: 'unavailable',
            message: `Marked ${entry.kind} on ${dayKey}.`,
            details: {
              availabilityId: entry.id,
              kind: entry.kind,
              date: dayKey,
            },
          });
        }
      }
    }

    return success(conflicts);
  }

  async getWorkload(
    tenantId: string,
    staffMemberId?: string,
  ): Promise<Result<StaffWorkloadDto[]>> {
    const members = staffMemberId
      ? [
          await this.staffMemberRepository.findById(tenantId, staffMemberId),
        ].filter((m): m is NonNullable<typeof m> => m !== null)
      : await this.staffMemberRepository.findMany(tenantId);

    if (staffMemberId && members.length === 0) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }

    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 6);
    const monthEnd = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
    );

    const result: StaffWorkloadDto[] = [];
    for (const member of members) {
      const confirmed =
        await this.staffAssignmentRepository.findConfirmedByStaffMemberId(
          tenantId,
          member.id,
        );
      let eventsToday = 0;
      let eventsThisWeek = 0;
      let eventsThisMonth = 0;
      let upcomingConfirmed = 0;

      for (const assignment of confirmed) {
        const event = await this.eventRepository.findById(
          tenantId,
          assignment.bookingId,
        );
        if (!event?.eventStartDate) continue;
        const start = startOfDay(event.eventStartDate);
        const end = event.eventEndDate ? startOfDay(event.eventEndDate) : start;
        if (datesOverlap(start, end, today, today)) eventsToday += 1;
        if (datesOverlap(start, end, today, weekEnd)) eventsThisWeek += 1;
        if (datesOverlap(start, end, today, monthEnd)) eventsThisMonth += 1;
        if (start >= today) upcomingConfirmed += 1;
      }

      result.push({
        staffMemberId: member.id,
        name: member.name,
        employmentType: member.employmentType,
        status: member.status,
        eventsToday,
        eventsThisWeek,
        eventsThisMonth,
        upcomingConfirmed,
      });
    }

    return success(result);
  }

  async getCalendar(
    tenantId: string,
    fromIso: string,
    toIso: string,
    staffMemberId?: string,
  ): Promise<Result<SchedulingCalendarEntryDto[]>> {
    const from = startOfDay(new Date(fromIso));
    const to = startOfDay(new Date(toIso));
    if (
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      to < from
    ) {
      return failure('VALIDATION_ERROR', 'Invalid calendar date range.');
    }

    const members = staffMemberId
      ? [
          await this.staffMemberRepository.findById(tenantId, staffMemberId),
        ].filter((m): m is NonNullable<typeof m> => m !== null)
      : await this.staffMemberRepository.findMany(tenantId, {
          status: 'active',
        });

    const entries: SchedulingCalendarEntryDto[] = [];

    for (const member of members) {
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
        const end = event.eventEndDate ? startOfDay(event.eventEndDate) : start;
        if (!datesOverlap(start, end, from, to)) continue;
        entries.push({
          type: 'assignment',
          staffMemberId: member.id,
          staffName: member.name,
          date: toDateKey(start),
          endDate: toDateKey(end),
          label: `B-${event.bookingNumber}${assignment.role ? ` · ${assignment.role}` : ''}`,
          meta: {
            assignmentId: assignment.id,
            bookingId: event.id,
            status: assignment.status,
          },
        });
      }

      const leave = await this.leaveRepository.findApprovedInRange(
        tenantId,
        from,
        to,
        member.id,
      );
      for (const row of leave) {
        entries.push({
          type: 'leave',
          staffMemberId: member.id,
          staffName: member.name,
          date: toDateKey(row.startDate),
          endDate: toDateKey(row.endDate),
          label: `${row.leaveType} leave`,
          meta: { leaveId: row.id, leaveType: row.leaveType },
        });
      }

      const availability =
        await this.availabilityRepository.findForStaffInRange(
          tenantId,
          member.id,
          from,
          to,
        );
      for (const entry of availability) {
        if (entry.date) {
          const key = toDateKey(entry.date);
          if (key < toDateKey(from) || key > toDateKey(to)) continue;
          entries.push({
            type: 'availability',
            staffMemberId: member.id,
            staffName: member.name,
            date: key,
            label: entry.kind,
            meta: {
              availabilityId: entry.id,
              kind: entry.kind,
              startTime: entry.startTime,
              endTime: entry.endTime,
            },
          });
        } else if (entry.weekday !== null) {
          for (const day of eachDate(from, to)) {
            if (day.getUTCDay() !== entry.weekday) continue;
            entries.push({
              type: 'availability',
              staffMemberId: member.id,
              staffName: member.name,
              date: toDateKey(day),
              label: `${entry.kind} (weekly)`,
              meta: {
                availabilityId: entry.id,
                kind: entry.kind,
                weekday: entry.weekday,
              },
            });
          }
        }
      }
    }

    entries.sort((a, b) => a.date.localeCompare(b.date));
    return success(entries);
  }

  async recommendForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<StaffRecommendationDto[]>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    const active = await this.staffMemberRepository.findMany(tenantId, {
      status: 'active',
    });
    const recommendations: StaffRecommendationDto[] = [];

    for (const member of active) {
      const conflictResult = await this.detectConflictsForStaffOnBooking(
        tenantId,
        member.id,
        bookingId,
      );
      if (!conflictResult.ok) continue;
      const conflicts = conflictResult.value;

      const workloadResult = await this.getWorkload(tenantId, member.id);
      const workload =
        workloadResult.ok && workloadResult.value[0]
          ? workloadResult.value[0]
          : null;

      let score = 100;
      const reasons: string[] = [];

      if (conflicts.length === 0) {
        reasons.push('No scheduling conflicts');
        score += 20;
      } else {
        score -= conflicts.length * 40;
        reasons.push(`${conflicts.length} conflict(s)`);
      }

      if (member.employmentType === 'permanent') {
        score += 10;
        reasons.push('Permanent staff');
      } else {
        reasons.push('Temporary staff');
      }

      if (workload) {
        if (workload.eventsThisWeek === 0) {
          score += 15;
          reasons.push('Free this week');
        } else if (workload.eventsThisWeek >= 3) {
          score -= 15;
          reasons.push('Heavy weekly workload');
        } else {
          reasons.push(`${workload.eventsThisWeek} event(s) this week`);
        }
      }

      recommendations.push({
        staffMemberId: member.id,
        name: member.name,
        employmentType: member.employmentType,
        operationalRole: member.role,
        score,
        reasons,
        conflicts,
      });
    }

    recommendations.sort((a, b) => b.score - a.score);
    return success(recommendations);
  }
}
