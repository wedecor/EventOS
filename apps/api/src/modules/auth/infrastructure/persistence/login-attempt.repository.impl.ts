import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../../database/redis.constants';
import { LoginAttemptRepository } from '../../domain/repositories/login-attempt.repository';

// All keys share this prefix so login brute-force state is easy to inspect and
// namespace-isolate in Redis. Storing this state in Redis (not memory) is what
// makes lockouts survive application restarts (R1-05 requirement).
const KEY_PREFIX = 'auth:login';

/**
 * Redis-backed {@link LoginAttemptRepository} (R1-05). Reuses the shared
 * ioredis client provided by the global `DatabaseModule` (`REDIS_CLIENT`) — no
 * new connection or infrastructure. Persistence-only: no policy logic here.
 */
@Injectable()
export class LoginAttemptRepositoryImpl extends LoginAttemptRepository {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    super();
  }

  async incrementFailures(
    tenantId: string,
    emailKey: string,
    windowSeconds: number,
  ): Promise<number> {
    const key = this.failuresKey(tenantId, emailKey);
    const count = await this.redis.incr(key);
    // Apply the window only when the counter is first created, so the window
    // runs from the first failure rather than sliding on every attempt.
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return count;
  }

  async clearFailures(tenantId: string, emailKey: string): Promise<void> {
    await this.redis.del(this.failuresKey(tenantId, emailKey));
  }

  async lock(
    tenantId: string,
    emailKey: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      this.lockKey(tenantId, emailKey),
      '1',
      'EX',
      ttlSeconds,
    );
  }

  async getLockTtlSeconds(
    tenantId: string,
    emailKey: string,
  ): Promise<number | null> {
    // ioredis TTL returns -2 (no key) or -1 (key without expiry); neither is an
    // active, time-bounded lockout, so both map to "not locked".
    const ttl = await this.redis.ttl(this.lockKey(tenantId, emailKey));
    return ttl > 0 ? ttl : null;
  }

  async clearLock(tenantId: string, emailKey: string): Promise<void> {
    await this.redis.del(this.lockKey(tenantId, emailKey));
  }

  async incrementLockoutLevel(
    tenantId: string,
    emailKey: string,
    ttlSeconds: number,
  ): Promise<number> {
    const key = this.levelKey(tenantId, emailKey);
    const level = await this.redis.incr(key);
    // Refresh the TTL on every escalation so the level decays only after a
    // sustained quiet period with no further lockouts.
    await this.redis.expire(key, ttlSeconds);
    return level;
  }

  async clearLockoutLevel(tenantId: string, emailKey: string): Promise<void> {
    await this.redis.del(this.levelKey(tenantId, emailKey));
  }

  private failuresKey(tenantId: string, emailKey: string): string {
    return `${KEY_PREFIX}:failures:${tenantId}:${emailKey}`;
  }

  private lockKey(tenantId: string, emailKey: string): string {
    return `${KEY_PREFIX}:lock:${tenantId}:${emailKey}`;
  }

  private levelKey(tenantId: string, emailKey: string): string {
    return `${KEY_PREFIX}:level:${tenantId}:${emailKey}`;
  }
}
