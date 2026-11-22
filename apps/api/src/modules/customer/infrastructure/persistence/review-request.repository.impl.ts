import { Injectable } from '@nestjs/common';
import type { ReviewRequest } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateReviewRequestData,
  ReviewRequestRecord,
  ReviewRequestRepository,
} from '../../domain/repositories/review-request.repository';

@Injectable()
export class ReviewRequestRepositoryImpl
  extends TenantScopedRepository
  implements ReviewRequestRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateReviewRequestData,
  ): Promise<ReviewRequestRecord> {
    const request = await this.prisma.reviewRequest.create({
      data: {
        tenantId,
        eventId: data.eventId,
        customerId: data.customerId,
        channel: data.channel,
        channelDetail: data.channelDetail ?? null,
        status: 'pending',
      },
    });

    return this.mapRecord(request);
  }

  async findByEventId(
    tenantId: string,
    eventId: string,
  ): Promise<ReviewRequestRecord | null> {
    const request = await this.prisma.reviewRequest.findFirst({
      where: { tenantId, eventId },
    });

    return request ? this.mapRecord(request) : null;
  }

  private mapRecord(request: ReviewRequest): ReviewRequestRecord {
    return {
      id: request.id,
      tenantId: request.tenantId,
      eventId: request.eventId,
      customerId: request.customerId,
      channel: request.channel,
      channelDetail: request.channelDetail,
      status: request.status,
      createdAt: request.createdAt,
    };
  }
}
