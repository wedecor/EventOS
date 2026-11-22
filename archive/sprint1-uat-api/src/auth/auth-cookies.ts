import type { CookieOptions, Response } from 'express';
import {
  DEFAULT_REFRESH_TOKEN_DAYS,
  REFRESH_COOKIE_NAME,
} from './auth.constants';

export function refreshCookieOptions(maxAgeMs: number): CookieOptions {
  const secure = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: maxAgeMs,
  };
}

export function setRefreshTokenCookie(
  response: Response,
  token: string,
  maxAgeMs: number = DEFAULT_REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
): void {
  response.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions(maxAgeMs));
}

export function clearRefreshTokenCookie(response: Response): void {
  response.clearCookie(REFRESH_COOKIE_NAME, {
    path: '/api/v1/auth',
  });
}
