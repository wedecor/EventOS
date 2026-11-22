import { AiExecutionRepositoryImpl } from './ai-execution.repository.impl';

describe('AiExecutionRepositoryImpl', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';

  it('creates tenant-scoped metadata rows without prompt bodies', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'exec-1',
      tenantId,
      userId: 'user-1',
      leadId: 'lead-1',
      feature: 'lead_intelligence',
      provider: 'test',
      model: 'test-model',
      promptVersion: 'lead-intelligence.v1',
      status: 'success',
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      estimatedCostUsd: null,
      durationMs: 12,
      correlationId: 'req-1',
      failureCategory: null,
      createdAt: new Date(),
    });
    const prisma = { aiExecution: { create } };
    const repository = new AiExecutionRepositoryImpl(prisma as never);

    const row = await repository.create(tenantId, {
      userId: 'user-1',
      leadId: 'lead-1',
      feature: 'lead_intelligence',
      provider: 'test',
      model: 'test-model',
      promptVersion: 'lead-intelligence.v1',
      status: 'success',
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      estimatedCostUsd: null,
      durationMs: 12,
      correlationId: 'req-1',
    });

    expect(row.id).toBe('exec-1');
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: 'user-1' } },
        lead: { connect: { id: 'lead-1' } },
        feature: 'lead_intelligence',
        status: 'success',
      }),
    });
    const args = create.mock.calls[0][0].data as Record<string, unknown>;
    expect(args).not.toHaveProperty('prompt');
    expect(args).not.toHaveProperty('response');
    expect(args).not.toHaveProperty('messages');
  });
});
