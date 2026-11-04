import { Injectable } from '@nestjs/common';
import type { TimelineEntryType } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { TimelineEntryAddedEvent } from '../../../../shared/events/sprint1-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { TimelineEntryRepository } from '../../domain/repositories/timeline-entry.repository';
import {
  toTimelineEntryCreateResultDto,
  toTimelineEntryDto,
  type TimelineEntryCreateResultDto,
  type TimelineEntryDto,
} from '../dtos/timeline-entry.dto';

export type LogTimelineEntryInput = {
  eventId: string;
  type: TimelineEntryType;
  message: string;
  occurredAt: Date;
  recordedByUserId: string;
};

// R3-05 / EP1-CUS-002 — Append-only communication timeline.
// docs/09 §Customer GET/POST /clients/:id/interactions. ADR-016 tenant scoping.
// Decision 3A: event must exist, belong to tenant, and match route customerId.
@Injectable()
export class TimelineApplicationService {
  constructor(
    private readonly timelineEntryRepository: TimelineEntryRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async listInteractions(
    tenantId: string,
    customerId: string,
  ): Promise<Result<TimelineEntryDto[]>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const entries = await this.timelineEntryRepository.findByCustomerId(
      tenantId,
      customerId,
    );

    return success(entries.map(toTimelineEntryDto));
  }

  async logInteraction(
    tenantId: string,
    customerId: string,
    input: LogTimelineEntryInput,
  ): Promise<Result<TimelineEntryCreateResultDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    if (!input.message.trim()) {
      return failure('VALIDATION_ERROR', 'Message cannot be blank.');
    }

    const event = await this.eventRepository.findById(tenantId, input.eventId);
    if (!event) {
      return failure('NOT_FOUND', 'Event not found.');
    }

    if (event.customerId !== customerId) {
      return failure(
        'VALIDATION_ERROR',
        'Event does not belong to this customer.',
        { eventId: input.eventId, customerId },
      );
    }

    const entry = await this.timelineEntryRepository.create(tenantId, {
      customerId,
      eventId: input.eventId,
      type: input.type,
      message: input.message.trim(),
      occurredAt: input.occurredAt,
      recordedByUserId: input.recordedByUserId,
    });

    this.eventPublisher.publish(new TimelineEntryAddedEvent(tenantId, entry));

    return success(toTimelineEntryCreateResultDto(entry));
  }
}
