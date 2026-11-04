import { describe, expect, it } from 'vitest';
import {
  parseExpenseList,
  parseInvoiceList,
  parsePaymentList,
  parseProfitability,
  toApiDateTime,
  toCreateInvoiceRequest,
  toRecordExpenseRequest,
  toRecordPaymentRequest,
  toSendInvoiceRequest,
} from './finance.schemas';

describe('finance schemas', () => {
  it('parses booking-scoped list envelopes', () => {
    expect(
      parsePaymentList({
        data: [
          {
            id: 'p1',
            tenantId: 't1',
            bookingId: 'b1',
            leadId: null,
            quotationId: null,
            invoiceId: null,
            amount: 10000,
            currency: 'INR',
            method: 'upi',
            status: 'recorded',
            receivedAt: '2026-07-01T00:00:00.000Z',
            attachmentId: null,
            missingProofReason: null,
            notes: null,
            createdAt: '2026-07-01T00:00:00.000Z',
            updatedAt: '2026-07-01T00:00:00.000Z',
            version: 1,
          },
        ],
      }),
    ).toHaveLength(1);

    expect(
      parseInvoiceList({
        data: [
          {
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
            lineItems: [
              {
                id: 'li1',
                tenantId: 't1',
                invoiceId: 'inv1',
                description: 'Decor',
                quantity: 1,
                unitPriceAmount: 100,
                currency: 'INR',
                sortOrder: 0,
                createdAt: '2026-07-01T00:00:00.000Z',
                updatedAt: '2026-07-01T00:00:00.000Z',
                version: 1,
              },
            ],
          },
        ],
      })[0]?.status,
    ).toBe('draft');

    expect(
      parseExpenseList({
        data: [
          {
            id: 'e1',
            tenantId: 't1',
            bookingId: 'b1',
            vendorId: 'v1',
            procurementLineId: null,
            amount: 500,
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
        ],
      }),
    ).toHaveLength(1);
  });

  it('parses profitability nested money', () => {
    expect(
      parseProfitability({
        data: {
          eventId: 'b1',
          revenue: { amount: 1000, currency: 'INR' },
          vendorExpenses: { amount: 400, currency: 'INR' },
          grossMargin: { amount: 600, currency: 'INR' },
        },
      }).grossMargin.amount,
    ).toBe(600);
  });

  it('maps record payment with flat amount', () => {
    expect(
      toRecordPaymentRequest({
        bookingId: '11111111-1111-4111-8111-111111111111',
        leadId: '',
        quotationId: '',
        invoiceId: '',
        amount: '25000',
        currency: 'INR',
        method: 'upi',
        receivedAt: '2026-07-01T10:00:00.000Z',
        missingProofReason: ' client forgot ',
        notes: '',
      }),
    ).toEqual({
      bookingId: '11111111-1111-4111-8111-111111111111',
      amount: 25000,
      currency: 'INR',
      method: 'upi',
      receivedAt: '2026-07-01T10:00:00Z',
      missingProofReason: 'client forgot',
    });
  });

  it('maps invoice create and send', () => {
    expect(
      toCreateInvoiceRequest({
        bookingId: '11111111-1111-4111-8111-111111111111',
        customerId: '22222222-2222-4222-8222-222222222222',
        description: 'Stage decor',
        quantity: '2',
        unitPriceAmount: '15000',
        notes: '',
      }).lineItems,
    ).toEqual([
      {
        description: 'Stage decor',
        quantity: 2,
        unitPriceAmount: 15000,
      },
    ]);
    expect(toSendInvoiceRequest({ channel: 'email', recipient: 'a@b.com' })).toEqual({
      channel: 'email',
      recipient: 'a@b.com',
    });
  });

  it('maps expense record with paidAt', () => {
    expect(
      toRecordExpenseRequest({
        vendorId: '33333333-3333-4333-8333-333333333333',
        procurementLineId: '',
        amount: '900',
        currency: 'INR',
        method: 'cash',
        paidAt: '2026-07-02T12:00:00.000Z',
        notes: 'flowers',
      }),
    ).toMatchObject({
      vendorId: '33333333-3333-4333-8333-333333333333',
      amount: 900,
      method: 'cash',
      notes: 'flowers',
    });
  });

  it('normalizes datetime to Z suffix', () => {
    expect(toApiDateTime('2026-07-01T10:00:00.000Z')).toBe(
      '2026-07-01T10:00:00Z',
    );
  });
});
