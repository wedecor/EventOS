import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { z } from 'zod';
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
import {
  buildPageMeta,
  paginationQuerySchema,
  toPagedResponse,
} from '../../../shared/presentation/pagination';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { PaymentApplicationService } from '../../payment/application/services/payment.application.service';
import { QuotationApplicationService } from '../application/services/quotation.application.service';
import { QuotationLineItemApplicationService } from '../application/services/quotation-line-item.application.service';
import { QuotationPdfApplicationService } from '../application/services/quotation-pdf.application.service';
import { CommunicationApplicationService } from '../../communication/application/services/communication.application.service';
import { OutboundEmailApplicationService } from '../../communication/application/services/outbound-email.application.service';
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

const emailQuotationSchema = z.object({
  to: z.string().email().optional(),
});
type EmailQuotationBody = z.infer<typeof emailQuotationSchema>;

const listQuotationsQuerySchema = paginationQuerySchema.extend({
  status: z
    .enum(['draft', 'sent', 'approved', 'rejected', 'expired', 'superseded'])
    .optional(),
  customerId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  sort: z.enum(['createdAt', 'quotationNumber']).optional(),
});

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationApplicationService,
    private readonly lineItemService: QuotationLineItemApplicationService,
    private readonly paymentService: PaymentApplicationService,
    private readonly quotationPdfService: QuotationPdfApplicationService,
    private readonly outboundEmailService: OutboundEmailApplicationService,
    private readonly communicationService: CommunicationApplicationService,
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

  @Get()
  @Permissions('quotations:read')
  @ApiOperation({ summary: 'List quotations (paginated)' })
  @ApiDataResponse(200, 'Quotations listed')
  @ApiStandardErrors()
  async listQuotations(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(listQuotationsQuerySchema))
    query: z.infer<typeof listQuotationsQuerySchema>,
  ) {
    const result = await this.quotationService.listQuotationsPage(tenantId, {
      page: query.page,
      pageSize: query.pageSize,
      q: query.q,
      status: query.status,
      customerId: query.customerId,
      leadId: query.leadId,
      sort: query.sort,
      order: query.order,
    });
    if (!result.ok) {
      return resultToResponse(result);
    }
    return toPagedResponse({
      items: result.value.items,
      meta: buildPageMeta(
        result.value.page,
        result.value.pageSize,
        result.value.total,
      ),
    });
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

  @Get(':id/pdf')
  @Permissions('quotations:read')
  @ApiOperation({ summary: 'Download quotation PDF' })
  @ApiUuidParam('id')
  @ApiProduces('application/pdf')
  @ApiStandardErrors()
  @Header('Content-Type', 'application/pdf')
  async downloadQuotationPdf(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const result = await this.quotationPdfService.generatePdf(
      tenantId,
      id,
      user.userId,
    );
    const pdf = resultToResponse(result).data;
    return new StreamableFile(pdf.buffer, {
      type: pdf.contentType,
      disposition: `attachment; filename="${pdf.filename}"`,
    });
  }

  @Get(':id/payments')
  @Permissions('payments:read')
  @ApiOperation({ summary: 'List payments recorded against a quotation' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Quotation payments listed')
  @ApiStandardErrors()
  async listQuotationPayments(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.paymentService.listPaymentsForQuotation(
      tenantId,
      id,
    );
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

  @Get(':id/line-items')
  @Permissions('quotations:read')
  @ApiOperation({ summary: 'List line items for a quotation' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Line items retrieved')
  @ApiStandardErrors()
  async listLineItems(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
  ) {
    const result = await this.lineItemService.listLineItems(
      tenantId,
      quotationId,
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
  @ApiOperation({ summary: 'Mark a quotation as sent (status only; no email)' })
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

  @Post(':id/email')
  @Permissions('quotations:send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Email quotation PDF to customer (does not approve or change acceptance)',
  })
  @ApiUuidParam('id')
  @ApiZodBody(emailQuotationSchema)
  @ApiDataResponse(200, 'Quotation email accepted or failed')
  @ApiStandardErrors()
  async emailQuotation(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(emailQuotationSchema)) body: EmailQuotationBody,
  ) {
    const result = await this.outboundEmailService.sendQuotationEmail(
      tenantId,
      quotationId,
      user.userId,
      body.to,
    );
    return resultToResponse(result);
  }

  @Get(':id/communications')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'List communications for a quotation' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Quotation communications listed')
  @ApiStandardErrors()
  async listQuotationCommunications(
    @TenantId() tenantId: string,
    @Param('id') quotationId: string,
  ) {
    return resultToResponse(
      await this.communicationService.listByQuotation(tenantId, quotationId),
    );
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
