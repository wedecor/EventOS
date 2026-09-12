import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../modules/payment/domain/repositories/payment.repository';
import { AdvancePaymentQuery } from './advance-payment.query';

@Injectable()
export class PrismaAdvancePaymentQuery extends AdvancePaymentQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {
    super();
  }

  hasConfirmedAdvance(
    tenantId: string,
    criteria: { leadId?: string; quotationId?: string },
  ): Promise<boolean> {
    return this.paymentRepository.hasConfirmedAdvance(tenantId, criteria);
  }
}
