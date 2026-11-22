import { z } from 'zod';

function parseDataEnvelope<T>(schema: z.ZodType<T>, payload: unknown): T {
  const envelope = z.object({ data: schema }).parse(payload);
  return envelope.data;
}

export const integrationSettingsSchema = z.object({
  // Seed tenant ids are nil-like UUIDs; Zod 4 uuid() rejects version nibble 0.
  id: z.string().min(1),
  tenantId: z.string().min(1),
  emailProvider: z.enum(['test', 'smtp', 'none']),
  fromName: z.string().nullable(),
  fromEmail: z.string().nullable(),
  smtpUser: z.string().nullable(),
  emailSecretConfigured: z.boolean(),
  emailSecretMasked: z.string().nullable(),
  storageProvider: z.enum(['local', 's3', 'none']),
  storageBucket: z.string().nullable(),
  storageEndpoint: z.string().nullable(),
  storageAccessKey: z.string().nullable(),
  storageSecretConfigured: z.boolean(),
  storageSecretMasked: z.string().nullable(),
  lastEmailTestAt: z.string().nullable(),
  lastEmailTestStatus: z.string().nullable(),
  lastStorageTestAt: z.string().nullable(),
  lastStorageTestStatus: z.string().nullable(),
  version: z.number().int(),
});

export type IntegrationSettings = z.infer<typeof integrationSettingsSchema>;

export const integrationSettingsUpdateResultSchema = z.object({
  tenantId: z.string().min(1),
  updated: z.literal(true),
  version: z.number().int(),
});

export type IntegrationSettingsUpdateResult = z.infer<
  typeof integrationSettingsUpdateResultSchema
>;

export const integrationConnectionTestResultSchema = z.object({
  ok: z.boolean(),
  status: z.enum(['ok', 'failed', 'unconfigured']),
  testedAt: z.string(),
  message: z.string(),
});

export type IntegrationConnectionTestResult = z.infer<
  typeof integrationConnectionTestResultSchema
>;

export const updateIntegrationSettingsRequestSchema = z
  .object({
    emailProvider: z.enum(['test', 'smtp', 'none']).optional(),
    fromName: z.string().trim().min(1).max(200).nullable().optional(),
    fromEmail: z
      .union([z.string().email(), z.literal(''), z.null()])
      .optional(),
    smtpUser: z.string().trim().min(1).max(200).nullable().optional(),
    smtpPassword: z.string().min(1).max(500).optional(),
    storageProvider: z.enum(['local', 's3', 'none']).optional(),
    storageBucket: z.string().trim().min(1).max(200).nullable().optional(),
    storageEndpoint: z.string().trim().url().nullable().optional(),
    storageAccessKey: z.string().trim().min(1).max(500).nullable().optional(),
    storageSecretKey: z.string().min(1).max(500).optional(),
  })
  .strict();

export type UpdateIntegrationSettingsRequest = z.infer<
  typeof updateIntegrationSettingsRequestSchema
>;

export const integrationSettingsFormSchema = z.object({
  emailProvider: z.enum(['test', 'smtp', 'none']),
  fromName: z.string(),
  fromEmail: z.string(),
  smtpUser: z.string(),
  smtpPassword: z.string(),
  storageProvider: z.enum(['local', 's3', 'none']),
  storageBucket: z.string(),
  storageEndpoint: z.string(),
  storageAccessKey: z.string(),
  storageSecretKey: z.string(),
});

export type IntegrationSettingsFormValues = z.infer<
  typeof integrationSettingsFormSchema
>;

export function settingsToFormValues(
  settings: IntegrationSettings,
): IntegrationSettingsFormValues {
  return {
    emailProvider: settings.emailProvider as 'test' | 'smtp' | 'none',
    fromName: settings.fromName ?? '',
    fromEmail: settings.fromEmail ?? '',
    smtpUser: settings.smtpUser ?? '',
    smtpPassword: '',
    storageProvider: settings.storageProvider as 'local' | 's3' | 'none',
    storageBucket: settings.storageBucket ?? '',
    storageEndpoint: settings.storageEndpoint ?? '',
    storageAccessKey: settings.storageAccessKey ?? '',
    storageSecretKey: '',
  };
}

export function toUpdateIntegrationSettingsRequest(
  values: IntegrationSettingsFormValues,
): UpdateIntegrationSettingsRequest {
  const body: UpdateIntegrationSettingsRequest = {
    emailProvider: values.emailProvider,
    fromName: values.fromName.trim() === '' ? null : values.fromName.trim(),
    fromEmail: values.fromEmail.trim() === '' ? null : values.fromEmail.trim(),
    smtpUser: values.smtpUser.trim() === '' ? null : values.smtpUser.trim(),
    storageProvider: values.storageProvider,
    storageBucket:
      values.storageBucket.trim() === '' ? null : values.storageBucket.trim(),
    storageEndpoint:
      values.storageEndpoint.trim() === ''
        ? null
        : values.storageEndpoint.trim(),
    storageAccessKey:
      values.storageAccessKey.trim() === ''
        ? null
        : values.storageAccessKey.trim(),
  };
  if (values.smtpPassword.trim() !== '') {
    body.smtpPassword = values.smtpPassword;
  }
  if (values.storageSecretKey.trim() !== '') {
    body.storageSecretKey = values.storageSecretKey;
  }
  return body;
}

export function parseIntegrationSettings(payload: unknown): IntegrationSettings {
  return parseDataEnvelope(integrationSettingsSchema, payload);
}

export function parseIntegrationSettingsUpdateResult(
  payload: unknown,
): IntegrationSettingsUpdateResult {
  return parseDataEnvelope(integrationSettingsUpdateResultSchema, payload);
}

export function parseIntegrationConnectionTestResult(
  payload: unknown,
): IntegrationConnectionTestResult {
  return parseDataEnvelope(integrationConnectionTestResultSchema, payload);
}
