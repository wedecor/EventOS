import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { Throttle, type ThrottlerStorage } from '@nestjs/throttler';
import { AppThrottlerGuard } from './app-throttler.guard';
import {
  RATE_LIMIT_AUTHENTICATED_PER_MINUTE,
  RATE_LIMIT_FIREBASE_EXCHANGE_PER_MINUTE,
  RATE_LIMIT_UNAUTHENTICATED_PER_MINUTE,
  RATE_LIMIT_WINDOW_MS,
} from './rate-limits';

class InMemoryStorage implements ThrottlerStorage {
  readonly counts = new Map<string, number>();

  increment(key: string, _ttl: number, limit: number) {
    const totalHits = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, totalHits);
    const isBlocked = totalHits > limit;
    return Promise.resolve({
      totalHits,
      timeToExpire: 30,
      isBlocked,
      timeToBlockExpire: isBlocked ? 30 : 0,
    });
  }
}

class DummyController {
  plain() {
    return 'ok';
  }

  @Throttle({
    default: {
      limit: RATE_LIMIT_FIREBASE_EXCHANGE_PER_MINUTE,
      ttl: RATE_LIMIT_WINDOW_MS,
    },
  })
  exchange() {
    return 'ok';
  }
}

function buildContext(
  handler: () => unknown,
  req: Record<string, unknown>,
): ExecutionContext {
  const res = { header: jest.fn() };
  return {
    getClass: () => DummyController,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;
}

describe('AppThrottlerGuard (M5-01)', () => {
  let storage: InMemoryStorage;
  let guard: AppThrottlerGuard;

  beforeEach(async () => {
    storage = new InMemoryStorage();
    guard = new AppThrottlerGuard(
      {
        storage,
        throttlers: [
          {
            name: 'default',
            ttl: RATE_LIMIT_WINDOW_MS,
            limit: (context: ExecutionContext) =>
              context.switchToHttp().getRequest<{ user?: unknown }>().user
                ? RATE_LIMIT_AUTHENTICATED_PER_MINUTE
                : RATE_LIMIT_UNAUTHENTICATED_PER_MINUTE,
          },
        ],
      },
      storage,
      new Reflector(),
    );
    await guard.onModuleInit();
  });

  it('allows 30 unauthenticated requests per IP then answers 429 RATE_LIMITED', async () => {
    const ctx = () =>
      buildContext(DummyController.prototype.plain, { ip: '203.0.113.1' });

    for (let i = 0; i < RATE_LIMIT_UNAUTHENTICATED_PER_MINUTE; i += 1) {
      await expect(guard.canActivate(ctx())).resolves.toBe(true);
    }
    await expect(guard.canActivate(ctx())).rejects.toMatchObject({
      status: 429,
      response: expect.objectContaining({ code: 'RATE_LIMITED' }),
    });
  });

  it('keys authenticated traffic by user id with the 120/min limit, independent of IP', async () => {
    const ctx = (ip: string) =>
      buildContext(DummyController.prototype.plain, {
        ip,
        user: { userId: 'user-1' },
      });

    for (let i = 0; i < RATE_LIMIT_AUTHENTICATED_PER_MINUTE; i += 1) {
      await expect(guard.canActivate(ctx(`10.0.0.${i % 250}`))).resolves.toBe(
        true,
      );
    }
    await expect(guard.canActivate(ctx('10.9.9.9'))).rejects.toMatchObject({
      status: 429,
    });
    expect([...storage.counts.keys()]).toEqual(['default:user:user-1']);
  });

  it('shares the default counter across routes but gives overridden routes their own', async () => {
    const req = { ip: '203.0.113.2' };

    await guard.canActivate(buildContext(DummyController.prototype.plain, req));
    await guard.canActivate(
      buildContext(DummyController.prototype.exchange, req),
    );

    const keys = [...storage.counts.keys()].sort();
    expect(keys).toHaveLength(2);
    expect(keys).toContain('default:ip:203.0.113.2');
  });

  it('limits the Firebase exchange route to 10 per minute per IP', async () => {
    const ctx = () =>
      buildContext(DummyController.prototype.exchange, {
        ip: '203.0.113.3',
      });

    for (let i = 0; i < RATE_LIMIT_FIREBASE_EXCHANGE_PER_MINUTE; i += 1) {
      await expect(guard.canActivate(ctx())).resolves.toBe(true);
    }
    await expect(guard.canActivate(ctx())).rejects.toMatchObject({
      status: 429,
      response: expect.objectContaining({
        code: 'RATE_LIMITED',
        details: { retryAfterSeconds: 30 },
      }),
    });
  });
});
