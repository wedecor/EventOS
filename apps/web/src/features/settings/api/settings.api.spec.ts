import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const patch = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}));

const sample = {
  id: 's1',
  tenantId: 't1',
  businessName: 'We Decor Events',
  monthlyEventTarget: 30,
  monthlyRevenueTarget: null,
  monthlyLeadTarget: null,
  averageBookingTarget: null,
  conversionRateTarget: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

describe('settingsApi', () => {
  beforeEach(() => {
    get.mockReset();
    patch.mockReset();
  });

  it('gets and updates settings with If-Match', async () => {
    const { settingsApi } = await import('./settings.api');
    get.mockResolvedValue({ data: { data: sample } });
    await expect(settingsApi.getSettings()).resolves.toMatchObject({
      businessName: 'We Decor Events',
    });
    expect(get).toHaveBeenCalledWith('/api/v1/settings');

    patch.mockResolvedValue({
      data: { data: { tenantId: 't1', updated: true } },
    });
    await settingsApi.updateSettings({ businessName: 'We Decor' }, 2);
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/settings',
      { businessName: 'We Decor' },
      { headers: { 'If-Match': '"2"' } },
    );
  });
});
