import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { PaymentRecordedEvent } from '../../../../shared/events/sprint1-domain.events';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { toPaymentDto, type PaymentDto } from '../dtos/payment.dto';

export type RecordPaymentInput = {
  bookingId?: string | null;
  leadId?: string | null;
  quotationId?: string | null;
  amount: number;
  currency?: string;
  method: string;
  receivedAt: Date;
  attachmentId?: string | null;
  missingProofReason?: string | null;
  notes?: string | null;
};

@Injectable()
export class PaymentApplicationService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async recordPayment(
    tenantId: string,
    input: RecordPaymentInput,
  ): Promise<Result<PaymentDto>> {
    if (input.amount <= 0) {
      return failure(
        'VALIDATION_ERROR',
        'Payment amount must be greater than zero.',
      );
    }

    const payment = await this.paymentRepository.create(tenantId, {
      bookingId: input.bookingId,
      leadId: input.leadId,
      quotationId: input.quotationId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      receivedAt: input.receivedAt,
      attachmentId: input.attachmentId,
      missingProofReason: input.missingProofReason,
      notes: input.notes,
    });

    this.eventPublisher.publish(new PaymentRecordedEvent(tenantId, payment));

    return success(toPaymentDto(payment));
  }

  async listPaymentsForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<PaymentDto[]>> {
    const payments = await this.paymentRepository.findByBookingId(
      tenantId,
      bookingId,
    );

    return success(payments.map(toPaymentDto));
  }
}
