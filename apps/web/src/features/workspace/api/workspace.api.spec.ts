import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

const workspace = {
  eventId: 'b1',
  workspaceStatus: 'inactive',
  preparationStatus: 'pending',
  operationalMilestone: null,
  executionOwnerId: null,
};

describe('workspaceApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('loads workspace by booking id', async () => {
    const { workspaceApi } = await import('./workspace.api');
    get.mockResolvedValue({ data: { data: workspace } });
    await workspaceApi.getByBookingId('b1');
    expect(get).toHaveBeenCalledWith('/api/v1/bookings/b1/workspace');
  });

  it('activates with booking version If-Match', async () => {
    const { workspaceApi } = await import('./workspace.api');
    post.mockResolvedValue({
      data: { data: { ...workspace, workspaceStatus: 'active' } },
    });
    const result = await workspaceApi.activate('b1', 4);
    expect(result.workspaceStatus).toBe('active');
    expect(post).toHaveBeenCalledWith(
      '/api/v1/bookings/b1/activate-workspace',
      {},
      { headers: { 'If-Match': '"4"' } },
    );
  });
});
