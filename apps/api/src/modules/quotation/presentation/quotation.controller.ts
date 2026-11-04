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
import { CurrentUser, Permissions, type AuthenticatedUser } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import {
  ApiDataResponse,
  ApiIfMatchHeader,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
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
  @Permissions('quotations:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new quotation' })
  @ApiZodBody(createQuotationSchema)
  @ApiDataResponse(201, 'Quotation created')
  @ApiStandardErrors()
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
  @Permissions('quotations:read')
  @ApiOperation({ summary: 'Retrieve a quotation by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Quotation retrieved')
  @ApiStandardErrors()
  async retrieveQuotation(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.quotationService.getQuotationById(tenantId, id);
    return resultToResponse(result);
  }

  @Patch(':id')
  @Permissions('quotations:write')
  @ApiOperation({ summary: 'Update a quotation' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(updateQuotationSchema)
  @ApiDataResponse(200, 'Quotation updated')
  @ApiStandardErrors()
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
  @Permissions('quotations:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a line item to a quotation' })
  @ApiUuidParam('id')
  @ApiZodBody(addLineItemSchema)
  @ApiDataResponse(201, 'Line item added')
  @ApiStandardErrors()
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
  @Permissions('quotations:write')
  @ApiOperation({ summary: 'Update a line item' })
  @ApiUuidParam('id')
  @ApiUuidParam('itemId')
  @ApiIfMatchHeader()
  @ApiZodBody(updateLineItemSchema)
  @ApiDataResponse(200, 'Line item updated')
  @ApiStandardErrors()
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
  @Permissions('quotations:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a line item from a quotation' })
  @ApiUuidParam('id')
  @ApiUuidParam('itemId')
  @ApiDataResponse(200, 'Line item removed')
  @ApiStandardErrors()
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
  @Permissions('quotations:send')
  @ApiOperation({ summary: 'Send a quotation' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiDataResponse(200, 'Quotation sent')
  @ApiStandardErrors()
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
  @Permissions('quotations:approve')
  @ApiOperation({ summary: 'Approve a quotation' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiDataResponse(200, 'Quotation approved')
  @ApiStandardErrors()
  async approveQuotation(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @IfMatchVersion() version: number | undefined,
  ) {
    const result = await this.quotationService.approveQuotation(
      user.userId,
      tenantId,
      quotationId,
      version ?? 0,
    );

    return resultToResponse(result);
  }

  @Post(':id/reject')
  @Permissions('quotations:reject')
  @ApiOperation({ summary: 'Reject a quotation' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(rejectQuotationSchema)
  @ApiDataResponse(200, 'Quotation rejected')
  @ApiStandardErrors()
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
  @Permissions('quotations:revise')
  @ApiOperation({ summary: 'Create a new revision of a quotation' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiDataResponse(200, 'Quotation revised')
  @ApiStandardErrors()
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
