// Auth Module domain layer (docs/14 §Brute Force Protection).
//
// R1-05 persistence port for login brute-force protection. Three independent
// pieces of per-email state back the progressive-lockout policy:
//   - failures: rolling count of failed attempts inside a fixed time window;
//   - lock:     presence + remaining TTL of an active lockout;
//   - level:    the consecutive-lockout escalation counter (selects 15m/30m/60m).
//
// This is a PERSISTENCE-ONLY port: every method is a dumb storage primitive.
// All policy decisions (thresholds, window length, lockout durations, when to
// escalate/reset) live in the application layer (`LoginThrottleService`), which
// passes the relevant TTL/window values in as arguments. Implementations must
// survive application restarts (Redis), per the R1-05 requirement.
//
// `emailKey` is already normalized by the caller (the application service); the
// repository treats it as an opaque key segment and does not re-normalize.
export abstract class LoginAttemptRepository {
  /**
   * Atomically increment the failure counter and return the new value. The
   * expiry window is (re)applied only when the counter is first created, giving
   * a fixed window that starts at the first failure.
   */
  abstract incrementFailures(
    tenantId: string,
    emailKey: string,
    windowSeconds: number,
  ): Promise<number>;

  abstract clearFailures(tenantId: string, emailKey: string): Promise<void>;

  /** Set (or overwrite) an active lockout that auto-expires after `ttlSeconds`. */
  abstract lock(
    tenantId: string,
    emailKey: string,
    ttlSeconds: number,
  ): Promise<void>;

  /**
   * Remaining lockout in seconds, or `null` when there is no active lockout.
   */
  abstract getLockTtlSeconds(
    tenantId: string,
    emailKey: string,
  ): Promise<number | null>;

  abstract clearLock(tenantId: string, emailKey: string): Promise<void>;

  /**
   * Atomically increment the consecutive-lockout escalation level and return
   * the new value, refreshing its TTL so the level decays after a quiet period.
   */
  abstract incrementLockoutLevel(
    tenantId: string,
    emailKey: string,
    ttlSeconds: number,
  ): Promise<number>;

  abstract clearLockoutLevel(tenantId: string, emailKey: string): Promise<void>;
}
