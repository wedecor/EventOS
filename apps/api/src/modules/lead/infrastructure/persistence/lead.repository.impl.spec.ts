import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { ConcurrentModificationError } from '../../../../shared/database';
import { LeadRepositoryImpl } from './lead.repository.impl';

describe('LeadRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const leadId = 'lead-1';

  const prismaLead = {
    id: leadId,
    tenantId,
    customerId: null,
    assignedToId: null,
    source: 'website' as const,
    sourceDetail: null,
    stage: 'new' as const,
    lostReason: null,
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-01'),
    venue: 'Bangalore',
    estimatedBudgetAmount: new Prisma.Decimal(100000),
    estimatedBudgetCurrency: 'INR',
    guestCount: 200,
    notes: null,
    createdAt: new Date('2026-07-08T00:00:00.000Z'),
    updatedAt: new Date('2026-07-08T00:00:00.000Z'),
    version: 1,
  };

  let prisma: {
    lead: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    leadStageHistory: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let repository: LeadRepositoryImpl;

  beforeEach(() => {
    prisma = {
      lead: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      leadStageHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
        callback(prisma),
      ),
    };

    repository = new LeadRepositoryImpl(prisma as unknown as PrismaService);
  });

  it('create scopes by tenant and maps the record', async () => {
    prisma.lead.create.mockResolvedValue(prismaLead);

    const result = await repository.create(tenantId, {
      source: 'website',
      eventType: 'wedding',
    });

    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    const createArgs = prisma.lead.create.mock.calls[0]?.[0] as {
      data: { tenant: { connect: { id: string } }; source: string };
    };
    expect(createArgs.data.tenant.connect.id).toBe(tenantId);
    expect(createArgs.data.source).toBe('website');
    expect(result.tenantId).toBe(tenantId);
    expect(result.estimatedBudgetAmount).toBe(100000);
  });

  it('findById scopes by tenant', async () => {
    prisma.lead.findFirst.mockResolvedValue(prismaLead);

    await repository.findById(tenantId, leadId);

    expect(prisma.lead.findFirst).toHaveBeenCalledWith({
      where: { id: leadId, tenantId },
    });
  });

  it('findByPhone scopes by tenant and customer phone', async () => {
    prisma.lead.findMany.mockResolvedValue([prismaLead]);

    await repository.findByPhone(tenantId, '+919999999999');

    expect(prisma.lead.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        customer: { primaryPhone: '+919999999999' },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findByStage scopes by tenant and stage', async () => {
    prisma.lead.findMany.mockResolvedValue([prismaLead]);

    await repository.findByStage(tenantId, 'in_talks');

    expect(prisma.lead.findMany).toHaveBeenCalledWith({
      where: { tenantId, stage: 'in_talks' },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('update uses optimistic concurrency and increments version', async () => {
    prisma.lead.update.mockResolvedValue({ ...prismaLead, version: 2 });

    await repository.update(tenantId, leadId, { notes: 'Updated' }, 1);

    expect(prisma.lead.update).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.lead.update.mock.calls[0]?.[0] as {
      where: { id: string; tenantId: string; version: number };
      data: { notes: string; version: { increment: number } };
    };
    expect(updateArgs.where).toEqual({ id: leadId, tenantId, version: 1 });
    expect(updateArgs.data.notes).toBe('Updated');
    expect(updateArgs.data.version).toEqual({ increment: 1 });
  });

  it('update throws ConcurrentModificationError when version mismatches', async () => {
    prisma.lead.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '7.8.0',
      }),
    );

    await expect(
      repository.update(tenantId, leadId, { notes: 'Updated' }, 99),
    ).rejects.toBeInstanceOf(ConcurrentModificationError);
  });

  it('changeStage persists stage history and updates the lead', async () => {
    prisma.lead.findFirst.mockResolvedValue(prismaLead);
    prisma.lead.update.mockResolvedValue({
      ...prismaLead,
      stage: 'in_talks',
      version: 2,
    });
    prisma.leadStageHistory.create.mockResolvedValue({});

    await repository.changeStage(
      tenantId,
      leadId,
      { stage: 'in_talks', changedById: 'user-1' },
      1,
    );

    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: leadId, tenantId, version: 1 },
      data: {
        stage: 'in_talks',
        version: { increment: 1 },
      },
    });
    expect(prisma.leadStageHistory.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        leadId,
        fromStage: 'new',
        toStage: 'in_talks',
        reason: null,
        changedById: 'user-1',
      },
    });
  });
});
