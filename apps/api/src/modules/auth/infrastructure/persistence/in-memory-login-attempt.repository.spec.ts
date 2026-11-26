import { InMemoryLoginAttemptRepository } from './in-memory-login-attempt.repository';

describe('InMemoryLoginAttemptRepository', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const emailKey = 'user@wedecor.test';
  let repository: InMemoryLoginAttemptRepository;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    repository = new InMemoryLoginAttemptRepository();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('incrementFailures', () => {
    it('counts failures inside a fixed window from the first failure', async () => {
      expect(await repository.incrementFailures(tenantId, emailKey, 900)).toBe(
        1,
      );
      jest.advanceTimersByTime(800_000);
      // A later failure must not extend the window.
      expect(await repository.incrementFailures(tenantId, emailKey, 900)).toBe(
        2,
      );
      jest.advanceTimersByTime(101_000); // 901s since the first failure
      expect(await repository.incrementFailures(tenantId, emailKey, 900)).toBe(
        1,
      );
    });

    it('isolates counters by tenant and email', async () => {
      await repository.incrementFailures(tenantId, emailKey, 900);

      expect(
        await repository.incrementFailures(tenantId, 'other@wedecor.test', 900),
      ).toBe(1);
      expect(
        await repository.incrementFailures('tenant-2', emailKey, 900),
      ).toBe(1);
    });

    it('resets the counter on clearFailures', async () => {
      await repository.incrementFailures(tenantId, emailKey, 900);
      await repository.incrementFailures(tenantId, emailKey, 900);

      await repository.clearFailures(tenantId, emailKey);

      expect(await repository.incrementFailures(tenantId, emailKey, 900)).toBe(
        1,
      );
    });
  });

  describe('lock / getLockTtlSeconds', () => {
    it('returns null when there is no lock', async () => {
      expect(await repository.getLockTtlSeconds(tenantId, emailKey)).toBeNull();
    });

    it('reports the remaining TTL and expires after it elapses', async () => {
      await repository.lock(tenantId, emailKey, 1800);
      expect(await repository.getLockTtlSeconds(tenantId, emailKey)).toBe(1800);

      jest.advanceTimersByTime(600_000);
      expect(await repository.getLockTtlSeconds(tenantId, emailKey)).toBe(1200);

      jest.advanceTimersByTime(1_200_000);
      expect(await repository.getLockTtlSeconds(tenantId, emailKey)).toBeNull();
    });

    it('overwrites an existing lock with the new TTL', async () => {
      await repository.lock(tenantId, emailKey, 900);
      await repository.lock(tenantId, emailKey, 3600);

      expect(await repository.getLockTtlSeconds(tenantId, emailKey)).toBe(3600);
    });

    it('clears the lock', async () => {
      await repository.lock(tenantId, emailKey, 900);

      await repository.clearLock(tenantId, emailKey);

      expect(await repository.getLockTtlSeconds(tenantId, emailKey)).toBeNull();
    });
  });

  describe('lockout level escalation', () => {
    it('increments and refreshes the TTL on every escalation', async () => {
      expect(
        await repository.incrementLockoutLevel(tenantId, emailKey, 1000),
      ).toBe(1);
      jest.advanceTimersByTime(900_000);
      // Refresh keeps the level alive past the original 1000s expiry.
      expect(
        await repository.incrementLockoutLevel(tenantId, emailKey, 1000),
      ).toBe(2);
      jest.advanceTimersByTime(900_000);
      expect(
        await repository.incrementLockoutLevel(tenantId, emailKey, 1000),
      ).toBe(3);
    });

    it('decays after a quiet period', async () => {
      await repository.incrementLockoutLevel(tenantId, emailKey, 1000);
      await repository.incrementLockoutLevel(tenantId, emailKey, 1000);

      jest.advanceTimersByTime(1_001_000);

      expect(
        await repository.incrementLockoutLevel(tenantId, emailKey, 1000),
      ).toBe(1);
    });

    it('resets on clearLockoutLevel', async () => {
      await repository.incrementLockoutLevel(tenantId, emailKey, 1000);

      await repository.clearLockoutLevel(tenantId, emailKey);

      expect(
        await repository.incrementLockoutLevel(tenantId, emailKey, 1000),
      ).toBe(1);
    });
  });

  it('purges expired entries from storage on read', async () => {
    await repository.incrementFailures(tenantId, emailKey, 10);
    await repository.lock(tenantId, emailKey, 10);
    jest.advanceTimersByTime(11_000);

    await repository.incrementFailures(tenantId, 'other@wedecor.test', 10);
    await repository.getLockTtlSeconds(tenantId, 'other@wedecor.test');

    const internals = repository as unknown as {
      failures: Map<string, unknown>;
      locks: Map<string, unknown>;
    };
    expect(internals.failures.size).toBe(1);
    expect(internals.locks.size).toBe(0);
  });
});
