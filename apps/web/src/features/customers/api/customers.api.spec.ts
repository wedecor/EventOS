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

const customer = {
  id: 'c1',
  tenantId: 't1',
  displayName: 'Acme',
  type: 'individual',
  status: 'active',
  primaryPhone: null,
  primaryEmail: 'a@b.co',
  notes: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 3,
};

describe('customersApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('creates a customer', async () => {
    const { customersApi } = await import('./customers.api');
    post.mockResolvedValue({ data: { data: customer } });
    const result = await customersApi.create({ name: 'Acme', email: 'a@b.co' });
    expect(result.id).toBe('c1');
    expect(post).toHaveBeenCalledWith('/api/v1/clients', {
      name: 'Acme',
      email: 'a@b.co',
    });
  });

  it('loads customer by id', async () => {
    const { customersApi } = await import('./customers.api');
    get.mockResolvedValue({ data: { data: customer } });
    await customersApi.getById('c1');
    expect(get).toHaveBeenCalledWith('/api/v1/clients/c1');
  });

  it('updates with If-Match version', async () => {
    const { customersApi } = await import('./customers.api');
    patch.mockResolvedValue({ data: { data: { ...customer, version: 4 } } });
    await customersApi.update('c1', { name: 'Acme 2' }, 3);
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/clients/c1',
      { name: 'Acme 2' },
      { headers: { 'If-Match': '"3"' } },
    );
  });
});
