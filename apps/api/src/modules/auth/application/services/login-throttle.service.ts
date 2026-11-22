import { Injectable } from '@nestjs/common';
import { LoginAttemptRepository } from '../../domain/repositories/login-attempt.repository';

/**
 * Login brute-force policy constants (docs/14 §Brute Force Protection:
 * "5 failed attempts per email per 15 minutes", "Lockout duration: 15 minutes
 * (progressive: 15m → 30m → 1h)"). These are the single source of truth for the
 * policy; the repository is unaware of them.
 */
export const MAX_FAILED_ATTEMPTS = 5;
export const FAILURE_WINDOW_SECONDS = 15 * 60; // 900

/**
 * Lockout duration per consecutive-lockout level. Index 0 is the first lockout;
 * the final entry applies to the third and every later consecutive lockout.
 */
export const LOCKOUT_DURATIONS_SECONDS: readonly number[] = [
  15 * 60, // 1st lockout → 15m
  30 * 60, // 2nd consecutive → 30m
  60 * 60, // 3rd and later → 60m
];

/**
 * TTL for the consecutive-lockout escalation level. Refreshed on each new
 * lockout; if a full window passes with no further lockouts, escalation decays
 * back to the first-lockout duration. (docs/14 does not specify a decay window;
 * this 24h default was confirmed with the product owner for R1-05.)
 */
export const LOCKOUT_LEVEL_TTL_SECONDS = 24 * 60 * 60; // 86400

export type ThrottleStatus = {
  locked: boolean;
  /** Seconds until the lockout expires; 0 when not locked. */
  retryAfterSeconds: number;
};

/**
 * Application-layer login brute-force protection (R1-05, docs/14 §Brute Force
 * Protection). Owns ALL policy decisions — thresholds, the rolling window,
 * progressive lockout durations, and when to escalate/reset — delegating only
 * raw storage to {@link LoginAttemptRepository}.
 *
 * Invoked exclusively from {@link AuthApplicationService.login}; no other
 * endpoint is throttled. Emails are normalized here so casing/whitespace
 * variations of the same address share one counter and cannot bypass the limit.
 */
@Injectable()
export class LoginThrottleService {
  constructor(private readonly attempts: LoginAttemptRepository) {}

  /** Current lockout status for an email, without recording anything. */
  async getStatus(tenantId: string, email: string): Promise<ThrottleStatus> {
    const emailKey = normalizeEmail(email);
    const ttl = await this.attempts.getLockTtlSeconds(tenantId, emailKey);
    return ttl !== null && ttl > 0
      ? { locked: true, retryAfterSeconds: ttl }
      : { locked: false, retryAfterSeconds: 0 };
  }

  /**
   * Record a failed login attempt. Once failures reach the limit within the
   * window, a progressive lockout is created and the failure counter is reset
   * so the next window starts clean. Returns whether the caller is now locked.
   */
  async registerFailure(
    tenantId: string,
    email: string,
  ): Promise<ThrottleStatus> {
    const emailKey = normalizeEmail(email);

    const failures = await this.attempts.incrementFailures(
      tenantId,
      emailKey,
      FAILURE_WINDOW_SECONDS,
    );
    if (failures < MAX_FAILED_ATTEMPTS) {
      return { locked: false, retryAfterSeconds: 0 };
    }

    const level = await this.attempts.incrementLockoutLevel(
      tenantId,
      emailKey,
      LOCKOUT_LEVEL_TTL_SECONDS,
    );
    const durationSeconds = lockoutDurationForLevel(level);
    await this.attempts.lock(tenantId, emailKey, durationSeconds);
    // The lockout now gates access; clear the window counter so re-attempts
    // after the lockout expires start a fresh window.
    await this.attempts.clearFailures(tenantId, emailKey);

    return { locked: true, retryAfterSeconds: durationSeconds };
  }

  /**
   * Reset all brute-force state after a successful login. Per R1-05 this clears
   * the failure counter AND the progressive-lockout escalation level, so a
   * proven-legitimate login returns future lockouts to the 15m starting point.
   */
  async reset(tenantId: string, email: string): Promise<void> {
    const emailKey = normalizeEmail(email);
    await this.attempts.clearFailures(tenantId, emailKey);
    await this.attempts.clearLock(tenantId, emailKey);
    await this.attempts.clearLockoutLevel(tenantId, emailKey);
  }
}

/** Level is 1-based; the last duration applies to every level beyond it. */
function lockoutDurationForLevel(level: number): number {
  const index = Math.min(level, LOCKOUT_DURATIONS_SECONDS.length) - 1;
  return LOCKOUT_DURATIONS_SECONDS[Math.max(index, 0)];
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
