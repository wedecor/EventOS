import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantContext } from '../../auth/tenant.context';
import { unwrapResult } from '../../common/http/result-http';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaymentApplicationService } from '../payment/application/services/payment.application.service';
import { recordPaymentBodySchema } from './schemas/payment.schemas';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentService: PaymentApplicationService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Post()
  async recordPayment(
    @Body(new ZodValidationPipe(recordPaymentBodySchema)) body: unknown,
  ) {
    const data = unwrapResult(
      await this.paymentService.recordPayment(
        this.tenantContext.getTenantId(),
        body as Parameters<PaymentApplicationService['recordPayment']>[1],
      ),
    );
    return { data };
  }
}
