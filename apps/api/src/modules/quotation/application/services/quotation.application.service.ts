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
  QuotationSentEvent,
  QuotationSupersededEvent,
} from '../../../../shared/events/sprint1-domain.events';
import {
  QuotationRepository,
  type CreateQuotationData,
  type UpdateQuotationData,
} from '../../domain/repositories/quotation.repository';
import { QuotationLineItemRepository } from '../../domain/repositories/quotation-line-item.repository';
import { buildMinimalQuotationPdf } from '../../../../shared/pdf/minimal-quotation-pdf';
import { buildQuotationPdfLines } from '../../../../shared/pdf/quotation-pdf-lines';
import { TenantRepository } from '../../../platform/domain/repositories/tenant.repository';
import {
  toQuotationLineItemDto,
  type QuotationLineItemDto,
} from '../dtos/quotation-line-item.dto';
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
    private readonly lineItemRepository: QuotationLineItemRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async getQuotation(
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

  async listLineItems(
    tenantId: string,
    quotationId: string,
  ): Promise<Result<QuotationLineItemDto[]>> {
    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );

    if (!quotation) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    const items = await this.lineItemRepository.listActiveByQuotation(
      tenantId,
      quotationId,
    );

    return success(items.map(toQuotationLineItemDto));
  }

  async findLatestByLeadId(
    tenantId: string,
    leadId: string,
  ): Promise<Result<QuotationDto | null>> {
    const leadQuotation = await this.quotationRepository.findLatestByLeadId(
      tenantId,
      leadId,
    );

    return success(leadQuotation ? toQuotationDto(leadQuotation) : null);
  }

  async generateQuotationPdf(
    tenantId: string,
    quotationId: string,
  ): Promise<Result<Buffer>> {
    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );

    if (!quotation) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    const lineItems = await this.lineItemRepository.listActiveByQuotation(
      tenantId,
      quotationId,
    );

    const tenant = await this.tenantRepository.findById(tenantId);
    const lines = buildQuotationPdfLines({
      tenantName: tenant?.name ?? 'Event OS',
      quotation,
      lineItems,
    });

    return success(buildMinimalQuotationPdf(lines));
  }

  async updateQuotation(
    tenantId: string,
    quotationId: string,
    input: UpdateQuotationData,
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
      return failure('INVALID_STATE', 'Only draft quotations can be updated.');
    }

    const validation = this.validateQuotationDates(
      input.eventStartDate ?? existing.eventStartDate,
      input.eventEndDate ?? existing.eventEndDate,
    );
    if (validation !== null) {
      return validation;
    }

    try {
      const quotation = await this.quotationRepository.update(
        tenantId,
        quotationId,
        input,
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

  async sendQuotation(
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

    if (existing.status !== 'draft') {
      return failure('INVALID_STATE', 'Only draft quotations can be sent.');
    }

    const lineCount = await this.lineItemRepository.countActiveByQuotation(
      tenantId,
      quotationId,
    );

    if (lineCount < 1) {
      return failure(
        'VALIDATION_ERROR',
        'Quotation must have at least one line item before sending.',
      );
    }

    if (existing.totalAmount <= 0) {
      await this.recalculateTotals(tenantId, quotationId, existing.version);
      const refreshed = await this.quotationRepository.findById(
        tenantId,
        quotationId,
      );
      if (!refreshed || refreshed.totalAmount <= 0) {
        return failure(
          'VALIDATION_ERROR',
          'Quotation total must be greater than zero before sending.',
        );
      }
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
      return failure('INVALID_STATE', 'Only sent quotations can be rejected.');
    }

    try {
      const quotation = await this.quotationRepository.update(
        tenantId,
        quotationId,
        { status: 'rejected' },
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

  async addLineItem(
    tenantId: string,
    quotationId: string,
    input: {
      description: string;
      packageId?: string | null;
      quantity: number;
      unitPrice: number;
      sortOrder?: number;
    },
  ): Promise<Result<{ id: string; quotationId: string }>> {
    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );

    if (!quotation) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    if (quotation.status !== 'draft') {
      return failure(
        'INVALID_STATE',
        'Line items can only be added to draft quotations.',
      );
    }

    if (input.quantity <= 0 || input.unitPrice < 0) {
      return failure(
        'VALIDATION_ERROR',
        'Invalid line item quantity or price.',
      );
    }

    const item = await this.lineItemRepository.create(tenantId, {
      quotationId,
      description: input.description,
      packageId: input.packageId,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      sortOrder: input.sortOrder,
    });

    await this.recalculateTotals(tenantId, quotationId, quotation.version);

    return success({ id: item.id, quotationId });
  }

  async updateLineItem(
    tenantId: string,
    quotationId: string,
    itemId: string,
    input: {
      description?: string;
      packageId?: string | null;
      quantity?: number;
      unitPrice?: number;
      sortOrder?: number;
    },
    version: number,
  ): Promise<Result<{ id: string }>> {
    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );

    if (!quotation || quotation.status !== 'draft') {
      return failure('INVALID_STATE', 'Quotation is not editable.');
    }

    const item = await this.lineItemRepository.findById(tenantId, itemId);
    if (!item || item.quotationId !== quotationId) {
      return failure('NOT_FOUND', 'Line item not found.');
    }

    try {
      const updated = await this.lineItemRepository.update(
        tenantId,
        itemId,
        input,
        version,
      );

      await this.recalculateTotals(tenantId, quotationId, quotation.version);

      return success({ id: updated.id });
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Line item was modified by another request. Reload and retry.',
          { itemId },
        );
      }
      throw error;
    }
  }

  async removeLineItem(
    tenantId: string,
    quotationId: string,
    itemId: string,
    version: number,
  ): Promise<Result<{ itemId: string; deleted: true }>> {
    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );

    if (!quotation || quotation.status !== 'draft') {
      return failure('INVALID_STATE', 'Quotation is not editable.');
    }

    const item = await this.lineItemRepository.findById(tenantId, itemId);
    if (!item || item.quotationId !== quotationId) {
      return failure('NOT_FOUND', 'Line item not found.');
    }

    try {
      await this.lineItemRepository.softDelete(tenantId, itemId, version);
      await this.recalculateTotals(tenantId, quotationId, quotation.version);
      return success({ itemId, deleted: true });
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Line item was modified by another request. Reload and retry.',
          { itemId },
        );
      }
      throw error;
    }
  }

  private async recalculateTotals(
    tenantId: string,
    quotationId: string,
    version: number,
  ): Promise<void> {
    const items = await this.lineItemRepository.listActiveByQuotation(
      tenantId,
      quotationId,
    );

    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );

    if (!quotation) {
      return;
    }

    const discount = quotation.discountAmount;
    const tax = quotation.taxAmount;
    const total = subtotal - discount + tax;

    await this.quotationRepository.update(
      tenantId,
      quotationId,
      {
        subtotalAmount: subtotal,
        totalAmount: total,
      },
      version,
    );
  }

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
