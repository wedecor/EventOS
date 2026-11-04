import { z } from 'zod';

// docs/14 §API Input Validation: string fields have maximum length limits.
const PASSWORD_MAX_LENGTH = 128;

export const loginSchema = z.object({
  email: z.string().email('A valid email is required.').max(320),
  password: z.string().min(1, 'Password is required.').max(PASSWORD_MAX_LENGTH),
});

export type LoginBody = z.infer<typeof loginSchema>;

// Refresh/logout read the refresh token from the HTTP-only cookie (ADR-008). The
// body field is an optional fallback for non-browser clients that cannot use cookies.
export const refreshSchema = z.object({
  refreshToken: z.string().min(1).max(4096).optional(),
});

export type RefreshBody = z.infer<typeof refreshSchema>;

// R1-10 — self-service password change. Both fields must be present; the full
// complexity/history/breach policy is enforced in the Application layer
// (PasswordChangeService), not here, so the policy has a single source of truth.
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required.')
    .max(PASSWORD_MAX_LENGTH),
  newPassword: z
    .string()
    .min(1, 'New password is required.')
    .max(PASSWORD_MAX_LENGTH),
});

export type ChangePasswordBody = z.infer<typeof changePasswordSchema>;
