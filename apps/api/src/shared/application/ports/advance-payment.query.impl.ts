import { Injectable } from '@nestjs/common';
import { AdvancePaymentQuery } from './advance-payment.query';

/**
 * Sprint 1 placeholder until Payment persistence is introduced.
 * Returns false until a payment record confirms advance (EP1-BR-001).
 */
@Injectable()
export class NoAdvancePaymentQuery extends AdvancePaymentQuery {
  hasConfirmedAdvance(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
