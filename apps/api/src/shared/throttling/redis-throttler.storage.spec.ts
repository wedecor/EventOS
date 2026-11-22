import type Redis from 'ioredis';
import { RedisThrottlerStorage } from './redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  function build(evalImpl: jest.Mock) {
    return new RedisThrottlerStorage({ eval: evalImpl } as unknown as Redis);
  }

  it('returns counts from the atomic script and prefixes keys', async () => {
    const evalMock = jest.fn().mockResolvedValue([3, 42_000]);
    const storage = build(evalMock);

    const record = await storage.increment('default:ip:1.1.1.1', 60_000, 5);

    expect(record).toEqual({
      totalHits: 3,
      timeToExpire: 42,
      isBlocked: false,
      timeToBlockExpire: 0,
    });
    expect(evalMock).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      'throttle:default:ip:1.1.1.1',
      '60000',
    );
  });

  it('blocks once hits exceed the limit', async () => {
    const storage = build(jest.fn().mockResolvedValue([6, 10_000]));

    const record = await storage.increment('k', 60_000, 5);

    expect(record.isBlocked).toBe(true);
    expect(record.timeToBlockExpire).toBe(10);
  });

  it('fails open when Redis errors', async () => {
    const storage = build(jest.fn().mockRejectedValue(new Error('redis down')));

    const record = await storage.increment('k', 60_000, 5);

    expect(record.isBlocked).toBe(false);
    expect(record.totalHits).toBe(0);
  });
});
