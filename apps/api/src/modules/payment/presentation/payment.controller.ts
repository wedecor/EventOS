import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { PaymentApplicationService } from '../application/services/payment.application.service';
import {
  recordPaymentSchema,
  voidPaymentSchema,
  type RecordPaymentBody,
} from './schemas/payment.schemas';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a payment' })
  async recordPayment(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(recordPaymentSchema)) body: RecordPaymentBody,
  ) {
    const result = await this.paymentService.recordPayment(tenantId, {
      leadId: body.leadId,
      quotationId: body.quotationId,
      bookingId: body.bookingId,
      invoiceId: body.invoiceId,
      amount: body.amount,
      currency: body.currency,
      method: body.method,
      receivedAt: new Date(body.receivedAt),
      attachmentId: body.attachmentId,
      missingProofReason: body.missingProofReason,
      notes: body.notes,
    });

    return resultToResponse(result);
  }

  // EP1-FIN-003 — Payment lifecycle extension (void)
  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void a payment' })
  async voidPayment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(voidPaymentSchema)) _body: unknown,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.paymentService.voidPayment(tenantId, id, version);
    return resultToResponse(result);
  }
}
