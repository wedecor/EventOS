import { z } from 'zod';

export const acceptSuggestionBodySchema = z.object({
  comment: z.string().nullable().optional(),
  assigneeId: z.string().uuid().optional(),
});
