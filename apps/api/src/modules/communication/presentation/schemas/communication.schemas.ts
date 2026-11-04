import { z } from 'zod';

export const communicationChannelSchema = z.enum([
  'whatsapp',
  'email',
  'sms',
  'phone_call',
  'internal_note',
  'manual_meeting',
]);

export const communicationDirectionSchema = z.enum(['incoming', 'outgoing']);

export const communicationStatusSchema = z.enum([
  'draft',
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'cancelled',
  'completed',
]);

export const createCommunicationSchema = z.object({
  bookingId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  staffMemberId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  channel: communicationChannelSchema,
  direction: communicationDirectionSchema,
  status: communicationStatusSchema.optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
});

export const updateCommunicationSchema = z.object({
  subject: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  staffMemberId: z.string().uuid().nullable().optional(),
  templateId: z.string().uuid().nullable().optional(),
});

export const transitionCommunicationSchema = z.object({
  status: communicationStatusSchema,
  failureReason: z.string().nullable().optional(),
});

export const addCommunicationAttachmentSchema = z.object({
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  storageKey: z.string().optional(),
});

export type CreateCommunicationBody = z.infer<typeof createCommunicationSchema>;
export type UpdateCommunicationBody = z.infer<typeof updateCommunicationSchema>;
export type TransitionCommunicationBody = z.infer<
  typeof transitionCommunicationSchema
>;
export type AddCommunicationAttachmentBody = z.infer<
  typeof addCommunicationAttachmentSchema
>;
