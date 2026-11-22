import { z } from 'zod';

export const taskCategorySchema = z.enum([
  'general',
  'pre_event',
  'dayheets',
  'vendor',
  'inventory',
  'venue',
  'wrap_up',
]);

export const checklistTemplateStatusSchema = z.enum([
  'active',
  'inactive',
  'archived',
]);

export const createChecklistTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  eventTypes: z.array(z.string()).optional(),
  category: taskCategorySchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const updateChecklistTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  eventTypes: z.array(z.string()).optional(),
  category: taskCategorySchema.optional(),
  status: checklistTemplateStatusSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const createChecklistTemplateItemSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  defaultAssigneeRole: z.string().optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateChecklistTemplateItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  defaultAssigneeRole: z.string().optional(),
  estimatedDurationMinutes: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const generateEventChecklistsSchema = z.object({
  bookingId: z.string().uuid(),
  templateIds: z.array(z.string().uuid()).optional(),
});

export const updateEventChecklistItemSchema = z.object({
  isCompleted: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateChecklistTemplateBody = z.infer<
  typeof createChecklistTemplateSchema
>;
export type UpdateChecklistTemplateBody = z.infer<
  typeof updateChecklistTemplateSchema
>;
export type CreateChecklistTemplateItemBody = z.infer<
  typeof createChecklistTemplateItemSchema
>;
export type UpdateChecklistTemplateItemBody = z.infer<
  typeof updateChecklistTemplateItemSchema
>;
export type GenerateEventChecklistsBody = z.infer<
  typeof generateEventChecklistsSchema
>;
export type UpdateEventChecklistItemBody = z.infer<
  typeof updateEventChecklistItemSchema
>;
