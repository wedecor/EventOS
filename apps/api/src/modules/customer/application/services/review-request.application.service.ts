import { Injectable } from '@nestjs/common';
import type { ReviewRequestChannel } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { ReviewRequestCreatedEvent } from '../../../../shared/events/sprint1-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { ReviewRequestRepository } from '../../domain/repositories/review-request.repository';
import {
  toReviewRequestCreateResultDto,
  type ReviewRequestCreateResultDto,
} from '../dtos/review-request.dto';

export type CreateReviewRequestInput = {
  channel: ReviewRequestChannel;
  channelDetail?: string | null;
};

// R3-07 / EP1-CUS-003 — Create review request for an event (at most one).
// docs/09 POST /events/:eventId/review-requests. customerId from Event.
@Injectable()
export class ReviewRequestApplicationService {
  constructor(
    private readonly reviewRequestRepository: ReviewRequestRepository,
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createReviewRequest(
    tenantId: string,
    eventId: string,
    input: CreateReviewRequestInput,
  ): Promise<Result<ReviewRequestCreateResultDto>> {
    const event = await this.eventRepository.findById(tenantId, eventId);
    if (!event) {
      return failure('NOT_FOUND', 'Event not found.');
    }

    const existing = await this.reviewRequestRepository.findByEventId(
      tenantId,
      eventId,
    );
    if (existing) {
      return failure(
        'DUPLICATE_REVIEW_REQUEST',
        'A review request already exists for this event.',
        { eventId, reviewRequestId: existing.id },
      );
    }

    const request = await this.reviewRequestRepository.create(tenantId, {
      eventId: event.id,
      customerId: event.customerId,
      channel: input.channel,
      channelDetail: input.channelDetail?.trim() || null,
    });

    this.eventPublisher.publish(
      new ReviewRequestCreatedEvent(tenantId, request),
    );

    return success(toReviewRequestCreateResultDto(request));
  }
}
