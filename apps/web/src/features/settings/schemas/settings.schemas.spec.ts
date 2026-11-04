import { describe, expect, it } from 'vitest';
import {
  parseTenantSettings,
  settingsToFormValues,
  toUpdateTenantSettingsRequest,
  tenantSettingsFormSchema,
} from './settings.schemas';

const sample = {
  id: 's1',
  tenantId: 't1',
  businessName: 'We Decor Events',
  monthlyEventTarget: 30,
  monthlyRevenueTarget: null,
  monthlyLeadTarget: 50,
  averageBookingTarget: 100000,
  conversionRateTarget: 0.25,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 2,
};

describe('settings schemas', () => {
  it('parses tenant settings envelope', () => {
    expect(parseTenantSettings({ data: sample }).businessName).toBe(
      'We Decor Events',
    );
  });

  it('maps form values and clears empty targets to null', () => {
    const form = settingsToFormValues(sample);
    expect(form.monthlyRevenueTarget).toBe('');
    expect(tenantSettingsFormSchema.parse(form).businessName).toBe(
      'We Decor Events',
    );
    expect(
      toUpdateTenantSettingsRequest({
        ...form,
        monthlyRevenueTarget: '',
        monthlyEventTarget: '12',
      }),
    ).toEqual({
      businessName: 'We Decor Events',
      monthlyEventTarget: 12,
      monthlyRevenueTarget: null,
      monthlyLeadTarget: 50,
      averageBookingTarget: 100000,
      conversionRateTarget: 0.25,
    });
  });

  it('rejects negative target strings on map', () => {
    expect(() =>
      toUpdateTenantSettingsRequest({
        businessName: 'X',
        monthlyEventTarget: '-1',
        monthlyRevenueTarget: '',
        monthlyLeadTarget: '',
        averageBookingTarget: '',
        conversionRateTarget: '',
      }),
    ).toThrow(/whole number/);
  });
});
