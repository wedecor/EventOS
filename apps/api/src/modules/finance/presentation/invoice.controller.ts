import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Permissions, type AuthenticatedUser } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
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
import { InvoiceApplicationService } from '../application/services/invoice.application.service';
import { InvoicePdfApplicationService } from '../application/services/invoice-pdf.application.service';
import { CommunicationApplicationService } from '../../communication/application/services/communication.application.service';
import { OutboundEmailApplicationService } from '../../communication/application/services/outbound-email.application.service';
import { z } from 'zod';
import {
  createInvoiceSchema,
  sendInvoiceSchema,
  voidInvoiceSchema,
  type CreateInvoiceBody,
} from './schemas/invoice.schemas';

const emailInvoiceSchema = z.object({
  to: z.string().email().optional(),
});
type EmailInvoiceBody = z.infer<typeof emailInvoiceSchema>;

// Base path matches `docs/09-api-design.md` §Module: Finance exactly (`/api/v1/invoices`).
@ApiTags('Finance')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceApplicationService,
    private readonly invoicePdfService: InvoicePdfApplicationService,
    private readonly outboundEmailService: OutboundEmailApplicationService,
    private readonly communicationService: CommunicationApplicationService,
  ) {}

  @Get(':id/pdf')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiUuidParam('id')
  @ApiProduces('application/pdf')
  @ApiStandardErrors()
  @Header('Content-Type', 'application/pdf')
  async downloadInvoicePdf(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const result = await this.invoicePdfService.generatePdf(
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

  // EP1-FIN-002 — Create a draft invoice for a booking
  @Post()
  @Permissions('invoices:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an invoice' })
  @ApiZodBody(createInvoiceSchema)
  @ApiDataResponse(201, 'Invoice created')
  @ApiStandardErrors()
  async createInvoice(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createInvoiceSchema)) body: CreateInvoiceBody,
  ) {
    const result = await this.invoiceService.createInvoice(tenantId, {
      bookingId: body.bookingId,
      customerId: body.customerId,
      lineItems: body.lineItems,
      notes: body.notes,
    });

    return resultToResponse(result);
  }

  @Post(':id/email')
  @Permissions('invoices:send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Email invoice PDF to customer (does not mark paid; separate from status send)',
  })
  @ApiUuidParam('id')
  @ApiZodBody(emailInvoiceSchema)
  @ApiDataResponse(200, 'Invoice email accepted or failed')
  @ApiStandardErrors()
  async emailInvoice(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(emailInvoiceSchema)) body: EmailInvoiceBody,
  ) {
    const result = await this.outboundEmailService.sendInvoiceEmail(
      tenantId,
      id,
      user.userId,
      body.to,
    );
    return resultToResponse(result);
  }

  @Get(':id/communications')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'List communications for an invoice' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Invoice communications listed')
  @ApiStandardErrors()
  async listInvoiceCommunications(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return resultToResponse(
      await this.communicationService.listByInvoice(tenantId, id),
    );
  }

  // EP1-FIN-002 — Send a draft invoice to the customer (status only)
  @Post(':id/send')
  @Permissions('invoices:send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an invoice as sent (status only; no email)' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(sendInvoiceSchema)
  @ApiDataResponse(200, 'Invoice sent')
  @ApiStandardErrors()
  async sendInvoice(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(sendInvoiceSchema)) _body: unknown,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.invoiceService.sendInvoice(tenantId, id, version);
    return resultToResponse(result);
  }

  // EP1-FIN-002 — Void an invoice
  @Post(':id/void')
  @Permissions('invoices:void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void an invoice' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(voidInvoiceSchema)
  @ApiDataResponse(200, 'Invoice voided')
  @ApiStandardErrors()
  async voidInvoice(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(voidInvoiceSchema)) _body: unknown,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.invoiceService.voidInvoice(tenantId, id, version);
    return resultToResponse(result);
  }
}
