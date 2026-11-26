import { Injectable } from '@nestjs/common';
import { LoginAttemptRepository } from '../../domain/repositories/login-attempt.repository';

type Entry = { value: number; expiresAt: number };

/**
 * In-memory {@link LoginAttemptRepository} used when Redis is not configured.
 * Same semantics/TTLs as the Redis implementation (fixed failure window from
 * the first failure; lock = SET with TTL; lockout level = INCR + TTL refresh).
 *
 * State is per process and lost on restart/cold start, so Cloud Run must run
 * with maxScale=1. Expired entries are purged lazily on read/write.
 */
@Injectable()
export class InMemoryLoginAttemptRepository extends LoginAttemptRepository {
  private readonly failures = new Map<string, Entry>();
  private readonly locks = new Map<string, Entry>();
  private readonly levels = new Map<string, Entry>();

  incrementFailures(
    tenantId: string,
    emailKey: string,
    windowSeconds: number,
  ): Promise<number> {
    const key = this.key(tenantId, emailKey);
    const existing = this.read(this.failures, key);
    if (!existing) {
      // Window runs from the first failure and does not slide on later ones.
      this.failures.set(key, {
        value: 1,
        expiresAt: Date.now() + windowSeconds * 1000,
      });
      return Promise.resolve(1);
    }
    existing.value += 1;
    return Promise.resolve(existing.value);
  }

  clearFailures(tenantId: string, emailKey: string): Promise<void> {
    this.failures.delete(this.key(tenantId, emailKey));
    return Promise.resolve();
  }

  lock(tenantId: string, emailKey: string, ttlSeconds: number): Promise<void> {
    this.locks.set(this.key(tenantId, emailKey), {
      value: 1,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return Promise.resolve();
  }

  getLockTtlSeconds(
    tenantId: string,
    emailKey: string,
  ): Promise<number | null> {
    const entry = this.read(this.locks, this.key(tenantId, emailKey));
    if (!entry) {
      return Promise.resolve(null);
    }
    // Round up like Redis TTL so an active lock never reports 0 seconds.
    return Promise.resolve(
      Math.max(1, Math.ceil((entry.expiresAt - Date.now()) / 1000)),
    );
  }

  clearLock(tenantId: string, emailKey: string): Promise<void> {
    this.locks.delete(this.key(tenantId, emailKey));
    return Promise.resolve();
  }

  incrementLockoutLevel(
    tenantId: string,
    emailKey: string,
    ttlSeconds: number,
  ): Promise<number> {
    const key = this.key(tenantId, emailKey);
    const level = (this.read(this.levels, key)?.value ?? 0) + 1;
    // TTL is refreshed on every escalation (decays after a quiet period).
    this.levels.set(key, {
      value: level,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return Promise.resolve(level);
  }

  clearLockoutLevel(tenantId: string, emailKey: string): Promise<void> {
    this.levels.delete(this.key(tenantId, emailKey));
    return Promise.resolve();
  }

  /** Returns a live entry, deleting it (and sweeping the map) if expired. */
  private read(store: Map<string, Entry>, key: string): Entry | undefined {
    const now = Date.now();
    for (const [k, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(k);
      }
    }
    return store.get(key);
  }

  private key(tenantId: string, emailKey: string): string {
    return `${tenantId}:${emailKey}`;
  }
}
