import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { ConcurrentModificationError } from '../../../../shared/database';
import { EventRepositoryImpl } from './event.repository.impl';

describe('EventRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const eventId = 'event-1';

  const prismaEvent = {
    id: eventId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'approved' as const,
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-01'),
    venueName: 'Bangalore',
    guestCount: 200,
    requirementsNotes: null,
    preparationStatus: 'pending' as const,
    operationalMilestone: null,
    executionOwnerId: null,
    cancellationReason: null,
    completedAt: null,
    createdAt: new Date('2026-07-08T00:00:00.000Z'),
    updatedAt: new Date('2026-07-08T00:00:00.000Z'),
    version: 1,
  };

  let prisma: {
    event: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let repository: EventRepositoryImpl;

  beforeEach(() => {
    prisma = {
      event: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    repository = new EventRepositoryImpl(prisma as unknown as PrismaService);
  });

  it('create scopes by tenant', async () => {
    prisma.event.create.mockResolvedValue(prismaEvent);

    const result = await repository.create(tenantId, {
      customerId: 'customer-1',
      quotationId: 'quotation-1',
      bookingNumber: 5001,
    });

    expect(prisma.event.create).toHaveBeenCalledTimes(1);
    const createArgs = prisma.event.create.mock.calls[0]?.[0] as {
      data: {
        tenant: { connect: { id: string } };
        customer: { connect: { id: string } };
        quotation: { connect: { id: string } };
        bookingNumber: number;
      };
    };
    expect(createArgs.data.tenant.connect.id).toBe(tenantId);
    expect(createArgs.data.customer.connect.id).toBe('customer-1');
    expect(createArgs.data.quotation.connect.id).toBe('quotation-1');
    expect(createArgs.data.bookingNumber).toBe(5001);
    expect(result.bookingNumber).toBe(5001);
  });

  it('findById scopes by tenant', async () => {
    prisma.event.findFirst.mockResolvedValue(prismaEvent);

    await repository.findById(tenantId, eventId);

    expect(prisma.event.findFirst).toHaveBeenCalledWith({
      where: { id: eventId, tenantId },
    });
  });

  it('findByEventDate scopes by tenant and date range', async () => {
    prisma.event.findMany.mockResolvedValue([prismaEvent]);
    const from = new Date('2026-08-01');
    const to = new Date('2026-08-31');

    await repository.findByEventDate(tenantId, { from, to });

    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        eventStartDate: { gte: from, lte: to },
      },
      orderBy: { eventStartDate: 'asc' },
    });
  });

  it('update uses optimistic concurrency', async () => {
    prisma.event.update.mockResolvedValue({
      ...prismaEvent,
      status: 'in_preparation',
      version: 2,
    });

    await repository.update(tenantId, eventId, { status: 'in_preparation' }, 1);

    expect(prisma.event.update).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.event.update.mock.calls[0]?.[0] as {
      where: { id: string; tenantId: string; version: number };
      data: { status: string; version: { increment: number } };
    };
    expect(updateArgs.where).toEqual({ id: eventId, tenantId, version: 1 });
    expect(updateArgs.data.status).toBe('in_preparation');
    expect(updateArgs.data.version).toEqual({ increment: 1 });
  });

  it('update throws ConcurrentModificationError when version mismatches', async () => {
    prisma.event.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '7.8.0',
      }),
    );

    await expect(
      repository.update(tenantId, eventId, { status: 'completed' }, 3),
    ).rejects.toBeInstanceOf(ConcurrentModificationError);
  });
});
