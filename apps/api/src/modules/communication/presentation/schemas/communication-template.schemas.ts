import { z } from 'zod';
import { communicationChannelSchema } from './communication.schemas';

export const createCommunicationTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  channel: communicationChannelSchema.optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
});

export const updateCommunicationTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  channel: communicationChannelSchema.nullable().optional(),
  subject: z.string().nullable().optional(),
  body: z.string().min(1).optional(),
});

export type CreateCommunicationTemplateBody = z.infer<
  typeof createCommunicationTemplateSchema
>;
export type UpdateCommunicationTemplateBody = z.infer<
  typeof updateCommunicationTemplateSchema
>;
