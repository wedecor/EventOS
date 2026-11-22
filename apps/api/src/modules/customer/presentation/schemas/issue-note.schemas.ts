import { z } from 'zod';

// docs/09 §Customer POST /events/:eventId/issues
export const createIssueNoteSchema = z.object({
  message: z.string().min(1, 'Issue message is required.'),
  severity: z.enum(['low', 'medium', 'high']),
  notes: z.string().nullable().optional(),
});

export type CreateIssueNoteBody = z.infer<typeof createIssueNoteSchema>;
