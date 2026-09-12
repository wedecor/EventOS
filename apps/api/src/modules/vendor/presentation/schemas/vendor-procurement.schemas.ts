import { z } from 'zod';

export const createVendorProcurementSchema = z.object({
  vendorId: z.string().uuid(),
  notes: z.string().optional(),
});

export type CreateVendorProcurementBody = z.infer<
  typeof createVendorProcurementSchema
>;
