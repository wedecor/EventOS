import { z } from 'zod';

export const TASK_CATEGORIES = [
  'general',
  'pre_event',
  'dayheets',
  'vendor',
  'inventory',
  'venue',
  'wrap_up',
] as const;

export const CHECKLIST_TEMPLATE_STATUSES = [
  'active',
  'inactive',
  'archived',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type ChecklistTemplateStatus =
  (typeof CHECKLIST_TEMPLATE_STATUSES)[number];

export const checklistTemplateItemSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  isRequired: z.boolean(),
  defaultAssigneeRole: z.string().nullable(),
  estimatedDurationMinutes: z.number().int().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const checklistTemplateSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  eventTypes: z.array(z.string()),
  category: z.enum(TASK_CATEGORIES),
  status: z.enum(CHECKLIST_TEMPLATE_STATUSES),
  templateVersion: z.number().int().positive(),
  sortOrder: z.number().int(),
  rootTemplateId: z.string().min(1),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
  items: z.array(checklistTemplateItemSchema).default([]),
});

export const eventChecklistItemSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  checklistId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  isRequired: z.boolean(),
  defaultAssigneeRole: z.string().nullable(),
  estimatedDurationMinutes: z.number().int().nullable(),
  sortOrder: z.number().int(),
  isCompleted: z.boolean(),
  completedAt: z.union([z.string(), z.date()]).nullable(),
  completedByUserId: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const eventChecklistSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  templateId: z.string().nullable(),
  templateVersion: z.number().int().nullable(),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.enum(TASK_CATEGORIES),
  sortOrder: z.number().int(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
  items: z.array(eventChecklistItemSchema).default([]),
});

export type ChecklistTemplate = z.infer<typeof checklistTemplateSchema>;
export type ChecklistTemplateItem = z.infer<typeof checklistTemplateItemSchema>;
export type EventChecklist = z.infer<typeof eventChecklistSchema>;
export type EventChecklistItem = z.infer<typeof eventChecklistItemSchema>;

export type CreateChecklistTemplateRequest = {
  name: string;
  description?: string;
  eventTypes?: string[];
  category?: TaskCategory;
  sortOrder?: number;
};

export type UpdateChecklistTemplateRequest = {
  name?: string;
  description?: string;
  eventTypes?: string[];
  category?: TaskCategory;
  status?: ChecklistTemplateStatus;
  sortOrder?: number;
};

export type CreateChecklistTemplateItemRequest = {
  title: string;
  description?: string;
  isRequired?: boolean;
  defaultAssigneeRole?: string;
  estimatedDurationMinutes?: number;
  sortOrder?: number;
};

export type GenerateEventChecklistsRequest = {
  bookingId: string;
  templateIds?: string[];
};

export type UpdateEventChecklistItemRequest = {
  isCompleted?: boolean;
  notes?: string | null;
};

export function parseChecklistTemplateList(body: unknown): ChecklistTemplate[] {
  return z.object({ data: z.array(checklistTemplateSchema) }).parse(body).data;
}

export function parseChecklistTemplate(body: unknown): ChecklistTemplate {
  return z.object({ data: checklistTemplateSchema }).parse(body).data;
}

export function parseChecklistTemplateItem(
  body: unknown,
): ChecklistTemplateItem {
  return z.object({ data: checklistTemplateItemSchema }).parse(body).data;
}

export function parseEventChecklistList(body: unknown): EventChecklist[] {
  return z.object({ data: z.array(eventChecklistSchema) }).parse(body).data;
}

export function parseEventChecklist(body: unknown): EventChecklist {
  return z.object({ data: eventChecklistSchema }).parse(body).data;
}

export function parseEventChecklistItem(body: unknown): EventChecklistItem {
  return z.object({ data: eventChecklistItemSchema }).parse(body).data;
}
