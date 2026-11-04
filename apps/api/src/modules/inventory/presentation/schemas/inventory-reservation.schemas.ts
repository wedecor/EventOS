import { z } from 'zod';

export const createInventoryReservationSchema = z.object({
  bookingId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
  vendorProcurementId: z.string().uuid().optional(),
});

export const modifyInventoryReservationSchema = z.object({
  quantity: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type CreateInventoryReservationBody = z.infer<
  typeof createInventoryReservationSchema
>;
export type ModifyInventoryReservationBody = z.infer<
  typeof modifyInventoryReservationSchema
>;
