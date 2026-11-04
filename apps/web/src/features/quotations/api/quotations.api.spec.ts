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

const quotation = {
  id: 'q1',
  tenantId: 't1',
  customerId: '11111111-1111-4111-8111-111111111111',
  leadId: '22222222-2222-4222-8222-222222222222',
  quotationNumber: 12,
  revisionNumber: 1,
  status: 'draft',
  eventType: null,
  eventStartDate: null,
  eventEndDate: null,
  venue: null,
  validUntil: null,
  terms: null,
  notes: null,
  subtotalAmount: 0,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  currency: 'INR',
  supersededById: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 3,
};

describe('quotationsApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('creates a quotation', async () => {
    const { quotationsApi } = await import('./quotations.api');
    post.mockResolvedValue({ data: { data: quotation } });
    await quotationsApi.create({
      leadId: quotation.leadId!,
      customerId: quotation.customerId,
    });
    expect(post).toHaveBeenCalledWith('/api/v1/quotations', {
      leadId: quotation.leadId,
      customerId: quotation.customerId,
    });
  });

  it('loads quotation by id', async () => {
    const { quotationsApi } = await import('./quotations.api');
    get.mockResolvedValue({ data: { data: quotation } });
    await quotationsApi.getById('q1');
    expect(get).toHaveBeenCalledWith('/api/v1/quotations/q1');
  });

  it('updates with If-Match', async () => {
    const { quotationsApi } = await import('./quotations.api');
    patch.mockResolvedValue({ data: { data: { ...quotation, version: 4 } } });
    await quotationsApi.update('q1', { notes: 'n', discountAmount: 1 }, 3);
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/quotations/q1',
      { notes: 'n', discountAmount: 1 },
      { headers: { 'If-Match': '"3"' } },
    );
  });

  it('sends, approves, rejects, and revises with If-Match', async () => {
    const { quotationsApi } = await import('./quotations.api');
    post
      .mockResolvedValueOnce({ data: { data: { ...quotation, status: 'sent' } } })
      .mockResolvedValueOnce({
        data: {
          data: { ...quotation, status: 'approved', eventId: null },
        },
      })
      .mockResolvedValueOnce({
        data: { data: { ...quotation, status: 'rejected' } },
      })
      .mockResolvedValueOnce({
        data: {
          data: { ...quotation, id: 'q2', revisionNumber: 2, status: 'draft' },
        },
      });

    await quotationsApi.send('q1', 3);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/quotations/q1/send',
      {},
      { headers: { 'If-Match': '"3"' } },
    );

    await quotationsApi.approve('q1', 3);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/quotations/q1/approve',
      {},
      { headers: { 'If-Match': '"3"' } },
    );

    await quotationsApi.reject('q1', { reason: 'no' }, 3);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/quotations/q1/reject',
      { reason: 'no' },
      { headers: { 'If-Match': '"3"' } },
    );

    const revised = await quotationsApi.revise('q1', 3);
    expect(revised.id).toBe('q2');
    expect(post).toHaveBeenCalledWith(
      '/api/v1/quotations/q1/revise',
      {},
      { headers: { 'If-Match': '"3"' } },
    );
  });
});
