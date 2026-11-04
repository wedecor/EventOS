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

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const TASK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const checklistItemSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  taskId: z.string().min(1),
  description: z.string().min(1),
  isCompleted: z.boolean(),
  completedAt: z.union([z.string(), z.date()]).nullable(),
  sortOrder: z.number().int(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const taskSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  category: z.enum(TASK_CATEGORIES),
  priority: z.enum(TASK_PRIORITIES),
  assignedTo: z.string().nullable(),
  dueAt: z.union([z.string(), z.date()]).nullable(),
  status: z.enum(TASK_STATUSES),
  completedAt: z.union([z.string(), z.date()]).nullable(),
  completionNotes: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
  checklistItems: z.array(checklistItemSchema).default([]),
});

export const taskListEnvelopeSchema = z.object({
  data: z.array(taskSchema),
});

export const taskEnvelopeSchema = z.object({
  data: taskSchema,
});

export const checklistItemEnvelopeSchema = z.object({
  data: checklistItemSchema,
});

export type Task = z.infer<typeof taskSchema>;
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export type CreateTaskRequest = {
  bookingId: string;
  title: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  assignedTo?: string;
  dueAt?: string;
};

export type UpdateTaskRequest = {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  assignedTo?: string;
  dueAt?: string;
};

export type UpdateTaskStatusRequest = {
  status: TaskStatus;
  completionNotes?: string;
};

export type AddChecklistItemRequest = {
  description: string;
  sortOrder?: number;
};

export type UpdateChecklistItemRequest = {
  description?: string;
  isCompleted?: boolean;
  sortOrder?: number;
};

export function parseTaskList(body: unknown): Task[] {
  return taskListEnvelopeSchema.parse(body).data;
}

export function parseTask(body: unknown): Task {
  return taskEnvelopeSchema.parse(body).data;
}

export function parseChecklistItem(body: unknown): ChecklistItem {
  return checklistItemEnvelopeSchema.parse(body).data;
}
