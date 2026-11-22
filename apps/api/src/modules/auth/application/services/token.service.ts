import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// ADR-008 / docs/14 §Session Management token lifetimes.
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type AccessTokenClaims = {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
};

export type AccessTokenPayload = {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
  type: 'access';
};

export type GeneratedRefreshToken = {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
};

export type ParsedRefreshToken = {
  sessionId: string;
  rawToken: string;
};

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(claims: AccessTokenClaims): string {
    const payload: AccessTokenPayload = {
      sub: claims.userId,
      tenantId: claims.tenantId,
      email: claims.email,
      role: claims.role,
      type: 'access',
    };
    return this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  generateRefreshToken(): GeneratedRefreshToken {
    const rawToken = randomBytes(32).toString('hex');
    return {
      rawToken,
      tokenHash: this.hashRefreshToken(rawToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    };
  }

  hashRefreshToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  // Constant-time comparison to avoid leaking hash bytes via timing.
  matchesRefreshToken(rawToken: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashRefreshToken(rawToken), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    if (actual.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(actual, expected);
  }

  // Client-facing refresh token is `<sessionId>.<rawToken>` so the owning session
  // can be located without scanning; the raw part is verified against its stored hash.
  composeRefreshToken(sessionId: string, rawToken: string): string {
    return `${sessionId}.${rawToken}`;
  }

  parseRefreshToken(token: string): ParsedRefreshToken | null {
    const separatorIndex = token.indexOf('.');
    if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
      return null;
    }
    return {
      sessionId: token.slice(0, separatorIndex),
      rawToken: token.slice(separatorIndex + 1),
    };
  }
}
