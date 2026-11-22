import { PrismaService } from '../../../../database/prisma.service';
import { ReviewRequestRepositoryImpl } from './review-request.repository.impl';

describe('ReviewRequestRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const eventId = 'event-1';
  const customerId = 'customer-1';

  const prismaRequest = {
    id: 'review-1',
    tenantId,
    eventId,
    customerId,
    channel: 'google' as const,
    channelDetail: null,
    status: 'pending' as const,
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
  };

  let prisma: {
    reviewRequest: { create: jest.Mock; findFirst: jest.Mock };
  };
  let repository: ReviewRequestRepositoryImpl;

  beforeEach(() => {
    prisma = {
      reviewRequest: { create: jest.fn(), findFirst: jest.fn() },
    };
    repository = new ReviewRequestRepositoryImpl(
      prisma as unknown as PrismaService,
    );
  });

  it('create persists pending status without version', async () => {
    prisma.reviewRequest.create.mockResolvedValue(prismaRequest);

    const result = await repository.create(tenantId, {
      eventId,
      customerId,
      channel: 'google',
    });

    expect(prisma.reviewRequest.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        eventId,
        customerId,
        channel: 'google',
        channelDetail: null,
        status: 'pending',
      },
    });
    expect(result.status).toBe('pending');
    expect(result).not.toHaveProperty('version');
  });

  it('findByEventId scopes by tenant', async () => {
    prisma.reviewRequest.findFirst.mockResolvedValue(prismaRequest);

    const result = await repository.findByEventId(tenantId, eventId);

    expect(prisma.reviewRequest.findFirst).toHaveBeenCalledWith({
      where: { tenantId, eventId },
    });
    expect(result?.id).toBe(prismaRequest.id);
  });
});
