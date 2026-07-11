import { Injectable } from '@nestjs/common';
import { PaymentRepository } from '../../../modules/payment/domain/repositories/payment.repository';
import { AdvancePaymentQuery } from './advance-payment.query';

@Injectable()
export class PrismaAdvancePaymentQuery extends AdvancePaymentQuery {
  constructor(private readonly paymentRepository: PaymentRepository) {
    super();
  }

  async hasConfirmedAdvance(
    tenantId: string,
    criteria: { leadId?: string; quotationId?: string },
  ): Promise<boolean> {
    if (criteria.leadId) {
      const hasAdvance =
        await this.paymentRepository.hasConfirmedAdvanceForLead(
          tenantId,
          criteria.leadId,
        );
      if (hasAdvance) {
        return true;
      }
    }

    if (criteria.quotationId) {
      const hasAdvance =
        await this.paymentRepository.hasConfirmedAdvanceForQuotation(
          tenantId,
          criteria.quotationId,
        );
      if (hasAdvance) {
        return true;
      }
    }

    return false;
  }
}
