import { describe, expect, it } from 'vitest';
import {
  parseAuthSessionPayload,
  parseAuthSuccessEnvelope,
  loginFormSchema,
  changePasswordFormSchema,
} from '@/features/auth/schemas/auth.schemas';

const validSession = {
  accessToken: 'jwt.access.token',
  expiresIn: 900,
  user: {
    id: 'user-1',
    email: 'owner@wedecor.com',
    name: 'Owner',
    role: 'owner',
  },
};

describe('auth session Zod schemas', () => {
  it('parses a valid login/refresh data payload', () => {
    expect(parseAuthSessionPayload(validSession)).toEqual(validSession);
  });

  it('parses a valid success envelope', () => {
    expect(parseAuthSuccessEnvelope({ data: validSession })).toEqual(validSession);
  });

  it('rejects missing accessToken (login failure shape)', () => {
    expect(() =>
      parseAuthSuccessEnvelope({
        data: { expiresIn: 900, user: validSession.user },
      }),
    ).toThrow();
  });

  it('rejects invalid envelope', () => {
    expect(() => parseAuthSuccessEnvelope({ error: 'nope' })).toThrow();
  });

  it('validates login form values against OpenAPI-aligned limits', () => {
    expect(loginFormSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginFormSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
    expect(loginFormSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });

  it('validates change-password form confirm match', () => {
    expect(
      changePasswordFormSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'new-pass',
        confirmPassword: 'new-pass',
      }).success,
    ).toBe(true);
    expect(
      changePasswordFormSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'new-pass',
        confirmPassword: 'other',
      }).success,
    ).toBe(false);
  });
});
