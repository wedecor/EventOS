import { Injectable } from '@nestjs/common';
import type { StaffLeaveStatus, StaffLeaveType } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { StaffMemberRepository } from '../../domain/repositories/staff-member.repository';
import { StaffLeaveRepository } from '../../domain/repositories/staff-leave.repository';
import { toStaffLeaveDto, type StaffLeaveDto } from '../dtos/staff-leave.dto';

export type CreateLeaveInput = {
  staffMemberId: string;
  leaveType: StaffLeaveType;
  startDate: string;
  endDate: string;
  reason?: string | null;
  notes?: string | null;
};

export type ReviewLeaveInput = {
  status: Extract<StaffLeaveStatus, 'approved' | 'rejected' | 'cancelled'>;
  reviewedByUserId: string;
  notes?: string | null;
};

@Injectable()
export class StaffLeaveApplicationService {
  constructor(
    private readonly leaveRepository: StaffLeaveRepository,
    private readonly staffMemberRepository: StaffMemberRepository,
  ) {}

  async listForStaff(
    tenantId: string,
    staffMemberId: string,
    status?: StaffLeaveStatus,
  ): Promise<Result<StaffLeaveDto[]>> {
    const staff = await this.staffMemberRepository.findById(
      tenantId,
      staffMemberId,
    );
    if (!staff) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }
    const rows = await this.leaveRepository.findByStaffMemberId(
      tenantId,
      staffMemberId,
      status,
    );
    return success(rows.map(toStaffLeaveDto));
  }

  async create(
    tenantId: string,
    input: CreateLeaveInput,
  ): Promise<Result<StaffLeaveDto>> {
    const staff = await this.staffMemberRepository.findById(
      tenantId,
      input.staffMemberId,
    );
    if (!staff) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return failure('VALIDATION_ERROR', 'Invalid leave dates.');
    }
    if (endDate < startDate) {
      return failure(
        'VALIDATION_ERROR',
        'Leave endDate must be on or after startDate.',
      );
    }

    const row = await this.leaveRepository.create(tenantId, {
      staffMemberId: input.staffMemberId,
      leaveType: input.leaveType,
      startDate,
      endDate,
      reason: input.reason,
      notes: input.notes,
    });
    return success(toStaffLeaveDto(row));
  }

  async review(
    tenantId: string,
    id: string,
    input: ReviewLeaveInput,
    version: number,
  ): Promise<Result<StaffLeaveDto>> {
    const existing = await this.leaveRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Leave request not found.');
    }

    if (input.status === 'cancelled') {
      if (existing.status !== 'requested' && existing.status !== 'approved') {
        return failure(
          'INVALID_STATE',
          'Only requested or approved leave can be cancelled.',
        );
      }
    } else if (existing.status !== 'requested') {
      return failure(
        'INVALID_STATE',
        'Only requested leave can be approved or rejected.',
      );
    }

    try {
      const row = await this.leaveRepository.update(
        tenantId,
        id,
        {
          status: input.status,
          notes: input.notes !== undefined ? input.notes : existing.notes,
          reviewedByUserId: input.reviewedByUserId,
          reviewedAt: new Date(),
        },
        version,
      );
      return success(toStaffLeaveDto(row));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Leave was modified by another request. Reload and retry.',
          { id },
        );
      }
      throw error;
    }
  }
}
