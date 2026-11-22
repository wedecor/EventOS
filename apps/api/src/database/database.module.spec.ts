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
  moduleRef.get(REDIS_CLIENT);
  return redisInstances[0].args;
}

describe('DatabaseModule Redis client (M5-01 REDIS_URL)', () => {
  const baseOptions = { maxRetriesPerRequest: null, lazyConnect: true };

  it('connects with host/port/password by default', async () => {
    const args = await clientWith({
      REDIS_HOST: 'cache',
      REDIS_PORT: 6380,
      REDIS_PASSWORD: 'pw',
    });

    expect(args).toEqual([
      { host: 'cache', port: 6380, password: 'pw', ...baseOptions },
    ]);
  });

  it('connects with REDIS_URL when set, ignoring host/port/password', async () => {
    const args = await clientWith({
      REDIS_URL: 'redis://10.0.0.3:6379',
      REDIS_HOST: 'ignored',
      REDIS_PORT: 1,
      REDIS_PASSWORD: 'ignored',
    });

    expect(args).toEqual(['redis://10.0.0.3:6379', baseOptions]);
  });
});
