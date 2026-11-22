import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { EnvConfig } from '../../../../config/env.schema';
import { REDIS_CLIENT } from '../../../../database/redis.constants';

export type AiThrottleDecision = {
  allowed: boolean;
  /** Seconds until the current window resets; 0 when allowed. */
  retryAfterSeconds: number;
  scope?: 'user' | 'tenant';
};

/**
 * Redis-backed AI usage throttle (M4 market readiness).
 * Caps Lead Intelligence (and future AI features) per user and per tenant
 * over a fixed hour window to limit cost abuse without blocking core EventOS.
 *
 * Fail-open on Redis errors so login/booking workflows stay available if Redis
 * is degraded; operators still see a warning log.
 */
@Injectable()
export class AiUsageThrottleService {
  private readonly logger = new Logger(AiUsageThrottleService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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

  private async incrementWindow(
    key: string,
    windowSeconds: number,
  ): Promise<{ count: number; ttlSeconds: number }> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    const ttl = await this.redis.ttl(key);
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
