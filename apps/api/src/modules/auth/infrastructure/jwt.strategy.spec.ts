import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { EnvConfig } from '../../../config';
import type { AccessTokenPayload } from '../application/services/token.service';
import { JwtStrategy } from './jwt.strategy';

function configWith(
  secret: string | undefined,
): ConfigService<EnvConfig, true> {
  return {
    get: jest.fn().mockReturnValue(secret),
  } as unknown as ConfigService<EnvConfig, true>;
}

describe('JwtStrategy', () => {
  const secret = 'unit-test-jwt-secret-at-least-32-characters';

  it('resolves the authenticated user from a valid access-token payload', () => {
    const strategy = new JwtStrategy(configWith(secret));

    const payload: AccessTokenPayload = {
      sub: 'user-1',
      tenantId: 'tenant-1',
      email: 'admin@wedecor.events',
      role: 'admin',
      type: 'access',
    };

    expect(strategy.validate(payload)).toEqual({
      userId: 'user-1',
      tenantId: 'tenant-1',
      email: 'admin@wedecor.events',
      role: 'admin',
    });
  });

  it('rejects a token whose type is not "access" (e.g. a refresh token)', () => {
    const strategy = new JwtStrategy(configWith(secret));

    const payload = {
      sub: 'user-1',
      tenantId: 'tenant-1',
      email: 'admin@wedecor.events',
      role: 'admin',
      type: 'refresh',
    } as unknown as AccessTokenPayload;

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
  });

  it('throws at construction when JWT_SECRET is not configured', () => {
    expect(() => new JwtStrategy(configWith(undefined))).toThrow(
      'JWT_SECRET is not configured',
    );
  });
});
