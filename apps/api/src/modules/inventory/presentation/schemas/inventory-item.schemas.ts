import { z } from 'zod';

// EP1-INV-001 — Item taxonomy (`docs/07-domain-model.md` §InventoryItem ItemTaxonomy,
// `docs/09-api-design.md` §Inventory item master).
const inventoryItemTaxonomySchema = z.enum([
  'reusable',
  'consumable',
  'per_event',
]);

const inventoryItemConditionSchema = z.enum([
  'good',
  'fair',
  'damaged',
  'retired',
]);

const inventoryItemStatusSchema = z.enum(['active', 'inactive', 'retired']);

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Inventory item name is required.'),
  sku: z.string().nullable().optional(),
  category: z.string().min(1, 'Inventory item category is required.'),
  taxonomy: inventoryItemTaxonomySchema,
  unit: z.string().min(1, 'Inventory item unit is required.'),
  condition: inventoryItemConditionSchema.optional(),
  quantityAtJpNagar: z.number().int().nonnegative().optional(),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).nullable().optional(),
  sku: z.string().nullable().optional(),
  category: z.string().min(1).optional(),
  taxonomy: inventoryItemTaxonomySchema.optional(),
  unit: z.string().min(1).optional(),
  condition: inventoryItemConditionSchema.optional(),
  quantityAtJpNagar: z.number().int().nonnegative().optional(),
  status: inventoryItemStatusSchema.optional(),
});

export const listInventoryItemsQuerySchema = z.object({
  status: inventoryItemStatusSchema.optional(),
  taxonomy: inventoryItemTaxonomySchema.optional(),
  category: z.string().optional(),
});

export type CreateInventoryItemBody = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemBody = z.infer<typeof updateInventoryItemSchema>;
export type ListInventoryItemsQuery = z.infer<
  typeof listInventoryItemsQuerySchema
>;
