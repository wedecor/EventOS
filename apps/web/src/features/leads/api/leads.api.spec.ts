import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}));

const lead = {
  id: 'l1',
  tenantId: 't1',
  customerId: null,
  assignedToId: null,
  source: 'manual',
  sourceDetail: null,
  stage: 'new',
  lostReason: null,
  eventType: 'Wedding',
  eventStartDate: null,
  eventEndDate: null,
  venue: null,
  estimatedBudgetAmount: null,
  estimatedBudgetCurrency: 'INR',
  guestCount: null,
  notes: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

describe('leadsApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('lists leads', async () => {
    const { leadsApi } = await import('./leads.api');
    get.mockResolvedValue({ data: { data: [lead] } });
    const result = await leadsApi.list();
    expect(result).toHaveLength(1);
    expect(get).toHaveBeenCalledWith('/api/v1/leads');
  });

  it('creates a lead', async () => {
    const { leadsApi } = await import('./leads.api');
    post.mockResolvedValue({ data: { data: lead } });
    await leadsApi.create({ source: 'manual' });
    expect(post).toHaveBeenCalledWith('/api/v1/leads', { source: 'manual' });
  });

  it('changes stage with If-Match', async () => {
    const { leadsApi } = await import('./leads.api');
    patch.mockResolvedValue({
      data: { data: { ...lead, stage: 'in_talks', version: 3 } },
    });
    await leadsApi.changeStage('l1', { stage: 'in_talks' }, 2);
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/leads/l1/stage',
      { stage: 'in_talks' },
      { headers: { 'If-Match': '"2"' } },
    );
  });

  it('assigns and schedules follow-up', async () => {
    const { leadsApi } = await import('./leads.api');
    post
      .mockResolvedValueOnce({ data: { data: { ...lead, assignedToId: 's1' } } })
      .mockResolvedValueOnce({
        data: {
          data: {
            id: 'f1',
            tenantId: 't1',
            leadId: 'l1',
            dueAt: '2026-07-20T10:00:00.000Z',
            notes: null,
            status: 'pending',
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
            version: 1,
          },
        },
      });

    await leadsApi.assign('l1', { staffId: '11111111-1111-4111-8111-111111111111' }, 2);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/leads/l1/assign',
      { staffId: '11111111-1111-4111-8111-111111111111' },
      { headers: { 'If-Match': '"2"' } },
    );

    await leadsApi.scheduleFollowUp('l1', {
      dueAt: '2026-07-20T10:00:00.000Z',
    });
    expect(post).toHaveBeenCalledWith('/api/v1/leads/l1/follow-ups', {
      dueAt: '2026-07-20T10:00:00.000Z',
    });
  });
});
