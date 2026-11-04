import { z } from 'zod';

const suggestionStatusSchema = z.enum([
  'pending',
  'accepted',
  'dismissed',
  'expired',
]);

export const listSuggestionsQuerySchema = z.object({
  status: suggestionStatusSchema.optional().default('pending'),
});

export const acceptSuggestionSchema = z.object({
  comment: z.string().nullable().optional(),
});

export const dismissSuggestionSchema = z.object({
  comment: z.string().nullable().optional(),
});

export type ListSuggestionsQuery = z.infer<typeof listSuggestionsQuerySchema>;
export type AcceptSuggestionBody = z.infer<typeof acceptSuggestionSchema>;
export type DismissSuggestionBody = z.infer<typeof dismissSuggestionSchema>;
