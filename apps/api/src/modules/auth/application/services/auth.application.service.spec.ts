import { AuthApplicationService } from './auth.application.service';
import type { LoginThrottleService } from './login-throttle.service';
import type { PasswordService } from './password.service';
import type { GeneratedRefreshToken, TokenService } from './token.service';
import type {
  SessionRecord,
  SessionRepository,
} from '../../domain/repositories/session.repository';
import type {
  UserRecord,
  UserRepository,
} from '../../domain/repositories/user.repository';

describe('AuthApplicationService', () => {
  const tenantId = 'tenant-1';

  const baseUser: UserRecord = {
    id: 'user-1',
    tenantId,
    email: 'admin@wedecor.events',
    name: 'We Decor Admin',
    role: 'admin',
    passwordHash: '$2b$12$hashedvalue',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseSession: SessionRecord = {
    id: 'session-1',
    tenantId,
    userId: 'user-1',
    refreshTokenHash: 'stored-hash',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const generated: GeneratedRefreshToken = {
    rawToken: 'raw-token',
    tokenHash: 'new-hash',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  let userRepository: jest.Mocked<UserRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let loginThrottle: jest.Mocked<LoginThrottleService>;
  let service: AuthApplicationService;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    sessionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    };
    passwordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    tokenService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue(generated),
      hashRefreshToken: jest.fn(),
      matchesRefreshToken: jest.fn(),
      composeRefreshToken: jest
        .fn()
        .mockImplementation((id: string, raw: string) => `${id}.${raw}`),
      parseRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    sessionRepository.create.mockResolvedValue({
      ...baseSession,
      id: 'session-new',
      refreshTokenHash: generated.tokenHash,
      expiresAt: generated.expiresAt,
    });

    // R1-05 — default: not locked, failures never trip the threshold. Individual
    // tests override these to exercise the lockout paths.
    loginThrottle = {
      getStatus: jest
        .fn()
        .mockResolvedValue({ locked: false, retryAfterSeconds: 0 }),
      registerFailure: jest
        .fn()
        .mockResolvedValue({ locked: false, retryAfterSeconds: 0 }),
      reset: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<LoginThrottleService>;

    service = new AuthApplicationService(
      userRepository,
      sessionRepository,
      passwordService,
      tokenService,
      loginThrottle,
    );
  });

  // --- login ---

  it('logs in with valid credentials and issues access + refresh tokens', async () => {
    userRepository.findByEmail.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(true);

    const result = await service.login(tenantId, {
      email: baseUser.email,
      password: 'correct-password',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe('access-token');
      expect(result.value.refreshToken).toBe('session-new.raw-token');
      expect(result.value.expiresIn).toBe(15 * 60);
      expect(result.value.user).toEqual({
        id: 'user-1',
        email: baseUser.email,
        name: 'We Decor Admin',
        role: 'admin',
      });
    }
    expect(sessionRepository.create).toHaveBeenCalledWith(tenantId, {
      userId: 'user-1',
      refreshTokenHash: generated.tokenHash,
      expiresAt: generated.expiresAt,
    });
  });

  it('rejects login for an unknown user without checking the password', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    const result = await service.login(tenantId, {
      email: 'ghost@wedecor.events',
      password: 'whatever',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CREDENTIALS');
    }
    expect(passwordService.compare).not.toHaveBeenCalled();
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });

  it('rejects login for a user without a password hash (cannot authenticate)', async () => {
    userRepository.findByEmail.mockResolvedValue({
      ...baseUser,
      passwordHash: null,
    });

    const result = await service.login(tenantId, {
      email: baseUser.email,
      password: 'whatever',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CREDENTIALS');
    }
    expect(passwordService.compare).not.toHaveBeenCalled();
  });

  it('rejects login when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(false);

    const result = await service.login(tenantId, {
      email: baseUser.email,
      password: 'wrong-password',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CREDENTIALS');
    }
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });

  // --- R1-05 login brute-force protection (docs/14 §Brute Force Protection) ---

  it('resets the throttle counter after a successful login', async () => {
    userRepository.findByEmail.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(true);

    await service.login(tenantId, {
      email: baseUser.email,
      password: 'correct-password',
    });

    expect(loginThrottle.reset).toHaveBeenCalledWith(tenantId, baseUser.email);
  });

  it('records a failed attempt when the password does not match', async () => {
    userRepository.findByEmail.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(false);

    await service.login(tenantId, {
      email: baseUser.email,
      password: 'wrong-password',
    });

    expect(loginThrottle.registerFailure).toHaveBeenCalledWith(
      tenantId,
      baseUser.email,
    );
  });

  it('records a failed attempt for an unknown user (uniform with wrong password)', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await service.login(tenantId, {
      email: 'ghost@wedecor.events',
      password: 'whatever',
    });

    expect(loginThrottle.registerFailure).toHaveBeenCalledWith(
      tenantId,
      'ghost@wedecor.events',
    );
  });

  it('rejects with RATE_LIMITED (429) while locked, without checking credentials', async () => {
    loginThrottle.getStatus.mockResolvedValue({
      locked: true,
      retryAfterSeconds: 900,
    });

    const result = await service.login(tenantId, {
      email: baseUser.email,
      password: 'correct-password',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RATE_LIMITED');
      expect(result.error.details).toEqual({ retryAfterSeconds: 900 });
    }
    // Locked out before any credential work or token issuance.
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
    expect(passwordService.compare).not.toHaveBeenCalled();
    expect(sessionRepository.create).not.toHaveBeenCalled();
    expect(loginThrottle.registerFailure).not.toHaveBeenCalled();
  });

  it('returns RATE_LIMITED when the failed attempt trips the lockout threshold', async () => {
    userRepository.findByEmail.mockResolvedValue(baseUser);
    passwordService.compare.mockResolvedValue(false);
    loginThrottle.registerFailure.mockResolvedValue({
      locked: true,
      retryAfterSeconds: 1800,
    });

    const result = await service.login(tenantId, {
      email: baseUser.email,
      password: 'wrong-password',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RATE_LIMITED');
      expect(result.error.details).toEqual({ retryAfterSeconds: 1800 });
    }
  });

  // --- refresh (rotation + revocation) ---

  it('rotates the refresh token: revokes the old session and issues a new one', async () => {
    tokenService.parseRefreshToken.mockReturnValue({
      sessionId: 'session-1',
      rawToken: 'raw-token',
    });
    sessionRepository.findById.mockResolvedValue(baseSession);
    tokenService.matchesRefreshToken.mockReturnValue(true);
    userRepository.findById.mockResolvedValue(baseUser);

    const result = await service.refresh(tenantId, 'session-1.raw-token');

    expect(sessionRepository.revoke).toHaveBeenCalledWith(
      tenantId,
      'session-1',
    );
    expect(sessionRepository.create).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.refreshToken).toBe('session-new.raw-token');
    }
  });

  it('rejects a malformed refresh token', async () => {
    tokenService.parseRefreshToken.mockReturnValue(null);

    const result = await service.refresh(tenantId, 'garbage');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
    }
    expect(sessionRepository.revoke).not.toHaveBeenCalled();
  });

  it('rejects refresh for an unknown session', async () => {
    tokenService.parseRefreshToken.mockReturnValue({
      sessionId: 'missing',
      rawToken: 'raw-token',
    });
    sessionRepository.findById.mockResolvedValue(null);

    const result = await service.refresh(tenantId, 'missing.raw-token');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
    }
    expect(sessionRepository.revoke).not.toHaveBeenCalled();
  });

  it('rejects refresh for an already-revoked session and revokes the session family', async () => {
    tokenService.parseRefreshToken.mockReturnValue({
      sessionId: 'session-1',
      rawToken: 'raw-token',
    });
    sessionRepository.findById.mockResolvedValue({
      ...baseSession,
      revokedAt: new Date(),
    });
    tokenService.matchesRefreshToken.mockReturnValue(true);

    const result = await service.refresh(tenantId, 'session-1.raw-token');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
    }
    expect(sessionRepository.revokeAllForUser).toHaveBeenCalledWith(
      tenantId,
      baseSession.userId,
    );
    expect(sessionRepository.revoke).not.toHaveBeenCalled();
  });

  it('rejects refresh for an expired session', async () => {
    tokenService.parseRefreshToken.mockReturnValue({
      sessionId: 'session-1',
      rawToken: 'raw-token',
    });
    sessionRepository.findById.mockResolvedValue({
      ...baseSession,
      expiresAt: new Date(Date.now() - 1000),
    });
    tokenService.matchesRefreshToken.mockReturnValue(true);

    const result = await service.refresh(tenantId, 'session-1.raw-token');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('rejects refresh when the token hash does not match (tampered token)', async () => {
    tokenService.parseRefreshToken.mockReturnValue({
      sessionId: 'session-1',
      rawToken: 'tampered',
    });
    sessionRepository.findById.mockResolvedValue(baseSession);
    tokenService.matchesRefreshToken.mockReturnValue(false);

    const result = await service.refresh(tenantId, 'session-1.tampered');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
    }
    expect(sessionRepository.revoke).not.toHaveBeenCalled();
  });

  it('rejects refresh when the owning user no longer exists', async () => {
    tokenService.parseRefreshToken.mockReturnValue({
      sessionId: 'session-1',
      rawToken: 'raw-token',
    });
    sessionRepository.findById.mockResolvedValue(baseSession);
    tokenService.matchesRefreshToken.mockReturnValue(true);
    userRepository.findById.mockResolvedValue(null);

    const result = await service.refresh(tenantId, 'session-1.raw-token');

    expect(sessionRepository.revoke).toHaveBeenCalledWith(
      tenantId,
      'session-1',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
    }
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });

  // --- logout ---

  it('revokes the presented session on logout', async () => {
    tokenService.parseRefreshToken.mockReturnValue({
      sessionId: 'session-1',
      rawToken: 'raw-token',
    });

    const result = await service.logout(tenantId, 'session-1.raw-token');

    expect(sessionRepository.revoke).toHaveBeenCalledWith(
      tenantId,
      'session-1',
    );
    expect(result.ok).toBe(true);
  });

  it('logout is idempotent when no refresh token is presented', async () => {
    const result = await service.logout(tenantId, null);

    expect(sessionRepository.revoke).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });

  it('logout succeeds without revoking when the token is malformed', async () => {
    tokenService.parseRefreshToken.mockReturnValue(null);

    const result = await service.logout(tenantId, 'garbage');

    expect(sessionRepository.revoke).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });
});
