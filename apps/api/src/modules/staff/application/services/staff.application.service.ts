import { Injectable } from '@nestjs/common';
import type { StaffEmploymentType } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  StaffMemberCreatedEvent,
  StaffMemberStatusChangedEvent,
  StaffMemberUpdatedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import {
  StaffMemberRepository,
  type FindStaffMembersFilter,
  type StaffMemberRecord,
} from '../../domain/repositories/staff-member.repository';
import {
  toStaffMemberDto,
  type StaffMemberDto,
} from '../dtos/staff-member.dto';

export type CreateStaffMemberInput = {
  name: string;
  role: string;
  department?: string | null;
  phone: string;
  email?: string | null;
  status?: StaffMemberRecord['status'];
  userId?: string | null;
  employmentType?: StaffEmploymentType;
  joinedAt?: Date | null;
};

export type UpdateStaffMemberInput = {
  name?: string;
  role?: string;
  department?: string | null;
  phone?: string;
  email?: string | null;
  status?: StaffMemberRecord['status'];
  userId?: string | null;
  employmentType?: StaffEmploymentType;
  joinedAt?: Date | null;
};

// EP1-STF-001 / P2-04 — Staff master CRUD. StaffMember is the operational workforce
// aggregate; optional userId links Auth User without moving auth into Staff.
@Injectable()
export class StaffApplicationService {
  constructor(
    private readonly staffMemberRepository: StaffMemberRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createStaffMember(
    tenantId: string,
    input: CreateStaffMemberInput,
  ): Promise<Result<StaffMemberDto>> {
    if (!input.name?.trim()) {
      return failure('VALIDATION_ERROR', 'Staff member name is required.');
    }
    if (!input.role?.trim()) {
      return failure('VALIDATION_ERROR', 'Staff member role is required.');
    }
    if (!input.phone?.trim()) {
      return failure('VALIDATION_ERROR', 'Staff member phone is required.');
    }

    if (input.userId) {
      const existingLink = await this.staffMemberRepository.findByUserId(
        tenantId,
        input.userId,
      );
      if (existingLink) {
        return failure(
          'VALIDATION_ERROR',
          'A staff member is already linked to this user.',
          { userId: input.userId, staffMemberId: existingLink.id },
        );
      }
    }

    const staffMember = await this.staffMemberRepository.create(tenantId, {
      name: input.name.trim(),
      role: input.role.trim(),
      department: input.department?.trim() ? input.department.trim() : null,
      phone: input.phone.trim(),
      email: input.email?.trim() ? input.email.trim() : null,
      status: input.status,
      userId: input.userId ?? null,
      employmentType: input.employmentType ?? 'temporary',
      joinedAt: input.joinedAt ?? null,
    });

    this.eventPublisher.publish(
      new StaffMemberCreatedEvent(tenantId, staffMember),
    );

    return success(toStaffMemberDto(staffMember));
  }

  async getStaffMemberById(
    tenantId: string,
    id: string,
  ): Promise<Result<StaffMemberDto>> {
    const staffMember = await this.staffMemberRepository.findById(tenantId, id);
    if (!staffMember) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }

    return success(toStaffMemberDto(staffMember));
  }

  async listStaffMembers(
    tenantId: string,
    filter?: FindStaffMembersFilter,
  ): Promise<Result<StaffMemberDto[]>> {
    const staffMembers = await this.staffMemberRepository.findMany(
      tenantId,
      filter,
    );
    return success(staffMembers.map(toStaffMemberDto));
  }

  async updateStaffMember(
    tenantId: string,
    id: string,
    input: UpdateStaffMemberInput,
    version: number,
  ): Promise<Result<StaffMemberDto>> {
    const existing = await this.staffMemberRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Staff member not found.');
    }

    if (input.name !== undefined && !input.name.trim()) {
      return failure('VALIDATION_ERROR', 'Staff member name cannot be blank.');
    }
    if (input.role !== undefined && !input.role.trim()) {
      return failure('VALIDATION_ERROR', 'Staff member role cannot be blank.');
    }
    if (input.phone !== undefined && !input.phone.trim()) {
      return failure('VALIDATION_ERROR', 'Staff member phone cannot be blank.');
    }

    if (input.userId) {
      const existingLink = await this.staffMemberRepository.findByUserId(
        tenantId,
        input.userId,
      );
      if (existingLink && existingLink.id !== id) {
        return failure(
          'VALIDATION_ERROR',
          'A staff member is already linked to this user.',
          { userId: input.userId, staffMemberId: existingLink.id },
        );
      }
    }

    try {
      const staffMember = await this.staffMemberRepository.update(
        tenantId,
        id,
        {
          name: input.name?.trim(),
          role: input.role?.trim(),
          department:
            input.department === undefined
              ? undefined
              : input.department?.trim()
                ? input.department.trim()
                : null,
          phone: input.phone?.trim(),
          email:
            input.email === undefined
              ? undefined
              : input.email?.trim()
                ? input.email.trim()
                : null,
          status: input.status,
          userId: input.userId,
          employmentType: input.employmentType,
          joinedAt: input.joinedAt,
        },
        version,
      );

      const isStatusChange =
        input.status !== undefined && input.status !== existing.status;

      if (isStatusChange) {
        this.eventPublisher.publish(
          new StaffMemberStatusChangedEvent(
            tenantId,
            staffMember,
            existing.status,
          ),
        );
      } else {
        this.eventPublisher.publish(
          new StaffMemberUpdatedEvent(tenantId, staffMember),
        );
      }

      return success(toStaffMemberDto(staffMember));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  private handleConcurrency<T>(
    error: unknown,
    staffMemberId: string,
  ): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Staff member was modified by another request. Reload and retry.',
        { staffMemberId },
      );
    }

    throw error;
  }
}
