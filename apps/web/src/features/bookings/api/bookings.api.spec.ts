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

const booking = {
  id: 'b1',
  tenantId: 't1',
  customerId: 'c1',
  leadId: 'l1',
  quotationId: 'q1',
  bookingNumber: 42,
  status: 'approved',
  eventType: null,
  eventStartDate: null,
  eventEndDate: null,
  venueName: null,
  guestCount: null,
  requirementsNotes: null,
  workspaceStatus: 'inactive',
  preparationStatus: 'pending',
  operationalMilestone: null,
  executionOwnerId: null,
  cancellationReason: null,
  completedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

const workspace = {
  eventId: 'b1',
  workspaceStatus: 'inactive',
  preparationStatus: 'pending',
  operationalMilestone: 'preparation',
  executionOwnerId: '11111111-1111-4111-8111-111111111111',
};

describe('bookingsApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
  });

  it('loads booking by id', async () => {
    const { bookingsApi } = await import('./bookings.api');
    get.mockResolvedValue({ data: { data: booking } });
    await bookingsApi.getById('b1');
    expect(get).toHaveBeenCalledWith('/api/v1/bookings/b1');
  });

  it('updates status with required If-Match', async () => {
    const { bookingsApi } = await import('./bookings.api');
    patch.mockResolvedValue({
      data: { data: { ...booking, status: 'in_preparation', version: 3 } },
    });
    await bookingsApi.updateStatus('b1', { status: 'in_preparation' }, 2);
    expect(patch).toHaveBeenCalledWith(
      '/api/v1/bookings/b1/status',
      { status: 'in_preparation' },
      { headers: { 'If-Match': '"2"' } },
    );
  });

  it('cancels and completes with If-Match', async () => {
    const { bookingsApi } = await import('./bookings.api');
    post
      .mockResolvedValueOnce({
        data: { data: { ...booking, status: 'cancelled' } },
      })
      .mockResolvedValueOnce({
        data: { data: { ...booking, status: 'completed' } },
      });

    await bookingsApi.cancel('b1', { reason: 'withdrawn' }, 2);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/bookings/b1/cancel',
      { reason: 'withdrawn' },
      { headers: { 'If-Match': '"2"' } },
    );

    await bookingsApi.complete('b1', 2);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/bookings/b1/complete',
      {},
      { headers: { 'If-Match': '"2"' } },
    );
  });

  it('assigns owner and advances stage (workspace response)', async () => {
    const { bookingsApi } = await import('./bookings.api');
    post
      .mockResolvedValueOnce({ data: { data: workspace } })
      .mockResolvedValueOnce({
        data: {
          data: { ...workspace, preparationStatus: 'ready' },
        },
      });

    await bookingsApi.assignExecutionOwner(
      'b1',
      { executionOwnerId: workspace.executionOwnerId! },
      2,
    );
    expect(post).toHaveBeenCalledWith(
      '/api/v1/bookings/b1/execution-owner',
      { executionOwnerId: workspace.executionOwnerId },
      { headers: { 'If-Match': '"2"' } },
    );

    await bookingsApi.advanceExecutionStage(
      'b1',
      { milestoneKey: 'preparation', preparationStatus: 'ready' },
      2,
    );
    expect(post).toHaveBeenCalledWith(
      '/api/v1/bookings/b1/execution-stages/advance',
      { milestoneKey: 'preparation', preparationStatus: 'ready' },
      { headers: { 'If-Match': '"2"' } },
    );
  });
});
