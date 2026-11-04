import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

const payment = {
  id: 'p1',
  tenantId: 't1',
  bookingId: 'b1',
  leadId: null,
  quotationId: null,
  invoiceId: null,
  amount: 1000,
  currency: 'INR',
  method: 'upi',
  status: 'recorded',
  receivedAt: '2026-07-01T00:00:00.000Z',
  attachmentId: null,
  missingProofReason: null,
  notes: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

describe('financeApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('lists payments and voids with If-Match', async () => {
    const { financeApi } = await import('./finance.api');
    get.mockResolvedValue({ data: { data: [payment] } });
    await financeApi.listPayments('b1');
    expect(get).toHaveBeenCalledWith('/api/v1/bookings/b1/payments');

    post.mockResolvedValue({
      data: { data: { ...payment, status: 'void', version: 3 } },
    });
    await financeApi.voidPayment('p1', 2);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/payments/p1/void',
      {},
      { headers: { 'If-Match': '"2"' } },
    );
  });

  it('creates and sends invoices', async () => {
    const { financeApi } = await import('./finance.api');
    const invoice = {
      id: 'inv1',
      tenantId: 't1',
      bookingId: 'b1',
      customerId: 'c1',
      invoiceNumber: 1,
      status: 'draft',
      subtotalAmount: 100,
      taxAmount: 0,
      totalAmount: 100,
      currency: 'INR',
      notes: null,
      sentAt: null,
      voidedAt: null,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      version: 1,
      lineItems: [],
    };
    post.mockResolvedValueOnce({ data: { data: invoice } });
    await financeApi.createInvoice({
      bookingId: 'b1',
      customerId: 'c1',
      lineItems: [{ description: 'Decor', unitPriceAmount: 100 }],
    });
    expect(post).toHaveBeenCalledWith('/api/v1/invoices', {
      bookingId: 'b1',
      customerId: 'c1',
      lineItems: [{ description: 'Decor', unitPriceAmount: 100 }],
    });

    post.mockResolvedValueOnce({
      data: { data: { ...invoice, status: 'sent', version: 2 } },
    });
    await financeApi.sendInvoice('inv1', { channel: 'email' }, 1);
    expect(post).toHaveBeenCalledWith(
      '/api/v1/invoices/inv1/send',
      { channel: 'email' },
      { headers: { 'If-Match': '"1"' } },
    );
  });

  it('records expenses and loads profitability', async () => {
    const { financeApi } = await import('./finance.api');
    post.mockResolvedValue({
      data: {
        data: {
          id: 'e1',
          tenantId: 't1',
          bookingId: 'b1',
          vendorId: 'v1',
          procurementLineId: null,
          amount: 50,
          currency: 'INR',
          method: 'cash',
          status: 'recorded',
          paidAt: '2026-07-01T00:00:00.000Z',
          attachmentId: null,
          notes: null,
          createdAt: '2026-07-01T00:00:00.000Z',
          updatedAt: '2026-07-01T00:00:00.000Z',
          version: 1,
        },
      },
    });
    await financeApi.recordExpense('b1', {
      vendorId: 'v1',
      amount: 50,
      currency: 'INR',
      method: 'cash',
      paidAt: '2026-07-01T00:00:00Z',
    });
    expect(post).toHaveBeenCalledWith('/api/v1/bookings/b1/expenses', {
      vendorId: 'v1',
      amount: 50,
      currency: 'INR',
      method: 'cash',
      paidAt: '2026-07-01T00:00:00Z',
    });

    get.mockResolvedValue({
      data: {
        data: {
          eventId: 'b1',
          revenue: { amount: 100, currency: 'INR' },
          vendorExpenses: { amount: 50, currency: 'INR' },
          grossMargin: { amount: 50, currency: 'INR' },
        },
      },
    });
    const profit = await financeApi.getProfitability('b1');
    expect(get).toHaveBeenCalledWith('/api/v1/bookings/b1/profitability');
    expect(profit.grossMargin.amount).toBe(50);
  });
});
