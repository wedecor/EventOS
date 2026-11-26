import type Redis from 'ioredis';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { buildThrottlerOptions } from './throttling.module';

describe('buildThrottlerOptions', () => {
  it('omits custom storage (Nest in-memory default) when Redis is null', () => {
    const options = buildThrottlerOptions(null);

    expect(options).not.toHaveProperty('storage');
    expect(options).toHaveProperty('throttlers');
  });

  it('uses RedisThrottlerStorage when a Redis client is provided', () => {
    const options = buildThrottlerOptions({} as unknown as Redis);

    expect(options.storage).toBeInstanceOf(RedisThrottlerStorage);
  });

  it('keeps the default and enquiriesFeed throttlers in both modes', () => {
    for (const redis of [null, {} as unknown as Redis]) {
      const { throttlers } = buildThrottlerOptions(redis) as {
        throttlers: Array<{ name: string }>;
      };
      expect(throttlers.map((t) => t.name)).toEqual([
        'default',
        'enquiriesFeed',
      ]);
    }
  });
});
