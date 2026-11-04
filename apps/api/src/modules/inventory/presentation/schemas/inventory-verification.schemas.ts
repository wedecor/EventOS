import { z } from 'zod';

export const createInventoryVerificationSchema = z.object({
  expectedQuantity: z.number().int().nonnegative(),
  actualQuantity: z.number().int().nonnegative(),
  notes: z.string().optional(),
  verifiedAt: z.string().datetime().optional(),
});

export type CreateInventoryVerificationBody = z.infer<
  typeof createInventoryVerificationSchema
>;
