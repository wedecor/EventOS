import type { ReviewRequestChannel, ReviewRequestStatus } from '@prisma/client';

export type ReviewRequestRecord = {
  id: string;
  tenantId: string;
  eventId: string;
  customerId: string;
  channel: ReviewRequestChannel;
  channelDetail: string | null;
  status: ReviewRequestStatus;
  createdAt: Date;
};

export type CreateReviewRequestData = {
  eventId: string;
  customerId: string;
  channel: ReviewRequestChannel;
  channelDetail?: string | null;
};

export abstract class ReviewRequestRepository {
  abstract create(
    tenantId: string,
    data: CreateReviewRequestData,
  ): Promise<ReviewRequestRecord>;

  abstract findByEventId(
    tenantId: string,
    eventId: string,
  ): Promise<ReviewRequestRecord | null>;
}
