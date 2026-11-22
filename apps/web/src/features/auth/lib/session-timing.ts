/**
 * Proactive silent refresh scheduling.
 * Access token TTL is 15m (backend TokenService). Refresh skew keeps requests authenticated.
 */
export const ACCESS_TOKEN_REFRESH_SKEW_MS = 60_000;

export function computeSilentRefreshDelayMs(
  expiresAt: number,
  now = Date.now(),
  skewMs = ACCESS_TOKEN_REFRESH_SKEW_MS,
): number {
  return Math.max(0, expiresAt - skewMs - now);
}

export function isAccessTokenExpired(expiresAt: number | null, now = Date.now()): boolean {
  if (expiresAt === null) return true;
  return now >= expiresAt;
}
