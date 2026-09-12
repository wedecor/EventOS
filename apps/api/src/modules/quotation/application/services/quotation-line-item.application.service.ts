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

    const lineItem = await this.lineItemRepository.create(tenantId, {
      ...input,
      quotationId,
    });

    return success(toQuotationLineItemDto(lineItem));
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

    try {
      const updated = await this.lineItemRepository.update(
        tenantId,
        itemId,
        input,
        version,
      );

      return success(toQuotationLineItemDto(updated));
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

    await this.lineItemRepository.remove(tenantId, itemId);

    return success({ itemId, deleted: true });
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
