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
import {
  BookingCancelledEvent,
  EventCompletedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { InvoiceRepository } from '../../../finance/domain/repositories/invoice.repository';
import { QuotationRepository } from '../../../quotation/domain/repositories/quotation.repository';
import {
  EventRepository,
  type EventRecord,
} from '../../domain/repositories/event.repository';
import { toBookingDto, type BookingDto } from '../dtos/booking.dto';

export type ActivateBookingInput = {
  version: number;
};

export type CancelBookingInput = {
  reason: string;
  version: number;
};

export type CompleteBookingInput = {
  version: number;
};

/** Fields owned by the source system on synced (non-`eventos`) bookings (M5-01). */
export type UpdateBookingDetailsInput = {
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venueName?: string | null;
  guestCount?: number | null;
  requirementsNotes?: string | null;
  version: number;
};

const SOURCE_OWNED_BOOKING_FIELDS = [
  'eventType',
  'eventStartDate',
  'eventEndDate',
  'venueName',
  'guestCount',
  'requirementsNotes',
] as const;

function sameValue(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  return a === b;
}

@Injectable()
export class BookingApplicationService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly advancePaymentQuery: AdvancePaymentQuery,
    private readonly invoiceRepository: InvoiceRepository,
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

  /** in_preparation → in_execution (required before completeBooking). */
  async startExecution(
    tenantId: string,
    bookingId: string,
    input: ActivateBookingInput,
  ): Promise<Result<BookingDto>> {
    const existing = await this.eventRepository.findById(tenantId, bookingId);
    if (!existing) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (existing.status !== 'in_preparation') {
      return failure(
        'INVALID_STATE',
        'Only in-preparation bookings can start execution.',
        { status: existing.status },
      );
    }

    try {
      const event = await this.eventRepository.update(
        tenantId,
        bookingId,
        { status: 'in_execution' },
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

  async listBookingsPage(
    tenantId: string,
    options: {
      page: number;
      pageSize: number;
      q?: string;
      status?: string;
      sort?: 'createdAt' | 'eventStartDate';
      order?: 'asc' | 'desc';
    },
  ): Promise<
    Result<{
      items: BookingDto[];
      total: number;
      page: number;
      pageSize: number;
    }>
  > {
    const page = await this.eventRepository.findPage(tenantId, options);
    return success({
      items: page.items.map(toBookingDto),
      total: page.total,
      page: options.page,
      pageSize: options.pageSize,
    });
  }

  /**
   * M5-01 — edit booking details. On bookings synced from an external source
   * (`source !== 'eventos'`) these fields are owned by that source: any real
   * change is rejected with 409 SOURCE_OWNED. Ops data (workspace, tasks, staff,
   * inventory, notes) is edited through its own endpoints and is never blocked.
   */
  async updateBookingDetails(
    tenantId: string,
    bookingId: string,
    input: UpdateBookingDetailsInput,
  ): Promise<Result<BookingDto>> {
    const existing = await this.eventRepository.findById(tenantId, bookingId);
    if (!existing) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (existing.status === 'cancelled' || existing.status === 'completed') {
      return failure(
        'INVALID_STATE',
        'Cannot edit a booking that is cancelled or completed.',
        { status: existing.status },
      );
    }

    const changes: Partial<
      Pick<EventRecord, (typeof SOURCE_OWNED_BOOKING_FIELDS)[number]>
    > = {};
    for (const field of SOURCE_OWNED_BOOKING_FIELDS) {
      const next = input[field];
      if (next !== undefined && !sameValue(existing[field], next)) {
        Object.assign(changes, { [field]: next });
      }
    }

    if (existing.source !== 'eventos' && Object.keys(changes).length > 0) {
      return failure(
        'SOURCE_OWNED',
        'This booking is managed by the Enquiries app. Edit this in the Enquiries app.',
        { bookingId, source: existing.source, fields: Object.keys(changes) },
      );
    }

    if (Object.keys(changes).length === 0) {
      return success(toBookingDto(existing));
    }

    try {
      const event = await this.eventRepository.update(
        tenantId,
        bookingId,
        changes,
        input.version,
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

  async cancelBooking(
    tenantId: string,
    bookingId: string,
    input: CancelBookingInput,
  ): Promise<Result<BookingDto>> {
    const existing = await this.eventRepository.findById(tenantId, bookingId);
    if (!existing) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (existing.status === 'cancelled' || existing.status === 'completed') {
      return failure(
        'INVALID_STATE',
        'Cannot cancel a booking that is already cancelled or completed.',
        { status: existing.status },
      );
    }

    try {
      const event = await this.eventRepository.update(
        tenantId,
        bookingId,
        {
          status: 'cancelled',
          cancellationReason: input.reason,
          workspaceStatus: 'archived',
        },
        input.version,
      );

      this.eventPublisher.publish(new BookingCancelledEvent(tenantId, event));

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

  // EP1-BR-002: Financial review required before completion. `08-data-model.md` §Payment
  // Persistence: "Event transition to Completed is blocked until finance review over Payment +
  // VendorExpense passes EP1-BR-002." Implementation decision (see implementation report):
  // "financial review" is interpreted as no outstanding *unreviewed* billing — i.e. no invoice for
  // the booking is left in `draft`. This maps the gate onto the one Phase 1 aggregate
  // (`Invoice`) that has an explicit unreviewed state; `Payment`/`VendorExpense` have no
  // "unreviewed" status in Phase 1 (recorded payments/expenses are immediately `confirmed`), and a
  // confirmed advance payment is already guaranteed to exist by EP1-BR-001 at booking creation.
  async completeBooking(
    tenantId: string,
    bookingId: string,
    input: CompleteBookingInput,
  ): Promise<Result<BookingDto>> {
    const existing = await this.eventRepository.findById(tenantId, bookingId);
    if (!existing) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (existing.status !== 'in_execution') {
      return failure(
        'INVALID_STATE',
        'Only in-execution bookings can be completed.',
        { status: existing.status },
      );
    }

    const hasDraftInvoice =
      await this.invoiceRepository.hasDraftInvoiceForBooking(
        tenantId,
        bookingId,
      );
    if (hasDraftInvoice) {
      return failure(
        'EP1-BR-002',
        'Financial review must be completed before marking an event as completed: an invoice for this booking is still in draft.',
        { bookingId },
      );
    }

    try {
      const event = await this.eventRepository.update(
        tenantId,
        bookingId,
        { status: 'completed', completedAt: new Date() },
        input.version,
      );

      this.eventPublisher.publish(new EventCompletedEvent(tenantId, event));

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
}
