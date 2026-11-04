import type Redis from 'ioredis';
import { LoginAttemptRepositoryImpl } from './login-attempt.repository.impl';

/**
 * R1-05 — verifies the Redis persistence primitives use the correct, namespaced
 * keys and TTL semantics. The ioredis client is mocked; these tests guard the
 * key layout and the window/expiry behavior the throttle policy relies on.
 */
describe('LoginAttemptRepositoryImpl (R1-05)', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const emailKey = 'user@wedecor.test';
  let redis: jest.Mocked<Redis>;
  let repository: LoginAttemptRepositoryImpl;

  beforeEach(() => {
    redis = {
      incr: jest.fn(),
      expire: jest.fn(),
      set: jest.fn(),
      ttl: jest.fn(),
      del: jest.fn(),
    } as unknown as jest.Mocked<Redis>;
    repository = new LoginAttemptRepositoryImpl(redis);
  });

  describe('incrementFailures', () => {
    it('applies the window TTL only on the first failure', async () => {
      redis.incr.mockResolvedValue(1);

      const count = await repository.incrementFailures(tenantId, emailKey, 900);

      expect(count).toBe(1);
      expect(redis.incr).toHaveBeenCalledWith(
        `auth:login:failures:${tenantId}:${emailKey}`,
      );
      expect(redis.expire).toHaveBeenCalledWith(
        `auth:login:failures:${tenantId}:${emailKey}`,
        900,
      );
    });

    it('does not reset the window TTL on subsequent failures', async () => {
      redis.incr.mockResolvedValue(3);

      const count = await repository.incrementFailures(tenantId, emailKey, 900);

      expect(count).toBe(3);
      expect(redis.expire).not.toHaveBeenCalled();
    });
  });

  describe('lock / getLockTtlSeconds', () => {
    it('sets the lock key with an EX expiry', async () => {
      await repository.lock(tenantId, emailKey, 1800);

      expect(redis.set).toHaveBeenCalledWith(
        `auth:login:lock:${tenantId}:${emailKey}`,
        '1',
        'EX',
        1800,
      );
    });

    it('returns the remaining seconds when a lockout is active', async () => {
      redis.ttl.mockResolvedValue(1234);

      const ttl = await repository.getLockTtlSeconds(tenantId, emailKey);

      expect(ttl).toBe(1234);
    });

    it('maps missing key (-2) to null', async () => {
      redis.ttl.mockResolvedValue(-2);

      expect(await repository.getLockTtlSeconds(tenantId, emailKey)).toBeNull();
    });

    it('maps key without expiry (-1) to null', async () => {
      redis.ttl.mockResolvedValue(-1);

      expect(await repository.getLockTtlSeconds(tenantId, emailKey)).toBeNull();
    });
  });

  describe('incrementLockoutLevel', () => {
    it('increments and refreshes the level TTL on every escalation', async () => {
      redis.incr.mockResolvedValue(2);

      const level = await repository.incrementLockoutLevel(
        tenantId,
        emailKey,
        86400,
      );

      expect(level).toBe(2);
      expect(redis.incr).toHaveBeenCalledWith(
        `auth:login:level:${tenantId}:${emailKey}`,
      );
      expect(redis.expire).toHaveBeenCalledWith(
        `auth:login:level:${tenantId}:${emailKey}`,
        86400,
      );
    });
  });

  describe('clear operations', () => {
    it('deletes the correct namespaced keys', async () => {
      await repository.clearFailures(tenantId, emailKey);
      await repository.clearLock(tenantId, emailKey);
      await repository.clearLockoutLevel(tenantId, emailKey);

      expect(redis.del).toHaveBeenCalledWith(
        `auth:login:failures:${tenantId}:${emailKey}`,
      );
      expect(redis.del).toHaveBeenCalledWith(
        `auth:login:lock:${tenantId}:${emailKey}`,
      );
      expect(redis.del).toHaveBeenCalledWith(
        `auth:login:level:${tenantId}:${emailKey}`,
      );
    });
  });
});
