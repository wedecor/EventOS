import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.constants';

// Atomic fixed-window counter: INCR + PEXPIRE on first hit, returns {hits, pttl}.
const INCREMENT_SCRIPT = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local pttl = redis.call('PTTL', KEYS[1])
if pttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  pttl = tonumber(ARGV[1])
end
return {hits, pttl}
`;

const KEY_PREFIX = 'throttle:';

type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage['increment']>
>;

/**
 * Redis-backed {@link ThrottlerStorage} so limits hold across Cloud Run
 * instances. A request is blocked once `totalHits > limit` inside the window.
 * Fails OPEN when Redis is unavailable (availability over strictness; the login
 * brute-force lockout and HMAC verification are independent controls).
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
  ): Promise<ThrottlerStorageRecord> {
    try {
      const result = (await this.redis.eval(
        INCREMENT_SCRIPT,
        1,
        `${KEY_PREFIX}${key}`,
        String(ttl),
      )) as [number, number];
      const totalHits = Number(result[0]);
      const timeToExpire = Math.max(1, Math.ceil(Number(result[1]) / 1000));
      const isBlocked = totalHits > limit;
      return {
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire: isBlocked ? timeToExpire : 0,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Throttler storage unavailable; failing open: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
