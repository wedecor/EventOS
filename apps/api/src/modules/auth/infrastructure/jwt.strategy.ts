import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvConfig } from '../../../config';
import type { AuthenticatedUser } from '../domain/authenticated-user';
import type { AccessTokenPayload } from '../application/services/token.service';

export const JWT_STRATEGY_NAME = 'jwt';

/**
 * ADR-008 — Passport JWT strategy. This is the authentication middleware: it
 * extracts the `Authorization: Bearer <token>` access token, verifies its
 * signature/expiry against `JWT_SECRET`, and resolves the request identity.
 * Access tokens are stateless (no session lookup) per ADR-008.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  constructor(configService: ConfigService<EnvConfig, true>) {
    const secret = configService.get('JWT_SECRET', { infer: true });
    if (!secret) {
      throw new Error(
        'JWT_SECRET is not configured. Authentication cannot be enabled.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      // P2-13 — pin algorithm to prevent alg confusion.
      algorithms: ['HS256'],
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type.');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role,
    };
  }
}
