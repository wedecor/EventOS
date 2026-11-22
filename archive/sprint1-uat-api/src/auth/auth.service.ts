import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { failure, success, type Result } from '../shared/application/result';
import type { EnvConfig } from '../config/env.schema';
import { AuthSessionRepository } from '../modules/platform/domain/repositories/auth-session.repository';
import { TenantRepository } from '../modules/platform/domain/repositories/tenant.repository';
import { UserRepository } from '../modules/platform/domain/repositories/user.repository';
import {
  DEFAULT_JWT_EXPIRES_IN,
  DEFAULT_REFRESH_TOKEN_DAYS,
  DEV_JWT_SECRET,
} from './auth.constants';
import type { AccessTokenPayload } from './jwt-payload.types';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.util';

export type LoginInput = {
  email: string;
  password: string;
  tenantSlug?: string;
};

export type AuthTokensResult = {
  accessToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
};

export type LoginResult = AuthTokensResult & {
  refreshToken: string;
  refreshMaxAgeMs: number;
};

export type AuthUserView = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  private jwtSecret(): string {
    return (
      this.configService.get('JWT_SECRET', { infer: true }) ?? DEV_JWT_SECRET
    );
  }

  private refreshMaxAgeMs(): number {
    const days = Number(
      process.env.REFRESH_TOKEN_DAYS ?? DEFAULT_REFRESH_TOKEN_DAYS,
    );
    return days * 24 * 60 * 60 * 1000;
  }

  async login(input: LoginInput): Promise<Result<LoginResult>> {
    const slug =
      input.tenantSlug?.trim() ||
      process.env.DEV_TENANT_SLUG?.trim() ||
      'we-decor';

    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) {
      return failure('UNAUTHORIZED', 'Unknown tenant.');
    }

    const email = input.email.trim().toLowerCase();
    if (!email || !input.password) {
      return failure('VALIDATION_ERROR', 'Email and password are required.');
    }

    const user = await this.userRepository.findByTenantAndEmail(
      tenant.id,
      email,
    );

    if (!user?.passwordHash) {
      return failure('UNAUTHORIZED', 'Invalid email or password.');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      return failure('UNAUTHORIZED', 'Invalid email or password.');
    }

    const tokens = await this.issueTokensForUser(user);
    return success(tokens);
  }

  async refresh(
    refreshToken: string | undefined,
  ): Promise<Result<LoginResult>> {
    if (!refreshToken?.trim()) {
      return failure('UNAUTHORIZED', 'Refresh token is required.');
    }

    const session = await this.authSessionRepository.findActiveByTokenHash(
      hashRefreshToken(refreshToken),
    );

    if (!session) {
      return failure('UNAUTHORIZED', 'Invalid or expired refresh token.');
    }

    await this.authSessionRepository.revoke(session.id);

    const user = await this.userRepository.findById(
      session.tenantId,
      session.userId,
    );

    if (!user) {
      return failure('UNAUTHORIZED', 'User no longer exists.');
    }

    return success(await this.issueTokensForUser(user));
  }

  async logout(
    refreshToken: string | undefined,
  ): Promise<Result<{ ok: true }>> {
    if (!refreshToken?.trim()) {
      return success({ ok: true });
    }

    const session = await this.authSessionRepository.findActiveByTokenHash(
      hashRefreshToken(refreshToken),
    );

    if (session) {
      await this.authSessionRepository.revoke(session.id);
    }

    return success({ ok: true });
  }

  async getProfile(
    tenantId: string,
    userId: string,
  ): Promise<Result<AuthUserView>> {
    const user = await this.userRepository.findById(tenantId, userId);
    if (!user) {
      return failure('NOT_FOUND', 'User not found.');
    }

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.jwtService.verify<AccessTokenPayload>(token, {
        secret: this.jwtSecret(),
      });
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired access token.',
      });
    }
  }

  private async issueTokensForUser(user: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  }): Promise<LoginResult> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    const expiresIn =
      process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_JWT_EXPIRES_IN;

    const accessToken = await this.jwtService.signAsync(
      { ...payload },
      {
        secret: this.jwtSecret(),
        expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const refreshToken = generateRefreshToken();
    const refreshMaxAgeMs = this.refreshMaxAgeMs();

    await this.authSessionRepository.create({
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshMaxAgeMs),
    });

    return {
      accessToken,
      expiresIn,
      tokenType: 'Bearer',
      refreshToken,
      refreshMaxAgeMs,
    };
  }
}
