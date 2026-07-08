import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { ConcurrentModificationError } from '../../../../shared/database';
import { QuotationRepositoryImpl } from './quotation.repository.impl';

describe('QuotationRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const quotationId = 'quotation-1';

  const prismaQuotation = {
    id: quotationId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationNumber: 1001,
    revisionNumber: 1,
    status: 'draft' as const,
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-01'),
    venue: 'Bangalore',
    validUntil: new Date('2026-07-31'),
    terms: 'Standard terms',
    notes: null,
    subtotalAmount: new Prisma.Decimal(100000),
    discountAmount: new Prisma.Decimal(0),
    taxAmount: new Prisma.Decimal(18000),
    totalAmount: new Prisma.Decimal(118000),
    currency: 'INR',
    supersededById: null,
    createdAt: new Date('2026-07-08T00:00:00.000Z'),
    updatedAt: new Date('2026-07-08T00:00:00.000Z'),
    version: 1,
  };

  let prisma: {
    quotation: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let repository: QuotationRepositoryImpl;

  beforeEach(() => {
    prisma = {
      quotation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    repository = new QuotationRepositoryImpl(
      prisma as unknown as PrismaService,
    );
  });

  it('create scopes by tenant', async () => {
    prisma.quotation.create.mockResolvedValue(prismaQuotation);

    const result = await repository.create(tenantId, {
      customerId: 'customer-1',
      quotationNumber: 1001,
    });

    expect(prisma.quotation.create).toHaveBeenCalledTimes(1);
    const createArgs = prisma.quotation.create.mock.calls[0]?.[0] as {
      data: {
        tenant: { connect: { id: string } };
        customer: { connect: { id: string } };
        quotationNumber: number;
      };
    };
    expect(createArgs.data.tenant.connect.id).toBe(tenantId);
    expect(createArgs.data.customer.connect.id).toBe('customer-1');
    expect(createArgs.data.quotationNumber).toBe(1001);
    expect(result.totalAmount).toBe(118000);
  });

  it('findById scopes by tenant', async () => {
    prisma.quotation.findFirst.mockResolvedValue(prismaQuotation);

    await repository.findById(tenantId, quotationId);

    expect(prisma.quotation.findFirst).toHaveBeenCalledWith({
      where: { id: quotationId, tenantId },
    });
  });

  it('findLatestRevision scopes by tenant and orders by revision', async () => {
    prisma.quotation.findFirst.mockResolvedValue({
      ...prismaQuotation,
      revisionNumber: 2,
    });

    await repository.findLatestRevision(tenantId, 1001);

    expect(prisma.quotation.findFirst).toHaveBeenCalledWith({
      where: { tenantId, quotationNumber: 1001 },
      orderBy: { revisionNumber: 'desc' },
    });
  });

  it('update uses optimistic concurrency', async () => {
    prisma.quotation.update.mockResolvedValue({
      ...prismaQuotation,
      status: 'sent',
      version: 2,
    });

    await repository.update(tenantId, quotationId, { status: 'sent' }, 1);

    expect(prisma.quotation.update).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.quotation.update.mock.calls[0]?.[0] as {
      where: { id: string; tenantId: string; version: number };
      data: { status: string; version: { increment: number } };
    };
    expect(updateArgs.where).toEqual({ id: quotationId, tenantId, version: 1 });
    expect(updateArgs.data.status).toBe('sent');
    expect(updateArgs.data.version).toEqual({ increment: 1 });
  });

  it('update throws ConcurrentModificationError when version mismatches', async () => {
    prisma.quotation.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '7.8.0',
      }),
    );

    await expect(
      repository.update(tenantId, quotationId, { status: 'sent' }, 9),
    ).rejects.toBeInstanceOf(ConcurrentModificationError);
  });
});
