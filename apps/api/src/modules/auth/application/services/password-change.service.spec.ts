import type { BreachedPasswordChecker } from '../ports/breached-password.checker';
import type { PasswordHistoryRepository } from '../../domain/repositories/password-history.repository';
import type { SessionRepository } from '../../domain/repositories/session.repository';
import type {
  UserRecord,
  UserRepository,
} from '../../domain/repositories/user.repository';
import {
  PASSWORD_HISTORY_DEPTH,
  PasswordChangeService,
} from './password-change.service';
import { PasswordPolicyService } from './password-policy.service';
import type { PasswordService } from './password.service';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = 'user-1';
const CURRENT_PASSWORD = 'CurrentPass1!';
const NEW_PASSWORD = 'BrandNewPass1!';

// Deterministic in-memory hashing stand-in so reuse comparisons are testable without
// paying bcrypt's cost. `hash(x)` -> "hash(x)"; `compare` reverses that mapping.
const fakeHash = (plain: string): string => `hash(${plain})`;

describe('PasswordChangeService (R1-10)', () => {
  let userRepository: jest.Mocked<
    Pick<UserRepository, 'findById' | 'updatePassword'>
  >;
  let passwordHistory: jest.Mocked<PasswordHistoryRepository>;
  let sessionRepository: jest.Mocked<
    Pick<SessionRepository, 'revokeAllForUser'>
  >;
  let passwordService: jest.Mocked<Pick<PasswordService, 'hash' | 'compare'>>;
  let breachedChecker: jest.Mocked<BreachedPasswordChecker>;
  let service: PasswordChangeService;

  const user: UserRecord = {
    id: USER_ID,
    tenantId: TENANT_ID,
    email: 'owner@wedecor.test',
    name: 'Owner',
    role: 'owner',
    passwordHash: fakeHash(CURRENT_PASSWORD),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  beforeEach(() => {
    userRepository = {
      findById: jest.fn().mockResolvedValue(user),
      updatePassword: jest.fn().mockResolvedValue(undefined),
    };
    passwordHistory = {
      findRecentHashes: jest.fn().mockResolvedValue([]),
      add: jest.fn().mockResolvedValue(undefined),
    };
    sessionRepository = {
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    };
    passwordService = {
      hash: jest.fn((plain: string) => Promise.resolve(fakeHash(plain))),
      compare: jest.fn((plain: string, hash: string) =>
        Promise.resolve(hash === fakeHash(plain)),
      ),
    };
    breachedChecker = { isBreached: jest.fn().mockResolvedValue(false) };

    service = new PasswordChangeService(
      userRepository as unknown as UserRepository,
      passwordHistory,
      sessionRepository as unknown as SessionRepository,
      passwordService,
      new PasswordPolicyService(),
      breachedChecker,
    );
  });

  it('changes the password on the happy path and retires the old hash to history', async () => {
    const result = await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(result.ok).toBe(true);
    expect(userRepository.updatePassword).toHaveBeenCalledWith(
      TENANT_ID,
      USER_ID,
      fakeHash(NEW_PASSWORD),
    );
    // The replaced (old) hash is what gets archived — only after success.
    expect(passwordHistory.add).toHaveBeenCalledWith(
      TENANT_ID,
      USER_ID,
      fakeHash(CURRENT_PASSWORD),
    );
    expect(sessionRepository.revokeAllForUser).toHaveBeenCalledWith(
      TENANT_ID,
      USER_ID,
    );
  });

  it('rejects an incorrect current password without mutating anything', async () => {
    const result = await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: 'WrongCurrent1!',
      newPassword: NEW_PASSWORD,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CREDENTIALS');
    }
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
    expect(passwordHistory.add).not.toHaveBeenCalled();
  });

  it('rejects when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    const result = await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('rejects when the user has no password on file', async () => {
    userRepository.findById.mockResolvedValue({ ...user, passwordHash: null });

    const result = await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('rejects a new password that fails the complexity policy and skips the breach check', async () => {
    const result = await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: CURRENT_PASSWORD,
      newPassword: 'weak',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(breachedChecker.isBreached).not.toHaveBeenCalled();
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('rejects reuse of the current password', async () => {
    const result = await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: CURRENT_PASSWORD,
      // Passes policy but equals the current password.
      newPassword: CURRENT_PASSWORD,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details?.reason).toBe('PASSWORD_REUSED');
    }
    expect(breachedChecker.isBreached).not.toHaveBeenCalled();
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('rejects reuse of a password found in history', async () => {
    passwordHistory.findRecentHashes.mockResolvedValue([
      fakeHash(NEW_PASSWORD),
    ]);

    const result = await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.details?.reason).toBe('PASSWORD_REUSED');
    }
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('reads only the previous (DEPTH - 1) history hashes', async () => {
    await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(passwordHistory.findRecentHashes).toHaveBeenCalledWith(
      TENANT_ID,
      USER_ID,
      PASSWORD_HISTORY_DEPTH - 1,
    );
  });

  it('rejects a breached password and does not persist the change', async () => {
    breachedChecker.isBreached.mockResolvedValue(true);

    const result = await service.changePassword(TENANT_ID, USER_ID, {
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details?.reason).toBe('PASSWORD_BREACHED');
    }
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
    expect(passwordHistory.add).not.toHaveBeenCalled();
  });
});
