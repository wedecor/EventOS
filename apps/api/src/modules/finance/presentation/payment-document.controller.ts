import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { FinancialDocumentApplicationService } from '../application/services/financial-document.application.service';

@ApiTags('Payment Documents')
@ApiBearerAuth()
@Controller('payment-documents')
export class PaymentDocumentController {
  constructor(
    private readonly documentService: FinancialDocumentApplicationService,
  ) {}

  @Get(':paymentId')
  @Permissions('documents:read')
  @ApiOperation({ summary: 'List financial documents linked to a payment' })
  @ApiUuidParam('paymentId')
  @ApiDataResponse(200, 'Payment documents listed')
  @ApiStandardErrors()
  async listForPayment(
    @TenantId() tenantId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return resultToResponse(
      await this.documentService.listForPayment(tenantId, paymentId),
    );
  }
}
