import { Module, type ExecutionContext } from '@nestjs/common';
import {
  ThrottlerModule,
  type ThrottlerModuleOptions,
} from '@nestjs/throttler';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.constants';
import {
  RATE_LIMIT_AUTHENTICATED_PER_MINUTE,
  RATE_LIMIT_ENQUIRIES_FEED_PER_MINUTE,
  RATE_LIMIT_UNAUTHENTICATED_PER_MINUTE,
  RATE_LIMIT_WINDOW_MS,
} from './rate-limits';
import { RedisThrottlerStorage } from './redis-throttler.storage';

/** Nest throttler metadata key prefix for `@Throttle({ name: limit })`. */
const THROTTLER_LIMIT = 'THROTTLER:LIMIT';

function resolveDefaultLimit(context: ExecutionContext): number {
  const request = context.switchToHttp().getRequest<{
    user?: { userId?: string };
  }>();
  return request.user?.userId
    ? RATE_LIMIT_AUTHENTICATED_PER_MINUTE
    : RATE_LIMIT_UNAUTHENTICATED_PER_MINUTE;
}

/** Only routes that opt in with `@Throttle({ enquiriesFeed: … })` use this budget. */
function skipEnquiriesFeedUnlessOptedIn(context: ExecutionContext): boolean {
  const key = `${THROTTLER_LIMIT}enquiriesFeed`;
  const onHandler: unknown = Reflect.getMetadata(key, context.getHandler());
  const onClass: unknown = Reflect.getMetadata(key, context.getClass());
  return onHandler === undefined && onClass === undefined;
}

/**
 * Redis present → shared {@link RedisThrottlerStorage}. Redis absent → no custom
 * storage, so Nest's default in-memory ThrottlerStorage is used (per instance;
 * Cloud Run must run maxScale=1 and counters reset on cold start).
 */
export function buildThrottlerOptions(
  redis: Redis | null,
): ThrottlerModuleOptions {
  return {
    ...(redis ? { storage: new RedisThrottlerStorage(redis) } : {}),
    throttlers: [
      {
        name: 'default',
        ttl: RATE_LIMIT_WINDOW_MS,
        limit: resolveDefaultLimit,
      },
      {
        name: 'enquiriesFeed',
        ttl: RATE_LIMIT_WINDOW_MS,
        limit: RATE_LIMIT_ENQUIRIES_FEED_PER_MINUTE,
        skipIf: skipEnquiriesFeedUnlessOptedIn,
      },
    ],
  };
}

/**
 * Wires `@nestjs/throttler` to Redis when configured (global REDIS_CLIENT from
 * DatabaseModule), otherwise to the in-memory default.
 * The guard itself is registered as APP_GUARD in AppModule, after the JWT and
 * permissions guards, so it can key authenticated traffic by user id.
 *
 * `enquiriesFeed` applies only where `@Throttle({ enquiriesFeed })` is set (the
 * HMAC sync route skips `default` and keeps this named limit alone).
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis | null) => buildThrottlerOptions(redis),
    }),
  ],
  exports: [ThrottlerModule],
})
export class ThrottlingModule {}
