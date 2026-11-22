import { z } from 'zod';

// docs/09 §Customer POST /events/:eventId/review-requests
export const createReviewRequestSchema = z.object({
  channel: z.enum(['google', 'instagram', 'other']),
  channelDetail: z.string().nullable().optional(),
});

export type CreateReviewRequestBody = z.infer<typeof createReviewRequestSchema>;
