import { Module, type ExecutionContext } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.constants';
import {
  RATE_LIMIT_AUTHENTICATED_PER_MINUTE,
  RATE_LIMIT_UNAUTHENTICATED_PER_MINUTE,
  RATE_LIMIT_WINDOW_MS,
} from './rate-limits';
import { RedisThrottlerStorage } from './redis-throttler.storage';

function resolveDefaultLimit(context: ExecutionContext): number {
  const request = context.switchToHttp().getRequest<{
    user?: { userId?: string };
  }>();
  return request.user?.userId
    ? RATE_LIMIT_AUTHENTICATED_PER_MINUTE
    : RATE_LIMIT_UNAUTHENTICATED_PER_MINUTE;
}

/**
 * Wires `@nestjs/throttler` to Redis (global REDIS_CLIENT from DatabaseModule).
 * The guard itself is registered as APP_GUARD in AppModule, after the JWT and
 * permissions guards, so it can key authenticated traffic by user id.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        storage: new RedisThrottlerStorage(redis),
        throttlers: [
          {
            name: 'default',
            ttl: RATE_LIMIT_WINDOW_MS,
            limit: resolveDefaultLimit,
          },
        ],
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class ThrottlingModule {}
