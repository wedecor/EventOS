import { PrismaService } from '../../../../database/prisma.service';
import { TimelineEntryRepositoryImpl } from './timeline-entry.repository.impl';

describe('TimelineEntryRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const customerId = 'customer-1';
  const eventId = 'event-1';
  const userId = 'user-1';

  const prismaEntry = {
    id: 'timeline-1',
    tenantId,
    customerId,
    eventId,
    type: 'note' as const,
    message: 'Follow-up call',
    occurredAt: new Date('2026-07-13T10:00:00.000Z'),
    recordedByUserId: userId,
    createdAt: new Date('2026-07-13T10:01:00.000Z'),
  };

  let prisma: {
    timelineEntry: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let repository: TimelineEntryRepositoryImpl;

  beforeEach(() => {
    prisma = {
      timelineEntry: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };
    repository = new TimelineEntryRepositoryImpl(
      prisma as unknown as PrismaService,
    );
  });

  it('create persists append-only fields without version', async () => {
    prisma.timelineEntry.create.mockResolvedValue(prismaEntry);

    const result = await repository.create(tenantId, {
      customerId,
      eventId,
      type: 'note',
      message: 'Follow-up call',
      occurredAt: prismaEntry.occurredAt,
      recordedByUserId: userId,
    });

    expect(prisma.timelineEntry.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        customerId,
        eventId,
        type: 'note',
        message: 'Follow-up call',
        occurredAt: prismaEntry.occurredAt,
        recordedByUserId: userId,
      },
    });
    expect(result.id).toBe(prismaEntry.id);
    expect(result).not.toHaveProperty('version');
  });

  it('findByCustomerId orders by occurredAt desc', async () => {
    prisma.timelineEntry.findMany.mockResolvedValue([prismaEntry]);

    const result = await repository.findByCustomerId(tenantId, customerId);

    expect(prisma.timelineEntry.findMany).toHaveBeenCalledWith({
      where: { tenantId, customerId },
      orderBy: { occurredAt: 'desc' },
    });
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('Follow-up call');
  });
});
