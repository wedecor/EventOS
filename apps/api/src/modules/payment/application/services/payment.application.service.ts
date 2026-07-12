import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { PaymentRecordedEvent } from '../../../../shared/events/sprint1-domain.events';
import { PaymentVoidedEvent } from '../../../../shared/events/sprint5-domain.events';
import { InvoiceRepository } from '../../../finance/domain/repositories/invoice.repository';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { toPaymentDto, type PaymentDto } from '../dtos/payment.dto';

export type RecordPaymentInput = {
  bookingId?: string | null;
  leadId?: string | null;
  quotationId?: string | null;
  invoiceId?: string | null;
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
    private readonly invoiceRepository: InvoiceRepository,
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

    if (input.invoiceId) {
      const invoice = await this.invoiceRepository.findById(
        tenantId,
        input.invoiceId,
      );
      if (!invoice) {
        return failure('NOT_FOUND', 'Invoice not found.');
      }

      // EP1-FIN-002 — `07-domain-model.md` §Invoice invariant: "Void invoices cannot receive
      // payments".
      if (invoice.status === 'void') {
        return failure(
          'INVALID_STATE',
          'Cannot record a payment against a void invoice.',
          { invoiceId: input.invoiceId },
        );
      }
    }

    const payment = await this.paymentRepository.create(tenantId, {
      bookingId: input.bookingId,
      leadId: input.leadId,
      quotationId: input.quotationId,
      invoiceId: input.invoiceId,
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

  // EP1-FIN-003 — Payment lifecycle extension (void)
  async voidPayment(
    tenantId: string,
    paymentId: string,
    version: number,
  ): Promise<Result<PaymentDto>> {
    const existing = await this.paymentRepository.findById(tenantId, paymentId);
    if (!existing) {
      return failure('NOT_FOUND', 'Payment not found.');
    }

    if (existing.status === 'void') {
      return failure('INVALID_STATE', 'Payment is already void.', {
        status: existing.status,
      });
    }

    try {
      const payment = await this.paymentRepository.update(
        tenantId,
        paymentId,
        { status: 'void' },
        version,
      );

      this.eventPublisher.publish(new PaymentVoidedEvent(tenantId, payment));

      return success(toPaymentDto(payment));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Payment was modified by another request. Reload and retry.',
          { paymentId },
        );
      }
      throw error;
    }
  }
}
