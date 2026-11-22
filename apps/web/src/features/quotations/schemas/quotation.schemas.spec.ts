import { describe, expect, it } from 'vitest';
import {
  createQuotationFormSchema,
  parseApproveQuotation,
  parseQuotation,
  quotationToUpdateFormValues,
  toCreateQuotationRequest,
  toUpdateQuotationRequest,
  updateQuotationFormSchema,
} from './quotation.schemas';

const sampleQuotation = {
  id: 'q1',
  tenantId: 't1',
  customerId: '11111111-1111-4111-8111-111111111111',
  leadId: '22222222-2222-4222-8222-222222222222',
  quotationNumber: 12,
  revisionNumber: 1,
  status: 'draft' as const,
  eventType: null,
  eventStartDate: null,
  eventEndDate: null,
  venue: null,
  validUntil: '2026-08-01',
  terms: null,
  notes: 'hello',
  subtotalAmount: 1000,
  discountAmount: 50,
  taxAmount: 100,
  totalAmount: 1050,
  currency: 'INR',
  supersededById: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

describe('quotation schemas', () => {
  it('parses quotation envelope', () => {
    expect(parseQuotation({ data: sampleQuotation }).quotationNumber).toBe(12);
  });

  it('parses approve result with optional eventId', () => {
    expect(
      parseApproveQuotation({
        data: { ...sampleQuotation, status: 'approved', eventId: 'e1' },
      }).eventId,
    ).toBe('e1');
  });

  it('maps create form to OpenAPI body', () => {
    expect(
      toCreateQuotationRequest({
        leadId: '22222222-2222-4222-8222-222222222222',
        customerId: '11111111-1111-4111-8111-111111111111',
        validUntil: '2026-09-01',
        notes: ' note ',
      }),
    ).toEqual({
      leadId: '22222222-2222-4222-8222-222222222222',
      customerId: '11111111-1111-4111-8111-111111111111',
      validUntil: '2026-09-01',
      notes: 'note',
    });
  });

  it('validates create UUIDs', () => {
    expect(
      createQuotationFormSchema.safeParse({
        leadId: 'not-a-uuid',
        customerId: '11111111-1111-4111-8111-111111111111',
        validUntil: '',
        notes: '',
      }).success,
    ).toBe(false);
  });

  it('maps update form including discount and tax', () => {
    expect(
      toUpdateQuotationRequest({
        validUntil: '2026-08-01',
        notes: 'n',
        discountAmount: '10',
        taxAmount: '5',
      }),
    ).toEqual({
      validUntil: '2026-08-01',
      notes: 'n',
      discountAmount: 10,
      taxAmount: 5,
    });
  });

  it('rejects negative amounts on update form', () => {
    expect(
      updateQuotationFormSchema.safeParse({
        validUntil: '',
        notes: '',
        discountAmount: '-1',
        taxAmount: '0',
      }).success,
    ).toBe(false);
  });

  it('maps quotation to update form defaults', () => {
    expect(quotationToUpdateFormValues(sampleQuotation)).toEqual({
      validUntil: '2026-08-01',
      notes: 'hello',
      discountAmount: '50',
      taxAmount: '100',
    });
  });
});
