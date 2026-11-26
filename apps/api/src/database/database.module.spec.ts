import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import { REDIS_CLIENT } from './redis.constants';

const redisInstances: Array<{ args: unknown[] }> = [];

jest.mock('ioredis', () => ({
  __esModule: true,
  default: class FakeRedis {
    status = 'end';
    constructor(...args: unknown[]) {
      redisInstances.push({ args });
    }
  },
}));

async function clientWith(values: Record<string, unknown>) {
  redisInstances.length = 0;
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        ignoreEnvVars: true,
        load: [() => values],
      }),
      DatabaseModule,
    ],
  }).compile();
  return { client: moduleRef.get(REDIS_CLIENT), moduleRef };
}

describe('DatabaseModule Redis client (optional, REDIS_URL switch)', () => {
  const baseOptions = { maxRetriesPerRequest: null, lazyConnect: true };

  it('provides null and builds no connection when REDIS_URL is unset', async () => {
    const { client } = await clientWith({});

    expect(client).toBeNull();
    expect(redisInstances).toHaveLength(0);
  });

  it('ignores legacy REDIS_HOST / REDIS_PORT without REDIS_URL', async () => {
    const { client } = await clientWith({
      REDIS_HOST: 'cache',
      REDIS_PORT: 6380,
    });

    expect(client).toBeNull();
    expect(redisInstances).toHaveLength(0);
  });

  it('connects with REDIS_URL when set', async () => {
    const { client } = await clientWith({
      REDIS_URL: 'redis://10.0.0.3:6379',
    });

    expect(client).not.toBeNull();
    expect(redisInstances[0].args).toEqual([
      'redis://10.0.0.3:6379',
      baseOptions,
    ]);
  });

  it('applies REDIS_PASSWORD on top of REDIS_URL', async () => {
    await clientWith({
      REDIS_URL: 'redis://10.0.0.3:6379',
      REDIS_PASSWORD: 'pw',
    });

    expect(redisInstances[0].args).toEqual([
      'redis://10.0.0.3:6379',
      { ...baseOptions, password: 'pw' },
    ]);
  });

  it('closes cleanly without a Redis client', async () => {
    const { moduleRef } = await clientWith({});

    await expect(moduleRef.close()).resolves.toBeUndefined();
  });
});
