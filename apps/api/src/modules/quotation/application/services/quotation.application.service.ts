import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  QuotationApprovedEvent,
  QuotationCreatedEvent,
  QuotationSupersededEvent,
} from '../../../../shared/events/sprint1-domain.events';
import {
  QuotationRepository,
  type CreateQuotationData,
} from '../../domain/repositories/quotation.repository';
import { toQuotationDto, type QuotationDto } from '../dtos/quotation.dto';

export type CreateQuotationInput = Omit<
  CreateQuotationData,
  'quotationNumber' | 'revisionNumber' | 'status'
>;

const REVISIONABLE_STATUSES = new Set([
  'draft',
  'sent',
  'approved',
  'rejected',
  'expired',
]);

@Injectable()
export class QuotationApplicationService {
  constructor(
    private readonly quotationRepository: QuotationRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createQuotation(
    tenantId: string,
    input: CreateQuotationInput,
  ): Promise<Result<QuotationDto>> {
    const validation = this.validateQuotationDates(
      input.eventStartDate,
      input.eventEndDate,
    );
    if (validation !== null) {
      return validation;
    }

    const maxNumber =
      await this.quotationRepository.findMaxQuotationNumber(tenantId);

    const quotation = await this.quotationRepository.create(tenantId, {
      ...input,
      quotationNumber: maxNumber + 1,
      revisionNumber: 1,
      status: 'draft',
    });

    this.eventPublisher.publish(new QuotationCreatedEvent(tenantId, quotation));

    return success(toQuotationDto(quotation));
  }

  async createNewRevision(
    tenantId: string,
    quotationId: string,
    version: number,
  ): Promise<Result<QuotationDto>> {
    const existing = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    if (existing.status === 'superseded') {
      return failure(
        'INVALID_STATE',
        'Superseded quotations cannot be revised again.',
      );
    }

    if (!REVISIONABLE_STATUSES.has(existing.status)) {
      return failure(
        'INVALID_STATE',
        `Quotation in status ${existing.status} cannot be revised.`,
      );
    }

    const replacement = await this.quotationRepository.create(tenantId, {
      customerId: existing.customerId,
      leadId: existing.leadId,
      quotationNumber: existing.quotationNumber,
      revisionNumber: existing.revisionNumber + 1,
      status: 'draft',
      eventType: existing.eventType,
      eventStartDate: existing.eventStartDate,
      eventEndDate: existing.eventEndDate,
      venue: existing.venue,
      validUntil: existing.validUntil,
      terms: existing.terms,
      notes: existing.notes,
      subtotalAmount: existing.subtotalAmount,
      discountAmount: existing.discountAmount,
      taxAmount: existing.taxAmount,
      totalAmount: existing.totalAmount,
      currency: existing.currency,
    });

    try {
      const superseded = await this.quotationRepository.update(
        tenantId,
        existing.id,
        {
          status: 'superseded',
          supersededById: replacement.id,
        },
        version,
      );

      this.eventPublisher.publish(
        new QuotationSupersededEvent(tenantId, superseded, replacement.id),
      );
      this.eventPublisher.publish(
        new QuotationCreatedEvent(tenantId, replacement),
      );

      return success(toQuotationDto(replacement));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Quotation was modified by another request. Reload and retry.',
          { quotationId },
        );
      }
      throw error;
    }
  }

  async approveQuotation(
    tenantId: string,
    quotationId: string,
    version: number,
  ): Promise<Result<QuotationDto>> {
    const existing = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    if (existing.status !== 'sent') {
      return failure('INVALID_STATE', 'Only sent quotations can be approved.', {
        status: existing.status,
      });
    }

    if (existing.totalAmount <= 0) {
      return failure(
        'VALIDATION_ERROR',
        'Quotation total must be greater than zero before approval.',
      );
    }

    if (existing.validUntil && existing.validUntil < new Date()) {
      return failure(
        'INVALID_STATE',
        'Quotation has expired and cannot be approved.',
      );
    }

    try {
      const quotation = await this.quotationRepository.update(
        tenantId,
        quotationId,
        { status: 'approved' },
        version,
      );

      this.eventPublisher.publish(
        new QuotationApprovedEvent(tenantId, quotation),
      );

      return success(toQuotationDto(quotation));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Quotation was modified by another request. Reload and retry.',
          { quotationId },
        );
      }
      throw error;
    }
  }

  private validateQuotationDates(
    start?: Date | null,
    end?: Date | null,
  ): Result<never> | null {
    if (start && end && end < start) {
      return failure(
        'VALIDATION_ERROR',
        'Event end date must be on or after the start date.',
      );
    }

    return null;
  }
}
