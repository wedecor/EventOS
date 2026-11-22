/** Dev-only fallback when JWT_SECRET is not set (never use in production). */
export const DEV_JWT_SECRET = 'dev-only-jwt-secret-min-32-characters-long!!';

export const DEFAULT_JWT_EXPIRES_IN = '15m';

export const REFRESH_COOKIE_NAME = 'refresh_token';

export const DEFAULT_REFRESH_TOKEN_DAYS = 7;
