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

const vendor = {
  id: 'v1',
  tenantId: 't1',
  name: 'Flower Co',
  category: 'flowers',
  status: 'active',
  contactName: null,
  contactPhone: null,
  location: null,
  servicesProvided: null,
  pricingNotes: null,
  paymentTerms: null,
  taxDetails: null,
  notes: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 3,
};

describe('vendorsApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('lists vendors with optional filters', async () => {
    const { vendorsApi } = await import('./vendors.api');
    get.mockResolvedValue({ data: { data: [vendor] } });
    await vendorsApi.list({ status: 'preferred', category: 'flowers' });
    expect(get).toHaveBeenCalledWith('/api/v1/vendors', {
      params: { status: 'preferred', category: 'flowers' },
    });
  });

  it('creates and loads by id', async () => {
    const { vendorsApi } = await import('./vendors.api');
    post.mockResolvedValue({ data: { data: vendor } });
    get.mockResolvedValue({ data: { data: vendor } });
    await vendorsApi.create({ name: 'Flower Co', category: 'flowers' });
    expect(post).toHaveBeenCalledWith('/api/v1/vendors', {
      name: 'Flower Co',
      category: 'flowers',
    });
    await vendorsApi.getById('v1');
    expect(get).toHaveBeenCalledWith('/api/v1/vendors/v1');
  });

  it('updates with If-Match and adds issue note', async () => {
    const { vendorsApi } = await import('./vendors.api');
    patch.mockResolvedValue({ data: { data: { ...vendor, version: 4 } } });
    post.mockResolvedValue({
      data: {
        data: {
          id: 'n1',
          tenantId: 't1',
          vendorId: 'v1',
          message: 'Late delivery',
          severity: 'high',
          occurredAt: null,
          createdAt: '2026-07-01T00:00:00.000Z',
        },
      },
    });

    await vendorsApi.update('v1', { name: 'Flower Co 2' }, 3);
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/vendors/v1',
      { name: 'Flower Co 2' },
      { headers: { 'If-Match': '"3"' } },
    );

    await vendorsApi.addIssueNote('v1', {
      message: 'Late delivery',
      severity: 'high',
    });
    expect(post).toHaveBeenCalledWith('/api/v1/vendors/v1/issue-notes', {
      message: 'Late delivery',
      severity: 'high',
    });
  });
});
