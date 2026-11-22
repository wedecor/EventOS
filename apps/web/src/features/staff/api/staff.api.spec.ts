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

const member = {
  id: 's1',
  tenantId: 't1',
  userId: null,
  name: 'Ravi',
  role: 'decorator',
  operationalRole: 'decorator',
  department: null,
  phone: '+919876543210',
  email: null,
  employmentType: 'temporary',
  status: 'active',
  active: true,
  joinedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 3,
};

describe('staffApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('lists staff with optional status filter', async () => {
    const { staffApi } = await import('./staff.api');
    get.mockResolvedValue({ data: { data: [member] } });
    await staffApi.list({ status: 'active' });
    expect(get).toHaveBeenCalledWith('/api/v1/staff', {
      params: { status: 'active' },
    });
  });

  it('creates and loads by id', async () => {
    const { staffApi } = await import('./staff.api');
    post.mockResolvedValue({ data: { data: member } });
    get.mockResolvedValue({ data: { data: member } });
    await staffApi.create({
      name: 'Ravi',
      role: 'decorator',
      phone: { countryCode: '+91', number: '9876543210' },
    });
    expect(post).toHaveBeenCalledWith('/api/v1/staff', {
      name: 'Ravi',
      role: 'decorator',
      phone: { countryCode: '+91', number: '9876543210' },
    });
    await staffApi.getById('s1');
    expect(get).toHaveBeenCalledWith('/api/v1/staff/s1');
  });

  it('updates with If-Match', async () => {
    const { staffApi } = await import('./staff.api');
    patch.mockResolvedValue({ data: { data: { ...member, version: 4 } } });
    await staffApi.update('s1', { name: 'Ravi K' }, 3);
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/staff/s1',
      { name: 'Ravi K' },
      { headers: { 'If-Match': '"3"' } },
    );
  });
});
