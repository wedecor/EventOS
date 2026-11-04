import { Injectable } from '@nestjs/common';
import type {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
} from '@prisma/client';
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
import { CommunicationAttachmentRepository } from '../../domain/repositories/communication-attachment.repository';
import { CommunicationRecordRepository } from '../../domain/repositories/communication-record.repository';
import { CommunicationTemplateRepository } from '../../domain/repositories/communication-template.repository';
import {
  toCommunicationAttachmentDto,
  toCommunicationDto,
  type CommunicationAttachmentDto,
  type CommunicationDto,
} from '../dtos/communication.dto';

export type CreateCommunicationInput = {
  bookingId?: string | null;
  customerId?: string | null;
  vendorId?: string | null;
  staffMemberId?: string | null;
  templateId?: string | null;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status?: CommunicationStatus;
  subject?: string | null;
  body?: string | null;
  createdByUserId?: string | null;
  occurredAt?: Date;
};

export type UpdateCommunicationInput = {
  subject?: string | null;
  body?: string | null;
  bookingId?: string | null;
  customerId?: string | null;
  vendorId?: string | null;
  staffMemberId?: string | null;
  templateId?: string | null;
};

export type TransitionCommunicationInput = {
  status: CommunicationStatus;
  failureReason?: string | null;
};

export type AddCommunicationAttachmentInput = {
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  storageKey?: string | null;
};

const MANUAL_CHANNELS = new Set<CommunicationChannel>([
  'internal_note',
  'manual_meeting',
  'phone_call',
]);

const ALLOWED_TRANSITIONS: Record<CommunicationStatus, CommunicationStatus[]> =
  {
    draft: ['queued', 'cancelled', 'completed'],
    queued: ['sent', 'cancelled', 'failed'],
    sent: ['delivered', 'failed', 'cancelled'],
    delivered: ['read', 'failed'],
    read: [],
    failed: ['queued', 'cancelled'],
    cancelled: [],
    completed: [],
  };

@Injectable()
export class CommunicationApplicationService {
  constructor(
    private readonly recordRepository: CommunicationRecordRepository,
    private readonly attachmentRepository: CommunicationAttachmentRepository,
    private readonly templateRepository: CommunicationTemplateRepository,
    private readonly eventRepository: EventRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly vendorRepository: VendorRepository,
    private readonly staffMemberRepository: StaffMemberRepository,
  ) {}

  async create(
    tenantId: string,
    input: CreateCommunicationInput,
  ): Promise<Result<CommunicationDto>> {
    const linkError = await this.validateLinks(tenantId, input);
    if (linkError) return linkError;

    const status = input.status ?? 'draft';
    if (status === 'completed' && !MANUAL_CHANNELS.has(input.channel)) {
      return failure(
        'VALIDATION_ERROR',
        'Only manual channels may be created as completed.',
        { channel: input.channel },
      );
    }
    if (status !== 'draft' && status !== 'queued' && status !== 'completed') {
      return failure(
        'VALIDATION_ERROR',
        'Communications may only be created as draft, queued, or completed (manual channels).',
        { status },
      );
    }

    const record = await this.recordRepository.create(tenantId, {
      bookingId: input.bookingId,
      customerId: input.customerId,
      vendorId: input.vendorId,
      staffMemberId: input.staffMemberId,
      templateId: input.templateId,
      channel: input.channel,
      direction: input.direction,
      status,
      subject: input.subject,
      body: input.body,
      createdByUserId: input.createdByUserId,
      occurredAt: input.occurredAt,
    });

    return success(toCommunicationDto(record));
  }

  async getById(
    tenantId: string,
    id: string,
  ): Promise<Result<CommunicationDto>> {
    const record = await this.recordRepository.findById(tenantId, id);
    if (!record || record.deletedAt) {
      return failure('NOT_FOUND', 'Communication not found.');
    }
    return success(toCommunicationDto(record));
  }

  async listAll(tenantId: string): Promise<Result<CommunicationDto[]>> {
    const rows = await this.recordRepository.findAll(tenantId);
    return success(rows.map(toCommunicationDto));
  }

  async listByBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<CommunicationDto[]>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }
    const rows = await this.recordRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    return success(rows.map(toCommunicationDto));
  }

  async updateMetadata(
    tenantId: string,
    id: string,
    input: UpdateCommunicationInput,
    version: number,
  ): Promise<Result<CommunicationDto>> {
    const existing = await this.recordRepository.findById(tenantId, id);
    if (!existing || existing.deletedAt) {
      return failure('NOT_FOUND', 'Communication not found.');
    }

    const linkError = await this.validateLinks(tenantId, {
      ...input,
      channel: existing.channel,
      direction: existing.direction,
    });
    if (linkError) return linkError;

    try {
      const updated = await this.recordRepository.update(
        tenantId,
        id,
        {
          subject: input.subject,
          body: input.body,
          bookingId: input.bookingId,
          customerId: input.customerId,
          vendorId: input.vendorId,
          staffMemberId: input.staffMemberId,
          templateId: input.templateId,
        },
        version,
      );
      return success(toCommunicationDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  async softDelete(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<Result<CommunicationDto>> {
    const existing = await this.recordRepository.findById(tenantId, id);
    if (!existing || existing.deletedAt) {
      return failure('NOT_FOUND', 'Communication not found.');
    }

    try {
      const updated = await this.recordRepository.update(
        tenantId,
        id,
        { deletedAt: new Date() },
        version,
      );
      return success(toCommunicationDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  async transitionStatus(
    tenantId: string,
    id: string,
    input: TransitionCommunicationInput,
    version: number,
  ): Promise<Result<CommunicationDto>> {
    const existing = await this.recordRepository.findById(tenantId, id);
    if (!existing || existing.deletedAt) {
      return failure('NOT_FOUND', 'Communication not found.');
    }

    const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(input.status)) {
      return failure(
        'INVALID_STATE',
        `Cannot transition communication from ${existing.status} to ${input.status}.`,
        { from: existing.status, to: input.status },
      );
    }

    if (
      input.status === 'completed' &&
      !MANUAL_CHANNELS.has(existing.channel)
    ) {
      return failure(
        'VALIDATION_ERROR',
        'Only manual channels may transition to completed.',
        { channel: existing.channel },
      );
    }

    const now = new Date();
    const patch: {
      status: CommunicationStatus;
      failureReason?: string | null;
      sentAt?: Date | null;
      deliveredAt?: Date | null;
      readAt?: Date | null;
      failedAt?: Date | null;
    } = { status: input.status };

    if (input.status === 'sent') patch.sentAt = now;
    if (input.status === 'delivered') patch.deliveredAt = now;
    if (input.status === 'read') patch.readAt = now;
    if (input.status === 'failed') {
      patch.failedAt = now;
      patch.failureReason = input.failureReason ?? null;
    }
    if (input.status === 'queued' && existing.status === 'failed') {
      patch.failureReason = null;
      patch.failedAt = null;
    }

    try {
      const updated = await this.recordRepository.update(
        tenantId,
        id,
        patch,
        version,
      );
      return success(toCommunicationDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  async addAttachment(
    tenantId: string,
    communicationId: string,
    input: AddCommunicationAttachmentInput,
  ): Promise<Result<CommunicationAttachmentDto>> {
    const record = await this.recordRepository.findById(
      tenantId,
      communicationId,
    );
    if (!record || record.deletedAt) {
      return failure('NOT_FOUND', 'Communication not found.');
    }

    const attachment = await this.attachmentRepository.create(tenantId, {
      communicationRecordId: communicationId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      storageKey: input.storageKey,
    });
    return success(toCommunicationAttachmentDto(attachment));
  }

  async listAttachments(
    tenantId: string,
    communicationId: string,
  ): Promise<Result<CommunicationAttachmentDto[]>> {
    const record = await this.recordRepository.findById(
      tenantId,
      communicationId,
    );
    if (!record || record.deletedAt) {
      return failure('NOT_FOUND', 'Communication not found.');
    }
    const rows = await this.attachmentRepository.findByCommunicationRecordId(
      tenantId,
      communicationId,
    );
    return success(rows.map(toCommunicationAttachmentDto));
  }

  async softDeleteAttachment(
    tenantId: string,
    communicationId: string,
    attachmentId: string,
    version: number,
  ): Promise<Result<CommunicationAttachmentDto>> {
    const record = await this.recordRepository.findById(
      tenantId,
      communicationId,
    );
    if (!record || record.deletedAt) {
      return failure('NOT_FOUND', 'Communication not found.');
    }

    const attachment = await this.attachmentRepository.findById(
      tenantId,
      attachmentId,
    );
    if (
      !attachment ||
      attachment.deletedAt ||
      attachment.communicationRecordId !== communicationId
    ) {
      return failure('NOT_FOUND', 'Communication attachment not found.');
    }

    try {
      const updated = await this.attachmentRepository.update(
        tenantId,
        attachmentId,
        { deletedAt: new Date() },
        version,
      );
      return success(toCommunicationAttachmentDto(updated));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Communication attachment was modified by another request. Reload and retry.',
          { attachmentId },
        );
      }
      throw error;
    }
  }

  private async validateLinks(
    tenantId: string,
    input: {
      bookingId?: string | null;
      customerId?: string | null;
      vendorId?: string | null;
      staffMemberId?: string | null;
      templateId?: string | null;
      channel: CommunicationChannel;
      direction: CommunicationDirection;
    },
  ): Promise<Result<CommunicationDto> | null> {
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
    if (input.templateId) {
      const template = await this.templateRepository.findById(
        tenantId,
        input.templateId,
      );
      if (!template || template.status === 'archived') {
        return failure('NOT_FOUND', 'Communication template not found.');
      }
    }
    return null;
  }

  private handleConcurrency<T>(
    error: unknown,
    communicationId: string,
  ): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Communication was modified by another request. Reload and retry.',
        { communicationId },
      );
    }
    throw error;
  }
}
