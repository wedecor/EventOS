import { z } from 'zod';

export const COMMUNICATION_CHANNELS = [
  'whatsapp',
  'email',
  'sms',
  'phone_call',
  'internal_note',
  'manual_meeting',
] as const;

export const COMMUNICATION_DIRECTIONS = ['incoming', 'outgoing'] as const;

export const COMMUNICATION_STATUSES = [
  'draft',
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'cancelled',
  'completed',
] as const;

export const COMMUNICATION_TEMPLATE_STATUSES = ['active', 'archived'] as const;

export const REMINDER_STATUSES = [
  'pending',
  'completed',
  'cancelled',
] as const;

export const REMINDER_CATEGORIES = [
  'payment_follow_up',
  'event_reminder',
  'vendor_follow_up',
  'customer_follow_up',
  'staff_follow_up',
  'other',
] as const;

export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];
export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];
export type CommunicationTemplateStatus =
  (typeof COMMUNICATION_TEMPLATE_STATUSES)[number];
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];
export type ReminderCategory = (typeof REMINDER_CATEGORIES)[number];

export const communicationChannelSchema = z.enum(COMMUNICATION_CHANNELS);
export const communicationDirectionSchema = z.enum(COMMUNICATION_DIRECTIONS);
export const communicationStatusSchema = z.enum(COMMUNICATION_STATUSES);
export const communicationTemplateStatusSchema = z.enum(
  COMMUNICATION_TEMPLATE_STATUSES,
);
export const reminderStatusSchema = z.enum(REMINDER_STATUSES);
export const reminderCategorySchema = z.enum(REMINDER_CATEGORIES);

/** Preferred next step along the outbound delivery path (API still allows branches). */
export const NEXT_COMMUNICATION_STATUS: Record<
  CommunicationStatus,
  CommunicationStatus | null
> = {
  draft: 'queued',
  queued: 'sent',
  sent: 'delivered',
  delivered: 'read',
  read: null,
  failed: 'queued',
  cancelled: null,
  completed: null,
};

export const ALLOWED_COMMUNICATION_TRANSITIONS: Record<
  CommunicationStatus,
  CommunicationStatus[]
> = {
  draft: ['queued', 'cancelled', 'completed'],
  queued: ['sent', 'cancelled', 'failed'],
  sent: ['delivered', 'failed', 'cancelled'],
  delivered: ['read', 'failed'],
  read: [],
  failed: ['queued', 'cancelled'],
  cancelled: [],
  completed: [],
};

const dateLike = z.union([z.string(), z.date()]);

export const communicationRecordSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().nullable(),
  customerId: z.string().nullable(),
  vendorId: z.string().nullable(),
  staffMemberId: z.string().nullable(),
  templateId: z.string().nullable(),
  channel: communicationChannelSchema,
  direction: communicationDirectionSchema,
  status: communicationStatusSchema,
  subject: z.string().nullable(),
  body: z.string().nullable(),
  failureReason: z.string().nullable(),
  createdByUserId: z.string().nullable(),
  occurredAt: dateLike,
  sentAt: dateLike.nullable(),
  deliveredAt: dateLike.nullable(),
  readAt: dateLike.nullable(),
  failedAt: dateLike.nullable(),
  deletedAt: dateLike.nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int().nonnegative(),
});

export const communicationRecordEnvelopeSchema = z.object({
  data: communicationRecordSchema,
});

export const communicationRecordListEnvelopeSchema = z.object({
  data: z.array(communicationRecordSchema),
});

export type CommunicationRecord = z.infer<typeof communicationRecordSchema>;

export const communicationAttachmentSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  communicationRecordId: z.string().min(1),
  fileName: z.string().nullable(),
  mimeType: z.string().nullable(),
  fileSizeBytes: z.number().int().nonnegative().nullable(),
  storageKey: z.string().nullable(),
  deletedAt: dateLike.nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int().nonnegative(),
});

export const communicationAttachmentEnvelopeSchema = z.object({
  data: communicationAttachmentSchema,
});

export const communicationAttachmentListEnvelopeSchema = z.object({
  data: z.array(communicationAttachmentSchema),
});

export type CommunicationAttachment = z.infer<
  typeof communicationAttachmentSchema
>;

export const communicationTemplateSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  channel: communicationChannelSchema.nullable(),
  subject: z.string().nullable(),
  body: z.string().min(1),
  status: communicationTemplateStatusSchema,
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int().nonnegative(),
});

export const communicationTemplateEnvelopeSchema = z.object({
  data: communicationTemplateSchema,
});

export const communicationTemplateListEnvelopeSchema = z.object({
  data: z.array(communicationTemplateSchema),
});

export type CommunicationTemplate = z.infer<typeof communicationTemplateSchema>;

export const reminderSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().nullable(),
  customerId: z.string().nullable(),
  vendorId: z.string().nullable(),
  staffMemberId: z.string().nullable(),
  communicationRecordId: z.string().nullable(),
  category: reminderCategorySchema,
  title: z.string().min(1),
  notes: z.string().nullable(),
  dueAt: dateLike,
  status: reminderStatusSchema,
  assignedToUserId: z.string().nullable(),
  completedAt: dateLike.nullable(),
  cancelledAt: dateLike.nullable(),
  createdAt: dateLike,
  updatedAt: dateLike,
  version: z.number().int().nonnegative(),
});

export const reminderEnvelopeSchema = z.object({
  data: reminderSchema,
});

export const reminderListEnvelopeSchema = z.object({
  data: z.array(reminderSchema),
});

export type Reminder = z.infer<typeof reminderSchema>;

export type CreateCommunicationRequest = {
  bookingId?: string;
  customerId?: string;
  vendorId?: string;
  staffMemberId?: string;
  templateId?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status?: CommunicationStatus;
  subject?: string;
  body?: string;
  occurredAt?: string;
};

export type UpdateCommunicationRequest = {
  subject?: string | null;
  body?: string | null;
  bookingId?: string | null;
  customerId?: string | null;
  vendorId?: string | null;
  staffMemberId?: string | null;
  templateId?: string | null;
};

export type TransitionCommunicationRequest = {
  status: CommunicationStatus;
  failureReason?: string | null;
};

export type AddCommunicationAttachmentRequest = {
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  storageKey?: string;
};

export type CreateCommunicationTemplateRequest = {
  name: string;
  category: string;
  channel?: CommunicationChannel;
  subject?: string;
  body: string;
};

export type UpdateCommunicationTemplateRequest = {
  name?: string;
  category?: string;
  channel?: CommunicationChannel | null;
  subject?: string | null;
  body?: string;
};

export type CreateReminderRequest = {
  bookingId?: string;
  customerId?: string;
  vendorId?: string;
  staffMemberId?: string;
  communicationRecordId?: string;
  category?: ReminderCategory;
  title: string;
  notes?: string;
  dueAt: string;
  assignedToUserId?: string;
};

export const createCommunicationFormSchema = z.object({
  bookingId: z.string(),
  customerId: z.string(),
  vendorId: z.string(),
  staffMemberId: z.string(),
  templateId: z.string(),
  channel: communicationChannelSchema,
  direction: communicationDirectionSchema,
  status: z.union([communicationStatusSchema, z.literal('')]),
  subject: z.string(),
  body: z.string(),
});

export type CreateCommunicationFormValues = z.infer<
  typeof createCommunicationFormSchema
>;

export const createTemplateFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  category: z.string().trim().min(1, 'Category is required'),
  channel: z.union([communicationChannelSchema, z.literal('')]),
  subject: z.string(),
  body: z.string().trim().min(1, 'Body is required'),
});

export type CreateTemplateFormValues = z.infer<typeof createTemplateFormSchema>;

export const createReminderFormSchema = z.object({
  bookingId: z.string(),
  customerId: z.string(),
  vendorId: z.string(),
  staffMemberId: z.string(),
  communicationRecordId: z.string(),
  category: reminderCategorySchema,
  title: z.string().trim().min(1, 'Title is required'),
  notes: z.string(),
  dueAt: z.string().trim().min(1, 'Due date is required'),
  assignedToUserId: z.string(),
});

export type CreateReminderFormValues = z.infer<typeof createReminderFormSchema>;

export const addAttachmentFormSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.string(),
  storageKey: z.string(),
});

export type AddAttachmentFormValues = z.infer<typeof addAttachmentFormSchema>;

function optionalTrimmed(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toCreateCommunicationRequest(
  values: CreateCommunicationFormValues,
): CreateCommunicationRequest {
  return {
    channel: values.channel,
    direction: values.direction,
    ...(optionalTrimmed(values.bookingId)
      ? { bookingId: values.bookingId.trim() }
      : {}),
    ...(optionalTrimmed(values.customerId)
      ? { customerId: values.customerId.trim() }
      : {}),
    ...(optionalTrimmed(values.vendorId)
      ? { vendorId: values.vendorId.trim() }
      : {}),
    ...(optionalTrimmed(values.staffMemberId)
      ? { staffMemberId: values.staffMemberId.trim() }
      : {}),
    ...(optionalTrimmed(values.templateId)
      ? { templateId: values.templateId.trim() }
      : {}),
    ...(values.status ? { status: values.status } : {}),
    ...(optionalTrimmed(values.subject)
      ? { subject: values.subject.trim() }
      : {}),
    ...(optionalTrimmed(values.body) ? { body: values.body.trim() } : {}),
  };
}

export function toCreateTemplateRequest(
  values: CreateTemplateFormValues,
): CreateCommunicationTemplateRequest {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    body: values.body.trim(),
    ...(values.channel ? { channel: values.channel } : {}),
    ...(optionalTrimmed(values.subject)
      ? { subject: values.subject.trim() }
      : {}),
  };
}

export function toCreateReminderRequest(
  values: CreateReminderFormValues,
): CreateReminderRequest {
  const due = new Date(values.dueAt);
  return {
    title: values.title.trim(),
    category: values.category,
    dueAt: Number.isNaN(due.getTime())
      ? values.dueAt
      : due.toISOString(),
    ...(optionalTrimmed(values.bookingId)
      ? { bookingId: values.bookingId.trim() }
      : {}),
    ...(optionalTrimmed(values.customerId)
      ? { customerId: values.customerId.trim() }
      : {}),
    ...(optionalTrimmed(values.vendorId)
      ? { vendorId: values.vendorId.trim() }
      : {}),
    ...(optionalTrimmed(values.staffMemberId)
      ? { staffMemberId: values.staffMemberId.trim() }
      : {}),
    ...(optionalTrimmed(values.communicationRecordId)
      ? { communicationRecordId: values.communicationRecordId.trim() }
      : {}),
    ...(optionalTrimmed(values.notes) ? { notes: values.notes.trim() } : {}),
    ...(optionalTrimmed(values.assignedToUserId)
      ? { assignedToUserId: values.assignedToUserId.trim() }
      : {}),
  };
}

export function toAddAttachmentRequest(
  values: AddAttachmentFormValues,
): AddCommunicationAttachmentRequest {
  const sizeRaw = values.fileSizeBytes.trim();
  const size = sizeRaw ? Number(sizeRaw) : undefined;
  return {
    ...(optionalTrimmed(values.fileName)
      ? { fileName: values.fileName.trim() }
      : {}),
    ...(optionalTrimmed(values.mimeType)
      ? { mimeType: values.mimeType.trim() }
      : {}),
    ...(size != null && Number.isInteger(size) && size >= 0
      ? { fileSizeBytes: size }
      : {}),
    ...(optionalTrimmed(values.storageKey)
      ? { storageKey: values.storageKey.trim() }
      : {}),
  };
}

export function parseCommunicationRecord(body: unknown): CommunicationRecord {
  return communicationRecordEnvelopeSchema.parse(body).data;
}

export function parseCommunicationRecordList(
  body: unknown,
): CommunicationRecord[] {
  return communicationRecordListEnvelopeSchema.parse(body).data;
}

export function parseCommunicationAttachment(
  body: unknown,
): CommunicationAttachment {
  return communicationAttachmentEnvelopeSchema.parse(body).data;
}

export function parseCommunicationAttachmentList(
  body: unknown,
): CommunicationAttachment[] {
  return communicationAttachmentListEnvelopeSchema.parse(body).data;
}

export function parseCommunicationTemplate(
  body: unknown,
): CommunicationTemplate {
  return communicationTemplateEnvelopeSchema.parse(body).data;
}

export function parseCommunicationTemplateList(
  body: unknown,
): CommunicationTemplate[] {
  return communicationTemplateListEnvelopeSchema.parse(body).data;
}

export function parseReminder(body: unknown): Reminder {
  return reminderEnvelopeSchema.parse(body).data;
}

export function parseReminderList(body: unknown): Reminder[] {
  return reminderListEnvelopeSchema.parse(body).data;
}

export function formatCommunicationLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatWhen(value: string | Date | null | undefined): string {
  if (value == null) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
