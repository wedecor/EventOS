import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AuditLogService,
  SYSTEM_ACTOR_ID,
} from '../../../../shared/audit';
import type { AuthTokensDto } from '../dtos/auth.dto';
import { ExternalIdentityRepository } from '../../domain/repositories/external-identity.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { FirebaseAuthPort } from '../ports/firebase-auth.port';
import { AuthApplicationService } from './auth.application.service';
import { LoginThrottleService } from './login-throttle.service';
import { PermissionService } from './permission.service';

export const FIREBASE_PROVIDER = 'firebase';

/** A Firebase ID token must have been minted within this window (by `iat`). */
export const FIREBASE_TOKEN_MAX_AGE_SECONDS = 5 * 60;
/** Tolerated clock skew for an `iat` that is slightly in the future. */
const FIREBASE_TOKEN_FUTURE_SKEW_SECONDS = 60;

export type FirebaseExchangeInput = {
  idToken: string;
  client?: 'mobile' | 'web';
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type FirebaseExchangeResult = {
  tokens: AuthTokensDto;
  /** True when the caller asked for the refresh token in the JSON body. */
  includeRefreshTokenInBody: boolean;
};

/**
 * M5-01 (ADR-019 phase 1) — exchanges a verified Firebase ID token for the
 * existing EventOS session. TEMPORARY bridge: removed when the Enquiries app is
 * fully migrated (ADR-019 phase 3).
 *
 * Security properties:
 * - the ID token is verified server-side (signature, expiry, revocation, disabled)
 *   by {@link FirebaseAuthPort}; audience, issuer and age (`iat` ≤ 5 min) are
 *   re-checked here;
 * - NO auto-provisioning: an unlinked Firebase uid gets 403 IDENTITY_NOT_LINKED;
 * - a disabled EventOS user gets 403;
 * - the existing login throttle is applied under the key `firebase:<uid>`;
 * - the token itself is never logged or audited — only the uid.
 */
@Injectable()
export class FirebaseExchangeApplicationService {
  constructor(
    private readonly firebaseAuth: FirebaseAuthPort,
    private readonly externalIdentities: ExternalIdentityRepository,
    private readonly userRepository: UserRepository,
    private readonly authService: AuthApplicationService,
    private readonly loginThrottle: LoginThrottleService,
    private readonly permissionService: PermissionService,
    private readonly auditLog: AuditLogService,
  ) {}

  async exchange(
    tenantId: string,
    input: FirebaseExchangeInput,
  ): Promise<Result<FirebaseExchangeResult>> {
    const verification = await this.firebaseAuth.verifyIdToken(input.idToken);
    if (!verification.ok) {
      await this.auditFailure(tenantId, 'unknown', verification.reason, input);
      if (verification.reason === 'unavailable') {
        return failure(
          'EXTERNAL_SERVICE_ERROR',
          'Firebase verification is temporarily unavailable.',
        );
      }
      return this.invalidToken();
    }

    const { claims } = verification;
    const projectId = this.firebaseAuth.getProjectId();

    if (
      claims.audience !== projectId ||
      claims.issuer !== `https://securetoken.google.com/${projectId}`
    ) {
      await this.auditFailure(tenantId, claims.uid, 'audience_mismatch', input);
      return this.invalidToken();
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const age = nowSeconds - claims.issuedAt;
    if (
      age > FIREBASE_TOKEN_MAX_AGE_SECONDS ||
      age < -FIREBASE_TOKEN_FUTURE_SKEW_SECONDS
    ) {
      await this.auditFailure(tenantId, claims.uid, 'token_too_old', input);
      return failure(
        'UNAUTHENTICATED',
        'Firebase token is too old. Sign in again and retry.',
      );
    }

    const throttleKey = `${FIREBASE_PROVIDER}:${claims.uid}`;
    const lock = await this.loginThrottle.getStatus(tenantId, throttleKey);
    if (lock.locked) {
      await this.auditFailure(tenantId, claims.uid, 'rate_limited', input);
      return failure(
        'RATE_LIMITED',
        'Too many failed login attempts. Please try again later.',
        { retryAfterSeconds: lock.retryAfterSeconds },
      );
    }

    const identity = await this.externalIdentities.findByProviderSubject(
      tenantId,
      FIREBASE_PROVIDER,
      claims.uid,
    );
    if (!identity) {
      return this.notLinked(tenantId, claims.uid, throttleKey, input);
    }

    const user = await this.userRepository.findById(tenantId, identity.userId);
    if (!user) {
      return this.notLinked(tenantId, claims.uid, throttleKey, input);
    }

    if (user.disabledAt) {
      await this.auditFailure(
        tenantId,
        claims.uid,
        'user_disabled',
        input,
        user.id,
      );
      return failure('FORBIDDEN', 'This account is disabled.');
    }

    const tokens = await this.authService.issueSessionForUser(tenantId, user);
    await this.externalIdentities.touchLastUsed(
      tenantId,
      identity.id,
      new Date(),
    );
    await this.loginThrottle.reset(tenantId, throttleKey);

    await this.auditLog.record({
      actorId: user.id,
      tenantId,
      action: AUDIT_ACTIONS.AUTH_FIREBASE_EXCHANGE,
      entityType: AUDIT_ENTITY_TYPES.EXTERNAL_IDENTITY,
      entityId: identity.id,
      outcome: 'success',
      metadata: {
        provider: FIREBASE_PROVIDER,
        uid: claims.uid,
        client: input.client ?? 'web',
        ip: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });

    return success({
      tokens: {
        ...tokens,
        user: {
          ...tokens.user,
          permissions: [
            ...this.permissionService.getPermissionsForRole(user.role),
          ],
        },
      },
      includeRefreshTokenInBody: input.client === 'mobile',
    });
  }

  private invalidToken(): Result<FirebaseExchangeResult> {
    return failure('UNAUTHENTICATED', 'Invalid or expired Firebase token.');
  }

  private async notLinked(
    tenantId: string,
    uid: string,
    throttleKey: string,
    input: FirebaseExchangeInput,
  ): Promise<Result<FirebaseExchangeResult>> {
    const outcome = await this.loginThrottle.registerFailure(
      tenantId,
      throttleKey,
    );
    await this.auditFailure(tenantId, uid, 'identity_not_linked', input);
    if (outcome.locked) {
      return failure(
        'RATE_LIMITED',
        'Too many failed login attempts. Please try again later.',
        { retryAfterSeconds: outcome.retryAfterSeconds },
      );
    }
    return failure(
      'IDENTITY_NOT_LINKED',
      'This Firebase account is not linked to an EventOS user. Ask an administrator to link it.',
    );
  }

  private async auditFailure(
    tenantId: string,
    uid: string,
    reason: string,
    input: FirebaseExchangeInput,
    actorId: string = SYSTEM_ACTOR_ID,
  ): Promise<void> {
    await this.auditLog.record({
      actorId,
      tenantId,
      action: AUDIT_ACTIONS.AUTH_FIREBASE_EXCHANGE,
      entityType: AUDIT_ENTITY_TYPES.EXTERNAL_IDENTITY,
      entityId: `${FIREBASE_PROVIDER}:${uid}`,
      outcome: 'failure',
      metadata: {
        provider: FIREBASE_PROVIDER,
        uid,
        reason,
        client: input.client ?? 'web',
        ip: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }
}
