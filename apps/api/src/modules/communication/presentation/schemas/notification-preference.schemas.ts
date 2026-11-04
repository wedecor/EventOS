import { z } from 'zod';

export const upsertNotificationPreferenceSchema = z.object({
  customerId: z.string().uuid(),
  whatsapp: z.boolean().optional(),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
});

export type UpsertNotificationPreferenceBody = z.infer<
  typeof upsertNotificationPreferenceSchema
>;
