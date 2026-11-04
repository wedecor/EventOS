import { z } from 'zod';

const nullableNonNegativeInt = z.number().int().nonnegative().nullable();
const nullableNonNegativeNumber = z.number().nonnegative().nullable();

export const updateTenantSettingsSchema = z.object({
  businessName: z.string().min(1).optional(),
  monthlyEventTarget: nullableNonNegativeInt.optional(),
  monthlyRevenueTarget: nullableNonNegativeNumber.optional(),
  monthlyLeadTarget: nullableNonNegativeInt.optional(),
  averageBookingTarget: nullableNonNegativeNumber.optional(),
  conversionRateTarget: nullableNonNegativeNumber.optional(),
});

export type UpdateTenantSettingsBody = z.infer<
  typeof updateTenantSettingsSchema
>;
