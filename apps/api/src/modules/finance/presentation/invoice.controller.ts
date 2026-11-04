import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
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
import {
  createInvoiceSchema,
  sendInvoiceSchema,
  voidInvoiceSchema,
  type CreateInvoiceBody,
} from './schemas/invoice.schemas';

// Base path matches `docs/09-api-design.md` §Module: Finance exactly (`/api/v1/invoices`).
@ApiTags('Finance')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceApplicationService) {}

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

  // EP1-FIN-002 — Send a draft invoice to the customer
  @Post(':id/send')
  @Permissions('invoices:send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an invoice' })
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
