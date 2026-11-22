import type { ReviewRequestRecord } from '../../domain/repositories/review-request.repository';

/** docs/09 POST /events/:eventId/review-requests response shape. */
export type ReviewRequestCreateResultDto = {
  id: string;
  eventId: string;
  status: ReviewRequestRecord['status'];
};

export function toReviewRequestCreateResultDto(
  request: ReviewRequestRecord,
): ReviewRequestCreateResultDto {
  return {
    id: request.id,
    eventId: request.eventId,
    status: request.status,
  };
}
