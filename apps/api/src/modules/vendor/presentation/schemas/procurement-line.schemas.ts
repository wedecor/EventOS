import { z } from 'zod';

export const addProcurementLineSchema = z.object({
  description: z.string().min(1, 'Procurement line description is required.'),
  category: z.string().min(1, 'Procurement line category is required.'),
  quantity: z.number().int().positive().optional(),
  budgetedAmount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  quotationLineItemId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// EP1-VEN-003 — `docs/09-api-design.md` §7 confirmation workflow. EP1-VEN-005 cost variance fields
// (`actualAmount`, `costVarianceReason`) are optional-when-applicable per §8's
// "optional cost variance recording when applicable" validation note.
const costVarianceReasonSchema = z.enum([
  'market_price_increase',
  'vendor_price_change',
  'vendor_change_availability_quality',
  'customer_scope_change',
  'emergency_purchase',
  'material_wastage_damage',
  'incorrect_estimation',
  'other',
]);

export const transitionProcurementLineSchema = z.object({
  toStatus: z.enum(['requested', 'confirmed', 'delivered', 'completed']),
  occurredAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  actualAmount: z.number().nonnegative().optional(),
  costVarianceReason: costVarianceReasonSchema.optional(),
});

export const addProcurementLineIssueNoteSchema = z.object({
  message: z.string().min(1, 'Issue note message is required.'),
  severity: z.enum(['low', 'medium', 'high']),
  occurredAt: z.string().datetime().optional(),
});

export type AddProcurementLineBody = z.infer<typeof addProcurementLineSchema>;
export type TransitionProcurementLineBody = z.infer<
  typeof transitionProcurementLineSchema
>;
export type AddProcurementLineIssueNoteBody = z.infer<
  typeof addProcurementLineIssueNoteSchema
>;
