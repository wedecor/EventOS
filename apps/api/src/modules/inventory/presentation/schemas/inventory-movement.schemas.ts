import { z } from 'zod';

export const createInventoryMovementSchema = z.object({
  bookingId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
  reservationId: z.string().uuid().optional(),
});

export const transitionInventoryMovementSchema = z.object({
  toStatus: z.enum([
    'picked',
    'packing_started',
    'packed',
    'verified',
    'ready_for_dispatch',
    'loaded',
    'dispatched',
    'at_venue',
    'returned',
    'return_verified',
    'cleaned_ready',
    'cancelled',
  ]),
  occurredAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  packedByUserId: z.string().uuid().optional(),
  verificationNotes: z.string().optional(),
  vehicle: z.string().optional(),
  driverName: z.string().optional(),
  returnedQuantity: z.number().int().nonnegative().optional(),
  missingQuantity: z.number().int().nonnegative().optional(),
  damagedQuantity: z.number().int().nonnegative().optional(),
  returnVerificationNotes: z.string().optional(),
});

export const addDamageNoteSchema = z.object({
  message: z.string().min(1, 'Damage note message is required.'),
  accountability: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
});

export type CreateInventoryMovementBody = z.infer<
  typeof createInventoryMovementSchema
>;
export type TransitionInventoryMovementBody = z.infer<
  typeof transitionInventoryMovementSchema
>;
export type AddDamageNoteBody = z.infer<typeof addDamageNoteSchema>;
