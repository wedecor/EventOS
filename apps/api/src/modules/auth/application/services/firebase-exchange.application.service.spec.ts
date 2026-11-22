import { JwtService } from '@nestjs/jwt';
import {
  SYSTEM_ACTOR_ID,
  type AuditLogService,
} from '../../../../shared/audit';
import {
  ExternalIdentityRepository,
  type ExternalIdentityRecord,
} from '../../domain/repositories/external-identity.repository';
import type {
  SessionRecord,
  SessionRepository,
} from '../../domain/repositories/session.repository';
import type {
  UserRecord,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { TestFirebaseAuthAdapter } from '../../infrastructure/test-firebase-auth.adapter';
import { AuthApplicationService } from './auth.application.service';
import {
  FIREBASE_TOKEN_MAX_AGE_SECONDS,
  FirebaseExchangeApplicationService,
} from './firebase-exchange.application.service';
import type { LoginThrottleService } from './login-throttle.service';
import { PermissionService } from './permission.service';
import { TokenService } from './token.service';

describe('FirebaseExchangeApplicationService (M5-01)', () => {
  const tenantId = 'tenant-1';
  const project = 'test-project';

  const user: UserRecord = {
    id: 'user-1',
    tenantId,
    email: 'ops@example.test',
    name: 'Ops Person',
    role: 'operations_manager',
    passwordHash: null,
    disabledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const identity: ExternalIdentityRecord = {
    id: 'ident-1',
    tenantId,
    userId: user.id,
    provider: 'firebase',
    subject: 'uid-1',
    email: 'ops@example.test',
    linkedAt: new Date(),
    linkedByUserId: 'owner-1',
    lastUsedAt: null,
    createdAt: new Date(),
  };

  let firebase: TestFirebaseAuthAdapter;
  let users: Map<string, UserRecord>;
  let identities: jest.Mocked<ExternalIdentityRepository>;
  let sessions: Map<string, SessionRecord>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let loginThrottle: jest.Mocked<LoginThrottleService>;
  let audit: jest.Mocked<Pick<AuditLogService, 'record'>>;
  let authService: AuthApplicationService;
  let service: FirebaseExchangeApplicationService;
  let tokenService: TokenService;

  beforeEach(() => {
    firebase = new TestFirebaseAuthAdapter(project);
    users = new Map([[user.id, user]]);

    identities = {
      create: jest.fn(),
      findById: jest.fn(),
      findByProviderSubject: jest
        .fn()
        .mockImplementation((_t: string, provider: string, subject: string) =>
          Promise.resolve(
            provider === 'firebase' && subject === identity.subject
              ? identity
              : null,
          ),
        ),
      touchLastUsed: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    };

    sessions = new Map();
    let sessionSeq = 0;
    sessionRepository = {
      create: jest.fn().mockImplementation((_t: string, data) => {
        const record: SessionRecord = {
          id: `session-${++sessionSeq}`,
          tenantId,
          userId: data.userId,
          refreshTokenHash: data.refreshTokenHash,
          expiresAt: data.expiresAt,
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        sessions.set(record.id, record);
        return Promise.resolve(record);
      }),
      findById: jest
        .fn()
        .mockImplementation((_t: string, id: string) =>
          Promise.resolve(sessions.get(id) ?? null),
        ),
      revoke: jest.fn().mockImplementation((_t: string, id: string) => {
        const session = sessions.get(id);
        if (session) session.revokedAt = new Date();
        return Promise.resolve();
      }),
      revokeAllForUser: jest.fn().mockResolvedValue(undefined),
    };

    const userRepository = {
      findByEmail: jest.fn(),
      findById: jest
        .fn()
        .mockImplementation((_t: string, id: string) =>
          Promise.resolve(users.get(id) ?? null),
        ),
      updatePassword: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    loginThrottle = {
      getStatus: jest
        .fn()
        .mockResolvedValue({ locked: false, retryAfterSeconds: 0 }),
      registerFailure: jest
        .fn()
        .mockResolvedValue({ locked: false, retryAfterSeconds: 0 }),
      reset: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<LoginThrottleService>;

    audit = { record: jest.fn().mockResolvedValue(undefined) };

    tokenService = new TokenService(
      new JwtService({ secret: 'x'.repeat(40), signOptions: {} }),
    );
    authService = new AuthApplicationService(
      userRepository,
      sessionRepository,
      { hash: jest.fn(), compare: jest.fn() },
      tokenService,
      loginThrottle,
    );

    service = new FirebaseExchangeApplicationService(
      firebase,
      identities,
      userRepository,
      authService,
      loginThrottle,
      new PermissionService(),
      audit as unknown as AuditLogService,
    );
  });

  const nowSeconds = () => Math.floor(Date.now() / 1000);

  it('issues a session with permissions for a linked, valid Firebase token', async () => {
    firebase.register('good', { uid: 'uid-1', email: 'ops@example.test' });

    const result = await service.exchange(tenantId, {
      idToken: 'good',
      client: 'web',
      ipAddress: '203.0.113.9',
      userAgent: 'jest',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.includeRefreshTokenInBody).toBe(false);
    const { tokens } = result.value;
    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.expiresIn).toBe(15 * 60);
    expect(tokens.user).toEqual(
      expect.objectContaining({
        id: user.id,
        name: user.name,
        role: 'operations_manager',
      }),
    );
    expect(tokens.user.permissions).toEqual(
      expect.arrayContaining(['bookings:read', 'tasks:write']),
    );
    expect(tokens.user.permissions).not.toContain('settings:write');
    expect(identities.touchLastUsed).toHaveBeenCalledWith(
      tenantId,
      identity.id,
      expect.any(Date),
    );
    expect(loginThrottle.reset).toHaveBeenCalledWith(
      tenantId,
      'firebase:uid-1',
    );
  });

  it('flags mobile clients so the refresh token is returned in the body', async () => {
    firebase.register('mobile-token', { uid: 'uid-1' });

    const result = await service.exchange(tenantId, {
      idToken: 'mobile-token',
      client: 'mobile',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includeRefreshTokenInBody).toBe(true);
      expect(result.value.tokens.refreshToken).toMatch(/^session-\d+\./);
    }
  });

  it('issues a refresh token that rotates through the existing refresh flow', async () => {
    firebase.register('mobile-token', { uid: 'uid-1' });
    const exchanged = await service.exchange(tenantId, {
      idToken: 'mobile-token',
      client: 'mobile',
    });
    if (!exchanged.ok) throw new Error('exchange failed');

    const first = exchanged.value.tokens.refreshToken;
    const rotated = await authService.refresh(tenantId, first);
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;
    expect(rotated.value.refreshToken).not.toBe(first);

    // reuse detection is unchanged: replaying the first token revokes the family
    const replay = await authService.refresh(tenantId, first);
    expect(replay.ok).toBe(false);
    expect(sessionRepository.revokeAllForUser).toHaveBeenCalledWith(
      tenantId,
      user.id,
    );
  });

  it.each(['invalid', 'expired', 'revoked', 'disabled'] as const)(
    'rejects a %s Firebase token with UNAUTHENTICATED and audits a failure',
    async (reason) => {
      firebase.fail('bad', reason);

      const result = await service.exchange(tenantId, { idToken: 'bad' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('UNAUTHENTICATED');
      }
      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auth.firebase_exchange',
          outcome: 'failure',
          actorId: SYSTEM_ACTOR_ID,
          metadata: expect.objectContaining({ reason }),
        }),
      );
    },
  );

  it('maps an unavailable verifier to EXTERNAL_SERVICE_ERROR', async () => {
    firebase.fail('flaky', 'unavailable');

    const result = await service.exchange(tenantId, { idToken: 'flaky' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EXTERNAL_SERVICE_ERROR');
    }
  });

  it('rejects a token minted for a different audience', async () => {
    firebase.register('other-aud', { uid: 'uid-1', audience: 'other-project' });

    const result = await service.exchange(tenantId, { idToken: 'other-aud' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
    }
    expect(sessionRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a token with the wrong issuer', async () => {
    firebase.register('bad-iss', {
      uid: 'uid-1',
      issuer: 'https://securetoken.google.com/other-project',
    });

    const result = await service.exchange(tenantId, { idToken: 'bad-iss' });

    expect(result.ok).toBe(false);
  });

  it('rejects a token whose iat is older than 5 minutes', async () => {
    firebase.register('stale', {
      uid: 'uid-1',
      issuedAt: nowSeconds() - FIREBASE_TOKEN_MAX_AGE_SECONDS - 5,
    });

    const result = await service.exchange(tenantId, { idToken: 'stale' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHENTICATED');
      expect(result.error.message).toMatch(/too old/i);
    }
  });

  it('accepts a token that is just inside the 5 minute window', async () => {
    firebase.register('fresh-ish', {
      uid: 'uid-1',
      issuedAt: nowSeconds() - FIREBASE_TOKEN_MAX_AGE_SECONDS + 10,
    });

    const result = await service.exchange(tenantId, { idToken: 'fresh-ish' });

    expect(result.ok).toBe(true);
  });

  it('rejects a token issued implausibly far in the future', async () => {
    firebase.register('future', {
      uid: 'uid-1',
      issuedAt: nowSeconds() + 3600,
    });

    const result = await service.exchange(tenantId, { idToken: 'future' });

    expect(result.ok).toBe(false);
  });

  it('returns 403 IDENTITY_NOT_LINKED for an unlinked uid and counts a failed attempt', async () => {
    firebase.register('stranger', { uid: 'uid-unknown' });

    const result = await service.exchange(tenantId, { idToken: 'stranger' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('IDENTITY_NOT_LINKED');
    }
    expect(loginThrottle.registerFailure).toHaveBeenCalledWith(
      tenantId,
      'firebase:uid-unknown',
    );
    expect(sessionRepository.create).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'failure',
        metadata: expect.objectContaining({
          reason: 'identity_not_linked',
          uid: 'uid-unknown',
        }),
      }),
    );
  });

  it('never auto-provisions users or identities', async () => {
    firebase.register('stranger', { uid: 'uid-unknown' });

    await service.exchange(tenantId, { idToken: 'stranger' });

    expect(identities.create).not.toHaveBeenCalled();
  });

  it('returns RATE_LIMITED once repeated unlinked attempts trip the lockout', async () => {
    loginThrottle.registerFailure.mockResolvedValue({
      locked: true,
      retryAfterSeconds: 900,
    });
    firebase.register('stranger', { uid: 'uid-unknown' });

    const result = await service.exchange(tenantId, { idToken: 'stranger' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RATE_LIMITED');
      expect(result.error.details).toEqual({ retryAfterSeconds: 900 });
    }
  });

  it('short-circuits with RATE_LIMITED while the firebase:<uid> key is locked', async () => {
    loginThrottle.getStatus.mockResolvedValue({
      locked: true,
      retryAfterSeconds: 600,
    });
    firebase.register('good', { uid: 'uid-1' });

    const result = await service.exchange(tenantId, { idToken: 'good' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('RATE_LIMITED');
    }
    expect(loginThrottle.getStatus).toHaveBeenCalledWith(
      tenantId,
      'firebase:uid-1',
    );
    expect(identities.findByProviderSubject).not.toHaveBeenCalled();
  });

  it('returns 403 FORBIDDEN when the linked EventOS user is disabled', async () => {
    users.set(user.id, { ...user, disabledAt: new Date() });
    firebase.register('good', { uid: 'uid-1' });

    const result = await service.exchange(tenantId, { idToken: 'good' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
    expect(sessionRepository.create).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'failure',
        actorId: user.id,
        metadata: expect.objectContaining({ reason: 'user_disabled' }),
      }),
    );
  });

  it('treats a link to a missing user as not linked', async () => {
    users.clear();
    firebase.register('good', { uid: 'uid-1' });

    const result = await service.exchange(tenantId, { idToken: 'good' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('IDENTITY_NOT_LINKED');
    }
  });

  it('writes a success audit entry with uid, ip and user agent but never the token', async () => {
    firebase.register('secret-id-token-value', { uid: 'uid-1' });

    await service.exchange(tenantId, {
      idToken: 'secret-id-token-value',
      client: 'mobile',
      ipAddress: '198.51.100.7',
      userAgent: 'EnquiriesApp/1.0',
    });

    expect(audit.record).toHaveBeenCalledTimes(1);
    const entry = audit.record.mock.calls[0][0];
    expect(entry).toEqual(
      expect.objectContaining({
        action: 'auth.firebase_exchange',
        outcome: 'success',
        actorId: user.id,
        entityId: identity.id,
        metadata: {
          provider: 'firebase',
          uid: 'uid-1',
          client: 'mobile',
          ip: '198.51.100.7',
          userAgent: 'EnquiriesApp/1.0',
        },
      }),
    );
    expect(JSON.stringify(entry)).not.toContain('secret-id-token-value');
  });
});
