import { describe, expect, it } from 'vitest';
import {
  customerFormSchema,
  customerToFormValues,
  parseCustomer,
  toCreateRequest,
} from './customer.schemas';

const sampleCustomer = {
  id: 'c1',
  tenantId: 't1',
  displayName: 'Acme',
  type: 'individual',
  status: 'active',
  primaryPhone: '9999999999',
  primaryEmail: 'a@b.co',
  notes: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 1,
};

describe('customer schemas', () => {
  it('parses customer envelope', () => {
    expect(parseCustomer({ data: sampleCustomer }).displayName).toBe('Acme');
  });

  it('requires phone or email on forms', () => {
    expect(
      customerFormSchema.safeParse({
        name: 'Acme',
        email: '',
        phone: '',
        notes: '',
      }).success,
    ).toBe(false);

    expect(
      customerFormSchema.safeParse({
        name: 'Acme',
        email: 'a@b.co',
        phone: '',
        notes: '',
      }).success,
    ).toBe(true);
  });

  it('maps form values to OpenAPI create body without company/address', () => {
    const body = toCreateRequest({
      name: ' Acme ',
      email: ' a@b.co ',
      phone: '',
      notes: ' hi ',
    });
    expect(body).toEqual({
      name: 'Acme',
      email: 'a@b.co',
      notes: 'hi',
    });
    expect(body).not.toHaveProperty('company');
  });

  it('maps customer DTO into form defaults', () => {
    expect(customerToFormValues(sampleCustomer)).toEqual({
      name: 'Acme',
      email: 'a@b.co',
      phone: '9999999999',
      notes: '',
    });
  });
});
