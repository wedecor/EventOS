import { describe, expect, it } from 'vitest';
import {
  createVendorFormSchema,
  parseVendor,
  parseVendorList,
  toCreateVendorRequest,
  toUpdateVendorRequest,
  updateVendorFormSchema,
  vendorToFormValues,
} from './vendor.schemas';

const sampleVendor = {
  id: 'v1',
  tenantId: 't1',
  name: 'Flower Co',
  category: 'flowers',
  status: 'preferred' as const,
  contactName: 'Asha',
  contactPhone: '9999999999',
  location: 'Bangalore',
  servicesProvided: null,
  pricingNotes: null,
  paymentTerms: null,
  taxDetails: null,
  notes: null,
  procurementCount: 0,
  onTimeDeliveryCount: 0,
  completedProcurementCount: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

describe('vendor schemas', () => {
  it('parses vendor list and detail envelopes', () => {
    expect(parseVendorList({ data: [sampleVendor] })).toHaveLength(1);
    expect(parseVendor({ data: sampleVendor }).name).toBe('Flower Co');
  });

  it('maps create form to OpenAPI body', () => {
    expect(
      toCreateVendorRequest({
        name: ' Flower Co ',
        category: ' flowers ',
        status: 'active',
        contactName: ' Asha ',
        contactPhone: '',
        location: '',
        servicesProvided: '',
        pricingNotes: '',
        paymentTerms: '',
        taxDetails: '',
        notes: '',
        statusReason: '',
      }),
    ).toEqual({
      name: 'Flower Co',
      category: 'flowers',
      status: 'active',
      contactName: 'Asha',
    });
  });

  it('requires statusReason when changing to paused', () => {
    const schema = updateVendorFormSchema('active');
    expect(
      schema.safeParse({
        ...vendorToFormValues(sampleVendor),
        status: 'paused',
        statusReason: '',
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...vendorToFormValues(sampleVendor),
        status: 'paused',
        statusReason: 'Quality issues',
      }).success,
    ).toBe(true);
  });

  it('includes statusReason on update when provided', () => {
    expect(
      toUpdateVendorRequest({
        ...vendorToFormValues(sampleVendor),
        status: 'blocked',
        statusReason: ' Unreliable ',
      }).statusReason,
    ).toBe('Unreliable');
  });

  it('validates create required fields', () => {
    expect(
      createVendorFormSchema.safeParse({
        name: '',
        category: 'flowers',
        status: 'active',
        contactName: '',
        contactPhone: '',
        location: '',
        servicesProvided: '',
        pricingNotes: '',
        paymentTerms: '',
        taxDetails: '',
        notes: '',
        statusReason: '',
      }).success,
    ).toBe(false);
  });
});
