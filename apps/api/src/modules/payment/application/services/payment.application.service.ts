import { Injectable } from '@nestjs/common';
import type { PaymentMethod } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { PaymentRecordedEvent } from '../../../../shared/events/sprint1-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { LeadRepository } from '../../../lead/domain/repositories/lead.repository';
import { QuotationRepository } from '../../../quotation/domain/repositories/quotation.repository';
import {
  PaymentRepository,
  type PaymentRecord,
} from '../../domain/repositories/payment.repository';

export type RecordPaymentInput = {
  bookingId?: string | null;
  leadId?: string | null;
  quotationId?: string | null;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  receivedAt: Date;
  paymentType?: 'advance' | 'balance' | 'other';
  missingProofReason?: string | null;
};

@Injectable()
export class PaymentApplicationService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly eventRepository: EventRepository,
    private readonly leadRepository: LeadRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async recordPayment(
    tenantId: string,
    input: RecordPaymentInput,
  ): Promise<Result<PaymentRecord>> {
    if (input.amount <= 0) {
      return failure(
        'VALIDATION_ERROR',
        'Payment amount must be greater than zero.',
      );
    }

    const eventId = input.bookingId ?? null;
    let leadId = input.leadId ?? null;
    let quotationId = input.quotationId ?? null;

    if (eventId) {
      const event = await this.eventRepository.findById(tenantId, eventId);
      if (!event) {
        return failure('NOT_FOUND', 'Booking not found.');
      }
      leadId = leadId ?? event.leadId;
      quotationId = quotationId ?? event.quotationId;
    }

    if (leadId) {
      const lead = await this.leadRepository.findById(tenantId, leadId);
      if (!lead) {
        return failure('NOT_FOUND', 'Lead not found.');
      }
    }

    if (quotationId) {
      const quotation = await this.quotationRepository.findById(
        tenantId,
        quotationId,
      );
      if (!quotation) {
        return failure('NOT_FOUND', 'Quotation not found.');
      }
    }

    if (!eventId && !leadId && !quotationId) {
      return failure(
        'VALIDATION_ERROR',
        'Payment must reference a booking, lead, or quotation.',
      );
    }

    const payment = await this.paymentRepository.create(tenantId, {
      eventId,
      leadId,
      quotationId,
      paymentType: input.paymentType ?? 'advance',
      amount: input.amount,
      currency: input.currency ?? 'INR',
      method: input.method,
      receivedAt: input.receivedAt,
      missingProofReason: input.missingProofReason ?? null,
    });

    this.eventPublisher.publish(new PaymentRecordedEvent(tenantId, payment));

    return success(payment);
  }
}
