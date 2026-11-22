import { z } from 'zod';

export const updateIntegrationSettingsSchema = z
  .object({
    emailProvider: z.enum(['test', 'smtp', 'none']).optional(),
    fromName: z.string().trim().min(1).max(200).nullable().optional(),
    fromEmail: z
      .union([z.string().email(), z.literal(''), z.null()])
      .optional(),
    smtpUser: z.string().trim().min(1).max(200).nullable().optional(),
    /** Write-only — never returned by GET. */
    smtpPassword: z.string().min(1).max(500).optional(),
    storageProvider: z.enum(['local', 's3', 'none']).optional(),
    storageBucket: z.string().trim().min(1).max(200).nullable().optional(),
    storageEndpoint: z.string().trim().url().nullable().optional(),
    storageAccessKey: z.string().trim().min(1).max(500).nullable().optional(),
    /** Write-only — never returned by GET. */
    storageSecretKey: z.string().min(1).max(500).optional(),
  })
  .strict();

export type UpdateIntegrationSettingsBody = z.infer<
  typeof updateIntegrationSettingsSchema
>;

export const testEmailSchema = z
  .object({
    to: z.string().email().optional(),
  })
  .strict();

export type TestEmailBody = z.infer<typeof testEmailSchema>;
