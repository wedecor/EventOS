import { z } from 'zod';
import type { operations } from '@/types/api.generated';

/**
 * OpenAPI request body for login (frozen contract).
 * Response `data` is under-specified in openapi.v1.json — validated via Zod below.
 */
export type LoginRequestBody =
  operations['AuthController_login']['requestBody']['content']['application/json'];

export type RefreshRequestBody =
  operations['AuthController_refresh']['requestBody']['content']['application/json'];

export type ChangePasswordRequestBody =
  operations['AuthController_changePassword']['requestBody']['content']['application/json'];

/** Runtime validation for auth success payloads (login / refresh). */
export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
});

export const authSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: authUserSchema,
});

export const authSuccessEnvelopeSchema = z.object({
  data: authSessionSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSessionPayload = z.infer<typeof authSessionSchema>;

/** Client login form constraints aligned with OpenAPI max lengths. */
export const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email').max(320),
  password: z.string().min(1, 'Password is required').max(128),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

/** Self-service password change (confirm is client-only; not sent to API). */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: z.string().min(1, 'New password is required').max(128),
    confirmPassword: z.string().min(1, 'Confirm your new password').max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export function parseAuthSessionPayload(data: unknown): AuthSessionPayload {
  return authSessionSchema.parse(data);
}

export function parseAuthSuccessEnvelope(body: unknown): AuthSessionPayload {
  return authSuccessEnvelopeSchema.parse(body).data;
}
