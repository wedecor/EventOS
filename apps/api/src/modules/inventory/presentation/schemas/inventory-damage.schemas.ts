import { z } from 'zod';

export const createInventoryDamageReportSchema = z.object({
  damageType: z.enum(['breakage', 'loss', 'water_damage', 'wear', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
  photoName: z.string().optional(),
  photoMimeType: z.string().optional(),
  photoSizeBytes: z.number().int().nonnegative().optional(),
});

export type CreateInventoryDamageReportBody = z.infer<
  typeof createInventoryDamageReportSchema
>;
