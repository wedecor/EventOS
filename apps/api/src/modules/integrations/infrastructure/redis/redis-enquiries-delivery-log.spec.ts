import type Redis from 'ioredis';
import { RedisEnquiriesDeliveryLog } from './redis-enquiries-delivery-log';

function build(overrides: Record<string, unknown> = {}) {
  const pipeline: Record<string, jest.Mock> = {};
  for (const method of [
    'zadd',
    'zremrangebyscore',
    'zremrangebyrank',
    'set',
    'lpush',
    'ltrim',
  ]) {
    pipeline[method] = jest.fn().mockReturnValue(pipeline);
  }
  pipeline.exec = jest.fn().mockResolvedValue([]);

  const redis = {
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn(),
    zrangebyscore: jest.fn().mockResolvedValue([]),
    lrange: jest.fn().mockResolvedValue([]),
    multi: jest.fn().mockReturnValue(pipeline),
    ...overrides,
  };
  return {
    redis,
    pipeline,
    log: new RedisEnquiriesDeliveryLog(redis as unknown as Redis),
  };
}

describe('RedisEnquiriesDeliveryLog (M5-01)', () => {
  it('claims a delivery id for 24 h with SET NX', async () => {
    const { log, redis } = build();

    await expect(log.claim('d-1')).resolves.toBe(true);
    expect(redis.set).toHaveBeenCalledWith(
      'enquiries:feed:delivery:d-1',
      '1',
      'EX',
      86_400,
      'NX',
    );
  });

  it('reports a duplicate when the id was already claimed', async () => {
    const { log } = build({ set: jest.fn().mockResolvedValue(null) });

    await expect(log.claim('d-1')).resolves.toBe(false);
  });

  it('fails open when Redis is unavailable (ordering keeps processing idempotent)', async () => {
    const { log } = build({
      set: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      del: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    });

    await expect(log.claim('d-1')).resolves.toBe(true);
    await expect(log.release('d-1')).resolves.toBeUndefined();
  });

  it('releases a claim by deleting the key', async () => {
    const { log, redis } = build();

    await log.release('d-1');

    expect(redis.del).toHaveBeenCalledWith('enquiries:feed:delivery:d-1');
  });

  it('records outcomes and keeps a capped error list only for failures', async () => {
    const { log, pipeline } = build();
    const at = new Date('2026-11-23T10:00:00Z');

    await log.record({
      at,
      deliveryId: 'd1',
      enquiryId: 'e1',
      outcome: 'processed',
    });
    expect(pipeline.lpush).not.toHaveBeenCalled();

    await log.record({
      at,
      deliveryId: 'd2',
      enquiryId: 'e2',
      outcome: 'failed',
      detail: 'boom',
    });
    expect(pipeline.lpush).toHaveBeenCalledTimes(1);
    expect(pipeline.ltrim).toHaveBeenCalledWith('enquiries:feed:errors', 0, 19);
    expect(pipeline.set).toHaveBeenCalledWith(
      'enquiries:feed:last',
      String(at.getTime()),
    );
  });

  it('never throws from record() when Redis is down', async () => {
    const { log, pipeline } = build();
    pipeline.exec.mockRejectedValue(new Error('down'));

    await expect(
      log.record({
        at: new Date(),
        deliveryId: 'd',
        enquiryId: 'e',
        outcome: 'processed',
      }),
    ).resolves.toBeUndefined();
  });

  it('summarises counts, last delivery and recent errors', async () => {
    const at = Date.parse('2026-11-23T10:00:00Z');
    const entry = (outcome: string, detail?: string) =>
      JSON.stringify({ at, deliveryId: 'd', enquiryId: 'e', outcome, detail });
    const { log } = build({
      get: jest.fn().mockResolvedValue(String(at)),
      zrangebyscore: jest
        .fn()
        .mockResolvedValue([
          entry('processed'),
          entry('processed'),
          entry('stale'),
          entry('failed', 'boom'),
          'not-json',
        ]),
      lrange: jest.fn().mockResolvedValue([entry('failed', 'boom')]),
    });

    const summary = await log.summarize(20);

    expect(summary.last24h).toEqual({
      processed: 2,
      stale: 1,
      ignored: 0,
      failed: 1,
    });
    expect(summary.lastDeliveryAt).toEqual(new Date(at));
    expect(summary.recentErrors).toEqual([
      { at: new Date(at), deliveryId: 'd', enquiryId: 'e', message: 'boom' },
    ]);
  });

  it('returns an empty summary when Redis is unavailable', async () => {
    const { log } = build({
      get: jest.fn().mockRejectedValue(new Error('down')),
    });

    await expect(log.summarize(20)).resolves.toEqual({
      lastDeliveryAt: null,
      last24h: { processed: 0, stale: 0, ignored: 0, failed: 0 },
      recentErrors: [],
    });
  });
});
