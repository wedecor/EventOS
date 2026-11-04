import { z } from 'zod';

const timelineEntryTypeSchema = z.enum(['note', 'issue', 'other']);

// docs/09 §Customer POST /clients/:id/interactions request model.
// recordedByUserId is never accepted from the body (decision 2A).
export const logTimelineEntrySchema = z.object({
  eventId: z.string().uuid('eventId must be a valid UUID.'),
  type: timelineEntryTypeSchema,
  message: z.string().min(1, 'Message is required.'),
  occurredAt: z.string().datetime(),
});

export type LogTimelineEntryBody = z.infer<typeof logTimelineEntrySchema>;
