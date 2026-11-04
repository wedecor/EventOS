import { z } from 'zod';

/**
 * Tenant settings read model (OpenAPI `data` under-specified — Zod-parse before UI bind).
 * Fields match apps/api TenantSettingsDto / PATCH body.
 */
export const tenantSettingsSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  businessName: z.string().min(1),
  monthlyEventTarget: z.number().int().nonnegative().nullable(),
  monthlyRevenueTarget: z.number().nonnegative().nullable(),
  monthlyLeadTarget: z.number().int().nonnegative().nullable(),
  averageBookingTarget: z.number().nonnegative().nullable(),
  conversionRateTarget: z.number().nonnegative().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const tenantSettingsEnvelopeSchema = z.object({
  data: tenantSettingsSchema,
});

export const tenantSettingsUpdateResultSchema = z.object({
  tenantId: z.string().min(1),
  updated: z.literal(true),
});

export const tenantSettingsUpdateEnvelopeSchema = z.object({
  data: tenantSettingsUpdateResultSchema,
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;
export type TenantSettingsUpdateResult = z.infer<
  typeof tenantSettingsUpdateResultSchema
>;

export type UpdateTenantSettingsRequest = {
  businessName?: string;
  monthlyEventTarget?: number | null;
  monthlyRevenueTarget?: number | null;
  monthlyLeadTarget?: number | null;
  averageBookingTarget?: number | null;
  conversionRateTarget?: number | null;
};

/** Form keeps targets as strings; empty string clears to null on submit. */
export const tenantSettingsFormSchema = z.object({
  businessName: z.string().trim().min(1, 'Business name is required'),
  monthlyEventTarget: z.string(),
  monthlyRevenueTarget: z.string(),
  monthlyLeadTarget: z.string(),
  averageBookingTarget: z.string(),
  conversionRateTarget: z.string(),
});

export type TenantSettingsFormValues = z.infer<typeof tenantSettingsFormSchema>;

function parseOptionalNonNegativeInt(
  raw: string,
  label: string,
): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a whole number ≥ 0`);
  }
  return value;
}

function parseOptionalNonNegativeNumber(
  raw: string,
  label: string,
): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be ≥ 0`);
  }
  return value;
}

export function parseTenantSettings(body: unknown): TenantSettings {
  return tenantSettingsEnvelopeSchema.parse(body).data;
}

export function parseTenantSettingsUpdateResult(
  body: unknown,
): TenantSettingsUpdateResult {
  return tenantSettingsUpdateEnvelopeSchema.parse(body).data;
}

export function settingsToFormValues(
  settings: TenantSettings,
): TenantSettingsFormValues {
  return {
    businessName: settings.businessName,
    monthlyEventTarget:
      settings.monthlyEventTarget == null
        ? ''
        : String(settings.monthlyEventTarget),
    monthlyRevenueTarget:
      settings.monthlyRevenueTarget == null
        ? ''
        : String(settings.monthlyRevenueTarget),
    monthlyLeadTarget:
      settings.monthlyLeadTarget == null
        ? ''
        : String(settings.monthlyLeadTarget),
    averageBookingTarget:
      settings.averageBookingTarget == null
        ? ''
        : String(settings.averageBookingTarget),
    conversionRateTarget:
      settings.conversionRateTarget == null
        ? ''
        : String(settings.conversionRateTarget),
  };
}

export function toUpdateTenantSettingsRequest(
  values: TenantSettingsFormValues,
): UpdateTenantSettingsRequest {
  return {
    businessName: values.businessName.trim(),
    monthlyEventTarget: parseOptionalNonNegativeInt(
      values.monthlyEventTarget,
      'Monthly event target',
    ),
    monthlyRevenueTarget: parseOptionalNonNegativeNumber(
      values.monthlyRevenueTarget,
      'Monthly revenue target',
    ),
    monthlyLeadTarget: parseOptionalNonNegativeInt(
      values.monthlyLeadTarget,
      'Monthly lead target',
    ),
    averageBookingTarget: parseOptionalNonNegativeNumber(
      values.averageBookingTarget,
      'Average booking target',
    ),
    conversionRateTarget: parseOptionalNonNegativeNumber(
      values.conversionRateTarget,
      'Conversion rate target',
    ),
  };
}
