import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { ConcurrentModificationError } from '../../../../shared/database';
import { CustomerRepositoryImpl } from './customer.repository.impl';

describe('CustomerRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const customerId = 'customer-1';

  const prismaCustomer = {
    id: customerId,
    tenantId,
    displayName: 'Priya Sharma',
    type: 'individual' as const,
    status: 'active' as const,
    primaryPhone: '+919999999999',
    primaryEmail: 'priya@example.com',
    notes: null,
    createdAt: new Date('2026-07-08T00:00:00.000Z'),
    updatedAt: new Date('2026-07-08T00:00:00.000Z'),
    version: 1,
  };

  let prisma: {
    customer: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let repository: CustomerRepositoryImpl;

  beforeEach(() => {
    prisma = {
      customer: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    repository = new CustomerRepositoryImpl(prisma as unknown as PrismaService);
  });

  it('create scopes by tenant', async () => {
    prisma.customer.create.mockResolvedValue(prismaCustomer);

    const result = await repository.create(tenantId, {
      displayName: 'Priya Sharma',
      primaryPhone: '+919999999999',
    });

    expect(prisma.customer.create).toHaveBeenCalledTimes(1);
    const createArgs = prisma.customer.create.mock.calls[0]?.[0] as {
      data: { tenant: { connect: { id: string } }; displayName: string };
    };
    expect(createArgs.data.tenant.connect.id).toBe(tenantId);
    expect(createArgs.data.displayName).toBe('Priya Sharma');
    expect(result.displayName).toBe('Priya Sharma');
  });

  it('findById scopes by tenant', async () => {
    prisma.customer.findFirst.mockResolvedValue(prismaCustomer);

    await repository.findById(tenantId, customerId);

    expect(prisma.customer.findFirst).toHaveBeenCalledWith({
      where: { id: customerId, tenantId },
    });
  });

  it('findByPhone scopes by tenant and phone', async () => {
    prisma.customer.findMany.mockResolvedValue([prismaCustomer]);

    await repository.findByPhone(tenantId, '+919999999999');

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      where: { tenantId, primaryPhone: '+919999999999' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('update uses optimistic concurrency', async () => {
    prisma.customer.update.mockResolvedValue({ ...prismaCustomer, version: 2 });

    await repository.update(
      tenantId,
      customerId,
      { displayName: 'Priya S.' },
      1,
    );

    expect(prisma.customer.update).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.customer.update.mock.calls[0]?.[0] as {
      where: { id: string; tenantId: string; version: number };
      data: { displayName: string; version: { increment: number } };
    };
    expect(updateArgs.where).toEqual({ id: customerId, tenantId, version: 1 });
    expect(updateArgs.data.displayName).toBe('Priya S.');
    expect(updateArgs.data.version).toEqual({ increment: 1 });
  });

  it('update throws ConcurrentModificationError when version mismatches', async () => {
    prisma.customer.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '7.8.0',
      }),
    );

    await expect(
      repository.update(tenantId, customerId, { displayName: 'X' }, 5),
    ).rejects.toBeInstanceOf(ConcurrentModificationError);
  });
});
