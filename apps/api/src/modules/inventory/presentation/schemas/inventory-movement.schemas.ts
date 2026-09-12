import { z } from 'zod';

export const createInventoryMovementSchema = z.object({
  bookingId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
});

export const transitionInventoryMovementSchema = z.object({
  toStatus: z.enum([
    'picked',
    'packed',
    'loaded',
    'at_venue',
    'returned',
    'cleaned_ready',
  ]),
  occurredAt: z.string().datetime().optional(),
  notes: z.string().optional(),
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
