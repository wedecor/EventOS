import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { QuotationRepository } from '../../domain/repositories/quotation.repository';
import {
  QuotationLineItemRepository,
  type CreateLineItemData,
  type UpdateLineItemData,
} from '../../domain/repositories/quotation-line-item.repository';
import {
  toQuotationLineItemDto,
  type QuotationLineItemDto,
} from '../dtos/quotation-line-item.dto';
import { calculateQuotationTotals } from './quotation-totals.calculator';

export type AddLineItemInput = Omit<CreateLineItemData, 'quotationId'>;
export type UpdateLineItemInput = UpdateLineItemData;

@Injectable()
export class QuotationLineItemApplicationService {
  constructor(
    private readonly quotationRepository: QuotationRepository,
    private readonly lineItemRepository: QuotationLineItemRepository,
  ) {}

  async addLineItem(
    tenantId: string,
    quotationId: string,
    input: AddLineItemInput,
  ): Promise<Result<QuotationLineItemDto>> {
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
        { status: quotation.status },
      );
    }

    if (input.unitPriceAmount < 0) {
      return failure(
        'VALIDATION_ERROR',
        'Unit price amount must be zero or greater.',
      );
    }

    const existingLineItems = await this.lineItemRepository.findByQuotationId(
      tenantId,
      quotationId,
    );

    const totals = calculateQuotationTotals({
      lineItems: [
        ...existingLineItems,
        {
          quantity: input.quantity ?? 1,
          unitPriceAmount: input.unitPriceAmount,
        },
      ],
      discountAmount: quotation.discountAmount,
      taxAmount: quotation.taxAmount,
    });

    try {
      const lineItem = await this.lineItemRepository.createWithQuotationTotals(
        tenantId,
        { ...input, quotationId },
        totals,
        quotation.version,
      );

      return success(toQuotationLineItemDto(lineItem));
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

  async updateLineItem(
    tenantId: string,
    quotationId: string,
    itemId: string,
    input: UpdateLineItemInput,
    version: number,
  ): Promise<Result<QuotationLineItemDto>> {
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
        'Line items can only be updated on draft quotations.',
        { status: quotation.status },
      );
    }

    const existing = await this.lineItemRepository.findById(tenantId, itemId);
    if (!existing) {
      return failure('NOT_FOUND', 'Line item not found.');
    }

    if (existing.quotationId !== quotationId) {
      return failure(
        'NOT_FOUND',
        'Line item does not belong to this quotation.',
      );
    }

    if (input.unitPriceAmount !== undefined && input.unitPriceAmount < 0) {
      return failure(
        'VALIDATION_ERROR',
        'Unit price amount must be zero or greater.',
      );
    }

    const allLineItems = await this.lineItemRepository.findByQuotationId(
      tenantId,
      quotationId,
    );

    // Apply the pending change to its line item before recalculating totals,
    // so the persisted totals always reflect the post-update state.
    const totals = calculateQuotationTotals({
      lineItems: allLineItems.map((item) =>
        item.id === itemId
          ? {
              quantity: input.quantity ?? item.quantity,
              unitPriceAmount: input.unitPriceAmount ?? item.unitPriceAmount,
            }
          : item,
      ),
      discountAmount: quotation.discountAmount,
      taxAmount: quotation.taxAmount,
    });

    try {
      const updated = await this.lineItemRepository.updateWithQuotationTotals(
        tenantId,
        itemId,
        input,
        version,
        totals,
        quotation.version,
      );

      return success(toQuotationLineItemDto(updated));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Line item or quotation was modified by another request. Reload and retry.',
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
  ): Promise<Result<{ itemId: string; deleted: boolean }>> {
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
        'Line items can only be removed from draft quotations.',
        { status: quotation.status },
      );
    }

    const existing = await this.lineItemRepository.findById(tenantId, itemId);
    if (!existing) {
      return failure('NOT_FOUND', 'Line item not found.');
    }

    const remainingLineItems = (
      await this.lineItemRepository.findByQuotationId(tenantId, quotationId)
    ).filter((item) => item.id !== itemId);

    // Handles the zero-line-item case: an empty array yields
    // subtotalAmount = 0 and totalAmount = 0 - discountAmount + taxAmount.
    const totals = calculateQuotationTotals({
      lineItems: remainingLineItems,
      discountAmount: quotation.discountAmount,
      taxAmount: quotation.taxAmount,
    });

    try {
      await this.lineItemRepository.removeWithQuotationTotals(
        tenantId,
        itemId,
        quotationId,
        totals,
        quotation.version,
      );

      return success({ itemId, deleted: true });
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

  async listLineItems(
    tenantId: string,
    quotationId: string,
  ): Promise<Result<QuotationLineItemDto[]>> {
    const lineItems = await this.lineItemRepository.findByQuotationId(
      tenantId,
      quotationId,
    );

    return success(lineItems.map(toQuotationLineItemDto));
  }
}
