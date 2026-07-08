import { Injectable } from '@nestjs/common';
import { AdvancePaymentQuery } from '../../../../shared/application/ports/advance-payment.query';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  BookingStatusChangedEvent,
  EventCreatedEvent,
} from '../../../../shared/events/sprint1-domain.events';
import { QuotationRepository } from '../../../quotation/domain/repositories/quotation.repository';
import { EventRepository } from '../../domain/repositories/event.repository';
import { toBookingDto, type BookingDto } from '../dtos/booking.dto';

export type ActivateBookingInput = {
  version: number;
};

@Injectable()
export class BookingApplicationService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly advancePaymentQuery: AdvancePaymentQuery,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createEventFromApprovedQuotation(
    tenantId: string,
    quotationId: string,
  ): Promise<Result<BookingDto>> {
    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );
    if (!quotation) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    if (quotation.status !== 'approved') {
      return failure(
        'INVALID_STATE',
        'Only approved quotations can create an event.',
        { status: quotation.status },
      );
    }

    const hasAdvance = await this.advancePaymentQuery.hasConfirmedAdvance(
      tenantId,
      { quotationId, leadId: quotation.leadId ?? undefined },
    );
    if (!hasAdvance) {
      return failure(
        'EP1-BR-001',
        'Advance payment must be confirmed before creating an approved event.',
      );
    }

    const existingEvent = await this.eventRepository.findByQuotationId(
      tenantId,
      quotationId,
    );
    if (existingEvent) {
      return failure(
        'DUPLICATE_EVENT',
        'An event already exists for this approved quotation.',
        { eventId: existingEvent.id },
      );
    }

    const maxBookingNumber =
      await this.eventRepository.findMaxBookingNumber(tenantId);

    const event = await this.eventRepository.create(tenantId, {
      customerId: quotation.customerId,
      quotationId: quotation.id,
      leadId: quotation.leadId,
      bookingNumber: maxBookingNumber + 1,
      status: 'approved',
      eventType: quotation.eventType,
      eventStartDate: quotation.eventStartDate,
      eventEndDate: quotation.eventEndDate,
      venueName: quotation.venue,
      preparationStatus: 'pending',
    });

    this.eventPublisher.publish(new EventCreatedEvent(tenantId, event));

    return success(toBookingDto(event));
  }

  async activateBooking(
    tenantId: string,
    bookingId: string,
    input: ActivateBookingInput,
  ): Promise<Result<BookingDto>> {
    const existing = await this.eventRepository.findById(tenantId, bookingId);
    if (!existing) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (existing.status !== 'approved') {
      return failure(
        'INVALID_STATE',
        'Only approved bookings can be activated.',
        { status: existing.status },
      );
    }

    try {
      const event = await this.eventRepository.update(
        tenantId,
        bookingId,
        { status: 'in_preparation' },
        input.version,
      );

      this.eventPublisher.publish(
        new BookingStatusChangedEvent(tenantId, event, existing.status),
      );

      return success(toBookingDto(event));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Booking was modified by another request. Reload and retry.',
          { bookingId },
        );
      }
      throw error;
    }
  }

  async retrieveBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<BookingDto>> {
    const event = await this.eventRepository.findById(tenantId, bookingId);
    if (!event) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    return success(toBookingDto(event));
  }
}
