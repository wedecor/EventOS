import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import type { UserRecord } from '../../domain/repositories/user.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { toAuthUserDto, type AuthTokensDto } from '../dtos/auth.dto';
import { LoginThrottleService } from './login-throttle.service';
import { PasswordService } from './password.service';
import { ACCESS_TOKEN_TTL_SECONDS, TokenService } from './token.service';

export type LoginInput = {
  email: string;
  password: string;
};

/**
 * Auth Module application service (docs/10 §Auth Module: `AuthService`).
 * Orchestrates email/password login (ADR-008) and refresh-token rotation.
 *
 * Phase 1 (ADR-016) is single-tenant: `tenantId` is always the seeded We Decor
 * tenant, supplied by the caller (never from the request payload). This service
 * does NOT perform RBAC — role is carried in the token for future authorization
 * (C4) but no permission is enforced here.
 */
@Injectable()
export class AuthApplicationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly loginThrottle: LoginThrottleService,
  ) {}

  async login(
    tenantId: string,
    input: LoginInput,
  ): Promise<Result<AuthTokensDto>> {
    // R1-05 (docs/14 §Brute Force Protection) — reject while locked BEFORE
    // touching credentials, so a locked account costs no user lookup or bcrypt
    // work and reveals nothing about whether the account exists.
    const lock = await this.loginThrottle.getStatus(tenantId, input.email);
    if (lock.locked) {
      return this.rateLimited(lock.retryAfterSeconds);
    }

    const user = await this.userRepository.findByEmail(tenantId, input.email);

    // Uniform failure for unknown user, unset password, and wrong password so the
    // response never reveals which accounts exist (docs/14 information-leak guard).
    if (!user || !user.passwordHash) {
      return this.registerFailedAttempt(tenantId, input.email);
    }

    const passwordMatches = await this.passwordService.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      return this.registerFailedAttempt(tenantId, input.email);
    }

    // R1-05 — a good login clears the failure counter and the progressive
    // lockout escalation level for this email.
    await this.loginThrottle.reset(tenantId, input.email);
    return success(await this.issueTokens(tenantId, user));
  }

  // R1-05 — record the failed attempt; if it trips the lockout threshold the
  // caller is now locked and gets 429, otherwise the uniform 401 credential
  // failure (docs/14 information-leak guard) is returned.
  private async registerFailedAttempt(
    tenantId: string,
    email: string,
  ): Promise<Result<AuthTokensDto>> {
    const outcome = await this.loginThrottle.registerFailure(tenantId, email);
    if (outcome.locked) {
      return this.rateLimited(outcome.retryAfterSeconds);
    }
    return failure('INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  private rateLimited(retryAfterSeconds: number): Result<AuthTokensDto> {
    return failure(
      'RATE_LIMITED',
      'Too many failed login attempts. Please try again later.',
      { retryAfterSeconds },
    );
  }

  // ADR-008 refresh-token rotation: the presented session is revoked and a new one
  // is issued on every successful refresh. A revoked, expired, unknown, or
  // tampered token is rejected and no new token is issued.
  async refresh(
    tenantId: string,
    refreshToken: string,
  ): Promise<Result<AuthTokensDto>> {
    const parsed = this.tokenService.parseRefreshToken(refreshToken);
    if (!parsed) {
      return failure('UNAUTHENTICATED', 'Invalid or expired refresh token.');
    }

    const session = await this.sessionRepository.findById(
      tenantId,
      parsed.sessionId,
    );
    if (!session) {
      return failure('UNAUTHENTICATED', 'Invalid or expired refresh token.');
    }

    if (
      !this.tokenService.matchesRefreshToken(
        parsed.rawToken,
        session.refreshTokenHash,
      )
    ) {
      return failure('UNAUTHENTICATED', 'Invalid or expired refresh token.');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return failure('UNAUTHENTICATED', 'Invalid or expired refresh token.');
    }

    // P2-13 — refresh reuse detection: a previously rotated/revoked token
    // presented again indicates theft; invalidate the user's session family.
    if (session.revokedAt !== null) {
      await this.sessionRepository.revokeAllForUser(tenantId, session.userId);
      return failure('UNAUTHENTICATED', 'Invalid or expired refresh token.');
    }

    await this.sessionRepository.revoke(tenantId, session.id);

    const user = await this.userRepository.findById(tenantId, session.userId);
    if (!user) {
      return failure('UNAUTHENTICATED', 'Invalid or expired refresh token.');
    }

    return success(await this.issueTokens(tenantId, user));
  }

  // Idempotent logout: revoke the presented session's refresh token. Malformed or
  // already-revoked tokens still succeed (client is logged out either way).
  async logout(
    tenantId: string,
    refreshToken: string | null,
  ): Promise<Result<{ success: true }>> {
    if (refreshToken) {
      const parsed = this.tokenService.parseRefreshToken(refreshToken);
      if (parsed) {
        await this.sessionRepository.revoke(tenantId, parsed.sessionId);
      }
    }
    return success({ success: true });
  }

  private async issueTokens(
    tenantId: string,
    user: UserRecord,
  ): Promise<AuthTokensDto> {
    const accessToken = this.tokenService.signAccessToken({
      userId: user.id,
      tenantId,
      email: user.email,
      role: user.role,
    });

    const generated = this.tokenService.generateRefreshToken();
    const session = await this.sessionRepository.create(tenantId, {
      userId: user.id,
      refreshTokenHash: generated.tokenHash,
      expiresAt: generated.expiresAt,
    });

    return {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken: this.tokenService.composeRefreshToken(
        session.id,
        generated.rawToken,
      ),
      refreshTokenExpiresAt: generated.expiresAt,
      user: toAuthUserDto(user),
    };
  }
}
