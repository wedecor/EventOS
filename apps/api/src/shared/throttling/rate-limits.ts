/**
 * M5-01 — rate-limit policy (docs/14 §Rate Limiting; ADR-019 hardening).
 * All windows are 60 s. TTLs are expressed in milliseconds (@nestjs/throttler v6).
 */
export const RATE_LIMIT_WINDOW_MS = 60_000;
/** Authenticated requests are keyed by user id. */
export const RATE_LIMIT_AUTHENTICATED_PER_MINUTE = 120;
/** Unauthenticated requests are keyed by client IP. */
export const RATE_LIMIT_UNAUTHENTICATED_PER_MINUTE = 30;
/** `POST /auth/firebase/exchange` — per IP. */
export const RATE_LIMIT_FIREBASE_EXCHANGE_PER_MINUTE = 10;
/** `POST /integrations/enquiries/sync` — per IP (the sender's egress). */
export const RATE_LIMIT_ENQUIRIES_FEED_PER_MINUTE = 120;
