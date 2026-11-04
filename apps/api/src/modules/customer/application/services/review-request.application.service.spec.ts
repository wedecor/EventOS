import { ReviewRequestCreatedEvent } from '../../../../shared/events/sprint1-domain.events';
import type { EventRecord } from '../../../booking/domain/repositories/event.repository';
import type { ReviewRequestRecord } from '../../domain/repositories/review-request.repository';
import { ReviewRequestApplicationService } from './review-request.application.service';

describe('ReviewRequestApplicationService', () => {
  const tenantId = 'tenant-1';
  const eventId = 'event-1';
  const customerId = 'customer-1';

  const event: EventRecord = {
    id: eventId,
    tenantId,
    customerId,
    leadId: null,
    quotationId: 'quotation-1',
    bookingNumber: 1001,
    status: 'approved',
    eventType: null,
    eventStartDate: null,
    eventEndDate: null,
    venueName: null,
    guestCount: null,
    requirementsNotes: null,
    workspaceStatus: 'inactive',
    preparationStatus: 'pending',
    operationalMilestone: null,
    executionOwnerId: null,
    cancellationReason: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const reviewRequest: ReviewRequestRecord = {
    id: 'review-1',
    tenantId,
    eventId,
    customerId,
    channel: 'google',
    channelDetail: null,
    status: 'pending',
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
  };

  let reviewRequestRepository: {
    create: jest.Mock;
    findByEventId: jest.Mock;
  };
  let eventRepository: { findById: jest.Mock };
  let publish: jest.Mock;
  let service: ReviewRequestApplicationService;

  beforeEach(() => {
    publish = jest.fn();
    reviewRequestRepository = {
      create: jest.fn(),
      findByEventId: jest.fn(),
    };
    eventRepository = { findById: jest.fn() };
    service = new ReviewRequestApplicationService(
      reviewRequestRepository,
      eventRepository as never,
      { publish },
    );
  });

  it('returns NOT_FOUND when event missing', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.createReviewRequest(tenantId, eventId, {
      channel: 'google',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects duplicate review request for the same event', async () => {
    eventRepository.findById.mockResolvedValue(event);
    reviewRequestRepository.findByEventId.mockResolvedValue(reviewRequest);

    const result = await service.createReviewRequest(tenantId, eventId, {
      channel: 'instagram',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('DUPLICATE_REVIEW_REQUEST');
    }
    expect(reviewRequestRepository.create).not.toHaveBeenCalled();
  });

  it('creates review request with customerId from event', async () => {
    eventRepository.findById.mockResolvedValue(event);
    reviewRequestRepository.findByEventId.mockResolvedValue(null);
    reviewRequestRepository.create.mockResolvedValue(reviewRequest);

    const result = await service.createReviewRequest(tenantId, eventId, {
      channel: 'google',
      channelDetail: '  maps link  ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        id: reviewRequest.id,
        eventId,
        status: 'pending',
      });
    }
    expect(reviewRequestRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        eventId,
        customerId,
        channel: 'google',
        channelDetail: 'maps link',
      }),
    );
    expect(publish).toHaveBeenCalledWith(expect.any(ReviewRequestCreatedEvent));
  });
});
