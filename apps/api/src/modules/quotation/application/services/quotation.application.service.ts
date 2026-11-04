import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import {
  AuditLogService,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from '../../../../shared/audit';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  QuotationApprovedEvent,
  QuotationCreatedEvent,
  QuotationRejectedEvent,
  QuotationSentEvent,
  QuotationSupersededEvent,
} from '../../../../shared/events/sprint1-domain.events';
import { BookingApplicationService } from '../../../booking/application/services/booking.application.service';
import {
  QuotationRepository,
  type CreateQuotationData,
} from '../../domain/repositories/quotation.repository';
import { QuotationLineItemRepository } from '../../domain/repositories/quotation-line-item.repository';
import {
  toApproveQuotationResultDto,
  toQuotationDto,
  type ApproveQuotationResultDto,
  type QuotationDto,
} from '../dtos/quotation.dto';

export type CreateQuotationInput = Omit<
  CreateQuotationData,
  'quotationNumber' | 'revisionNumber' | 'status'
>;

export type UpdateQuotationInput = {
  validUntil?: Date;
  notes?: string;
  discountAmount?: number;
  taxAmount?: number;
};

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
    private readonly lineItemRepository: QuotationLineItemRepository,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly bookingService: BookingApplicationService,
    private readonly auditLog: AuditLogService,
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

  async getQuotationById(
    tenantId: string,
    quotationId: string,
  ): Promise<Result<QuotationDto>> {
    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );
    if (!quotation) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    return success(toQuotationDto(quotation));
  }

  async updateQuotation(
    tenantId: string,
    quotationId: string,
    input: UpdateQuotationInput,
    version: number,
  ): Promise<Result<QuotationDto>> {
    const existing = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    if (existing.status !== 'draft') {
      return failure('INVALID_STATE', 'Only draft quotations can be updated.', {
        status: existing.status,
      });
    }

    try {
      const quotation = await this.quotationRepository.update(
        tenantId,
        quotationId,
        {
          validUntil: input.validUntil,
          notes: input.notes,
          discountAmount: input.discountAmount,
          taxAmount: input.taxAmount,
        },
        version,
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

  // EP1-AUT-006 — approving a quotation also drives the conversion linkage into the
  // Approved Event chain, per docs/09-api-design.md `POST /api/v1/quotations/:id/approve`
  // ("Transaction boundary: approve + conversion linkage to Approved Event chain";
  // response includes `eventId: uuid|null`). Reuses
  // `BookingApplicationService.createEventFromApprovedQuotation()` — the single place
  // that enforces EP1-BR-001 (advance payment), the duplicate-event guard, and
  // `EventCreated` publishing — so none of that logic is duplicated here.
  //
  // Event creation is a best-effort chained step, not a hard precondition of approval:
  // if the advance payment has not been confirmed yet (EP1-BR-001) or the event already
  // exists, the quotation is still approved and `eventId` reflects the outcome
  // (`null` or the existing event's id respectively). Any other failure from that call
  // is likewise non-fatal to approval, since booking creation is a separate aggregate
  // write that can be retried once its own preconditions are met.
  // R1-08 — audit wrapper. Emits exactly one audit record per authenticated approval
  // attempt, capturing the real outcome (success or failure). The audit write is
  // best-effort and outside the business transaction, so it never affects the
  // returned Result (docs/10 §Audit Strategy).
  async approveQuotation(
    actorId: string,
    tenantId: string,
    quotationId: string,
    version: number,
  ): Promise<Result<ApproveQuotationResultDto>> {
    const result = await this.approveQuotationInternal(
      tenantId,
      quotationId,
      version,
    );

    await this.auditLog.record({
      actorId,
      tenantId,
      action: AUDIT_ACTIONS.QUOTATION_APPROVED,
      entityType: AUDIT_ENTITY_TYPES.QUOTATION,
      entityId: quotationId,
      outcome: result.ok ? 'success' : 'failure',
      metadata: result.ok
        ? { status: result.value.status, eventId: result.value.eventId }
        : { errorCode: result.error.code },
    });

    return result;
  }

  private async approveQuotationInternal(
    tenantId: string,
    quotationId: string,
    version: number,
  ): Promise<Result<ApproveQuotationResultDto>> {
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

      const eventId = await this.tryCreateEventFromApprovedQuotation(
        tenantId,
        quotation.id,
      );

      return success(toApproveQuotationResultDto(quotation, eventId));
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

  private async tryCreateEventFromApprovedQuotation(
    tenantId: string,
    quotationId: string,
  ): Promise<string | null> {
    const result = await this.bookingService.createEventFromApprovedQuotation(
      tenantId,
      quotationId,
    );

    if (result.ok) {
      return result.value.id;
    }

    if (result.error.code === 'DUPLICATE_EVENT') {
      const existingEventId = result.error.details?.eventId;
      return typeof existingEventId === 'string' ? existingEventId : null;
    }

    // EP1-BR-001 (advance payment not yet confirmed) or any other precondition
    // failure: the Event will be created later once its own preconditions pass.
    return null;
  }

  async sendQuotation(
    tenantId: string,
    quotationId: string,
    version: number,
    _channel?: string,
    _recipient?: string,
  ): Promise<Result<QuotationDto>> {
    const existing = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    if (existing.status !== 'draft') {
      return failure('INVALID_STATE', 'Only draft quotations can be sent.', {
        status: existing.status,
      });
    }

    const lineItemCount = await this.lineItemRepository.countByQuotationId(
      tenantId,
      quotationId,
    );
    if (lineItemCount === 0) {
      return failure(
        'VALIDATION_ERROR',
        'Quotation must have at least one line item before sending.',
      );
    }

    if (existing.totalAmount <= 0) {
      return failure(
        'VALIDATION_ERROR',
        'Quotation total must be greater than zero before sending.',
      );
    }

    try {
      const quotation = await this.quotationRepository.update(
        tenantId,
        quotationId,
        { status: 'sent' },
        version,
      );

      this.eventPublisher.publish(new QuotationSentEvent(tenantId, quotation));

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

  async rejectQuotation(
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
      return failure('INVALID_STATE', 'Only sent quotations can be rejected.', {
        status: existing.status,
      });
    }

    try {
      const quotation = await this.quotationRepository.update(
        tenantId,
        quotationId,
        { status: 'rejected' },
        version,
      );

      this.eventPublisher.publish(
        new QuotationRejectedEvent(tenantId, quotation),
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
