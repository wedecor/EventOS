import { z } from 'zod';

// M5-01 — body of POST /admin/external-identities. Strict: unknown keys rejected.
export const linkExternalIdentitySchema = z
  .object({
    userId: z.string().uuid(),
    provider: z.literal('firebase'),
    subject: z.string().min(1).max(256),
    email: z.string().email().max(320).optional(),
  })
  .strict();

export type LinkExternalIdentityBody = z.infer<
  typeof linkExternalIdentitySchema
>;
