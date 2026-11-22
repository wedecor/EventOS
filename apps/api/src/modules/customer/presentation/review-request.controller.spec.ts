import { success } from '../../../shared/application/result';
import { ReviewRequestApplicationService } from '../application/services/review-request.application.service';
import { ReviewRequestController } from './review-request.controller';

describe('ReviewRequestController', () => {
  const tenantId = 'tenant-1';
  const eventId = 'event-1';

  let reviewRequestService: { createReviewRequest: jest.Mock };
  let controller: ReviewRequestController;

  beforeEach(() => {
    reviewRequestService = { createReviewRequest: jest.fn() };
    controller = new ReviewRequestController(
      reviewRequestService as unknown as ReviewRequestApplicationService,
    );
  });

  it('delegates create to ReviewRequestApplicationService and wraps Result', async () => {
    reviewRequestService.createReviewRequest.mockResolvedValue(
      success({ id: 'review-1', eventId, status: 'pending' }),
    );

    const response = await controller.createReviewRequest(tenantId, eventId, {
      channel: 'google',
      channelDetail: null,
    });

    expect(reviewRequestService.createReviewRequest).toHaveBeenCalledWith(
      tenantId,
      eventId,
      { channel: 'google', channelDetail: null },
    );
    expect(response).toEqual({
      data: { id: 'review-1', eventId, status: 'pending' },
    });
  });
});
