import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import type { EnvConfig } from '../../../../config/env.schema';
import { REDIS_CLIENT } from '../../../../database/redis.constants';

export type AiThrottleDecision = {
  allowed: boolean;
  /** Seconds until the current window resets; 0 when allowed. */
  retryAfterSeconds: number;
  scope?: 'user' | 'tenant';
};

/**
 * AI usage throttle (M4 market readiness). Redis-backed when REDIS_URL is set,
 * otherwise an in-memory fixed-window counter (per instance; resets on cold
 * start — Cloud Run must run maxScale=1).
 * Caps Lead Intelligence (and future AI features) per user and per tenant
 * over a fixed hour window to limit cost abuse without blocking core EventOS.
 *
 * Fail-open on Redis errors so login/booking workflows stay available if Redis
 * is degraded; operators still see a warning log.
 */
@Injectable()
export class AiUsageThrottleService {
  private readonly logger = new Logger(AiUsageThrottleService.name);

  private readonly windows = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async consume(
    tenantId: string,
    userId: string,
    feature: string,
  ): Promise<AiThrottleDecision> {
    const userLimit = this.config.get('AI_RATE_LIMIT_PER_USER_PER_HOUR', {
      infer: true,
    });
    const tenantLimit = this.config.get('AI_RATE_LIMIT_PER_TENANT_PER_HOUR', {
      infer: true,
    });
    const windowSeconds = this.config.get('AI_RATE_LIMIT_WINDOW_SECONDS', {
      infer: true,
    });

    if (userLimit <= 0 && tenantLimit <= 0) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    try {
      if (userLimit > 0) {
        const user = await this.incrementWindow(
          this.userKey(tenantId, userId, feature),
          windowSeconds,
        );
        if (user.count > userLimit) {
          return {
            allowed: false,
            retryAfterSeconds: user.ttlSeconds,
            scope: 'user',
          };
        }
      }

      if (tenantLimit > 0) {
        const tenant = await this.incrementWindow(
          this.tenantKey(tenantId, feature),
          windowSeconds,
        );
        if (tenant.count > tenantLimit) {
          return {
            allowed: false,
            retryAfterSeconds: tenant.ttlSeconds,
            scope: 'tenant',
          };
        }
      }

      return { allowed: true, retryAfterSeconds: 0 };
    } catch (error: unknown) {
      this.logger.warn(
        `AI rate-limit check failed (fail-open): ${String(error)}`,
      );
      return { allowed: true, retryAfterSeconds: 0 };
    }
  }

  private incrementWindow(
    key: string,
    windowSeconds: number,
  ): Promise<{ count: number; ttlSeconds: number }> {
    return this.redis
      ? this.incrementRedisWindow(this.redis, key, windowSeconds)
      : Promise.resolve(this.incrementMemoryWindow(key, windowSeconds));
  }

  /** Fixed window from the first hit, same semantics as the Redis path. */
  private incrementMemoryWindow(
    key: string,
    windowSeconds: number,
  ): { count: number; ttlSeconds: number } {
    const now = Date.now();
    for (const [k, w] of this.windows) {
      if (w.expiresAt <= now) this.windows.delete(k);
    }
    const window = this.windows.get(key) ?? {
      count: 0,
      expiresAt: now + windowSeconds * 1000,
    };
    window.count += 1;
    this.windows.set(key, window);
    return {
      count: window.count,
      ttlSeconds: Math.max(1, Math.ceil((window.expiresAt - now) / 1000)),
    };
  }

  private async incrementRedisWindow(
    redis: Redis,
    key: string,
    windowSeconds: number,
  ): Promise<{ count: number; ttlSeconds: number }> {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    const ttl = await redis.ttl(key);
    return {
      count,
      ttlSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  }

  private userKey(tenantId: string, userId: string, feature: string): string {
    return `ai:rl:user:${tenantId}:${userId}:${feature}`;
  }

  private tenantKey(tenantId: string, feature: string): string {
    return `ai:rl:tenant:${tenantId}:${feature}`;
  }
}
