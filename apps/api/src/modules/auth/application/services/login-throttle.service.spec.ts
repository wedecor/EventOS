import type { LoginAttemptRepository } from '../../domain/repositories/login-attempt.repository';
import {
  FAILURE_WINDOW_SECONDS,
  LOCKOUT_LEVEL_TTL_SECONDS,
  LoginThrottleService,
  MAX_FAILED_ATTEMPTS,
} from './login-throttle.service';

/**
 * R1-05 (docs/14 §Brute Force Protection): "5 failed attempts per email per 15
 * minutes", "Lockout duration: 15 minutes (progressive: 15m → 30m → 1h)".
 * The repository is mocked so these tests assert the POLICY (thresholds,
 * window, progressive durations, reset) that lives in the application layer.
 */
describe('LoginThrottleService (R1-05)', () => {
  const tenantId = 'tenant-1';
  let attempts: jest.Mocked<LoginAttemptRepository>;
  let service: LoginThrottleService;

  beforeEach(() => {
    attempts = {
      incrementFailures: jest.fn(),
      clearFailures: jest.fn(),
      lock: jest.fn(),
      getLockTtlSeconds: jest.fn(),
      clearLock: jest.fn(),
      incrementLockoutLevel: jest.fn(),
      clearLockoutLevel: jest.fn(),
    };
    service = new LoginThrottleService(attempts);
  });

  describe('getStatus', () => {
    it('reports locked with the remaining seconds when a lockout is active', async () => {
      attempts.getLockTtlSeconds.mockResolvedValue(842);

      const status = await service.getStatus(tenantId, 'user@wedecor.test');

      expect(status).toEqual({ locked: true, retryAfterSeconds: 842 });
    });

    it('reports not locked when there is no active lockout', async () => {
      attempts.getLockTtlSeconds.mockResolvedValue(null);

      const status = await service.getStatus(tenantId, 'user@wedecor.test');

      expect(status).toEqual({ locked: false, retryAfterSeconds: 0 });
    });

    it('normalizes the email (case/whitespace) into a single key', async () => {
      attempts.getLockTtlSeconds.mockResolvedValue(null);

      await service.getStatus(tenantId, '  User@WeDecor.TEST  ');

      expect(attempts.getLockTtlSeconds).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
      );
    });
  });

  describe('registerFailure', () => {
    it('does not lock while below the threshold and applies the 15-minute window', async () => {
      attempts.incrementFailures.mockResolvedValue(MAX_FAILED_ATTEMPTS - 1);

      const status = await service.registerFailure(
        tenantId,
        'user@wedecor.test',
      );

      expect(status).toEqual({ locked: false, retryAfterSeconds: 0 });
      expect(attempts.incrementFailures).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
        FAILURE_WINDOW_SECONDS,
      );
      expect(attempts.lock).not.toHaveBeenCalled();
      expect(attempts.incrementLockoutLevel).not.toHaveBeenCalled();
    });

    it('locks for 15 minutes on the first lockout (5th failure)', async () => {
      attempts.incrementFailures.mockResolvedValue(MAX_FAILED_ATTEMPTS);
      attempts.incrementLockoutLevel.mockResolvedValue(1);

      const status = await service.registerFailure(
        tenantId,
        'user@wedecor.test',
      );

      expect(status).toEqual({ locked: true, retryAfterSeconds: 15 * 60 });
      expect(attempts.incrementLockoutLevel).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
        LOCKOUT_LEVEL_TTL_SECONDS,
      );
      expect(attempts.lock).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
        15 * 60,
      );
      // Window counter cleared so the next attempt cycle starts fresh.
      expect(attempts.clearFailures).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
      );
    });

    it('locks for 30 minutes on the second consecutive lockout', async () => {
      attempts.incrementFailures.mockResolvedValue(MAX_FAILED_ATTEMPTS);
      attempts.incrementLockoutLevel.mockResolvedValue(2);

      const status = await service.registerFailure(
        tenantId,
        'user@wedecor.test',
      );

      expect(status).toEqual({ locked: true, retryAfterSeconds: 30 * 60 });
      expect(attempts.lock).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
        30 * 60,
      );
    });

    it('locks for 60 minutes on the third consecutive lockout', async () => {
      attempts.incrementFailures.mockResolvedValue(MAX_FAILED_ATTEMPTS);
      attempts.incrementLockoutLevel.mockResolvedValue(3);

      const status = await service.registerFailure(
        tenantId,
        'user@wedecor.test',
      );

      expect(status).toEqual({ locked: true, retryAfterSeconds: 60 * 60 });
    });

    it('caps the lockout at 60 minutes for the fourth and later lockouts', async () => {
      attempts.incrementFailures.mockResolvedValue(MAX_FAILED_ATTEMPTS);
      attempts.incrementLockoutLevel.mockResolvedValue(7);

      const status = await service.registerFailure(
        tenantId,
        'user@wedecor.test',
      );

      expect(status).toEqual({ locked: true, retryAfterSeconds: 60 * 60 });
    });
  });

  describe('reset', () => {
    it('clears failures, lock, and escalation level on a successful login', async () => {
      await service.reset(tenantId, 'User@WeDecor.test');

      expect(attempts.clearFailures).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
      );
      expect(attempts.clearLock).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
      );
      expect(attempts.clearLockoutLevel).toHaveBeenCalledWith(
        tenantId,
        'user@wedecor.test',
      );
    });
  });
});
