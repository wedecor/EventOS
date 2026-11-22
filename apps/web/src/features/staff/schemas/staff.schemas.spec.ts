import { describe, expect, it } from 'vitest';
import {
  parseStaffList,
  parseStaffMember,
  splitPhone,
  staffFormSchema,
  staffToFormValues,
  toCreateStaffRequest,
  toUpdateStaffRequest,
} from './staff.schemas';

const sample = {
  id: 's1',
  tenantId: 't1',
  userId: null,
  name: 'Ravi',
  role: 'decorator',
  operationalRole: 'decorator',
  department: null,
  phone: '+919876543210',
  email: 'ravi@example.com',
  employmentType: 'permanent' as const,
  status: 'active' as const,
  active: true,
  joinedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

describe('staff schemas', () => {
  it('parses list and detail envelopes', () => {
    expect(parseStaffList({ data: [sample] })).toHaveLength(1);
    expect(parseStaffMember({ data: sample }).name).toBe('Ravi');
  });

  it('splits flattened phone for forms', () => {
    expect(splitPhone('+919876543210')).toEqual({
      countryCode: '+91',
      number: '9876543210',
    });
  });

  it('maps create form to OpenAPI nested phone/email', () => {
    expect(
      toCreateStaffRequest({
        name: ' Ravi ',
        role: ' decorator ',
        department: '',
        phoneCountryCode: '+91',
        phoneNumber: '9876543210',
        email: ' ravi@example.com ',
        status: 'active',
        employmentType: 'temporary',
      }),
    ).toEqual({
      name: 'Ravi',
      role: 'decorator',
      phone: { countryCode: '+91', number: '9876543210' },
      status: 'active',
      employmentType: 'temporary',
      email: { value: 'ravi@example.com' },
    });
  });

  it('maps staff dto into form defaults', () => {
    expect(staffToFormValues(sample)).toEqual({
      name: 'Ravi',
      role: 'decorator',
      department: '',
      phoneCountryCode: '+91',
      phoneNumber: '9876543210',
      email: 'ravi@example.com',
      status: 'active',
      employmentType: 'permanent',
    });
  });

  it('clears email on update with null', () => {
    expect(
      toUpdateStaffRequest({
        ...staffToFormValues(sample),
        email: '',
      }).email,
    ).toBeNull();
  });

  it('rejects invalid email when provided', () => {
    expect(
      staffFormSchema.safeParse({
        name: 'Ravi',
        role: 'decorator',
        department: '',
        phoneCountryCode: '+91',
        phoneNumber: '9876543210',
        email: 'not-an-email',
        status: 'active',
        employmentType: 'temporary',
      }).success,
    ).toBe(false);
  });
});
