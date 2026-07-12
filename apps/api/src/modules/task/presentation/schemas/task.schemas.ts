import { z } from 'zod';

export const createTaskSchema = z.object({
  bookingId: z.string().uuid(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
});

export const addChecklistItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  sortOrder: z.number().int().optional(),
});

export const updateChecklistItemSchema = z.object({
  description: z.string().min(1).optional(),
  isCompleted: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskSchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusBody = z.infer<typeof updateTaskStatusSchema>;
export type AddChecklistItemBody = z.infer<typeof addChecklistItemSchema>;
export type UpdateChecklistItemBody = z.infer<typeof updateChecklistItemSchema>;
