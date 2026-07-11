import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { QuotationApplicationService } from '../application/services/quotation.application.service';
import { QuotationLineItemApplicationService } from '../application/services/quotation-line-item.application.service';
import {
  addLineItemSchema,
  createQuotationSchema,
  rejectQuotationSchema,
  updateLineItemSchema,
  updateQuotationSchema,
  type AddLineItemBody,
  type CreateQuotationBody,
  type RejectQuotationBody,
  type UpdateLineItemBody,
  type UpdateQuotationBody,
} from './schemas/quotation.schemas';

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationApplicationService,
    private readonly lineItemService: QuotationLineItemApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new quotation' })
  async createQuotation(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createQuotationSchema))
    body: CreateQuotationBody,
  ) {
    const result = await this.quotationService.createQuotation(tenantId, {
      customerId: body.customerId,
      leadId: body.leadId,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      notes: body.notes,
    });

    return resultToResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a quotation by ID' })
  async retrieveQuotation(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.quotationService.getQuotationById(tenantId, id);
    return resultToResponse(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quotation' })
  async updateQuotation(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateQuotationSchema))
    body: UpdateQuotationBody,
  ) {
    const result = await this.quotationService.updateQuotation(
      tenantId,
      id,
      {
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        notes: body.notes,
        discountAmount: body.discountAmount,
        taxAmount: body.taxAmount,
      },
      version ?? 0,
    );

    return resultToResponse(result);
  }

  @Post(':id/line-items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a line item to a quotation' })
  async addLineItem(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @Body(new ZodValidationPipe(addLineItemSchema)) body: AddLineItemBody,
  ) {
    const result = await this.lineItemService.addLineItem(
      tenantId,
      quotationId,
      {
        description: body.description,
        quantity: body.quantity,
        unitPriceAmount: body.unitPrice.amount,
        currency: body.unitPrice.currency,
        sortOrder: body.sortOrder,
      },
    );

    return resultToResponse(result);
  }

  @Patch(':id/line-items/:itemId')
  @ApiOperation({ summary: 'Update a line item' })
  async updateLineItem(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @Param('itemId') itemId: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateLineItemSchema))
    body: UpdateLineItemBody,
  ) {
    const result = await this.lineItemService.updateLineItem(
      tenantId,
      quotationId,
      itemId,
      {
        description: body.description,
        quantity: body.quantity,
        unitPriceAmount: body.unitPrice?.amount,
        sortOrder: body.sortOrder,
      },
      version ?? 0,
    );

    return resultToResponse(result);
  }

  @Delete(':id/line-items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a line item from a quotation' })
  async removeLineItem(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @Param('itemId') itemId: string,
  ) {
    const result = await this.lineItemService.removeLineItem(
      tenantId,
      quotationId,
      itemId,
    );

    if (!result.ok) {
      resultToResponse(result);
    }
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send a quotation' })
  async sendQuotation(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @IfMatchVersion() version: number | undefined,
  ) {
    const result = await this.quotationService.sendQuotation(
      tenantId,
      quotationId,
      version ?? 0,
    );

    return resultToResponse(result);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a quotation' })
  async approveQuotation(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @IfMatchVersion() version: number | undefined,
  ) {
    const result = await this.quotationService.approveQuotation(
      tenantId,
      quotationId,
      version ?? 0,
    );

    return resultToResponse(result);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a quotation' })
  async rejectQuotation(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(rejectQuotationSchema))
    _body: RejectQuotationBody,
  ) {
    const result = await this.quotationService.rejectQuotation(
      tenantId,
      quotationId,
      version ?? 0,
    );

    return resultToResponse(result);
  }

  @Post(':id/revise')
  @ApiOperation({ summary: 'Create a new revision of a quotation' })
  async reviseQuotation(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @IfMatchVersion() version: number | undefined,
  ) {
    const result = await this.quotationService.createNewRevision(
      tenantId,
      quotationId,
      version ?? 0,
    );

    return resultToResponse(result);
  }
}
