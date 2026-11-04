import { SuggestionRepositoryImpl } from './suggestion.repository.impl';

describe('SuggestionRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const suggestionId = 'suggestion-1';

  const prismaSuggestion = {
    id: suggestionId,
    tenantId,
    type: 'workspace.create',
    status: 'pending' as const,
    aggregateType: 'booking',
    aggregateId: 'booking-1',
    payload: { version: 1 },
    sourceEventId: null,
    comment: null,
    createdAt: new Date(),
    resolvedAt: null,
    resolvedBy: null,
  };

  const prisma = {
    suggestion: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  let repository: SuggestionRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SuggestionRepositoryImpl(prisma as never);
  });

  it('create maps a suggestion record', async () => {
    prisma.suggestion.create.mockResolvedValue(prismaSuggestion);

    const result = await repository.create(tenantId, {
      type: 'workspace.create',
      aggregateType: 'booking',
      aggregateId: 'booking-1',
      payload: { version: 1 },
    });

    expect(result.id).toBe(suggestionId);
    expect(prisma.suggestion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenant: { connect: { id: tenantId } },
        type: 'workspace.create',
      }),
    });
  });

  it('findById scopes by tenant', async () => {
    prisma.suggestion.findFirst.mockResolvedValue(prismaSuggestion);

    const result = await repository.findById(tenantId, suggestionId);

    expect(result?.type).toBe('workspace.create');
    expect(prisma.suggestion.findFirst).toHaveBeenCalledWith({
      where: { id: suggestionId, tenantId },
    });
  });

  it('findMany filters by status', async () => {
    prisma.suggestion.findMany.mockResolvedValue([prismaSuggestion]);

    const result = await repository.findMany(tenantId, { status: 'pending' });

    expect(result).toHaveLength(1);
    expect(prisma.suggestion.findMany).toHaveBeenCalledWith({
      where: { tenantId, status: 'pending', type: undefined },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('resolve sets status and resolution metadata', async () => {
    prisma.suggestion.update.mockResolvedValue({
      ...prismaSuggestion,
      status: 'accepted',
      resolvedBy: 'user-1',
      resolvedAt: new Date(),
      comment: 'go',
    });

    const result = await repository.resolve(tenantId, suggestionId, {
      status: 'accepted',
      resolvedBy: 'user-1',
      comment: 'go',
    });

    expect(result.status).toBe('accepted');
    expect(prisma.suggestion.update).toHaveBeenCalledWith({
      where: { id: suggestionId, tenantId },
      data: expect.objectContaining({
        status: 'accepted',
        resolvedBy: 'user-1',
        comment: 'go',
      }),
    });
  });
});
