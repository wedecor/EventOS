import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { PaymentApplicationService } from '../application/services/payment.application.service';
import {
  recordPaymentSchema,
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
      amount: body.amount,
      currency: body.currency,
      method: body.method,
      receivedAt: new Date(body.receivedAt),
      notes: body.notes,
    });

    return resultToResponse(result);
  }
}
