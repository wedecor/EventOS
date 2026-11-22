import { Injectable } from '@nestjs/common';
import type { StaffAvailabilityKind } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { StaffMemberRepository } from '../../domain/repositories/staff-member.repository';
import { StaffAvailabilityRepository } from '../../domain/repositories/staff-availability.repository';
import {
  toStaffAvailabilityDto,
  type StaffAvailabilityDto,
} from '../dtos/staff-availability.dto';

export type CreateAvailabilityInput = {
  staffMemberId: string;
  date?: string | null;
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  kind: StaffAvailabilityKind;
  reason?: string | null;
  notes?: string | null;
};

export type UpdateAvailabilityInput = {
  date?: string | null;
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  kind?: StaffAvailabilityKind;
  reason?: string | null;
  notes?: string | null;
};

@Injectable()
export class StaffAvailabilityApplicationService {
  constructor(
    private readonly availabilityRepository: StaffAvailabilityRepository,
    private readonly staffMemberRepository: StaffMemberRepository,
  ) {}

  async listForStaff(
    tenantId: string,
    staffMemberId: string,
  ): Promise<Result<StaffAvailabilityDto[]>> {
    const staff = await this.staffMemberRepository.findById(
      tenantId,
      staffMemberId,
    );
    if (!staff) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }
    const rows = await this.availabilityRepository.findByStaffMemberId(
      tenantId,
      staffMemberId,
    );
    return success(rows.map(toStaffAvailabilityDto));
  }

  async create(
    tenantId: string,
    input: CreateAvailabilityInput,
  ): Promise<Result<StaffAvailabilityDto>> {
    const staff = await this.staffMemberRepository.findById(
      tenantId,
      input.staffMemberId,
    );
    if (!staff) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }

    const validation = this.validateWindow(input);
    if (validation) {
      return validation;
    }

    const row = await this.availabilityRepository.create(tenantId, {
      staffMemberId: input.staffMemberId,
      date: input.date ? new Date(input.date) : null,
      weekday: input.weekday ?? null,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      kind: input.kind,
      reason: input.reason,
      notes: input.notes,
    });
    return success(toStaffAvailabilityDto(row));
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateAvailabilityInput,
    version: number,
  ): Promise<Result<StaffAvailabilityDto>> {
    const existing = await this.availabilityRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Availability entry not found.');
    }

    const merged = {
      date:
        input.date !== undefined
          ? input.date
          : existing.date?.toISOString().slice(0, 10),
      weekday: input.weekday !== undefined ? input.weekday : existing.weekday,
      startTime:
        input.startTime !== undefined ? input.startTime : existing.startTime,
      endTime: input.endTime !== undefined ? input.endTime : existing.endTime,
      kind: input.kind ?? existing.kind,
    };
    const validation = this.validateWindow(merged);
    if (validation) {
      return validation;
    }

    try {
      const row = await this.availabilityRepository.update(
        tenantId,
        id,
        {
          date:
            input.date === undefined
              ? undefined
              : input.date === null
                ? null
                : new Date(input.date),
          weekday: input.weekday,
          startTime: input.startTime,
          endTime: input.endTime,
          kind: input.kind,
          reason: input.reason,
          notes: input.notes,
        },
        version,
      );
      return success(toStaffAvailabilityDto(row));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Availability was modified by another request. Reload and retry.',
          { id },
        );
      }
      throw error;
    }
  }

  async remove(tenantId: string, id: string): Promise<Result<void>> {
    const existing = await this.availabilityRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Availability entry not found.');
    }
    await this.availabilityRepository.remove(tenantId, id);
    return success(undefined);
  }

  private validateWindow(input: {
    date?: string | Date | null;
    weekday?: number | null;
    startTime?: string | null;
    endTime?: string | null;
    kind?: StaffAvailabilityKind;
  }): Result<never> | null {
    const hasDate = input.date != null && input.date !== '';
    const hasWeekday =
      input.weekday !== undefined &&
      input.weekday !== null &&
      Number.isInteger(input.weekday);

    if (!hasDate && !hasWeekday) {
      return failure(
        'VALIDATION_ERROR',
        'Provide either a specific date or a recurring weekday (0–6).',
      );
    }
    if (hasDate && hasWeekday) {
      return failure(
        'VALIDATION_ERROR',
        'Provide either date or weekday, not both.',
      );
    }
    if (hasWeekday && (input.weekday! < 0 || input.weekday! > 6)) {
      return failure(
        'VALIDATION_ERROR',
        'Weekday must be between 0 (Sunday) and 6 (Saturday).',
      );
    }
    if (
      (input.startTime && !input.endTime) ||
      (!input.startTime && input.endTime)
    ) {
      return failure(
        'VALIDATION_ERROR',
        'Provide both startTime and endTime, or neither for all-day.',
      );
    }
    return null;
  }
}
