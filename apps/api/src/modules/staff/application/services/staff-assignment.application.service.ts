import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  StaffAssignmentCancelledEvent,
  StaffAssignmentConfirmedEvent,
  StaffAssignmentCreatedEvent,
  StaffAssignmentReleasedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { StaffMemberRepository } from '../../domain/repositories/staff-member.repository';
import {
  StaffAssignmentRepository,
  type StaffAssignmentRecord,
} from '../../domain/repositories/staff-assignment.repository';
import {
  toStaffAssignmentDto,
  type StaffAssignmentDto,
} from '../dtos/staff-assignment.dto';
import { SchedulingApplicationService } from './scheduling.application.service';

export type CreateStaffAssignmentInput = {
  bookingId: string;
  staffMemberId: string;
  role?: string | null;
  isOnSiteLead?: boolean;
  reportingAt?: Date | null;
  note?: string | null;
};

export type CancelStaffAssignmentInput = {
  reason: string;
};

const ALLOWED_TRANSITIONS: Record<
  StaffAssignmentRecord['status'],
  StaffAssignmentRecord['status'][]
> = {
  proposed: ['confirmed', 'cancelled'],
  confirmed: ['released', 'cancelled'],
  released: [],
  cancelled: [],
};

// EP1-STF-002, EP1-AUT-004 / P2-04 — Assignments reference StaffMember.
// Legacy User UUID still accepted via resolveForAssignment bridge.
// P2-05 — Confirm runs scheduling conflict detection on StaffMember.
@Injectable()
export class StaffAssignmentApplicationService {
  constructor(
    private readonly staffAssignmentRepository: StaffAssignmentRepository,
    private readonly staffMemberRepository: StaffMemberRepository,
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly schedulingService: SchedulingApplicationService,
  ) {}

  async createAssignment(
    tenantId: string,
    input: CreateStaffAssignmentInput,
  ): Promise<Result<StaffAssignmentDto>> {
    const booking = await this.eventRepository.findById(
      tenantId,
      input.bookingId,
    );
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (booking.status === 'cancelled') {
      return failure(
        'INVALID_STATE',
        'Cannot assign staff to a cancelled booking.',
        { bookingId: input.bookingId, status: booking.status },
      );
    }

    const staffMember = await this.staffMemberRepository.resolveForAssignment(
      tenantId,
      input.staffMemberId,
    );
    if (!staffMember) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }

    if (staffMember.status !== 'active') {
      return failure(
        'INVALID_STATE',
        'Only active staff members can be assigned to events.',
        { staffMemberId: staffMember.id, status: staffMember.status },
      );
    }

    const assignment = await this.staffAssignmentRepository.create(tenantId, {
      bookingId: input.bookingId,
      staffMemberId: staffMember.id,
      legacyUserId: staffMember.userId,
      role: input.role,
      isOnSiteLead: input.isOnSiteLead,
      reportingAt: input.reportingAt,
      note: input.note,
    });

    this.eventPublisher.publish(
      new StaffAssignmentCreatedEvent(tenantId, assignment),
    );

    return success(toStaffAssignmentDto(assignment, staffMember));
  }

  async getAssignmentById(
    tenantId: string,
    assignmentId: string,
  ): Promise<Result<StaffAssignmentDto>> {
    const assignment = await this.staffAssignmentRepository.findById(
      tenantId,
      assignmentId,
    );
    if (!assignment) {
      return failure('NOT_FOUND', 'Staff assignment not found.');
    }

    const staffMember = await this.staffMemberRepository.findById(
      tenantId,
      assignment.staffMemberId,
    );
    return success(toStaffAssignmentDto(assignment, staffMember));
  }

  async listAssignmentsForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<StaffAssignmentDto[]>> {
    const assignments = await this.staffAssignmentRepository.findByBookingId(
      tenantId,
      bookingId,
    );

    const dtos = await Promise.all(
      assignments.map(async (assignment) => {
        const staffMember = await this.staffMemberRepository.findById(
          tenantId,
          assignment.staffMemberId,
        );
        return toStaffAssignmentDto(assignment, staffMember);
      }),
    );

    return success(dtos);
  }

  async confirmAssignment(
    tenantId: string,
    assignmentId: string,
    version: number,
  ): Promise<Result<StaffAssignmentDto>> {
    const existing = await this.staffAssignmentRepository.findById(
      tenantId,
      assignmentId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Staff assignment not found.');
    }

    const transition = this.checkTransition(existing.status, 'confirmed');
    if (transition) {
      return transition;
    }

    const staffMember = await this.staffMemberRepository.findById(
      tenantId,
      existing.staffMemberId,
    );
    if (staffMember && staffMember.status !== 'active') {
      return failure(
        'INVALID_STATE',
        'Cannot confirm assignment for a non-active staff member.',
        { staffMemberId: staffMember.id, status: staffMember.status },
      );
    }

    const conflictResult =
      await this.schedulingService.detectConflictsForStaffOnBooking(
        tenantId,
        existing.staffMemberId,
        existing.bookingId,
        assignmentId,
      );
    if (!conflictResult.ok) {
      return conflictResult;
    }
    if (conflictResult.value.length > 0) {
      return failure(
        'SCHEDULING_CONFLICT',
        'Cannot confirm assignment due to scheduling conflicts.',
        { conflicts: conflictResult.value },
      );
    }

    try {
      const assignment = await this.staffAssignmentRepository.update(
        tenantId,
        assignmentId,
        { status: 'confirmed', confirmedAt: new Date() },
        version,
      );

      this.eventPublisher.publish(
        new StaffAssignmentConfirmedEvent(tenantId, assignment),
      );

      return success(toStaffAssignmentDto(assignment, staffMember));
    } catch (error: unknown) {
      return this.handleConcurrency(error, assignmentId);
    }
  }

  async releaseAssignment(
    tenantId: string,
    assignmentId: string,
    version: number,
  ): Promise<Result<StaffAssignmentDto>> {
    const existing = await this.staffAssignmentRepository.findById(
      tenantId,
      assignmentId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Staff assignment not found.');
    }

    const transition = this.checkTransition(existing.status, 'released');
    if (transition) {
      return transition;
    }

    try {
      const assignment = await this.staffAssignmentRepository.update(
        tenantId,
        assignmentId,
        { status: 'released', releasedAt: new Date() },
        version,
      );

      this.eventPublisher.publish(
        new StaffAssignmentReleasedEvent(tenantId, assignment),
      );

      const staffMember = await this.staffMemberRepository.findById(
        tenantId,
        assignment.staffMemberId,
      );
      return success(toStaffAssignmentDto(assignment, staffMember));
    } catch (error: unknown) {
      return this.handleConcurrency(error, assignmentId);
    }
  }

  async cancelAssignment(
    tenantId: string,
    assignmentId: string,
    input: CancelStaffAssignmentInput,
    version: number,
  ): Promise<Result<StaffAssignmentDto>> {
    const existing = await this.staffAssignmentRepository.findById(
      tenantId,
      assignmentId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Staff assignment not found.');
    }

    if (!input.reason?.trim()) {
      return failure('VALIDATION_ERROR', 'Cancellation reason is required.');
    }

    const transition = this.checkTransition(existing.status, 'cancelled');
    if (transition) {
      return transition;
    }

    try {
      const assignment = await this.staffAssignmentRepository.update(
        tenantId,
        assignmentId,
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
        version,
      );

      this.eventPublisher.publish(
        new StaffAssignmentCancelledEvent(tenantId, assignment),
      );

      const staffMember = await this.staffMemberRepository.findById(
        tenantId,
        assignment.staffMemberId,
      );
      return success(toStaffAssignmentDto(assignment, staffMember));
    } catch (error: unknown) {
      return this.handleConcurrency(error, assignmentId);
    }
  }

  private checkTransition(
    from: StaffAssignmentRecord['status'],
    to: StaffAssignmentRecord['status'],
  ): Result<StaffAssignmentDto> | null {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      return failure(
        'INVALID_TRANSITION',
        `Cannot transition staff assignment from '${from}' to '${to}'.`,
        { from, to },
      );
    }

    return null;
  }

  private handleConcurrency<T>(
    error: unknown,
    assignmentId: string,
  ): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Staff assignment was modified by another request. Reload and retry.',
        { assignmentId },
      );
    }

    throw error;
  }
}
