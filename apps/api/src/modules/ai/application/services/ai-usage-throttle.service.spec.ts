import { AiUsageThrottleService } from './ai-usage-throttle.service';

describe('AiUsageThrottleService', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const userId = 'user-1';
  const feature = 'lead_intelligence';

  function build(opts: {
    userLimit?: number;
    tenantLimit?: number;
    windowSeconds?: number;
    incr?: jest.Mock;
    expire?: jest.Mock;
    ttl?: jest.Mock;
  }) {
    const redis = {
      incr: opts.incr ?? jest.fn().mockResolvedValue(1),
      expire: opts.expire ?? jest.fn().mockResolvedValue(1),
      ttl: opts.ttl ?? jest.fn().mockResolvedValue(3600),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_RATE_LIMIT_PER_USER_PER_HOUR') {
          return opts.userLimit ?? 30;
        }
        if (key === 'AI_RATE_LIMIT_PER_TENANT_PER_HOUR') {
          return opts.tenantLimit ?? 200;
        }
        if (key === 'AI_RATE_LIMIT_WINDOW_SECONDS') {
          return opts.windowSeconds ?? 3600;
        }
        return undefined;
      }),
    };
    const service = new AiUsageThrottleService(redis as never, config as never);
    return { service, redis };
  }

  it('allows requests under both limits', async () => {
    const { service, redis } = build({
      incr: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2),
    });
    const decision = await service.consume(tenantId, userId, feature);
    expect(decision.allowed).toBe(true);
    expect(redis.incr).toHaveBeenCalledTimes(2);
  });

  it('blocks when the per-user limit is exceeded', async () => {
    const { service } = build({
      userLimit: 5,
      incr: jest.fn().mockResolvedValue(6),
      ttl: jest.fn().mockResolvedValue(1200),
    });
    const decision = await service.consume(tenantId, userId, feature);
    expect(decision).toEqual({
      allowed: false,
      retryAfterSeconds: 1200,
      scope: 'user',
    });
  });

  it('blocks when the per-tenant limit is exceeded', async () => {
    const { service } = build({
      userLimit: 100,
      tenantLimit: 10,
      incr: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(11),
      ttl: jest.fn().mockResolvedValue(900),
    });
    const decision = await service.consume(tenantId, userId, feature);
    expect(decision).toEqual({
      allowed: false,
      retryAfterSeconds: 900,
      scope: 'tenant',
    });
  });

  it('skips Redis when limits are disabled (0)', async () => {
    const { service, redis } = build({ userLimit: 0, tenantLimit: 0 });
    const decision = await service.consume(tenantId, userId, feature);
    expect(decision.allowed).toBe(true);
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('fails open when Redis errors', async () => {
    const { service } = build({
      incr: jest.fn().mockRejectedValue(new Error('redis down')),
    });
    const decision = await service.consume(tenantId, userId, feature);
    expect(decision.allowed).toBe(true);
  });

  describe('in-memory (no Redis)', () => {
    function buildMemory(userLimit: number, tenantLimit = 200) {
      const config = {
        get: jest.fn((key: string) =>
          key === 'AI_RATE_LIMIT_PER_USER_PER_HOUR'
            ? userLimit
            : key === 'AI_RATE_LIMIT_PER_TENANT_PER_HOUR'
              ? tenantLimit
              : 3600,
        ),
      };
      return new AiUsageThrottleService(null, config as never);
    }

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('blocks the per-user limit and reports time until the window resets', async () => {
      const service = buildMemory(2);
      expect((await service.consume(tenantId, userId, feature)).allowed).toBe(
        true,
      );
      expect((await service.consume(tenantId, userId, feature)).allowed).toBe(
        true,
      );
      jest.advanceTimersByTime(600_000);

      expect(await service.consume(tenantId, userId, feature)).toEqual({
        allowed: false,
        retryAfterSeconds: 3000,
        scope: 'user',
      });
    });

    it('starts a fresh window after expiry', async () => {
      const service = buildMemory(1);
      await service.consume(tenantId, userId, feature);
      expect((await service.consume(tenantId, userId, feature)).allowed).toBe(
        false,
      );

      jest.advanceTimersByTime(3_601_000);

      expect((await service.consume(tenantId, userId, feature)).allowed).toBe(
        true,
      );
    });

    it('enforces the per-tenant limit across users', async () => {
      const service = buildMemory(100, 2);
      await service.consume(tenantId, 'user-a', feature);
      await service.consume(tenantId, 'user-b', feature);

      const decision = await service.consume(tenantId, 'user-c', feature);

      expect(decision).toMatchObject({ allowed: false, scope: 'tenant' });
    });
  });
});
