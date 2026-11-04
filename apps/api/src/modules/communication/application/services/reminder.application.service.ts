import { Injectable } from '@nestjs/common';
import type { ReminderCategory } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import { StaffMemberRepository } from '../../../staff/domain/repositories/staff-member.repository';
import { VendorRepository } from '../../../vendor/domain/repositories/vendor.repository';
import { CommunicationRecordRepository } from '../../domain/repositories/communication-record.repository';
import { ReminderRepository } from '../../domain/repositories/reminder.repository';
import { toReminderDto, type ReminderDto } from '../dtos/reminder.dto';

export type CreateReminderInput = {
  bookingId?: string | null;
  customerId?: string | null;
  vendorId?: string | null;
  staffMemberId?: string | null;
  communicationRecordId?: string | null;
  category?: ReminderCategory;
  title: string;
  notes?: string | null;
  dueAt: Date;
  assignedToUserId?: string | null;
};

@Injectable()
export class ReminderApplicationService {
  constructor(
    private readonly reminderRepository: ReminderRepository,
    private readonly eventRepository: EventRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly vendorRepository: VendorRepository,
    private readonly staffMemberRepository: StaffMemberRepository,
    private readonly communicationRecordRepository: CommunicationRecordRepository,
  ) {}

  async create(
    tenantId: string,
    input: CreateReminderInput,
  ): Promise<Result<ReminderDto>> {
    if (input.title.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Reminder title is required.');
    }

    const linkError = await this.validateLinks(tenantId, input);
    if (linkError) return linkError;

    const reminder = await this.reminderRepository.create(tenantId, {
      bookingId: input.bookingId,
      customerId: input.customerId,
      vendorId: input.vendorId,
      staffMemberId: input.staffMemberId,
      communicationRecordId: input.communicationRecordId,
      category: input.category,
      title: input.title.trim(),
      notes: input.notes,
      dueAt: input.dueAt,
      assignedToUserId: input.assignedToUserId,
    });
    return success(toReminderDto(reminder));
  }

  async listAll(tenantId: string): Promise<Result<ReminderDto[]>> {
    const rows = await this.reminderRepository.findAll(tenantId);
    return success(rows.map(toReminderDto));
  }

  async listByBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<ReminderDto[]>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }
    const rows = await this.reminderRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    return success(rows.map(toReminderDto));
  }

  async getById(tenantId: string, id: string): Promise<Result<ReminderDto>> {
    const reminder = await this.reminderRepository.findById(tenantId, id);
    if (!reminder) {
      return failure('NOT_FOUND', 'Reminder not found.');
    }
    return success(toReminderDto(reminder));
  }

  async complete(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<Result<ReminderDto>> {
    return this.transition(tenantId, id, version, 'completed');
  }

  async cancel(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<Result<ReminderDto>> {
    return this.transition(tenantId, id, version, 'cancelled');
  }

  private async transition(
    tenantId: string,
    id: string,
    version: number,
    status: 'completed' | 'cancelled',
  ): Promise<Result<ReminderDto>> {
    const existing = await this.reminderRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Reminder not found.');
    }
    if (existing.status !== 'pending') {
      return failure(
        'INVALID_STATE',
        `Cannot ${status === 'completed' ? 'complete' : 'cancel'} a reminder that is already ${existing.status}.`,
        { status: existing.status },
      );
    }

    const now = new Date();
    try {
      const updated = await this.reminderRepository.update(
        tenantId,
        id,
        {
          status,
          completedAt: status === 'completed' ? now : null,
          cancelledAt: status === 'cancelled' ? now : null,
        },
        version,
      );
      return success(toReminderDto(updated));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Reminder was modified by another request. Reload and retry.',
          { reminderId: id },
        );
      }
      throw error;
    }
  }

  private async validateLinks(
    tenantId: string,
    input: CreateReminderInput,
  ): Promise<Result<ReminderDto> | null> {
    if (input.bookingId) {
      const booking = await this.eventRepository.findById(
        tenantId,
        input.bookingId,
      );
      if (!booking) {
        return failure('NOT_FOUND', 'Booking not found.');
      }
    }
    if (input.customerId) {
      const customer = await this.customerRepository.findById(
        tenantId,
        input.customerId,
      );
      if (!customer) {
        return failure('NOT_FOUND', 'Customer not found.');
      }
    }
    if (input.vendorId) {
      const vendor = await this.vendorRepository.findById(
        tenantId,
        input.vendorId,
      );
      if (!vendor) {
        return failure('NOT_FOUND', 'Vendor not found.');
      }
    }
    if (input.staffMemberId) {
      const staff = await this.staffMemberRepository.findById(
        tenantId,
        input.staffMemberId,
      );
      if (!staff) {
        return failure('NOT_FOUND', 'Staff member not found.');
      }
    }
    if (input.communicationRecordId) {
      const record = await this.communicationRecordRepository.findById(
        tenantId,
        input.communicationRecordId,
      );
      if (!record || record.deletedAt) {
        return failure('NOT_FOUND', 'Communication not found.');
      }
    }
    return null;
  }
}
